// src/parser/mod.rs
mod expression;
mod statement;

use std::collections::VecDeque;
use crate::ast::{AST, Parameter, UnaryOperator, BinaryOperator, CompareOp};
use crate::lexer::Token;
use crate::error::{CompileError, Result};

pub struct Parser {
    /// トークンのキュー
    tokens: VecDeque<Token>,
    /// 現在のインデントレベル
    current_indent: usize,
}

impl Parser {
    pub fn new(tokens: Vec<Token>) -> Self {
        Parser {
            tokens: tokens.into(),
            current_indent: 0,
        }
    }

    fn peek_token(&self) -> Option<&Token> {
        self.tokens.front()
    }

    fn next_token(&mut self) -> Option<Token> {
        self.tokens.pop_front()
    }

    fn expect_token(&mut self, expected: Token) -> Result<()> {
        match self.next_token() {
            Some(token) if token == expected => Ok(()),
            Some(token) => Err(CompileError::ExpectedToken {
                expected: format!("{:?}", expected),
                found: format!("{:?}", token),
            }),
            None => Err(CompileError::UnexpectedEOF),
        }
    }

    pub fn parse(&mut self) -> Result<AST> {
        let mut statements = Vec::new();
        
        while let Some(token) = self.peek_token() {
            match token {
                Token::EOF => break,
                _ => statements.push(self.parse_statement()?),
            }
        }

        if statements.len() == 1 {
            Ok(statements.pop().unwrap())
        } else {
            Ok(AST::Block(statements))
        }
    }

    /// インデントレベルの変更を処理
    fn handle_indentation(&mut self) -> Result<()> {
        match self.peek_token() {
            Some(Token::Indent(level)) => {
                self.next_token();
                self.current_indent = level;
                Ok(())
            }
            Some(Token::Dedent) => {
                self.next_token();
                if self.current_indent > 0 {
                    self.current_indent -= 1;
                    Ok(())
                } else {
                    Err(CompileError::UnexpectedIndentation)
                }
            }
            _ => Ok(()),
        }
    }

    /// 演算子の優先順位を取得
    fn operator_precedence(token: &Token) -> u8 {
        match token {
            Token::Define => 1,        // :
            Token::Lambda => 2,        // ?
            Token::Product => 3,       // ,
            Token::Or => 4,           // |
            Token::Xor => 5,          // ;
            Token::And => 6,          // &
            Token::LessThan |
            Token::LessEqual |
            Token::Equal |
            Token::NotEqual |
            Token::GreaterEqual |
            Token::GreaterThan => 7,   // 比較演算子
            Token::Plus |
            Token::Minus => 8,         // 加減算
            Token::Multiply |
            Token::Divide |
            Token::Modulo => 9,        // 乗除算
            Token::Power => 10,        // べき乗
            Token::Get |
            Token::Range => 11,        // 特殊演算子
            _ => 0,
        }
    }

    /// トークンが右結合かどうかを判定
    fn is_right_associative(token: &Token) -> bool {
        matches!(token,
            Token::Define |    // :
            Token::Lambda |    // ?
            Token::Power       // ^
        )
    }

    /// エラーメッセージの生成
    fn error_unexpected_token(&self, token: &Token) -> CompileError {
        CompileError::UnexpectedToken(format!("{:?}", token))
    }
}
