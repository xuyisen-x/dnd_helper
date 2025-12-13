use crate::grammar::CompareExpr;

use super::grammar::{BinOp, Expr, ModifierOp, ModifierParam};

// ==========================================
// 类型定义
// ==========================================

#[derive(Clone, PartialEq, Debug)]
pub struct DiceItem {
    pub min_count: i64, // 最小值，因为explode可能会导致这个值的增长
    pub side: i64,      // 骰子面数，一般是不会改变的
}

#[derive(Clone, PartialEq, Debug)]
pub enum DicePoolType {
    RawDicePool(DiceItem), // 原始的骰池，除了ExplodeCompound外，生成的骰池子均为此类型
    LimitableDicePool(DiceItem), // 可限制爆骰的骰池，只有通过ExplodeCompound生成
}

#[derive(Clone, PartialEq, Debug)]
pub enum VariableNumber {
    Unknown,                // 未知的变量数值
    DicePool(DicePoolType), // 来自骰池的变量数值
}

#[derive(Clone, PartialEq, Debug)]
pub enum NumberType {
    Constant(f64),            // 常数数值
    Variable(VariableNumber), // 变量数值
}

#[derive(Clone, PartialEq, Debug)]
pub enum ListType {
    ConstantList(Vec<f64>), // 常数列表
    VariableList(i64),      // 变量列表，记录长度
}

#[derive(Clone, PartialEq, Debug)]
pub enum Type {
    Invalid(String),    // 无效类型，携带错误信息
    Number(NumberType), // 数值类型
    List(ListType),     // 列表类型
}

// ==========================================
// Type 构造辅助函数
// ==========================================

impl Type {
    pub fn constant(val: f64) -> Self {
        Type::Number(NumberType::Constant(val))
    }

    pub fn unknown_var() -> Self {
        Type::Number(NumberType::Variable(VariableNumber::Unknown))
    }

    pub fn raw_dice_pool(item: DiceItem) -> Self {
        Type::Number(NumberType::Variable(VariableNumber::DicePool(
            DicePoolType::RawDicePool(item),
        )))
    }

    pub fn limitable_dice_pool(item: DiceItem) -> Self {
        Type::Number(NumberType::Variable(VariableNumber::DicePool(
            DicePoolType::LimitableDicePool(item),
        )))
    }

    pub fn const_list(list: Vec<f64>) -> Self {
        Type::List(ListType::ConstantList(list))
    }

    pub fn var_list(len: i64) -> Self {
        Type::List(ListType::VariableList(len))
    }
}

// ==========================================
// 主类型检查函数
// ==========================================

pub fn typecheck_expr(expr: &Expr) -> Type {
    match expr {
        Expr::Number(x) => Type::constant(*x),
        Expr::Dice { count, side } => type_of_dice(count, side),
        Expr::Binary { lhs, op, rhs } => type_of_binary_op(lhs, op, rhs),
        Expr::Call { func_name, args } => type_of_call(func_name, args),
        Expr::List(args) => type_of_list(args),
        Expr::Modifier { lhs, op, param } => type_of_modifier(lhs, op, param),
        Expr::SuccessCheck { lhs, compare_expr } => type_of_success_check(lhs, compare_expr),
    }
}

// ==========================================
// 辅助处理函数
// ==========================================

// 判断一个浮点数是否为整数
pub fn is_integer(num: f64) -> bool {
    num.fract() == 0.0
}

// 从切片中选出前 n 个最大值或最小值，并按原顺序返回
pub fn top_n_preserve_order<T: Clone + PartialOrd>(
    data: &[T],
    n: usize,
    largest: bool, // true: 取最大值；false: 取最小值
) -> Vec<T> {
    let len = data.len();
    if n == 0 || len == 0 {
        return Vec::new();
    }

    let n = n.min(len);

    // 1) 带上原始下标
    let mut indexed: Vec<(usize, &T)> = data.iter().enumerate().collect();

    // 2) 按值排序（根据 largest 决定升序/降序）
    indexed.sort_by(|a, b| {
        match a.1.partial_cmp(b.1) {
            Some(ord) => {
                if largest {
                    ord.reverse() // 最大值优先
                } else {
                    ord // 最小值优先
                }
            }
            None => std::cmp::Ordering::Equal,
        }
    });

    // 3) 取前 n 个下标
    let mut top_n: Vec<(usize, &T)> = indexed.into_iter().take(n).collect();

    // 4) 再按原始下标排序，保证“保持原来顺序”
    top_n.sort_by_key(|(idx, _)| *idx);

    // 5) 把结果按顺序抽出来
    top_n.into_iter().map(|(_, v)| v.clone()).collect()
}

fn type_of_dice(count: &Expr, side: &Expr) -> Type {
    use NumberType::*;
    use Type::*;

    let count_type = typecheck_expr(count);
    let side_type = typecheck_expr(side);
    match (count_type, side_type) {
        (Invalid(s), _) => Invalid(s),
        (_, Invalid(s)) => Invalid(s),
        // 两边必须都是常数
        (Number(Constant(c)), Number(Constant(s))) => {
            if is_integer(c) && is_integer(s) && c > 0.0 && s >= 2.0 {
                let dice_item = DiceItem {
                    min_count: c as i64,
                    side: s as i64,
                };
                Type::raw_dice_pool(dice_item)
            } else {
                Invalid(format!(
                    "Invalid dice parameters: count = {}, side = {}",
                    c, s
                ))
            }
        }
        // 针对变量的特殊警告
        (Number(Variable(_)), _) | (_, Number(Variable(_))) => {
            Invalid("Dice count and side must be constant numbers.".to_string())
        }
        _ => Invalid("Dice count and side must be numbers.".to_string()),
    }
}

fn type_of_binary_op(lhs: &Expr, op: &BinOp, rhs: &Expr) -> Type {
    use ListType::*;
    use NumberType::*;
    use Type::*;

    let lhs_type = typecheck_expr(lhs);
    let rhs_type = typecheck_expr(rhs);
    match (lhs_type, rhs_type) {
        (Invalid(s), _) => Invalid(s),
        (_, Invalid(s)) => Invalid(s),
        // 两个标量数值之间的操作
        (Number(lt), Number(rt)) => {
            match (lt, rt) {
                (Constant(lc), Constant(rc)) => {
                    // 常数与常数之间的操作，结果仍为常数
                    match op {
                        BinOp::Add => Type::constant(lc + rc),
                        BinOp::Sub => Type::constant(lc - rc),
                        BinOp::Mul => Type::constant(lc * rc),
                        BinOp::Div => {
                            if rc != 0.0 {
                                Type::constant(lc / rc)
                            } else {
                                Invalid("Division by zero.".to_string())
                            }
                        }
                        BinOp::Mod => {
                            if rc == 0.0 {
                                Invalid("Modulo by zero.".to_string())
                            } else if is_integer(lc) && is_integer(rc) {
                                Type::constant((lc as i64 % rc as i64) as f64)
                            } else {
                                Invalid("Modulo operator requires integer operands.".to_string())
                            }
                        }
                        BinOp::Idiv => {
                            if rc == 0.0 {
                                Invalid("Integer division by zero.".to_string())
                            } else if is_integer(lc) && is_integer(rc) {
                                Type::constant((lc as i64 / rc as i64) as f64)
                            } else {
                                Invalid(
                                    "Integer division operator requires integer operands."
                                        .to_string(),
                                )
                            }
                        }
                    }
                }
                (_, Constant(rc)) => {
                    // 检查除零和整数要求
                    if (op == &BinOp::Div || op == &BinOp::Mod || op == &BinOp::Idiv) && rc == 0.0 {
                        Invalid("Division or modulo by zero.".to_string())
                    } else if (op == &BinOp::Mod || op == &BinOp::Idiv) && !is_integer(rc) {
                        Invalid(
                            "Modulo or integer division operator requires integer operands."
                                .to_string(),
                        )
                    } else {
                        // 变量与常数之间的操作，结果为变量数值
                        Type::unknown_var()
                    }
                }
                _ => Type::unknown_var(), // 其他情况，结果为未知变量数值
            }
        }
        // 列表与常数标量之间的操作
        (List(l), Number(Constant(c))) | (Number(Constant(c)), List(l)) => {
            if !is_integer(c) || c < 0.0 {
                Invalid("List operations require non-negative integer constants.".to_string())
            } else if *op != BinOp::Mul {
                Invalid("Only multiplication is allowed between list and constant.".to_string())
            } else {
                match l {
                    ConstantList(lst) => {
                        // 列表与常数相乘，结果为常数列表
                        let mut new_list = Vec::new();
                        for _ in 0..(c as i64) {
                            new_list.extend(lst.iter());
                        }
                        Type::const_list(new_list)
                    }
                    VariableList(len) => {
                        // 列表与常数相乘，结果为变量列表，长度为原长度乘以常数
                        Type::var_list(len * (c as i64))
                    }
                }
            }
        }
        // 列表与列表之间的操作
        (List(l), List(r)) => {
            // 只允许加法运算
            match op {
                BinOp::Add => {
                    match (l, r) {
                        (ConstantList(lc), ConstantList(rc)) => {
                            //两个常数列表相加，结果为常数列表
                            let mut new_list = lc.clone();
                            new_list.extend(rc.iter());
                            Type::const_list(new_list)
                        }
                        (VariableList(llen), VariableList(rlen)) => {
                            //两个变量列表相加，结果为变量列表，长度为两者之和
                            Type::var_list(llen + rlen)
                        }
                        (ConstantList(c), VariableList(len))
                        | (VariableList(len), ConstantList(c)) => {
                            //常数列表与变量列表相加，结果为变量列表，长度为常数列表长度加变量列表长度
                            Type::var_list(len + c.len() as i64)
                        }
                    }
                }
                _ => Invalid("Only addition is allowed between lists.".to_string()),
            }
        }
        // 列表与变量之间执行特殊警告
        (List(_), Number(Variable(_))) | (Number(Variable(_)), List(_)) => {
            Invalid("Cannot perform operations between list and variable number.".to_string())
        }
    }
}

#[derive(Clone)]
enum ArgsType {
    OneNumber(NumberType),
    OneList(ListType),
    OneListAndOneNumber(ListType, NumberType),
}
fn preprocess_call_args(args: &Vec<Type>) -> Result<ArgsType, String> {
    match args.as_slice() {
        [] => Err("Function requires at least one argument.".to_string()), // 空向量错误
        [Type::Number(nt)] => Ok(ArgsType::OneNumber(nt.clone())),         // 单数值参数
        [Type::List(lt)] => Ok(ArgsType::OneList(lt.clone())),             // 单列表参数
        [Type::List(lt), Type::Number(nt)] => {
            Ok(ArgsType::OneListAndOneNumber(lt.clone(), nt.clone()))
        } // 列表与数值参数
        // 其他情况，尝试将所有参数解释一起解释为列表，如果失败则视为错误
        _ => {
            let mut is_variable = false;
            let mut consts = Vec::new();
            for arg_type in args {
                use NumberType::*;
                use Type::*;
                match arg_type {
                    Invalid(s) => return Err(s.to_string()), // 遇到无效类型，直接返回错误
                    List(_) => return Err("Nested lists are not allowed.".to_string()), // 不允许嵌套列表
                    Number(Variable(_)) => is_variable = true, // 统计变量数值
                    Number(Constant(c)) => {
                        if !is_variable {
                            consts.push(*c); // 仅当没有变量数值时，收集常数数值
                        }
                    }
                }
            }
            if is_variable {
                Ok(ArgsType::OneList(ListType::VariableList(args.len() as i64)))
            } else {
                Ok(ArgsType::OneList(ListType::ConstantList(consts)))
            }
        }
    }
}
fn type_of_call(func_name: &str, args: &Vec<Expr>) -> Type {
    use ArgsType::*;
    use ListType::*;
    use NumberType::*;
    use VariableNumber::*;
    let raw_args_type: Vec<Type> = args.iter().map(|arg| typecheck_expr(arg)).collect();
    let args_type = match preprocess_call_args(&raw_args_type) {
        Err(s) => return Type::Invalid(s),
        Ok(at) => at,
    };
    match func_name {
        "max" | "min" => {
            match args_type {
                OneNumber(Constant(c)) => Type::constant(c), // 单常数参数，结果为该常数
                OneNumber(Variable(_)) => Type::unknown_var(), // 单变量参数，结果为未知变量数值
                OneList(ConstantList(lst)) => {
                    if lst.is_empty() {
                        Type::Invalid("max/min function requires at least one element.".to_string())
                    } else {
                        let extreme = if func_name == "max" {
                            lst.iter().cloned().fold(f64::MIN, f64::max)
                        } else {
                            lst.iter().cloned().fold(f64::MAX, f64::min)
                        };
                        Type::constant(extreme)
                    }
                }
                OneList(VariableList(_)) => Type::unknown_var(), // 列表参数结果为未知变量数值
                // 从列表中取最大/小的 n 个元素
                OneListAndOneNumber(lst, nt) => {
                    let nt = if let Constant(c) = nt {
                        c
                    } else {
                        return Type::Invalid("If the first argument is a list, the second argument must be a constant number.".to_string());
                    };
                    if !is_integer(nt) || nt <= 0.0 {
                        return Type::Invalid(
                            "In min/max, the count parameter must be a positive integer."
                                .to_string(),
                        );
                    }
                    match lst {
                        VariableList(len) => {
                            if len < nt as i64 {
                                Type::Invalid(format!(
                                    "In min/max, the list length {} is less than the count parameter {}.",
                                    len, nt
                                ))
                            } else {
                                Type::var_list(nt as i64)
                            }
                        }
                        ConstantList(ls) => {
                            if ls.is_empty() {
                                Type::Invalid(
                                    "In min/max, the list argument must have at least one element."
                                        .to_string(),
                                )
                            } else if (nt as i64) > ls.len() as i64 {
                                Type::Invalid(format!(
                                    "In min/max, the list length {} is less than the count parameter {}.",
                                    ls.len(),
                                    nt
                                ))
                            } else {
                                let selected =
                                    top_n_preserve_order(&ls, nt as usize, func_name == "max");
                                Type::const_list(selected)
                            }
                        }
                    }
                }
            }
        }
        "sum" => {
            match args_type {
                OneNumber(Constant(c)) => Type::constant(c), // 单常数参数，结果为该常数
                OneNumber(Variable(_)) => Type::unknown_var(), // 单变量参数，结果为未知变量数值
                OneList(ConstantList(lst)) => {
                    let total: f64 = lst.iter().sum();
                    Type::constant(total)
                }
                OneList(VariableList(_)) => Type::unknown_var(), // 列表参数结果为未知变量数值
                OneListAndOneNumber(_, _) => Type::Invalid(
                    "sum function does not accept one list and one number as arguments."
                        .to_string(),
                ),
            }
        }
        "floor" | "ceil" | "round" | "abs" => {
            match args_type {
                OneNumber(Constant(c)) => {
                    let result = match func_name {
                        "floor" => c.floor(),
                        "ceil" => c.ceil(),
                        "round" => c.round(),
                        "abs" => c.abs(),
                        _ => unreachable!(),
                    };
                    Type::constant(result)
                }
                OneNumber(Variable(_)) => Type::unknown_var(), // 变量参数，结果为未知变量数值
                _ => Type::Invalid(format!(
                    "{} function requires a single numeric argument.",
                    func_name
                )),
            }
        }
        "rpdice" => {
            match raw_args_type.as_slice() {
                [Type::Number(Variable(DicePool(_)))] => {
                    Type::unknown_var() // 单骰池参数，结果为未知变量数值
                }
                [t] => t.clone(), // 其他情况的单参数调用，直接返回该参数的类型
                // 也可以接受第二个参数为常数数值，表示重复次数
                [t, Type::Number(Constant(c))] => {
                    if !is_integer(*c) || *c <= 1.0 {
                        Type::Invalid(
                            "In rpdice, the repeat count parameter must be a integer larger than 1."
                                .to_string(),
                        )
                    } else {
                        match t {
                            Type::Number(Variable(DicePool(_))) => Type::unknown_var(),
                            _ => t.clone(), // 其他情况，直接返回第一个参数的类型
                        }
                    }
                }
                [_, Type::Number(Variable(_))] => Type::Invalid(
                    "In rpdice, the repeat count parameter must be a constant integer.".to_string(),
                ),
                _ => Type::Invalid(
                    "rpdice function requires one argument, or one argument and a repeat count."
                        .to_string(),
                ),
            }
        }
        _ => Type::Invalid(format!("Unknown function: {}", func_name)), // 未知函数，should be unreachable
    }
}

fn type_of_list(args: &Vec<Expr>) -> Type {
    use NumberType::*;
    use Type::*;
    let mut is_variable = false;
    let mut consts = Vec::new();
    for arg in args {
        let arg_type = typecheck_expr(arg);
        match arg_type {
            Invalid(s) => return Invalid(s), // 遇到无效类型，直接返回错误
            List(_) => return Invalid("Nested lists are not allowed.".to_string()), // 不允许嵌套列表
            Number(Variable(_)) => is_variable = true,                              // 统计变量数值
            Number(Constant(c)) => {
                if !is_variable {
                    consts.push(c); // 仅当没有变量数值时，收集常数数值
                }
            }
        }
    }
    if is_variable {
        Type::var_list(args.len() as i64)
    } else {
        Type::const_list(consts)
    }
}

fn positive_integer_constant(param: &Option<ModifierParam>) -> Result<i64, String> {
    use NumberType::*;
    use Type::*;
    if let Some(ModifierParam::Value(n)) = param {
        match typecheck_expr(n) {
            Invalid(s) => Err(s),
            Number(Constant(c)) => {
                if is_integer(c) && c >= 0.0 {
                    Ok(c as i64)
                } else {
                    Err("Modifier parameter must be a non-negative integer.".to_string())
                }
            }
            _ => Err("Modifier parameter must be a constant number.".to_string()),
        }
    } else {
        Err("Modifier requires a count parameter.".to_string()) // should be unreachable
    }
}
fn valid_compare_param(param: &Option<ModifierParam>) -> Result<Option<()>, String> {
    match param {
        Some(ModifierParam::Compare(ce)) => {
            let ce_type = typecheck_expr(&ce.val);
            match ce_type {
                Type::Invalid(s) => Err(s),
                Type::Number(NumberType::Constant(_)) => Ok(Some(())),
                Type::Number(NumberType::Variable(_)) => Err(
                    "Comparison modifier cannot have a variable comparison parameter.".to_string(),
                ),
                _ => {
                    Err("Comparison modifier requires a numeric comparison parameter.".to_string())
                }
            }
        }
        Some(ModifierParam::Value(_)) => {
            Err("Comparison modifier requires a comparison parameter, not a value.".to_string()) // should be unreachable
        }
        None => Ok(None), // 没有参数，可能也合法，需要交给外层处理
    }
}
fn type_of_modifier(lhs: &Expr, op: &ModifierOp, param: &Option<ModifierParam>) -> Type {
    use DicePoolType::*;
    use ModifierOp::*;
    use NumberType::*;
    use Type::*;
    use VariableNumber::*;

    // 首先检查类型
    let lhs_type = typecheck_expr(lhs);
    let dice_pool = match lhs_type {
        Invalid(s) => return Invalid(s),
        Number(Variable(DicePool(pool))) => pool, // 正常进行后续计算
        _ => return Invalid("Modifiers can only be applied to dice expressions.".to_string()),
    };

    // 根据不同的修饰符进行不同的处理
    match op {
        KeepHigh | KeepLow | DropHigh | DropLow => {
            // 这些修饰符需要一个常整数参数
            match positive_integer_constant(param) {
                Err(s) => return Invalid(s),
                Ok(c) => {
                    match dice_pool {
                        RawDicePool(item) | LimitableDicePool(item) => {
                            let remain_count = {
                                match op {
                                    KeepHigh | KeepLow => c as i64,
                                    DropHigh | DropLow => item.min_count - (c as i64),
                                    _ => unreachable!(),
                                }
                            };
                            if remain_count <= 0 || remain_count > item.min_count {
                                // 不允许超过边界的保留与丢弃
                                Invalid("Drop / keep count exceeds dice pool size.".to_string())
                            } else {
                                Type::raw_dice_pool(DiceItem {
                                    min_count: remain_count,
                                    side: item.side,
                                })
                            }
                        }
                    }
                }
            }
        }
        Reroll | RerollOnce => match valid_compare_param(param) {
            Err(s) => Invalid(s),
            Ok(None) => Invalid("Modifier requires a comparison parameter.".to_string()), // should be unreachable
            Ok(Some(())) => match dice_pool {
                RawDicePool(item) | LimitableDicePool(item) => Type::raw_dice_pool(item),
            },
        },
        Explode => match valid_compare_param(param) {
            Err(s) => Invalid(s),
            Ok(_) => match dice_pool {
                // 参数是可选的，不强制要求
                RawDicePool(item) | LimitableDicePool(item) => Type::raw_dice_pool(item),
            },
        },
        ExplodeCompound => match valid_compare_param(param) {
            Err(s) => Invalid(s),
            Ok(_) => {
                match dice_pool {
                    // 参数是可选的，不需要检查
                    // 只是唯一会生成 LimitableDicePool 的修饰符
                    RawDicePool(item) | LimitableDicePool(item) => Type::limitable_dice_pool(item),
                }
            }
        },
        Limit => {
            // 这些修饰符需要一个常整数参数
            match positive_integer_constant(param) {
                Err(s) => return Invalid(s),
                Ok(_) => match dice_pool {
                    LimitableDicePool(item) => Type::raw_dice_pool(item),
                    RawDicePool(_) => Invalid(
                        "Limit modifier can only be applied to limitable dice pools.".to_string(),
                    ),
                },
            }
        }
    }
}

fn type_of_success_check(lhs: &Expr, param: &CompareExpr) -> Type {
    use NumberType::*;
    use Type::*;
    use VariableNumber::*;
    let lhs_type = typecheck_expr(lhs);
    match lhs_type {
        Invalid(s) => Invalid(s),
        Number(Variable(DicePool(_))) => {
            match typecheck_expr(&param.val) {
                Invalid(s) => Invalid(s),
                Number(n) => {
                    match n {
                        Variable(_) => Invalid(
                            "Comparison parameter for success check cannot be a variable number."
                                .to_string(),
                        ),
                        Constant(_) => Type::unknown_var(), // 成功检定的结果为未知值
                    }
                }
                _ => Invalid(
                    "Comparison parameter for success check must be a numeric expression."
                        .to_string(),
                ),
            }
        }
        _ => Invalid("Success check can only be applied to dice expressions.".to_string()),
    }
}
