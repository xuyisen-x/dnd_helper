use dice_roller::grammar::*;

#[test]
fn test_number_constant() {
    let result = parse_dice("20");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Number(20.0)
    );
}

#[test]
fn test_dice_expr() {
    let result = parse_dice("2d20");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Dice (
            Box::new(Expr::Number(2.0)),
            Box::new(Expr::Number(20.0)),
        )
    );
}

#[test]
fn test_recursive_dice_expr() {
    let result = parse_dice("(1+2)d6");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Dice (
            Box::new(Expr::Binary(
                Box::new(Expr::Number(1.0)),
                BinOp::Add, 
                Box::new(Expr::Number(2.0))
            )),
            Box::new(Expr::Number(6.0)),
        )
    );
}

#[test]
fn test_recursive_normal_expr() {
    let result = parse_dice("(1 + 2) - (3 - (1 + 1))");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Binary(
            Box::new(Expr::Binary(
                Box::new(Expr::Number(1.0)),
                BinOp::Add, 
                Box::new(Expr::Number(2.0))
            )),
            BinOp::Sub, 
            Box::new(
                Expr::Binary(
                    Box::new(Expr::Number(3.0)),
                    BinOp::Sub, 
                    Box::new(
                        Expr::Binary(
                            Box::new(Expr::Number(1.0)),
                            BinOp::Add, 
                            Box::new(Expr::Number(1.0))
                        )
                    )
                )
            )
        )
    );
}

#[test]
fn test_implict_dice_expr() {
    let result = parse_dice("d20");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Dice (
            Box::new(Expr::Number(1.0)),
            Box::new(Expr::Number(20.0)),
        )
    );
}

#[test]
fn test_priority_expr() {
    let result = parse_dice("1 + 2d20 * 3");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Binary(
            Box::new(Expr::Number(1.0)),
            BinOp::Add, 
            Box::new(
                Expr::Binary(
                    Box::new(
                        Expr::Dice (
                            Box::new(Expr::Number(2.0)),
                            Box::new(Expr::Number(20.0)),
                        )
                    ),
                    BinOp::Mul, 
                    Box::new(Expr::Number(3.0))
                )
            )
        )
    );
}

#[test]
fn test_div_expr() {
    let result = parse_dice("10 / 2d5");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Binary(
            Box::new(Expr::Number(10.0)),
            BinOp::Div, 
            Box::new(
                Expr::Dice (
                    Box::new(Expr::Number(2.0)),
                    Box::new(Expr::Number(5.0)),
                )
            )
        )
    );
}

#[test]
fn test_mod_expr() {
    let result = parse_dice("3d4 % 10");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Binary(
            Box::new(
                Expr::Dice (
                    Box::new(Expr::Number(3.0)),
                    Box::new(Expr::Number(4.0)),
                )
            ),
            BinOp::Mod, 
            Box::new(Expr::Number(10.0))
        )
    );
}

#[test]
fn test_list_expr() {
    let result = parse_dice("[2d6, 3d4, 1d20]");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::List(vec![
            Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(6.0)),
            ),
            Expr::Dice (
                Box::new(Expr::Number(3.0)),
                Box::new(Expr::Number(4.0)),
            ),
            Expr::Dice (
                Box::new(Expr::Number(1.0)),
                Box::new(Expr::Number(20.0)),
            ),
        ])
    );
}

#[test]
fn test_list_multi_expr() {
    let result = parse_dice("[1d6, 2d8, 3d10] * 2");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Binary(
            Box::new(
                Expr::List(vec![
                    Expr::Dice (
                        Box::new(Expr::Number(1.0)),
                        Box::new(Expr::Number(6.0)),
                    ),
                    Expr::Dice (
                        Box::new(Expr::Number(2.0)),
                        Box::new(Expr::Number(8.0)),
                    ),
                    Expr::Dice (
                        Box::new(Expr::Number(3.0)),
                        Box::new(Expr::Number(10.0)),
                    ),
                ])
            ),
            BinOp::Mul, 
            Box::new(Expr::Number(2.0))
        )
    );
}

#[test]
fn test_max_list() {
    let result = parse_dice("max([2d6, 3d4, 1d20])");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Call (
            "max".to_string(),
            vec![
                Expr::List(vec![
                    Expr::Dice (
                        Box::new(Expr::Number(2.0)),
                        Box::new(Expr::Number(6.0)),
                    ),
                    Expr::Dice (
                        Box::new(Expr::Number(3.0)),
                        Box::new(Expr::Number(4.0)),
                    ),
                    Expr::Dice (
                        Box::new(Expr::Number(1.0)),
                        Box::new(Expr::Number(20.0)),
                    ),
                ])
            ],
        )
    );
}

#[test]
fn test_max_args() {
    let result = parse_dice("max(2d6, 3d4, 1d20)");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Call (
            "max".to_string(),
            vec![
                Expr::Dice (
                    Box::new(Expr::Number(2.0)),
                    Box::new(Expr::Number(6.0)),
                ),
                Expr::Dice (
                    Box::new(Expr::Number(3.0)),
                    Box::new(Expr::Number(4.0)),
                ),
                Expr::Dice (
                    Box::new(Expr::Number(1.0)),
                    Box::new(Expr::Number(20.0)),
                ),
            ],
        )
    )
}

#[test]
fn test_max_empty() {
    let result = parse_dice("max()");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Call (
            "max".to_string(),
            vec![],
        )
    )
}

#[test]
fn test_min_list_empty() {
    let result = parse_dice("min([])");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Call (
            "min".to_string(),
            vec![
                Expr::List(vec![]),
            ],
        )
    )
}

#[test]
fn test_keephigh() {
    let result = parse_dice("2d20kh");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::KeepHigh,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(1.0)))),
        }
    );
}

#[test]
fn test_keeplow() {
    let result = parse_dice("3d20kl");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(3.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::KeepLow,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(1.0)))),
        }
    );
}

#[test]
fn test_drophigh() {
    let result = parse_dice("4d20dh");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(4.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::DropHigh,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(1.0)))),
        }
    );
}

#[test]
fn test_droplow() {
    let result = parse_dice("5d20dl");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(5.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::DropLow,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(1.0)))),
        }
    );
}

#[test]
fn test_keephigh_with_param() {
    let result = parse_dice("2d20kh1");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::KeepHigh,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(1.0)))),
        }
    );
}

#[test]
fn test_keeplow_with_param() {
    let result = parse_dice("3d20kl2");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(3.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::KeepLow,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(2.0)))),
        }
    );
}

#[test]
fn test_drophigh_with_param() {
    let result = parse_dice("4d20dh3");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(4.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::DropHigh,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(3.0)))),
        }
    );
}

#[test]
fn test_droplow_with_param() {
    let result = parse_dice("5d20dl4");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(5.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::DropLow,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(4.0)))),
        }
    );
}

#[test]
fn test_pos() {
    let result = parse_dice("+5d20dl4");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(5.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::DropLow,
            param: Some(ModifierParam::Value(Box::new(Expr::Number(4.0)))),
        }
    );
}

#[test]
fn test_neg() {
    let result = parse_dice("-5d20dl4");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Binary(
            Box::new(Expr::Number(0.0)),
            BinOp::Sub, 
            Box::new(
                Expr::Modifier { 
                    lhs: Box::new(Expr::Dice (
                        Box::new(Expr::Number(5.0)),
                        Box::new(Expr::Number(20.0)),
                    )),
                    op: ModifierOp::DropLow,
                    param: Some(ModifierParam::Value(Box::new(Expr::Number(4.0)))),
                }
            )
        )
    );
}

#[test]
fn test_compare_expr() {
    let result = parse_dice("2d20<=15");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::SuccessCheck { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0))),
            ),
            compare_expr: CompareExpr {
                op: CompareOp::LessEqual,
                val: Box::new(Expr::Number(15.0)),
            },
        }
    );
}

#[test]
fn test_compare_expr2() {
    let result = parse_dice("2d20>=15");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::SuccessCheck { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0))),
            ),
            compare_expr: CompareExpr {
                op: CompareOp::GreaterEqual,
                val: Box::new(Expr::Number(15.0)),
            },
        }
    );
}

#[test]
fn test_compare_expr3() {
    let result = parse_dice("2d20=15");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::SuccessCheck { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0))),
            ),
            compare_expr: CompareExpr {
                op: CompareOp::Equal,
                val: Box::new(Expr::Number(15.0)),
            },
        }
    );
}

#[test]
fn test_compare_expr4() {
    let result = parse_dice("2d20>15");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::SuccessCheck { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0))),
            ),
            compare_expr: CompareExpr {
                op: CompareOp::Greater,
                val: Box::new(Expr::Number(15.0)),
            },
        }
    );
}

#[test]
fn test_compare_expr5() {
    let result = parse_dice("2d20<15");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::SuccessCheck { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0))),
            ),
            compare_expr: CompareExpr {
                op: CompareOp::Less,
                val: Box::new(Expr::Number(15.0)),
            },
        }
    );
}

#[test]
fn test_explode_expr() {
    let result = parse_dice("2d6!");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(6.0)),
            )),
            op: ModifierOp::Explode,
            param: None,
        }
    );
}

#[test]
fn test_explode_expr_with_param() {
    let result = parse_dice("2d6!3");
    assert!(result.is_ok());
        assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(6.0)),
            )),
            op: ModifierOp::Explode,
            param: Some(
                ModifierParam::Compare(
                    CompareExpr { op: CompareOp::Equal, val: Box::new(Expr::Number(3.0)) }
                )
            ),
        }
    );
}

#[test]
fn test_explode_compound_expr() {
    let result = parse_dice("2d6!!");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(6.0)),
            )),
            op: ModifierOp::ExplodeCompound,
            param: None,
        }
    );
}

#[test]
fn test_explode_compound_expr_with_param() {
    let result = parse_dice("2d6!!<=4");
    assert!(result.is_ok());
        assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(6.0)),
            )),
            op: ModifierOp::ExplodeCompound,
            param: Some(
                ModifierParam::Compare(
                    CompareExpr { op: CompareOp::LessEqual, val: Box::new(Expr::Number(4.0)) }
                )
            ),
        }
    );
}

#[test]
fn test_explode_compound_expr_with_param_and_limit() {
    let result = parse_dice("2d6!!<=4l(1+1)");
    assert!(result.is_ok());
        assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Modifier { 
                lhs: Box::new(Expr::Dice (
                    Box::new(Expr::Number(2.0)),
                    Box::new(Expr::Number(6.0)),
                )),
                op: ModifierOp::ExplodeCompound,
                param: Some(
                    ModifierParam::Compare(
                        CompareExpr { op: CompareOp::LessEqual, val: Box::new(Expr::Number(4.0)) }
                    )
                ),
            }),
            op: ModifierOp::Limit,
            param: Some(ModifierParam::Value(
                Box::new(Expr::Binary(
                    Box::new(Expr::Number(1.0)), 
                    BinOp::Add, 
                    Box::new(Expr::Number(1.0))))
            ))
        }
    );
}

#[test]
fn test_reroll_expr() {
    let result = parse_dice("2d20r<5");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::Reroll,
            param: Some(
                ModifierParam::Compare(
                    CompareExpr { op: CompareOp::Less, val: Box::new(Expr::Number(5.0)) }
                )
            ),
        }
    );
}

#[test]
fn test_reroll_once_expr() {
    let result = parse_dice("2d20ro>=5");
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        Expr::Modifier { 
            lhs: Box::new(Expr::Dice (
                Box::new(Expr::Number(2.0)),
                Box::new(Expr::Number(20.0)),
            )),
            op: ModifierOp::RerollOnce,
            param: Some(
                ModifierParam::Compare(
                    CompareExpr { op: CompareOp::GreaterEqual, val: Box::new(Expr::Number(5.0)) }
                )
            ),
        }
    );
}

#[test]
fn test_reroll_expr_without_param() {
    let result = parse_dice("2d20r");
    assert!(result.is_err());
}

#[test]
fn test_reroll_once_expr_without_param() {
    let result = parse_dice("2d20ro");
    assert!(result.is_err());
}