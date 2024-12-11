// src/lexer/state.rs
use std::fmt;

/// 字句解析器の状態を表す列挙型
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LexerState {
    /// 通常の状態
    /// トークンの読み取りを行う
    Normal,

    /// 文字列を読み込み中
    /// バッククォートで囲まれた部分を処理
    /// この状態では改行とバッククォートを除く全ての文字をそのまま読み込む
    InString,

    /// インデントを処理中
    /// 行頭の空白文字をカウントしている状態
    ProcessingIndent,
}

impl LexerState {
    /// 状態が遷移可能かどうかを判定
    pub fn can_transition_to(&self, next: LexerState) -> bool {
        match (*self, next) {
            // 通常状態からの遷移
            (LexerState::Normal, LexerState::InString) => true,
            (LexerState::Normal, LexerState::ProcessingIndent) => true,
            
            // 文字列状態からの遷移
            (LexerState::InString, LexerState::Normal) => true,
            
            // インデント処理状態からの遷移
            (LexerState::ProcessingIndent, LexerState::Normal) => true,
            
            // 同じ状態への遷移は常に可能
            (current, next) if current == next => true,
            
            // その他の遷移は不可
            _ => false,
        }
    }

    /// 現在の状態で特定の文字が特別な意味を持つかどうかを判定
    pub fn is_special_char(&self, c: char) -> bool {
        match self {
            LexerState::Normal => matches!(c, 
                '`' | '\\' | '[' | ']' | '{' | '}' | '(' | ')' |
                ':' | '?' | ',' | '~' | '#' | '@' | '\'' | '!' |
                '+' | '-' | '*' | '/' | '%' | '^' | '&' | '|' | ';' |
                '<' | '>' | '=' | '\n'
            ),
            LexerState::InString => matches!(c, '`' | '\n'),
            LexerState::ProcessingIndent => c.is_whitespace(),
        }
    }

    /// 現在の状態でエラーとなる文字かどうかを判定
    pub fn is_error_char(&self, c: char) -> bool {
        match self {
            LexerState::InString => c == '\n',
            _ => false,
        }
    }
}

impl fmt::Display for LexerState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LexerState::Normal => write!(f, "Normal"),
            LexerState::InString => write!(f, "InString"),
            LexerState::ProcessingIndent => write!(f, "ProcessingIndent"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_transitions() {
        let normal = LexerState::Normal;
        let in_string = LexerState::InString;
        let processing_indent = LexerState::ProcessingIndent;

        // 有効な遷移
        assert!(normal.can_transition_to(in_string));
        assert!(normal.can_transition_to(processing_indent));
        assert!(in_string.can_transition_to(normal));
        assert!(processing_indent.can_transition_to(normal));

        // 無効な遷移
        assert!(!in_string.can_transition_to(processing_indent));
        assert!(!processing_indent.can_transition_to(in_string));
    }

    #[test]
    fn test_special_chars() {
        let normal = LexerState::Normal;
        let in_string = LexerState::InString;
        let processing_indent = LexerState::ProcessingIndent;

        // 通常状態での特殊文字
        assert!(normal.is_special_char('`'));
        assert!(normal.is_special_char('\\'));
        assert!(normal.is_special_char('['));
        assert!(normal.is_special_char(':'));

        // 文字列状態での特殊文字
        assert!(in_string.is_special_char('`'));
        assert!(in_string.is_special_char('\n'));
        assert!(!in_string.is_special_char('\\'));
        assert!(!in_string.is_special_char('['));

        // インデント処理状態での特殊文字
        assert!(processing_indent.is_special_char(' '));
        assert!(processing_indent.is_special_char('\t'));
        assert!(!processing_indent.is_special_char('a'));
    }

    #[test]
    fn test_error_chars() {
        let normal = LexerState::Normal;
        let in_string = LexerState::InString;

        // 文字列内の改行はエラー
        assert!(in_string.is_error_char('\n'));
        
        // 通常状態での改行はエラーではない
        assert!(!normal.is_error_char('\n'));
    }

    #[test]
    fn test_state_display() {
        assert_eq!(LexerState::Normal.to_string(), "Normal");
        assert_eq!(LexerState::InString.to_string(), "InString");
        assert_eq!(LexerState::ProcessingIndent.to_string(), "ProcessingIndent");
    }
}
