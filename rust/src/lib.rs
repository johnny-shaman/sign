// src/lib.rs
pub mod ast;
pub mod lexer;
pub mod parser;
pub mod error;

// Re-export commonly used items
pub use ast::AST;
pub use lexer::Lexer;
pub use parser::Parser;
pub use error::{CompileError, Result};

// Version and other metadata
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const LANG_NAME: &str = "SN Language";

// src/error.rs
use std::fmt;

#[derive(Debug)]
pub enum CompileError {
    // Lexer errors
    UnexpectedToken(String),
    UnexpectedEOF,
    InvalidNumber(String),
    InvalidCharacter(char),
    InvalidString(String),
    
    // Parser errors
    InvalidSyntax(String),
    MultipleRestParameters,
    UnexpectedIndentation,
    
    // General errors
    UnexpectedError(String),
}

impl fmt::Display for CompileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CompileError::UnexpectedToken(t) => write!(f, "Unexpected token: {}", t),
            CompileError::UnexpectedEOF => write!(f, "Unexpected end of file"),
            CompileError::InvalidNumber(n) => write!(f, "Invalid number: {}", n),
            CompileError::InvalidCharacter(c) => write!(f, "Invalid character: {}", c),
            CompileError::InvalidString(s) => write!(f, "Invalid string: {}", s),
            CompileError::InvalidSyntax(s) => write!(f, "Invalid syntax: {}", s),
            CompileError::MultipleRestParameters => write!(f, "Multiple rest parameters are not allowed"),
            CompileError::UnexpectedIndentation => write!(f, "Unexpected indentation"),
            CompileError::UnexpectedError(e) => write!(f, "Unexpected error: {}", e),
        }
    }
}

impl std::error::Error for CompileError {}

pub type Result<T> = std::result::Result<T, CompileError>;

// src/tests/mod.rs
#[cfg(test)]
mod common;

#[cfg(test)]
mod lexer;

#[cfg(test)]
mod parser;

// src/tests/common/mod.rs
#[cfg(test)]
pub fn setup() {
    // 共通のテストセットアップがあれば、ここに実装
}
