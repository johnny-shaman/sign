use pest::pratt_parser::{PrattParser, Op, Assoc};
use pest::Parser;
use std::collections::HashMap;

#[derive(Parser)]
#[grammar = "sign.pest"]
pub struct SignParser;

lazy_static! {
    static ref PRATT_PARSER: PrattParser<Rule> = {
        use Rule::*;
        use Assoc::*;

        PrattParser::new()
            // define (highest precedence)
            .op(Op::infix(f_define, Right))
            // export
            .op(Op::prefix(f_export))
            // lambda
            .op(Op::infix(f_lambda, Right))
            // product
            .op(Op::infix(f_product, Left))
            // spread (infix)
            .op(Op::infix(f_spread, Left))
            // lift (prefix spread)
            .op(Op::prefix(f_spread))
            // or, xor
            .op(Op::infix(f_or | f_xor, Left))
            // and
            .op(Op::infix(f_and, Left))
            // not
            .op(Op::prefix(f_not))
            // compare
            .op(Op::infix(f_less | f_less_eq | f_eq | f_neq | f_more_eq | f_more, Left))
            // add, sub
            .op(Op::infix(f_add | f_sub, Left))
            // mul, div, mod
            .op(Op::infix(f_mul | f_div | f_mod, Left))
            // power
            .op(Op::infix(f_power, Right))
            // factorial
            .op(Op::postfix(f_factorial))
            // flat (postfix spread)
            .op(Op::postfix(f_spread))
            // get
            .op(Op::infix(f_get, Left))
            // import
            .op(Op::prefix(f_import))
    };
}

fn eval(expression: Pairs<Rule>) -> f64 {
    PRATT_PARSER
        .map_primary(|primary| match primary.as_rule() {
            Rule::num => primary.as_str().parse::<f64>().unwrap(),
            Rule::expr => eval(primary.into_inner()),
            _ => unreachable!(),
        })
        .map_infix(|lhs, op, rhs| match op.as_rule() {
            Rule::add => lhs + rhs,
            Rule::subtract => lhs - rhs,
            Rule::multiply => lhs * rhs,
            Rule::divide => lhs / rhs,
            Rule::power => lhs.powf(rhs),
            _ => unreachable!(),
        })
        .parse(expression)
}