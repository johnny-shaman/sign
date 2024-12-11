// src/parser/statement.rs
use super::Parser;
use crate::ast::AST;
use crate::lexer::Token;
use crate::error::{CompileError, Result};

impl Parser {
    /// 文の解析
    pub(crate) fn parse_statement(&mut self) -> Result<AST> {
        self.handle_indentation()?;

        match self.peek_token() {
            // 改行を無視
            Some(Token::Newline) => {
                self.next_token();
                self.parse_statement()
            }

            // export (#) で始まる文
            Some(Token::Export) => {
                self.next_token();
                let expr = self.parse_expression()?;
                self.skip_newlines()?;
                Ok(AST::UnaryOp {
                    op: crate::ast::UnaryOperator::Export,
                    expr: Box::new(expr),
                })
            }

            // import (@) で始まる文
            Some(Token::Import) => {
                self.next_token();
                let expr = self.parse_expression()?;
                self.skip_newlines()?;
                Ok(AST::UnaryOp {
                    op: crate::ast::UnaryOperator::Import,
                    expr: Box::new(expr),
                })
            }

            // ブロックの開始
            Some(Token::LeftBracket | Token::LeftBrace | Token::LeftParen) => {
                let block = self.parse_block()?;
                self.skip_newlines()?;
                Ok(block)
            }

            // パターンマッチ構造
            Some(Token::Identifier(_)) if self.is_pattern_match() => {
                self.parse_pattern_match()
            }

            // その他の式
            _ => {
                let expr = self.parse_expression()?;
                self.skip_newlines()?;
                Ok(expr)
            }
        }
    }

    /// 改行をスキップ
    fn skip_newlines(&mut self) -> Result<()> {
        while let Some(Token::Newline) = self.peek_token() {
            self.next_token();
        }
        Ok(())
    }

    /// ブロックの解析
    fn parse_block(&mut self) -> Result<AST> {
        // 開始括弧の種類を記憶
        let start_token = self.next_token().unwrap();
        let end_token = match start_token {
            Token::LeftBracket => Token::RightBracket,
            Token::LeftBrace => Token::RightBrace,
            Token::LeftParen => Token::RightParen,
            _ => unreachable!(),
        };

        let mut statements = Vec::new();
        let mut expecting_separator = false;

        while let Some(token) = self.peek_token() {
            match token {
                // ブロック終了
                t if t == end_token => {
                    self.next_token();
                    break;
                }

                // セパレータ（改行または;）
                Token::Newline => {
                    self.next_token();
                    expecting_separator = false;
                }
                
                // 文の解析
                _ => {
                    if expecting_separator {
                        return Err(CompileError::InvalidSyntax(
                            "Expected separator between statements".to_string()
                        ));
                    }
                    statements.push(self.parse_statement()?);
                    expecting_separator = true;
                }
            }
        }

        Ok(AST::Block(statements))
    }

    /// パターンマッチ構造の判定
    fn is_pattern_match(&mut self) -> bool {
        let mut tokens = self.tokens.iter().take(3);
        match (tokens.next(), tokens.next(), tokens.next()) {
            (Some(Token::Identifier(_)), Some(Token::Define), Some(Token::Lambda)) => true,
            _ => false,
        }
    }

    /// パターンマッチ構造の解析
    fn parse_pattern_match(&mut self) -> Result<AST> {
        let mut patterns = Vec::new();
        let mut current_pattern = Vec::new();
        
        while let Some(token) = self.peek_token() {
            match token {
                // パターンとケースの区切り
                Token::Or => {
                    self.next_token();
                    if !current_pattern.is_empty() {
                        patterns.push(current_pattern);
                        current_pattern = Vec::new();
                    }
                }

                // ブロック終了
                Token::RightBracket | Token::RightBrace | Token::RightParen => {
                    if !current_pattern.is_empty() {
                        patterns.push(current_pattern);
                    }
                    break;
                }

                // パターンの一部
                _ => {
                    let expr = self.parse_expression()?;
                    current_pattern.push(expr);
                }
            }
        }

        Ok(AST::Match {
            value: Box::new(AST::Block(Vec::new())), // パターンマッチ対象
            cases: patterns.into_iter()
                .map(|pattern| {
                    let condition = if pattern.len() == 1 {
                        pattern[0].clone()
                    } else {
                        AST::Block(pattern)
                    };
                    (condition, AST::Block(Vec::new()))
                })
                .collect(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexer::Token;

    #[test]
    fn test_simple_statement() {
        let tokens = vec![
            Token::NumberLiteral(42.0),
            Token::Newline,
            Token::EOF,
        ];
        let mut parser = Parser::new(tokens);
        let ast = parser.parse_statement().unwrap();
        
        match ast {
            AST::Number(n) => assert_eq!(n, 42.0),
            _ => panic!("Expected number literal"),
        }
    }

    #[test]
    fn test_block_statement() {
        let tokens = vec![
            Token::LeftBracket,
            Token::NumberLiteral(1.0),
            Token::Newline,
            Token::NumberLiteral(2.0),
            Token::RightBracket,
            Token::EOF,
        ];
        let mut parser = Parser::new(tokens);
        let ast = parser.parse_statement().unwrap();
        
        match ast {
            AST::Block(statements) => assert_eq!(statements.len(), 2),
            _ => panic!("Expected block"),
        }
    }

    #[test]
    fn test_export_statement() {
        let tokens = vec![
            Token::Export,
            Token::Identifier("value".to_string()),
            Token::EOF,
        ];
        let mut parser = Parser::new(tokens);
        let ast = parser.parse_statement().unwrap();
        
        match ast {
            AST::UnaryOp { op: crate::ast::UnaryOperator::Export, .. } => {},
            _ => panic!("Expected export statement"),
        }
    }

    #[test]
    fn test_import_statement() {
        let tokens = vec![
            Token::Import,
            Token::Identifier("module".to_string()),
            Token::EOF,
        ];
        let mut parser = Parser::new(tokens);
        let ast = parser.parse_statement().unwrap();
        
        match ast {
            AST::UnaryOp { op: crate::ast::UnaryOperator::Import, .. } => {},
            _ => panic!("Expected import statement"),
        }
    }
}
