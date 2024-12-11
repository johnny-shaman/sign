// src/lexer/mod.rs

mod token;
mod state;
mod error;

pub use token::Token;
use state::LexerState;
use crate::error::{CompileError, Result};
use std::str::Chars;
use std::iter::Peekable;

pub struct Lexer<'a> {
    input: Peekable<Chars<'a>>,
    state: LexerState,
    indent_stack: Vec<usize>,
    current_indent: usize,
    line_start: bool,
}

impl<'a> Lexer<'a> {
    pub fn new(input: &'a str) -> Self {
        Lexer {
            input: input.chars().peekable(),
            state: LexerState::Normal,
            indent_stack: vec![0],
            current_indent: 0,
            line_start: true,
        }
    }

    fn peek_char(&mut self) -> Option<char> {
        self.input.peek().copied()
    }

    fn next_char(&mut self) -> Option<char> {
        let c = self.input.next();
        if c == Some('\n') {
            self.line_start = true;
            self.current_indent = 0;
        }
        c
    }

    fn skip_whitespace(&mut self) -> usize {
        let mut count = 0;
        while let Some(c) = self.peek_char() {
            if c.is_whitespace() && c != '\n' {
                self.next_char();
                if self.line_start {
                    count += 1;
                }
            } else {
                break;
            }
        }
        count
    }

    fn read_string(&mut self) -> Result<Token> {
        let mut chars = Vec::new();
        self.state = LexerState::InString;
        
        while let Some(c) = self.next_char() {
            match c {
                '`' => {
                    self.state = LexerState::Normal;
                    return Ok(Token::StringChars(chars));
                }
                '\n' => {
                    return Err(CompileError::NewlineInString);
                }
                c => chars.push(c),
            }
        }
        
        Err(CompileError::UnterminatedString)
    }

    fn read_number(&mut self, first_digit: char) -> Result<Token> {
        let mut number = first_digit.to_string();
        let mut has_decimal = false;

        while let Some(c) = self.peek_char() {
            match c {
                '0'..='9' => {
                    number.push(self.next_char().unwrap());
                }
                '.' if !has_decimal => {
                    has_decimal = true;
                    number.push(self.next_char().unwrap());
                }
                _ => break,
            }
        }

        number.parse::<f64>()
            .map(Token::NumberLiteral)
            .map_err(|_| CompileError::InvalidNumber(number))
    }

    fn read_identifier(&mut self, first_char: char) -> String {
        let mut identifier = first_char.to_string();
        while let Some(c) = self.peek_char() {
            if c.is_alphanumeric() || c == '_' {
                identifier.push(self.next_char().unwrap());
            } else {
                break;
            }
        }
        identifier
    }

    pub fn next_token(&mut self) -> Result<Token> {
        // インデントの処理
        if self.line_start && self.state == LexerState::Normal {
            let indent_level = self.skip_whitespace();
            self.line_start = false;
            let current_indent = *self.indent_stack.last().unwrap();
            
            if indent_level > current_indent {
                self.indent_stack.push(indent_level);
                return Ok(Token::Indent(indent_level));
            } else if indent_level < current_indent {
                self.indent_stack.pop();
                return Ok(Token::Dedent);
            }
        }

        match self.next_char() {
            Some(c) => match (c, self.state) {
                // 文字列の開始
                ('`', LexerState::Normal) => self.read_string(),

                // 文字リテラル
                ('\\', LexerState::Normal) => {
                    match self.next_char() {
                        Some(c) => Ok(Token::CharLiteral(c)),
                        None => Err(CompileError::UnexpectedEOF),
                    }
                }

                // 演算子とその他のトークン
                (c, LexerState::Normal) => match c {
                    // 一文字トークン
                    '[' => Ok(Token::LeftBracket),
                    ']' => Ok(Token::RightBracket),
                    '{' => Ok(Token::LeftBrace),
                    '}' => Ok(Token::RightBrace),
                    '(' => Ok(Token::LeftParen),
                    ')' => Ok(Token::RightParen),
                    ':' => Ok(Token::Define),
                    '?' => Ok(Token::Lambda),
                    ',' => Ok(Token::Product),
                    '~' => Ok(Token::Spread),
                    '#' => Ok(Token::Export),
                    '@' => Ok(Token::Import),
                    '\'' => Ok(Token::Get),
                    '+' => Ok(Token::Plus),
                    '*' => Ok(Token::Multiply),
                    '/' => Ok(Token::Divide),
                    '%' => Ok(Token::Modulo),
                    '^' => Ok(Token::Power),
                    '|' => Ok(Token::Or),
                    ';' => Ok(Token::Xor),
                    '&' => Ok(Token::And),

                    // 二文字トークンの可能性があるもの
                    '!' => match self.peek_char() {
                        Some('=') => { self.next_char(); Ok(Token::NotEqual) }
                        _ => Ok(Token::Not)
                    },
                    
                    '<' => match self.peek_char() {
                        Some('=') => { self.next_char(); Ok(Token::LessEqual) }
                        Some('>') => { self.next_char(); Ok(Token::NotEqual) }
                        _ => Ok(Token::LessThan)
                    },
                    
                    '>' => match self.peek_char() {
                        Some('=') => { self.next_char(); Ok(Token::GreaterEqual) }
                        _ => Ok(Token::GreaterThan)
                    },
                    
                    '=' => match self.peek_char() {
                        Some('=') => { self.next_char(); Ok(Token::Equal) }
                        _ => Ok(Token::Equal)
                    },
                    
                    '-' => Ok(Token::Minus),

                    '\n' => Ok(Token::Newline),

                    // 数値
                    c if c.is_digit(10) => self.read_number(c),

                    // 識別子
                    c if c.is_alphabetic() || c == '_' => {
                        Ok(Token::Identifier(self.read_identifier(c)))
                    }

                    // 空白文字はスキップ
                    c if c.is_whitespace() => self.next_token(),

                    // その他の文字はエラー
                    c => Err(CompileError::UnexpectedChar(c)),
                },

                // 文字列内の文字はすべて read_string で処理
                (_, LexerState::InString) => unreachable!(),
            },
            
            None => Ok(Token::EOF),
        }
    }
}
