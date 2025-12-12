//! A dice utility library for D&D helper.
//!
//! This crate provides functionality for dice rolling and related utilities.

pub mod grammar;
pub mod typecheck;

use crate::grammar::parse_dice;
use crate::typecheck::typecheck_expr;

use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::prelude::*;

// ==========================================
// 辅助类型定义
// ==========================================

// 用于检查常量是否是常量整数的结果类型，用于check_constant_integer函数
#[derive(Tsify, Serialize, Deserialize)]
#[tsify(into_wasm_abi)]
#[serde(tag = "result", content = "value")]
pub enum ConstantIntegerCheckResult {
    Constant(f64),
    NotConstant(String),
}

// 用于表示带有原因的布尔结果，如果为False，则包含原因字符串
#[derive(Tsify, Serialize, Deserialize)]
#[tsify(into_wasm_abi)]
#[serde(tag = "result", content = "value")]
pub enum ResultWithReason {
    Ture,
    False(String),
}

// ==========================================
// 相关函数定义
// ==========================================

// 检查输入的表达式是否为常量整数
#[wasm_bindgen]
pub fn check_constant_integer(input: String) -> ConstantIntegerCheckResult {
    use crate::typecheck::NumberType; // 有Constant命名冲突，所以单独引入
    use crate::typecheck::Type::*;
    use ConstantIntegerCheckResult::*;
    match parse_dice(&input) {
        Ok(ast) => match typecheck_expr(&ast) {
            Invalid(s) => NotConstant(s),
            Number(NumberType::Constant(c)) if c.fract() == 0.0 => Constant(c),
            Number(NumberType::Constant(_)) => NotConstant("Not an integer".to_string()),
            Number(NumberType::Variable(_)) => NotConstant("Not a constant number".to_string()),
            List(_) => NotConstant("It's a list, not a number".to_string()),
        },
        Err(e) => NotConstant(format!("Parse error: {}", e.to_string())),
    }
}

// 检查输入的表达式是否为合法的骰子表达式
#[wasm_bindgen]
pub fn check_valid_dice_expression(input: String) -> ResultWithReason {
    use ResultWithReason::*;
    match parse_dice(&input) {
        Ok(ast) => match typecheck_expr(&ast) {
            crate::typecheck::Type::Invalid(s) => False(s),
            _ => Ture,
        },
        Err(e) => False(format!("Parse error: {}", e.to_string())),
    }
}
