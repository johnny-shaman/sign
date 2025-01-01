use pest::Parser;use lazy_static::lazy_static;

use pest::iterators::Pairs;
use pest::Rule;
use crate::ast::*;
use pratt::*;

#[derive(Parser)]
#[grammar = "sign.pest"]
pub struct SignParser;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]

lazy_static! {
    static ref PRATT_PARSER: SignParser<Rule> = {
        use Rule::*;
        use Assoc::*;

        SignParser::new()
    };
}

pub fn parse(input: &str) -> Result<Pairs<Rule>, pest::error::Error<Rule>> {
    SignParser::parse(Rule::program, input)
}
