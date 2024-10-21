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
            // export (highest precedence)
            .op(Op::prefix(f_export))
            // assign
            .op(Op::infix(f_assign, Right))
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

use std::sync::Arc;

#[derive(Clone)]
enum AstNode {
    Value(Value),
    Expression(Arc<Expression>),
}

#[derive(Clone)]
enum Value {
    Literal(Literal),
    List(Arc<Vec<Value>>),
    Function(Arc<dyn Fn(Vec<Value>) -> Result<Value, String> + Send + Sync>),
}

#[derive(Clone)]
enum Literal {
    Number(Number),
    String(String),
    Char(char),
    Unit,
    Identifier(String),
}

#[derive(Clone)]
enum Number {
    Uint(u64),
    Integer(i64),
    Float(f64),
    Hex(u64),
    Oct(u64),
    Bit(u64),
}

enum Expression {
    Export(Arc<AstNode>),
    Assign(String, Arc<AstNode>),
    Lambda(Vec<Literal::Identifier>, Arc<AstNode>),
    Product(Vec<AstNode>),
    Spread(Arc<AstNode>),
    Lift(Vec<Arc<AstNode>>),
    OrXor(Arc<AstNode>, OrXorOp, Arc<AstNode>),
    And(Arc<AstNode>, Arc<AstNode>),
    Not(Arc<AstNode>),
    Compare(Arc<AstNode>, CompareOp, Arc<AstNode>),
    AddSub(Arc<AstNode>, AddSubOp, Arc<AstNode>),
    MulDivMod(Arc<AstNode>, MulDivModOp, Arc<AstNode>),
    Power(Arc<AstNode>, Arc<AstNode>),
    Factorial(Arc<AstNode>),
    Apply(Arc<AstNode>, Vec<AstNode>),
    Flat(Arc<AstNode>),
    Get(Arc<AstNode>, Arc<AstNode>),
    Import(String),
    Block(Vec<AstNode>),
}

#[derive(Clone)]
enum OrXorOp {
    Or,
    Xor,
}

#[derive(Clone)]
enum CompareOp {
    Less,
    LessEq,
    Eq,
    NotEq,
    MoreEq,
    More,
}

#[derive(Clone)]
enum AddSubOp {
    Add,
    Sub,
}

#[derive(Clone)]
enum MulDivModOp {
    Mul,
    Div,
    Mod,
}

type Environment = HashMap<String, Value>;

impl Number {
    fn to<T>(&self) -> Result<T, &'static str>
    where
        T: TryFrom<u64> + TryFrom<i64> + From<f64>,
        <T as TryFrom<u64>>::Error: std::fmt::Debug,
        <T as TryFrom<i64>>::Error: std::fmt::Debug,
    {
        match *self {
            Number::Uint(n) => T::try_from(n).map_err(|_| "Conversion failed"),
            Number::Integer(n) => T::try_from(n).map_err(|_| "Conversion failed"),
            Number::Float(n) => Ok(T::from(n)),
            Number::Hex(n) | Number::Oct(n) | Number::Bit(n) => T::try_from(n).map_err(|_| "Conversion failed"),
        }
    }
}



fn eval(pairs: pest::iterators::Pairs<Rule>, env: &mut Environment) -> Result<Value, String> {
    PRATT_PARSER
        .map_primary(|primary| {
            match primary.as_rule() {
                Rule::number => {
                    let num: f64 = primary.as_str().parse().unwrap();
                    Ok(Value::Number(num))
                },
                Rule::string => {
                    let s = primary.into_inner().next().unwrap().as_str();
                    Ok(Value::String(s.to_string()))
                },
                Rule::identifier => {
                    let id = primary.as_str();
                    env.get(id).cloned().ok_or_else(|| format!("Undefined variable: {}", id))
                },
                Rule::unit => Ok(Value::Unit),
                Rule::lambda => {
                    // Lambda解析の実装
                    unimplemented!("Lambda parsing not yet implemented")
                },
                Rule::block => eval(primary.into_inner(), env),
                _ => Err(format!("Unexpected primary: {:?}", primary.as_rule())),
            }
        })
        .map_infix(|lhs, op, rhs| {
            match (op.as_rule(), lhs?, rhs?) {
                (Rule::f_assign, Value::String(id), value) => {
                    env.insert(id, value.clone());
                    Ok(value)
                },
                (Rule::f_add, Value::Number(l), Value::Number(r)) => Ok(Value::Number(l + r)),
                (Rule::f_sub, Value::Number(l), Value::Number(r)) => Ok(Value::Number(l - r)),
                (Rule::f_mul, Value::Number(l), Value::Number(r)) => Ok(Value::Number(l * r)),
                (Rule::f_div, Value::Number(l), Value::Number(r)) => Ok(Value::Number(l / r)),
                (Rule::f_power, Value::Number(l), Value::Number(r)) => Ok(Value::Number(l.powf(r))),
                // その他の演算子の実装...
                _ => Err(format!("Unsupported operation: {:?}", op.as_rule())),
            }
        })
        .map_prefix(|op, rhs| {
            match (op.as_rule(), rhs?) {
                (Rule::f_not, Value::Bool(b)) => Ok(Value::Bool(!b)),
                _ => Err(format!("Unsupported prefix operation: {:?}", op.as_rule())),
            }
        })
        .map_postfix(|lhs, op| {
            match (lhs?, op.as_rule()) {
                (Value::Number(n), Rule::f_factorial) => Ok(Value::Number(factorial(n))),
                _ => Err(format!("Unsupported postfix operation: {:?}", op.as_rule())),
            }
        })
        .parse(pairs)
}

fn factorial(n: f64) -> f64 {
    if n <= 1.0 {
        1.0
    } else {
        n * factorial(n - 1.0)
    }
}

// メイン関数やその他の必要な関数の実装...