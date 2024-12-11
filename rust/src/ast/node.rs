// src/ast/node.rs
use super::{ASTNode, UnaryOperator, BinaryOperator, Parameter};
use std::fmt;

/// 抽象構文木のノード
#[derive(Debug, Clone)]
pub enum AST {
    // リテラル
    Number(f64),
    String(Vec<char>),
    Char(char),
    Identifier(String),
    
    // ブロック構造
    Block(Vec<AST>),
    
    // 変数・関数定義
    Definition {
        name: Box<AST>,
        value: Box<AST>,
    },
    
    // 関数
    Lambda {
        params: Vec<Parameter>,
        body: Box<AST>,
    },
    
    // 演算子
    UnaryOp {
        op: UnaryOperator,
        expr: Box<AST>,
    },
    
    BinaryOp {
        op: BinaryOperator,
        left: Box<AST>,
        right: Box<AST>,
    },
    
    // リスト操作
    List(Vec<AST>),
    
    // 範囲式
    Range {
        start: Box<AST>,
        end: Box<AST>,
    },

    // パターンマッチ
    Match {
        value: Box<AST>,
        cases: Vec<(AST, AST)>,  // (パターン, 結果)のペアのリスト
    },
}

impl ASTNode for AST {
    fn to_string(&self) -> String {
        match self {
            AST::Number(n) => n.to_string(),
            AST::String(chars) => format!("\"{}\"", chars.iter().collect::<String>()),
            AST::Char(c) => format!("\\{}", c),
            AST::Identifier(name) => name.clone(),
            
            AST::Block(exprs) => {
                format!("[{}]", exprs.iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join(" "))
            }
            
            AST::Definition { name, value } => {
                format!("{}: {}", name.to_string(), value.to_string())
            }
            
            AST::Lambda { params, body } => {
                let params_str = params.iter()
                    .map(|p| p.to_string())
                    .collect::<Vec<_>>()
                    .join(" ");
                format!("{} ? {}", params_str, body.to_string())
            }
            
            AST::UnaryOp { op, expr } => {
                match op {
                    // 前置演算子
                    UnaryOperator::Not | UnaryOperator::Export | 
                    UnaryOperator::Import | UnaryOperator::Negative => {
                        format!("{}{}", op.to_string(), expr.to_string())
                    },
                    // 後置演算子
                    UnaryOperator::Factorial | UnaryOperator::Spread => {
                        format!("{}{}", expr.to_string(), op.to_string())
                    }
                }
            }
            
            AST::BinaryOp { op, left, right } => {
                format!("{} {} {}", left.to_string(), op.to_string(), right.to_string())
            }
            
            AST::List(items) => {
                format!("[{}]", items.iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join(", "))
            }
            
            AST::Range { start, end } => {
                format!("{} ~ {}", start.to_string(), end.to_string())
            }
            
            AST::Match { value, cases } => {
                let cases_str = cases.iter()
                    .map(|(pattern, result)| {
                        format!("{}: {}", pattern.to_string(), result.to_string())
                    })
                    .collect::<Vec<_>>()
                    .join(" | ");
                format!("[{} => {}]", value.to_string(), cases_str)
            }
        }
    }

    fn children(&self) -> Vec<&AST> {
        match self {
            AST::Number(_) | AST::String(_) | AST::Char(_) | AST::Identifier(_) => vec![],
            
            AST::Block(exprs) | AST::List(exprs) => exprs.iter().collect(),
            
            AST::Definition { name, value } => vec![name, value],
            
            AST::Lambda { body, .. } => vec![body],
            
            AST::UnaryOp { expr, .. } => vec![expr],
            
            AST::BinaryOp { left, right, .. } => vec![left, right],
            
            AST::Range { start, end } => vec![start, end],
            
            AST::Match { value, cases } => {
                let mut children = vec![value];
                for (pattern, result) in cases {
                    children.push(pattern);
                    children.push(result);
                }
                children
            }
        }
    }
}

impl fmt::Display for AST {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_ast_display() {
        // 数値リテラル
        let num = AST::Number(42.0);
        assert_eq!(num.to_string(), "42");
        
        // 文字リテラル
        let chr = AST::Char('a');
        assert_eq!(chr.to_string(), "\\a");
        
        // 関数定義
        let lambda = AST::Lambda {
            params: vec![Parameter::Normal("x".to_string())],
            body: Box::new(AST::Identifier("x".to_string())),
        };
        assert_eq!(lambda.to_string(), "x ? x");
    }

    #[test]
    fn test_ast_children() {
        let binary_op = AST::BinaryOp {
            op: BinaryOperator::Add,
            left: Box::new(AST::Number(1.0)),
            right: Box::new(AST::Number(2.0)),
        };
        
        let children = binary_op.children();
        assert_eq!(children.len(), 2);
    }
}
