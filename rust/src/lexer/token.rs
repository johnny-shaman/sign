// src/lexer/token.rs
use std::fmt;

/// 字句解析で生成されるトークン
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // リテラル
    Identifier(String),     // 識別子
    StringChars(Vec<char>), // バッククォートで囲まれた文字列
    NumberLiteral(f64),     // 数値
    CharLiteral(char),      // \の後の1文字
    
    // 括弧類（すべて同じ意味だが、可読性のために区別）
    LeftBracket,    // [
    RightBracket,   // ]
    LeftBrace,      // {
    RightBrace,     // }
    LeftParen,      // (
    RightParen,     // )
    
    // 定義と関数
    Define,         // :
    Lambda,         // ?
    
    // 直積
    Product,        // ,
    
    // 前置演算子
    Export,         // #
    Import,         // @
    Not,            // !（前置）
    
    // 後置演算子
    Factorial,      // !（後置）
    Spread,         // ~（後置）
    
    // 中置演算子
    // 論理演算子
    And,            // &
    Or,             // |
    Xor,            // ;
    
    // 比較演算子
    LessThan,       // <
    LessEqual,      // <=
    Equal,          // = or ==
    NotEqual,       // != or >< or <>
    GreaterEqual,   // >=
    GreaterThan,    // >
    
    // 算術演算子
    Plus,           // +
    Minus,          // -
    Multiply,       // *
    Divide,         // /
    Modulo,         // %
    Power,          // ^
    
    // 特殊演算子
    Get,            // '（要素アクセス）
    Range,          // ~（範囲生成）

    // インデントとブロック制御
    Indent(usize),  // インデントレベル
    Dedent,         // デデント
    Newline,        // 改行
    
    // 終端
    EOF,            // 入力終端
}

impl Token {
    /// トークンが演算子かどうかを判定
    pub fn is_operator(&self) -> bool {
        matches!(self,
            Token::Plus | Token::Minus | Token::Multiply | Token::Divide |
            Token::Modulo | Token::Power | Token::And | Token::Or |
            Token::Xor | Token::LessThan | Token::LessEqual |
            Token::Equal | Token::NotEqual | Token::GreaterEqual |
            Token::GreaterThan | Token::Get | Token::Range |
            Token::Export | Token::Import | Token::Not |
            Token::Factorial | Token::Spread
        )
    }

    /// トークンが前置演算子かどうかを判定
    pub fn is_prefix_operator(&self) -> bool {
        matches!(self,
            Token::Export | Token::Import | Token::Not |
            Token::Minus  // 単項マイナスとして使用可能
        )
    }

    /// トークンが後置演算子かどうかを判定
    pub fn is_postfix_operator(&self) -> bool {
        matches!(self,
            Token::Factorial | Token::Spread
        )
    }

    /// トークンが二項演算子かどうかを判定
    pub fn is_binary_operator(&self) -> bool {
        self.is_operator() && !self.is_prefix_operator() && !self.is_postfix_operator()
    }
}

impl fmt::Display for Token {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Token::Identifier(name) => write!(f, "{}", name),
            Token::StringChars(chars) => write!(f, "`{}`", chars.iter().collect::<String>()),
            Token::NumberLiteral(n) => write!(f, "{}", n),
            Token::CharLiteral(c) => write!(f, "\\{}", c),
            
            Token::LeftBracket => write!(f, "["),
            Token::RightBracket => write!(f, "]"),
            Token::LeftBrace => write!(f, "{{"),
            Token::RightBrace => write!(f, "}}"),
            Token::LeftParen => write!(f, "("),
            Token::RightParen => write!(f, ")"),
            
            Token::Define => write!(f, ":"),
            Token::Lambda => write!(f, "?"),
            Token::Product => write!(f, ","),
            
            Token::Export => write!(f, "#"),
            Token::Import => write!(f, "@"),
            Token::Not => write!(f, "!"),
            Token::Factorial => write!(f, "!"),
            Token::Spread => write!(f, "~"),
            
            Token::And => write!(f, "&"),
            Token::Or => write!(f, "|"),
            Token::Xor => write!(f, ";"),
            
            Token::LessThan => write!(f, "<"),
            Token::LessEqual => write!(f, "<="),
            Token::Equal => write!(f, "="),
            Token::NotEqual => write!(f, "!="),
            Token::GreaterEqual => write!(f, ">="),
            Token::GreaterThan => write!(f, ">"),
            
            Token::Plus => write!(f, "+"),
            Token::Minus => write!(f, "-"),
            Token::Multiply => write!(f, "*"),
            Token::Divide => write!(f, "/"),
            Token::Modulo => write!(f, "%"),
            Token::Power => write!(f, "^"),
            
            Token::Get => write!(f, "'"),
            Token::Range => write!(f, "~"),
            
            Token::Indent(n) => write!(f, "<indent:{}>", n),
            Token::Dedent => write!(f, "<dedent>"),
            Token::Newline => write!(f, "<newline>"),
            Token::EOF => write!(f, "<eof>"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_operator_classification() {
        // 前置演算子
        assert!(Token::Export.is_prefix_operator());
        assert!(Token::Import.is_prefix_operator());
        assert!(Token::Not.is_prefix_operator());
        
        // 後置演算子
        assert!(Token::Factorial.is_postfix_operator());
        assert!(Token::Spread.is_postfix_operator());
        
        // 二項演算子
        assert!(Token::Plus.is_binary_operator());
        assert!(Token::Minus.is_binary_operator());
        assert!(Token::Get.is_binary_operator());
        assert!(Token::Range.is_binary_operator());
    }

    #[test]
    fn test_token_display() {
        assert_eq!(Token::CharLiteral('a').to_string(), "\\a");
        assert_eq!(Token::StringChars(vec!['h', 'i']).to_string(), "`hi`");
        assert_eq!(Token::NumberLiteral(42.0).to_string(), "42");
        assert_eq!(Token::Identifier("foo".to_string()).to_string(), "foo");
    }

    #[test]
    fn test_special_characters() {
        let string_chars = Token::StringChars(vec!['\\', 'n']);
        assert_eq!(string_chars.to_string(), "`\\n`");
        
        let char_literal = Token::CharLiteral('\\');
        assert_eq!(char_literal.to_string(), "\\\\");
    }
}
