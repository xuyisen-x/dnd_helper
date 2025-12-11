//! A dice utility library for D&D helper.
//!
//! This crate provides functionality for dice rolling and related utilities.

pub mod grammar;

pub use crate::grammar::{parse_dice, Expr};