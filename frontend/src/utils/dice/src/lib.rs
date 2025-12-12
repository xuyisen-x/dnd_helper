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

#[derive(Tsify, Serialize, Deserialize)]
#[tsify(into_wasm_abi)]
#[serde(tag = "result", content = "value")]
pub enum ConstantNumberCheckResult {
    Constant(f64),
    NotConstant(String),
}
#[wasm_bindgen]
pub fn is_constant_number(input: String) -> ConstantNumberCheckResult {
    use ConstantNumberCheckResult::*;
    match parse_dice(&input) {
        Ok(ast) => {
            use crate::typecheck::NumberType::*;
            use crate::typecheck::Type::*;
            match typecheck_expr(&ast) {
                Invalid(s) => NotConstant(s),
                Number(Constant(c)) => ConstantNumberCheckResult::Constant(c),
                Number(Variable(_)) => NotConstant("Not a constant number".to_string()),
                List(_) => NotConstant("It's a list".to_string()),
            }
        }
        Err(e) => NotConstant(e.to_string()),
    }
}
