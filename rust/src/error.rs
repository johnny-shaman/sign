// src/error.rs
use std::fmt;

/// コンパイラのエラー型
#[derive(Debug)]
pub enum CompileError {
    // Lexer (字句解析) エラー
    UnexpectedChar(char),                    // 予期しない文字
    UnexpectedToken(String),                 // 予期しないトークン
    UnexpectedEOF,                          // 予期しないファイル終端
    InvalidNumber(String),                   // 不正な数値形式
    NewlineInString,                         // 文字列内の改行
    UnterminatedString,                      // 終端されていない文字列
    InvalidEscapeSequence(String),           // 不正なエスケープシーケンス

    // Parser (構文解析) エラー
    InvalidSyntax(String),                   // 一般的な構文エラー
    MultipleRestParameters,                  // 複数の残余パラメータ
    UnexpectedIndentation,                   // 不正なインデント
    InvalidIdentifier(String),               // 不正な識別子
    ExpectedToken {                          // 期待されるトークンが見つからない
        expected: String,
        found: String,
    },
    InvalidOperator {                        // 不正な演算子の使用
        operator: String,
        context: String,
    },
    UnmatchedBracket {                      // 対応する括弧がない
        opening: char,
        closing: char,
    },

    // Semantic (意味解析) エラー
    InvalidSpreadUsage(String),              // 不正なスプレッド演算子の使用
    InvalidExportUsage(String),              // 不正なエクスポートの使用
    InvalidImportUsage(String),              // 不正なインポートの使用
    InvalidGetUsage(String),                 // 不正なget演算子の使用
    
    // General (一般) エラー
    IOError(String),                         // I/Oエラー
    UnexpectedError(String),                 // その他の予期しないエラー
}

impl fmt::Display for CompileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            // Lexerエラーのフォーマット
            CompileError::UnexpectedChar(c) => 
                write!(f, "Unexpected character: '{}'", c),
            CompileError::UnexpectedToken(t) => 
                write!(f, "Unexpected token: {}", t),
            CompileError::UnexpectedEOF => 
                write!(f, "Unexpected end of file"),
            CompileError::InvalidNumber(n) => 
                write!(f, "Invalid number format: {}", n),
            CompileError::NewlineInString => 
                write!(f, "Newline is not allowed in string literals"),
            CompileError::UnterminatedString => 
                write!(f, "Unterminated string literal"),
            CompileError::InvalidEscapeSequence(s) => 
                write!(f, "Invalid escape sequence: {}", s),

            // Parserエラーのフォーマット
            CompileError::InvalidSyntax(s) => 
                write!(f, "Invalid syntax: {}", s),
            CompileError::MultipleRestParameters => 
                write!(f, "Multiple rest parameters are not allowed"),
            CompileError::UnexpectedIndentation => 
                write!(f, "Unexpected indentation level"),
            CompileError::InvalidIdentifier(id) => 
                write!(f, "Invalid identifier: {}", id),
            CompileError::ExpectedToken { expected, found } => 
                write!(f, "Expected {}, found {}", expected, found),
            CompileError::InvalidOperator { operator, context } => 
                write!(f, "Invalid use of operator '{}' in {}", operator, context),
            CompileError::UnmatchedBracket { opening, closing } => 
                write!(f, "Unmatched brackets: expected '{}', found '{}'", closing, opening),

            // Semanticエラーのフォーマット
            CompileError::InvalidSpreadUsage(msg) => 
                write!(f, "Invalid use of spread operator: {}", msg),
            CompileError::InvalidExportUsage(msg) => 
                write!(f, "Invalid use of export operator: {}", msg),
            CompileError::InvalidImportUsage(msg) => 
                write!(f, "Invalid use of import operator: {}", msg),
            CompileError::InvalidGetUsage(msg) => 
                write!(f, "Invalid use of get operator: {}", msg),

            // Generalエラーのフォーマット
            CompileError::IOError(msg) => 
                write!(f, "IO error: {}", msg),
            CompileError::UnexpectedError(e) => 
                write!(f, "Unexpected error: {}", e),
        }
    }
}

impl std::error::Error for CompileError {}

/// コンパイラの結果型
pub type Result<T> = std::result::Result<T, CompileError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let error = CompileError::UnexpectedChar('$');
        assert_eq!(
            error.to_string(),
            "Unexpected character: '$'"
        );

        let error = CompileError::InvalidOperator {
            operator: "~".to_string(),
            context: "postfix position".to_string(),
        };
        assert_eq!(
            error.to_string(),
            "Invalid use of operator '~' in postfix position"
        );
    }

    #[test]
    fn test_error_conversion() {
        let error = CompileError::UnexpectedEOF;
        let _: Box<dyn std::error::Error> = Box::new(error);
    }
}
