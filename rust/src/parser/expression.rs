// src/parser/expression.rs
use super::Parser;
use crate::ast::{AST, UnaryOperator, BinaryOperator, CompareOp, Parameter};
use crate::lexer::Token;
use crate::error::{CompileError, Result};

impl Parser {
    /// 式の解析（優先順位が最も低い演算子から開始）
    pub(crate) fn parse_expression(&mut self) -> Result<AST> {
        self.parse_define()
    }

    /// 定義の解析 (:)
    fn parse_define(&mut self) -> Result<AST> {
        let mut left = self.parse_lambda()?;
        
        while let Some(Token::Define) = self.peek_token() {
            self.next_token();
            let right = self.parse_lambda()?;
            left = AST::Definition {
                name: Box::new(left),
                value: Box::new(right),
            };
        }
        
        Ok(left)
    }

    /// ラムダ式の解析 (?)
    fn parse_lambda(&mut self) -> Result<AST> {
        let mut params = vec![];
        
        // パラメータリストの解析
        while let Some(token) = self.peek_token() {
            match token {
                Token::Identifier(_) => {
                    if let Token::Identifier(name) = self.next_token().unwrap() {
                        params.push(Parameter::Normal(name));
                    }
                }
                Token::Spread => {
                    self.next_token();
                    if let Some(Token::Identifier(name)) = self.next_token() {
                        params.push(Parameter::Rest(name));
                        break;  // 残余パラメータは最後
                    } else {
                        return Err(CompileError::InvalidSyntax(
                            "Expected identifier after spread operator".to_string()
                        ));
                    }
                }
                Token::Lambda => break,
                _ => return self.parse_product(),
            }
        }

        if let Some(Token::Lambda) = self.peek_token() {
            self.next_token();
            let body = Box::new(self.parse_expression()?);
            Ok(AST::Lambda { params, body })
        } else {
            self.parse_product()
        }
    }

    /// 直積の解析 (,)
    fn parse_product(&mut self) -> Result<AST> {
        let mut left = self.parse_logical_or()?;
        
        while let Some(Token::Product) = self.peek_token() {
            self.next_token();
            let right = self.parse_logical_or()?;
            left = AST::BinaryOp {
                op: BinaryOperator::Product,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    /// 論理和の解析 (|)
    fn parse_logical_or(&mut self) -> Result<AST> {
        let mut left = self.parse_logical_xor()?;
        
        while let Some(Token::Or) = self.peek_token() {
            self.next_token();
            let right = self.parse_logical_xor()?;
            left = AST::BinaryOp {
                op: BinaryOperator::Or,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    /// 排他的論理和の解析 (;)
    fn parse_logical_xor(&mut self) -> Result<AST> {
        let mut left = self.parse_logical_and()?;
        
        while let Some(Token::Xor) = self.peek_token() {
            self.next_token();
            let right = self.parse_logical_and()?;
            left = AST::BinaryOp {
                op: BinaryOperator::Xor,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    /// 論理積の解析 (&)
    fn parse_logical_and(&mut self) -> Result<AST> {
        let mut left = self.parse_comparison()?;
        
        while let Some(Token::And) = self.peek_token() {
            self.next_token();
            let right = self.parse_comparison()?;
            left = AST::BinaryOp {
                op: BinaryOperator::And,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    /// 比較演算の解析
    fn parse_comparison(&mut self) -> Result<AST> {
        let mut left = self.parse_additive()?;
        let mut comparisons = vec![];
        
        while let Some(token) = self.peek_token() {
            let op = match token {
                Token::LessThan => Some(CompareOp::Less),
                Token::LessEqual => Some(CompareOp::LessEqual),
                Token::Equal => Some(CompareOp::Equal),
                Token::NotEqual => Some(CompareOp::NotEqual),
                Token::GreaterEqual => Some(CompareOp::GreaterEqual),
                Token::GreaterThan => Some(CompareOp::Greater),
                _ => None,
            };
            
            if let Some(op) = op {
                self.next_token();
                let right = self.parse_additive()?;
                comparisons.push((op, right));
            } else {
                break;
            }
        }
        
        if comparisons.is_empty() {
            return Ok(left);
        }
        
        // 比較の連鎖をANDで結合
        let mut result = left.clone();
        for (op, right) in comparisons {
            result = AST::BinaryOp {
                op: BinaryOperator::And,
                left: Box::new(result),
                right: Box::new(AST::BinaryOp {
                    op: BinaryOperator::Compare(op),
                    left: Box::new(left.clone()),
                    right: Box::new(right),
                }),
            };
        }
        
        Ok(result)
    }

    /// 加減算の解析
    fn parse_additive(&mut self) -> Result<AST> {
        let mut left = self.parse_multiplicative()?;
        
        while let Some(token) = self.peek_token() {
            match token {
                Token::Plus | Token::Minus => {
                    let token = self.next_token().unwrap();
                    let right = self.parse_multiplicative()?;
                    let op = match token {
                        Token::Plus => BinaryOperator::Add,
                        Token::Minus => BinaryOperator::Sub,
                        _ => unreachable!(),
                    };
                    left = AST::BinaryOp {
                        op,
                        left: Box::new(left),
                        right: Box::new(right),
                    };
                }
                _ => break,
            }
        }
        
        Ok(left)
    }

    /// 乗除算の解析
    fn parse_multiplicative(&mut self) -> Result<AST> {
        let mut left = self.parse_power()?;
        
        while let Some(token) = self.peek_token() {
            match token {
                Token::Multiply | Token::Divide | Token::Modulo => {
                    let token = self.next_token().unwrap();
                    let right = self.parse_power()?;
                    let op = match token {
                        Token::Multiply => BinaryOperator::Mul,
                        Token::Divide => BinaryOperator::Div,
                        Token::Modulo => BinaryOperator::Mod,
                        _ => unreachable!(),
                    };
                    left = AST::BinaryOp {
                        op,
                        left: Box::new(left),
                        right: Box::new(right),
                    };
                }
                _ => break,
            }
        }
        
        Ok(left)
    }

    /// べき乗の解析
    fn parse_power(&mut self) -> Result<AST> {
        let mut left = self.parse_range()?;
        
        while let Some(Token::Power) = self.peek_token() {
            self.next_token();
            let right = self.parse_range()?;
            left = AST::BinaryOp {
                op: BinaryOperator::Power,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    /// 範囲とスプレッド演算の解析
    fn parse_range(&mut self) -> Result<AST> {
        let mut expr = self.parse_get()?;
        
        while let Some(token) = self.peek_token() {
            match token {
                Token::Spread => {
                    self.next_token();
                    match self.peek_token() {
                        None => {
                            // 後置スプレッド
                            expr = AST::UnaryOp {
                                op: UnaryOperator::Spread,
                                expr: Box::new(expr),
                            };
                        }
                        Some(_) => {
                            // 範囲演算子
                            let end = self.parse_get()?;
                            expr = AST::Range {
                                start: Box::new(expr),
                                end: Box::new(end),
                            };
                        }
                    }
                }
                _ => break,
            }
        }
        
        Ok(expr)
    }

    /// 要素アクセスの解析 (')
    fn parse_get(&mut self) -> Result<AST> {
        let mut expr = self.parse_unary()?;
        
        while let Some(Token::Get) = self.peek_token() {
            self.next_token();
            let index = self.parse_unary()?;
            expr = AST::BinaryOp {
                op: BinaryOperator::Get,
                left: Box::new(expr),
                right: Box::new(index),
            };
        }
        
        Ok(expr)
    }

    /// 単項演算子の解析
    fn parse_unary(&mut self) -> Result<AST> {
        match self.peek_token() {
            Some(Token::Not) => {
                self.next_token();
                Ok(AST::UnaryOp {
                    op: UnaryOperator::Not,
                    expr: Box::new(self.parse_unary()?),
                })
            }
            Some(Token::Export) => {
                self.next_token();
                Ok(AST::UnaryOp {
                    op: UnaryOperator::Export,
                    expr: Box::new(self.parse_unary()?),
                })
            }
            Some(Token::Import) => {
                self.next_token();
                Ok(AST::UnaryOp {
                    op: UnaryOperator::Import,
                    expr: Box::new(self.parse_unary()?),
                })
            }
            Some(Token::Spread) => {
                self.next_token();
                if let Some(Token::Identifier(name)) = self.peek_token() {
                    self.next_token();
                    Ok(AST::UnaryOp {
                        op: UnaryOperator::RestParam,
                        expr: Box::new(AST::Identifier(name)),
                    })
                } else {
                    Err(CompileError::InvalidSyntax(
                        "Expected identifier after spread operator".to_string()
                    ))
                }
            }
            Some(Token::Minus) => {
                self.next_token();
                Ok(AST::UnaryOp {
                    op: UnaryOperator::Negative,
                    expr: Box::new(self.parse_unary()?),
                })
            }
            _ => self.parse_postfix(),
        }
    }

    /// 後置演算子の解析
    fn parse_postfix(&mut self) -> Result<AST> {
        let mut expr = self.parse_primary()?;
        
        while let Some(token) = self.peek_token() {
            match token {
                Token::Not => {
                    self.next_token();
                    expr = AST::UnaryOp {
                        op: UnaryOperator::Factorial,
                        expr: Box::new(expr),
                    };
                }
                _ => break,
            }
        }
        
        Ok(expr)
    }

    /// 基本式の解析
    fn parse_primary(&mut self) -> Result<AST> {
        match self.next_token() {
            Some(Token::NumberLiteral(n)) => Ok(AST::Number(n)),
            Some(Token::StringChars(chars)) => Ok(AST::String(chars)),
            Some(Token::CharLiteral(c)) => Ok(AST::Char(c)),
            Some(Token::Identifier(name)) => Ok(AST::Identifier(name)),
            Some(Token::LeftBracket) => self.parse_block_or_list(),
            Some(Token::LeftBrace) => self.parse_block_or_list(),
            Some(Token::LeftParen) => self.parse_block_or_list(),
            Some(token) => Err(self.error_unexpected_token(&token)),
            None => Err(CompileError::UnexpectedEOF),
        }
    }

    /// ブロックまたはリストの解析
    fn parse_block_or_list(&mut self) -> Result<AST> {
        let mut elements = Vec::new();
        
        while let Some(token) = self.peek_token() {
            match token {
                Token::RightBracket | Token::RightBrace | Token::RightParen => {
                    self.next_token();
                    break;
                }
                _ => elements.push(self.parse_expression()?),
            }
        }
        
        if elements.len() == 1 {
            Ok(elements.pop().unwrap())
        } else {
            Ok(AST::Block(elements))
        }
    }
}
