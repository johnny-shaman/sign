use pest::Parser;
use lazy_static::lazy_static;
use pest::iterators::Pairs;
use pest::Rule;
use crate::ast::*;
use pratt::*;

#[derive(Parser)]
#[grammar = "sign.pest"]
pub struct SignParser;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
use pest::pratt_parser::{PrattParser, Op, Assoc};
use pest::Parser;
use std::collections::HashMap;

// How will I get AST?
pub fn parse(source: &str) -> Result<Vec<Expression>, pest::error::Error<Rule>> {
    let pairs = SignParser::parse(Rule::program, source)?;
    Ok(pairs.map(|pair| build_ast(pair)).collect())
}

fn build_ast(pair: Pairs<Rule>) -> Expression {
    match pair.as_rule() {
        Rule::expression => build_expression(pair),
        Rule::EOI => Expression::Empty,
        _ => unreachable!(),
    }
}

fn build_expression(pair: Pairs<Rule>) -> Expression {
    match pair.as_rule() {
        Rule::binary_expression => build_binary_expression(pair),
        Rule::number => build_number(pair),
        _ => unreachable!(),
    }
}

fn build_binary_expression(pair: Pairs<Rule>) -> Expression {
    let mut expressions = pair.filter(|pair| pair.as_rule() == Rule::expression);
    let lhs = build_expression(expressions.next().unwrap());
    let rhs = build_expression(expressions.next().unwrap());
    let operator = pair.filter(|pair| pair.as_rule() == Rule::operator).next().unwrap();
    let operator = match operator.as_str() {
        "+" => BinaryOperator::Add,
        "-" => BinaryOperator::Sub,
        "*" => BinaryOperator::Mul,
        "/" => BinaryOperator::Div,
        _ => unreachable!(),
    };
    Expression::Binary(Box::new(lhs), operator, Box::new(rhs))
}

fn build_number(pair: Pairs<Rule>) -> Expression {
    let value = pair.next().unwrap().as_str().parse().unwrap();
    Expression::Number(value)
}
