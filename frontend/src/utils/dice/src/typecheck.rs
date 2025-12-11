use super::grammar::{BinOp, Expr, ModifierOp, ModifierParam};

pub fn is_integer(num: f64) -> bool {
    num.fract() == 0.0
}

pub enum DicePool {
    // xDy
    RawDicePool(i64, i64),
    KeepOrDropPool(i64, i64),
    RerollPool(i64, i64),
    RerollOncePool(i64, i64),
    ExplodePool(i64, i64),
    ExplodeCompoundPool(i64, i64),
    LimitedExplodePool(i64, i64),
}

pub enum Type {
    ConstantNumber(f64),
    VariableNumber,
    DicePool(DicePool),
    ConstantList(Vec<f64>),
    VariableList(i64),
    Invalid(String),
}

pub fn typecheck_expr(expr: &Expr) -> Type {
    match expr {
        Expr::Number(x) => Type::ConstantNumber(*x),
        Expr::Dice { count, side } => type_of_dice(count, side),
        Expr::Binary { lhs, op, rhs } => type_of_binary_op(lhs, op, rhs),
        Expr::Call { func_name, args } => type_of_call(func_name, args),
        Expr::List(args) => type_of_list(args),
        Expr::Modifier { lhs, op, param } => type_of_modifier(lhs, op, param),
        Expr::SuccessCheck {
            lhs,
            compare_expr: _,
        } => type_of_success_check(lhs),
    }
}

// ==========================================
// 辅助处理函数
// ==========================================

/// 从切片中选出前 n 个最大值或最小值，并按原顺序返回
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
    let count_type = typecheck_expr(count);
    let side_type = typecheck_expr(side);
    match (count_type, side_type) {
        (Type::Invalid(err), _) => Type::Invalid(err),
        (_, Type::Invalid(err)) => Type::Invalid(err),
        (Type::ConstantNumber(c), Type::ConstantNumber(s))
            if is_integer(c) && is_integer(s) && c > 1.0 && s > 2.0 =>
        {
            Type::DicePool(DicePool::RawDicePool(c as i64, s as i64))
        }
        (Type::ConstantNumber(_), Type::ConstantNumber(_)) => Type::Invalid(
            "Dice count must be an integer > 1 and side must be an integer > 2".to_string(),
        ),
        _ => Type::Invalid("Dice count and side must be constant numbers".to_string()),
    }
}

fn type_of_binary_op(lhs: &Expr, op: &BinOp, rhs: &Expr) -> Type {
    let lhs_type = typecheck_expr(lhs);
    let rhs_type = typecheck_expr(rhs);
    match (lhs_type, rhs_type) {
        (Type::Invalid(err), _) => Type::Invalid(err),
        (_, Type::Invalid(err)) => Type::Invalid(err),
        // 两侧都是常量数值时，进行计算
        (Type::ConstantNumber(a), Type::ConstantNumber(b)) => match op {
            BinOp::Add => Type::ConstantNumber(a + b),
            BinOp::Sub => Type::ConstantNumber(a - b),
            BinOp::Mul => Type::ConstantNumber(a * b),
            BinOp::Div => {
                if b == 0.0 {
                    Type::Invalid("Division by zero".to_string())
                } else {
                    Type::ConstantNumber(a / b)
                }
            }
            BinOp::Mod => {
                if b == 0.0 {
                    Type::Invalid("Modulo by zero".to_string())
                } else if is_integer(a) && is_integer(b) {
                    Type::ConstantNumber((a as i64 % b as i64) as f64)
                } else {
                    Type::Invalid("Modulo operands must be integers".to_string())
                }
            }
        },
        // 两侧都是数值，但是一侧是变量数值，结果为变量数值
        (Type::ConstantNumber(_), Type::VariableNumber | Type::DicePool(_))
        | (Type::VariableNumber | Type::DicePool(_), Type::ConstantNumber(_))
        | (Type::VariableNumber | Type::DicePool(_), Type::VariableNumber | Type::DicePool(_)) => {
            Type::VariableNumber
        }
        // 允许两个列表作加法
        (Type::ConstantList(a), Type::ConstantList(b)) => {
            if let BinOp::Add = op {
                let mut result = a.clone();
                result.extend(b.iter());
                Type::ConstantList(result)
            } else {
                Type::Invalid("Only addition is supported for lists".to_string())
            }
        }
        (Type::VariableList(l1), Type::VariableList(l2)) => {
            if let BinOp::Add = op {
                Type::VariableList(l1 + l2)
            } else {
                Type::Invalid("Only addition is supported for lists".to_string())
            }
        }
        (Type::VariableList(lv), Type::ConstantList(lc))
        | (Type::ConstantList(lc), Type::VariableList(lv)) => {
            if let BinOp::Add = op {
                Type::VariableList(lv + lc.len() as i64)
            } else {
                Type::Invalid("Only addition is supported for lists".to_string())
            }
        }
        // 允许整数和列表作乘法
        (Type::ConstantNumber(num), Type::ConstantList(list))
        | (Type::ConstantList(list), Type::ConstantNumber(num)) => {
            if let BinOp::Mul = op {
                if is_integer(num) {
                    let times = num as usize;
                    let mut result = Vec::new();
                    for _ in 0..times {
                        result.extend(list.iter());
                    }
                    Type::ConstantList(result)
                } else {
                    Type::Invalid("Can only multiply list by an integer".to_string())
                }
            } else {
                Type::Invalid(
                    "Only multiplication is supported between number and list".to_string(),
                )
            }
        }
        (Type::ConstantNumber(num), Type::VariableList(lv))
        | (Type::VariableList(lv), Type::ConstantNumber(num)) => {
            if let BinOp::Mul = op {
                if is_integer(num) {
                    Type::VariableList(lv * (num as i64))
                } else {
                    Type::Invalid("Can only multiply list by an integer".to_string())
                }
            } else {
                Type::Invalid(
                    "Only multiplication is supported between number and list".to_string(),
                )
            }
        }
        // 为变量数值和列表的组合进行报错
        (Type::VariableNumber, Type::ConstantList(_))
        | (Type::ConstantList(_), Type::VariableNumber)
        | (Type::VariableNumber, Type::VariableList(_))
        | (Type::VariableList(_), Type::VariableNumber) => {
            Type::Invalid("Cannot operate between variable number and list".to_string())
        }
        // 其他情况报错
        _ => Type::Invalid("Invalid binary operation".to_string()),
    }
}

fn only_list_args(args: &Vec<Expr>) -> Option<Type> {
    if args.len() == 1 {
        let arg_type = typecheck_expr(&args[0]);
        match arg_type {
            Type::ConstantList(_) | Type::VariableList(_) => Some(arg_type),
            _ => None,
        }
    } else {
        None
    }
}
fn one_list_and_one_constant_args(args: &Vec<Expr>) -> Option<(Type, i64)> {
    if args.len() == 2 {
        let first_type = typecheck_expr(&args[0]);
        let second_type = typecheck_expr(&args[1]);
        match (&first_type, second_type) {
            (Type::ConstantList(_) | Type::VariableList(_), Type::ConstantNumber(n))
                if is_integer(n) =>
            {
                Some((first_type, n as i64))
            }
            _ => None,
        }
    } else {
        None
    }
}
fn common_numeric_args(args: &Vec<Expr>) -> bool {
    for arg in args {
        let arg_type = typecheck_expr(arg);
        match arg_type {
            Type::ConstantNumber(_) | Type::VariableNumber | Type::DicePool(_) => {}
            _ => return false,
        }
    }
    true
}
fn type_of_call(func_name: &str, args: &Vec<Expr>) -> Type {
    match func_name {
        "max" | "min" => {
            // 先检查args中是否有无效类型
            for arg in args {
                let arg_type = typecheck_expr(arg);
                if let Type::Invalid(err) = arg_type {
                    return Type::Invalid(err);
                }
            }
            // 允许3种输入
            // 1. args中所有参数均为数值类型
            // 2. args有且只有一个参数，且为列表
            // 3. args有且只有两个参数，第一个为列表，第二个为常整数 取出前n个最大/小值，仍然为列表
            // 处理第一种类型
            if common_numeric_args(args) {
                let mut values = Vec::new();
                for arg in args {
                    let arg_type = typecheck_expr(arg);
                    match arg_type {
                        Type::ConstantNumber(x) => values.push(x),
                        Type::VariableNumber | Type::DicePool(_) => {
                            return Type::VariableNumber;
                        }
                        _ => unreachable!(),
                    }
                }
                if values.is_empty() {
                    return Type::Invalid("No arguments provided to max/min function".to_string());
                }
                let max_min = if func_name == "max" {
                    values.into_iter().fold(f64::MIN, f64::max)
                } else {
                    values.into_iter().fold(f64::MAX, f64::min)
                };
                return Type::ConstantNumber(max_min);
            }
            // 处理第二种类型
            if let Some(list_type) = only_list_args(args) {
                return match list_type {
                    Type::ConstantList(values) => {
                        if values.is_empty() {
                            Type::Invalid("Cannot compute max/min of empty list".to_string())
                        } else {
                            let max_min = if func_name == "max" {
                                values.into_iter().fold(f64::MIN, f64::max)
                            } else {
                                values.into_iter().fold(f64::MAX, f64::min)
                            };
                            Type::ConstantNumber(max_min)
                        }
                    }
                    Type::VariableList(_) => Type::VariableNumber,
                    _ => unreachable!(),
                };
            }
            // 处理第三种类型
            if let Some((list_type, n)) = one_list_and_one_constant_args(args) {
                return match list_type {
                    Type::ConstantList(values) => {
                        if n <= 0 || n as usize > values.len() {
                            Type::Invalid("Invalid count for max/min".to_string())
                        } else if values.is_empty() {
                            Type::Invalid("Cannot compute max/min of empty list".to_string())
                        } else {
                            if func_name == "max" {
                                Type::ConstantList(top_n_preserve_order(&values, n as usize, true))
                            } else {
                                Type::ConstantList(top_n_preserve_order(&values, n as usize, false))
                            }
                        }
                    }
                    Type::VariableList(lv) => {
                        if n > lv {
                            Type::Invalid(
                                "Count exceeds the length of the variable list".to_string(),
                            )
                        } else {
                            Type::VariableList(n)
                        }
                    }
                    _ => unreachable!(),
                };
            }
            Type::Invalid("Invalid arguments for max/min function".to_string())
        }
        "sum" => {
            // 允许两种输入
            // 1. args中所有参数均为数值类型
            // 2. args有且只有一个参数，且为列表
            // 处理第一种类型
            if common_numeric_args(args) {
                let mut total = 0.0;
                for arg in args {
                    let arg_type = typecheck_expr(arg);
                    match arg_type {
                        Type::ConstantNumber(x) => total += x,
                        Type::VariableNumber | Type::DicePool(_) => {
                            return Type::VariableNumber;
                        }
                        _ => unreachable!(),
                    }
                }
                return Type::ConstantNumber(total);
            }
            // 处理第二种类型
            if let Some(list_type) = only_list_args(args) {
                return match list_type {
                    Type::ConstantList(values) => {
                        let total: f64 = values.into_iter().sum();
                        Type::ConstantNumber(total)
                    }
                    Type::VariableList(_) => Type::VariableNumber,
                    _ => unreachable!(),
                };
            }
            Type::Invalid("Invalid arguments for sum function".to_string())
        }
        "floor" | "ceil" | "round" | "abs" => {
            // 只允许一个数值类型参数
            if args.len() != 1 {
                return Type::Invalid(format!(
                    "{} function requires exactly one argument",
                    func_name
                ));
            }
            let arg_type = typecheck_expr(&args[0]);
            match arg_type {
                Type::Invalid(err) => Type::Invalid(err),
                Type::ConstantNumber(x) => {
                    let result = match func_name {
                        "floor" => x.floor(),
                        "ceil" => x.ceil(),
                        "round" => x.round(),
                        "abs" => x.abs(),
                        _ => unreachable!(),
                    };
                    Type::ConstantNumber(result)
                }
                Type::VariableNumber | Type::DicePool(_) => Type::VariableNumber,
                _ => Type::Invalid(format!(
                    "{} function requires a numeric argument",
                    func_name
                )),
            }
        }
        _ => Type::Invalid(format!("Unknown function: {}", func_name)),
    }
}

fn type_of_list(args: &Vec<Expr>) -> Type {
    // 检查每个元素的类型，确保都是数值类型
    let mut is_constant = true;
    for arg in args {
        let arg_type = typecheck_expr(arg);
        match arg_type {
            Type::Invalid(err) => return Type::Invalid(err),
            Type::ConstantList(_) | Type::VariableList(_) => {
                return Type::Invalid("Nested lists are not supported".to_string());
            }
            // 只要有一个元素是变量数值或骰池，整个列表就不是常量列表
            Type::VariableNumber | Type::DicePool(_) => {
                is_constant = false;
            }
            _ => {}
        }
    }
    if is_constant {
        let mut values = Vec::new();
        for arg in args {
            if let Expr::Number(x) = arg {
                values.push(*x);
            }
        }
        Type::ConstantList(values)
    } else {
        Type::VariableList(args.len() as i64)
    }
}

fn type_of_modifier(lhs: &Expr, op: &ModifierOp, param: &Option<ModifierParam>) -> Type {
    let lhs_type = typecheck_expr(lhs);
    match lhs_type {
        Type::Invalid(err) => return Type::Invalid(err),
        _ => (),
    }
    match op {
        ModifierOp::DropHigh | ModifierOp::DropLow | ModifierOp::KeepHigh | ModifierOp::KeepLow => {
            // 只能作用于原始骰池
            match lhs_type {
                Type::DicePool(DicePool::RawDicePool(count, side)) => match param {
                    Some(ModifierParam::Value(e)) => {
                        let param_type = typecheck_expr(e);
                        match param_type {
                            Type::ConstantNumber(n) if is_integer(n) && n >= 0.0 && n < count as f64 => {
                                let n = n as i64;
                                let new_pool = match op {
                                    ModifierOp::DropHigh => {
                                        DicePool::KeepOrDropPool(count - n, side)
                                    }
                                    ModifierOp::DropLow => {
                                        DicePool::KeepOrDropPool(count - n, side)
                                    }
                                    ModifierOp::KeepHigh => {
                                        DicePool::KeepOrDropPool(n, side)
                                    }
                                    ModifierOp::KeepLow => {
                                        DicePool::KeepOrDropPool(n, side)
                                    }
                                    _ => unreachable!(),
                                };
                                Type::DicePool(new_pool)
                            }
                            _ => Type::Invalid(
                                "Keep/Drop parameter must be a non-negative integer less than the dice count".to_string(),
                            ),
                        }
                    }
                    None => Type::Invalid("Keep/Drop modifiers require a parameter".to_string()),
                    _ => Type::Invalid("Invalid parameter for Keep/Drop modifier".to_string()),
                },
                _ => Type::Invalid(
                    "Keep/Drop modifiers can only be applied to raw dice pools".to_string(),
                ),
            }
        }
        ModifierOp::Explode => {
            // 只能作用于原始骰池
            match lhs_type {
                Type::DicePool(DicePool::RawDicePool(count, side)) => {
                    Type::DicePool(DicePool::ExplodePool(count, side))
                }
                _ => Type::Invalid(
                    "Explode modifier can only be applied to raw dice pools".to_string(),
                ),
            }
        }
        ModifierOp::ExplodeCompound => {
            // 只能作用于原始骰池
            match lhs_type {
                Type::DicePool(DicePool::RawDicePool(count, side)) => {
                    Type::DicePool(DicePool::ExplodeCompoundPool(count, side))
                }
                _ => Type::Invalid(
                    "Explode Compound modifier can only be applied to raw dice pools".to_string(),
                ),
            }
        }
        ModifierOp::Limit => {
            // 只能作用于ExplodeCompoundPool
            match lhs_type {
                Type::DicePool(DicePool::ExplodeCompoundPool(count, side)) => match param {
                    Some(ModifierParam::Value(e)) => {
                        let param_type = typecheck_expr(e);
                        match param_type {
                            Type::ConstantNumber(n) if is_integer(n) && n > 0.0 => {
                                Type::DicePool(DicePool::LimitedExplodePool(count, side))
                            }
                            _ => Type::Invalid(
                                "Limited Explode parameter must be a positive integer".to_string(),
                            ),
                        }
                    }
                    None => {
                        Type::Invalid("Limited Explode modifier requires a parameter".to_string())
                    }
                    _ => {
                        Type::Invalid("Invalid parameter for Limited Explode modifier".to_string())
                    }
                },
                _ => Type::Invalid(
                    "Limited Explode modifier can only be applied to compound explode pools"
                        .to_string(),
                ),
            }
        }
        ModifierOp::Reroll => match lhs_type {
            Type::DicePool(DicePool::RawDicePool(count, side))
            | Type::DicePool(DicePool::KeepOrDropPool(count, side)) => {
                Type::DicePool(DicePool::RerollPool(count, side))
            }
            _ => Type::Invalid(
                "Reroll modifier can only be applied to raw or keep/drop dice pools".to_string(),
            ),
        },
        ModifierOp::RerollOnce => match lhs_type {
            Type::DicePool(DicePool::RawDicePool(count, side))
            | Type::DicePool(DicePool::KeepOrDropPool(count, side)) => {
                Type::DicePool(DicePool::RerollOncePool(count, side))
            }
            _ => Type::Invalid(
                "Reroll Once modifier can only be applied to raw or keep/drop dice pools"
                    .to_string(),
            ),
        },
    }
}

fn type_of_success_check(lhs: &Expr) -> Type {
    let lhs_type = typecheck_expr(lhs);
    match lhs_type {
        Type::Invalid(err) => Type::Invalid(err),
        Type::DicePool(_) => Type::VariableNumber,
        _ => Type::Invalid("Success check can only be applied to dice pools".to_string()),
    }
}
