use lazy_static::lazy_static;
use pest::Parser;
use pest::pratt_parser::{Assoc, Op, PrattParser};
use pest_derive::Parser;
use serde::{Deserialize, Serialize};
use tsify::Tsify;

// 加载语法文件
#[derive(Parser)]
#[grammar = "grammar.pest"]
pub struct DiceGrammar;

// ==========================================
// 2. AST 数据结构 (导出给前端)
// ==========================================

// 二元运算符
#[derive(Debug, Clone, Serialize, Deserialize, Tsify, PartialEq)]
#[tsify(into_wasm_abi)]
pub enum BinOp {
    Add,
    Sub,
    Mul,
    Div,
    Mod,
    Idiv,
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify, PartialEq)]
#[tsify(into_wasm_abi)]
pub enum CompareOp {
    Greater,
    Less,
    Equal,
    GreaterEqual,
    LessEqual,
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify, PartialEq)]
#[tsify(into_wasm_abi)]
pub enum ModifierOp {
    KeepHigh,
    KeepLow,
    DropHigh,
    DropLow,
    Reroll,
    RerollOnce,
    Explode,
    ExplodeCompound,
    Limit,
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify, PartialEq)]
#[tsify(into_wasm_abi)]
pub struct CompareExpr {
    pub op: CompareOp,  // 比较符号
    pub val: Box<Expr>, // 目标值
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify, PartialEq)]
#[tsify(into_wasm_abi)]
#[serde(untagged)]
pub enum ModifierParam {
    Compare(CompareExpr),
    Value(Box<Expr>),
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify, PartialEq)]
#[tsify(into_wasm_abi)]
pub enum Expr {
    // 基础数值: 1, 1.5
    Number(f64),

    // 骰子: 数量, 面数 (例如 1d20 -> Dice(Number(1), Number(20)))
    Dice {
        count: Box<Expr>,
        side: Box<Expr>,
    },

    // 二元运算: 1 + 2
    Binary {
        lhs: Box<Expr>,
        op: BinOp,
        rhs: Box<Expr>,
    },

    // 函数调用: max(1, 2)
    Call {
        func_name: String,
        args: Vec<Expr>,
    },

    // 列表: [1, 2]
    List(Vec<Expr>),

    // 通用修饰符节点 (kh1, r>5, !!)
    Modifier {
        lhs: Box<Expr>,               // lhs: 被修饰的对象 (如 1d20)，不支持标量表达式
        op: ModifierOp,               // op:修饰符名称 (kh, kl, r, ro, !, !!, l)
        param: Option<ModifierParam>, // param参数，可能是数值或者比较表达式
    },

    // 成功/失败判定 (>10, =5)
    SuccessCheck {
        lhs: Box<Expr>,            // lhs: 被判定的对象，可以是标量也可以是列表
        compare_expr: CompareExpr, // 比较表达式
    },
}

fn string_to_compare_op(s: &str) -> CompareOp {
    match s {
        ">" => CompareOp::Greater,
        "<" => CompareOp::Less,
        "=" => CompareOp::Equal,
        ">=" => CompareOp::GreaterEqual,
        "<=" => CompareOp::LessEqual,
        _ => unreachable!("Unknown compare operator: {}", s),
    }
}

// ==========================================
// 3. Pratt Parser 配置 (优先级控制)
// ==========================================

lazy_static! {
    static ref PRATT_PARSER: PrattParser<Rule> = {
        PrattParser::new()
            // 优先级 1: 加减
            .op(Op::infix(Rule::add, Assoc::Left) | Op::infix(Rule::sub, Assoc::Left))
            // 优先级 2: 乘除模
            .op(Op::infix(Rule::mul, Assoc::Left) |
                Op::infix(Rule::div, Assoc::Left) |
                Op::infix(Rule::rem, Assoc::Left) |
                Op::infix(Rule::idiv, Assoc::Left))
            // 优先级 3: 前缀 (负号)
            .op(Op::prefix(Rule::neg) | Op::prefix(Rule::pos))
            // 优先级 4: 后缀 (修饰符) - 优先级最高，紧贴左侧
            .op(Op::postfix(Rule::modifier))
    };
}

// ==========================================
// 4. 解析函数声明
// ==========================================

pub fn parse_dice(input: &str) -> Result<Expr, pest::error::Error<Rule>> {
    // A. 调用 Pest 解析
    let mut pairs = DiceGrammar::parse(Rule::main, input)?;

    // B. 获取 expr
    let expr_pair = pairs.next().unwrap(); // expr

    // C. 转换为 AST
    Ok(parse_expr_pratt(expr_pair))
}

fn parse_expr_pratt(pair: pest::iterators::Pair<Rule>) -> Expr {
    PRATT_PARSER
        .map_primary(process_primary)
        .map_infix(process_infix)
        .map_prefix(process_prefix)
        .map_postfix(process_postfix)
        .parse(pair.into_inner())
}

// ==========================================
// 5. 辅助处理函数
// ==========================================

fn process_primary(pair: pest::iterators::Pair<Rule>) -> Expr {
    match pair.as_rule() {
        Rule::dice_expr => {
            // 进入里面一层
            let mut inner_pairs = pair.into_inner();
            let first = inner_pairs.next().unwrap();
            match first.as_rule() {
                Rule::dice_op => {
                    // 以dice_op开头，省略了数量，则默认为1
                    let atom_pair = inner_pairs.next().unwrap();
                    let sides = parse_atom(atom_pair);
                    Expr::Dice {
                        count: Box::new(Expr::Number(1.0)),
                        side: Box::new(sides),
                    }
                }
                Rule::atom => {
                    // 以atom开头，说明有数量，可能是单纯的数值或者ndn的表达式
                    let count_or_number = parse_atom(first);
                    match inner_pairs.next() {
                        Some(_) => {
                            // 后面跟着dice_op，说明是ndn表达式
                            let sides_pair = inner_pairs.next().unwrap();
                            let sides = parse_atom(sides_pair);
                            Expr::Dice {
                                count: Box::new(count_or_number),
                                side: Box::new(sides),
                            }
                        }
                        None => {
                            // 只有一个atom，直接返回
                            count_or_number
                        }
                    }
                }
                _ => unreachable!("Unknown dice expression: {:?}", first.as_rule()),
            }
        }
        // 下面这句话永远不会被reach到，因为expr已经被Pratt Parser处理过了
        // Rule::expr => parse_expr_pratt(pair),
        _ => unreachable!("Unknown primary expression: {:?}", pair.as_rule()),
    }
}

fn process_infix(lhs: Expr, op: pest::iterators::Pair<Rule>, rhs: Expr) -> Expr {
    let bin_op = match op.as_rule() {
        Rule::add => BinOp::Add,
        Rule::sub => BinOp::Sub,
        Rule::mul => BinOp::Mul,
        Rule::div => BinOp::Div,
        Rule::rem => BinOp::Mod,
        Rule::idiv => BinOp::Idiv,
        _ => unreachable!("Unknown infix operator: {:?}", op.as_rule()),
    };
    Expr::Binary {
        lhs: Box::new(lhs),
        op: bin_op,
        rhs: Box::new(rhs),
    }
}

fn process_prefix(op: pest::iterators::Pair<Rule>, rhs: Expr) -> Expr {
    match op.as_rule() {
        Rule::neg => Expr::Binary {
            lhs: Box::new(Expr::Number(0.0)),
            op: BinOp::Sub,
            rhs: Box::new(rhs),
        },
        Rule::pos => rhs, // 正号不做处理
        _ => unreachable!("Unknown prefix operator: {:?}", op.as_rule()),
    }
}

fn process_postfix(lhs: Expr, op: pest::iterators::Pair<Rule>) -> Expr {
    let op = op.into_inner().next().unwrap(); // 取得第一个操作符
    println!("Processing postfix operator: {:?}", op.as_rule());
    match op.as_rule() {
        Rule::keep_high | Rule::keep_low | Rule::drop_high | Rule::drop_low => {
            let op_enum = match op.as_rule() {
                Rule::keep_high => ModifierOp::KeepHigh,
                Rule::keep_low => ModifierOp::KeepLow,
                Rule::drop_high => ModifierOp::DropHigh,
                Rule::drop_low => ModifierOp::DropLow,
                _ => unreachable!(), // should not reach here
            };
            let mut inner_pairs = op.into_inner(); // 进入内部
            let param = if let Some(mod_param) = inner_pairs.next() {
                Some(ModifierParam::Value(Box::new(parse_atom(mod_param))))
            } else {
                // 默认值为1
                Some(ModifierParam::Value(Box::new(Expr::Number(1.0))))
            };
            Expr::Modifier {
                lhs: Box::new(lhs),
                op: op_enum,
                param: param,
            }
        }
        Rule::reroll_once | Rule::reroll | Rule::explode_compound | Rule::explode => {
            let op_enum = match op.as_rule() {
                Rule::reroll_once => ModifierOp::RerollOnce,
                Rule::reroll => ModifierOp::Reroll,
                Rule::explode_compound => ModifierOp::ExplodeCompound,
                Rule::explode => ModifierOp::Explode,
                _ => unreachable!(), // should not reach here
            };
            let mut inner_pairs = op.into_inner(); // 进入内部
            let param = if let Some(mod_param) = inner_pairs.next() {
                let mut mod_param_inner = mod_param.into_inner(); // mod_param内部
                let first = mod_param_inner.next().unwrap();
                match first.as_rule() {
                    Rule::atom => {
                        // 是值，默认op为等于
                        let value = parse_atom(first);
                        Some(ModifierParam::Compare(CompareExpr {
                            op: CompareOp::Equal,
                            val: Box::new(value),
                        }))
                    }
                    Rule::compare_op => {
                        // 是比较表达式
                        let op_symbol = first; // >, <, =
                        let val_pair = mod_param_inner.next().unwrap(); // atom
                        let compare_expr = CompareExpr {
                            op: string_to_compare_op(op_symbol.as_str()),
                            val: Box::new(parse_atom(val_pair)),
                        };
                        Some(ModifierParam::Compare(compare_expr))
                    }
                    _ => unreachable!("Unknown modifier parameter: {:?}", first.as_rule()),
                }
            } else {
                None
            };
            Expr::Modifier {
                lhs: Box::new(lhs),
                op: op_enum,
                param: param,
            }
        }
        Rule::limit => {
            let inner_pairs = op.into_inner().next().unwrap(); // atom, limit_param是隐式的
            Expr::Modifier {
                lhs: Box::new(lhs),
                op: ModifierOp::Limit,
                param: Some(ModifierParam::Value(Box::new(parse_atom(inner_pairs)))),
            }
        }
        Rule::compare_param => {
            let mut inner_pairs = op.into_inner(); // 进入compare_param内部
            let op_symbol = inner_pairs.next().unwrap(); // >, <, =
            let val_pair = inner_pairs.next().unwrap(); // atom
            Expr::SuccessCheck {
                lhs: Box::new(lhs), // 被判定的对象
                compare_expr: CompareExpr {
                    op: string_to_compare_op(op_symbol.as_str()), // 比较符
                    val: Box::new(parse_atom(val_pair)),          // 目标值
                },
            }
        }
        _ => unreachable!("Unknown postfix operator: {:?}", op.as_rule()),
    }
}

fn parse_atom(pair: pest::iterators::Pair<Rule>) -> Expr {
    let inner_pairs = pair.into_inner().next().unwrap();
    match inner_pairs.as_rule() {
        Rule::number => {
            let s = inner_pairs.as_str();
            Expr::Number(s.parse::<f64>().unwrap_or(0.0))
        }
        Rule::function => {
            let mut inner = inner_pairs.into_inner();
            let name = inner.next().unwrap().as_str().to_string(); // func_name
            let args = match inner.next() {
                Some(args_pair) => args_pair
                    .into_inner()
                    .map(|p| parse_expr_pratt(p))
                    .collect(),
                None => vec![],
            };
            Expr::Call {
                func_name: name,
                args: args,
            }
        }
        Rule::list => {
            let mut inner = inner_pairs.into_inner();
            let items = match inner.next() {
                Some(args_pair) => args_pair
                    .into_inner()
                    .map(|p| parse_expr_pratt(p))
                    .collect(),
                None => vec![],
            };
            Expr::List(items)
        }
        // 处理括号 (expr)
        Rule::expr => parse_expr_pratt(inner_pairs),

        // 容错处理
        _ => unreachable!(
            "Unknown atom: {:?} - {}",
            inner_pairs.as_rule(),
            inner_pairs.as_str()
        ),
    }
}
