// src/ast/operator.rs
use std::fmt;

/// 単項演算子
#[derive(Debug, Clone, PartialEq)]
pub enum UnaryOperator {
    // 前置演算子
    Not,        // !x (論理否定)
    Export,     // #x (エクスポート)
    Import,     // @x (インポート)
    RestParam,  // ~xs (残余パラメータ)
    Negative,   // -x (数値の符号反転)
    
    // 後置演算子
    Factorial,  // x! (階乗)
    Spread,     // x~ (スプレッド展開)
}

/// 二項演算子
#[derive(Debug, Clone, PartialEq)]
pub enum BinaryOperator {
    // 定義・構造
    Define,    // : (定義)
    Lambda,    // ? (ラムダ抽象)
    Product,   // , (直積)

    // 論理演算
    Or,        // | (論理和)
    Xor,       // ; (排他的論理和)
    And,       // & (論理積)

    // 比較演算
    Compare(CompareOp),  // 比較演算子

    // 算術演算
    Add,       // + (加算)
    Sub,       // - (減算)
    Mul,       // * (乗算)
    Div,       // / (除算)
    Mod,       // % (剰余)
    Power,     // ^ (べき乗)

    // 特殊演算
    Get,       // ' (要素アクセス)
    Range,     // ~ (範囲生成)
}

/// 比較演算子
#[derive(Debug, Clone, PartialEq)]
pub enum CompareOp {
    Less,          // <
    LessEqual,     // <=
    Equal,         // = or ==
    NotEqual,      // != or >< or <>
    GreaterEqual,  // >=
    Greater,       // >
}

impl UnaryOperator {
    /// 演算子の優先順位（値が大きいほど優先順位が高い）
    pub fn precedence(&self) -> u8 {
        match self {
            // IO関連演算子と残余パラメータは優先順位が低い
            UnaryOperator::Export => 1,
            UnaryOperator::Import => 1,
            UnaryOperator::RestParam => 1,
            
            // 前置演算子は比較的優先順位が高い
            UnaryOperator::Not => 9,
            UnaryOperator::Negative => 9,
            
            // 後置演算子は最も優先順位が高い
            UnaryOperator::Factorial => 11,
            UnaryOperator::Spread => 11,
        }
    }

    /// 演算子が前置かどうか
    pub fn is_prefix(&self) -> bool {
        matches!(self, 
            UnaryOperator::Not | 
            UnaryOperator::Export | 
            UnaryOperator::Import | 
            UnaryOperator::RestParam |
            UnaryOperator::Negative
        )
    }

    /// 演算子が後置かどうか
    pub fn is_postfix(&self) -> bool {
        !self.is_prefix()
    }
}

impl BinaryOperator {
    /// 演算子の優先順位（値が大きいほど優先順位が高い）
    pub fn precedence(&self) -> u8 {
        match self {
            // 最も優先順位が低い
            BinaryOperator::Define => 1,
            BinaryOperator::Lambda => 2,
            BinaryOperator::Product => 3,
            
            // 論理演算子
            BinaryOperator::Or => 4,
            BinaryOperator::Xor => 5,
            BinaryOperator::And => 6,
            
            // 比較演算子
            BinaryOperator::Compare(_) => 7,
            
            // 算術演算子
            BinaryOperator::Add | BinaryOperator::Sub => 8,
            BinaryOperator::Mul | BinaryOperator::Div | BinaryOperator::Mod => 9,
            BinaryOperator::Power => 10,
            
            // 特殊演算子は最も優先順位が高い
            BinaryOperator::Get => 11,
            BinaryOperator::Range => 11,
        }
    }

    /// 演算子の結合性（右結合ならtrue）
    pub fn is_right_associative(&self) -> bool {
        matches!(self, 
            BinaryOperator::Define | 
            BinaryOperator::Lambda | 
            BinaryOperator::Power
        )
    }

    /// 演算子が比較演算子かどうか（連鎖可能）
    pub fn is_comparison(&self) -> bool {
        matches!(self, BinaryOperator::Compare(_))
    }
}

impl fmt::Display for UnaryOperator {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", match self {
            UnaryOperator::Not => "!",
            UnaryOperator::Export => "#",
            UnaryOperator::Import => "@",
            UnaryOperator::RestParam => "~",
            UnaryOperator::Negative => "-",
            UnaryOperator::Factorial => "!",
            UnaryOperator::Spread => "~",
        })
    }
}

impl fmt::Display for BinaryOperator {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BinaryOperator::Define => write!(f, ":"),
            BinaryOperator::Lambda => write!(f, "?"),
            BinaryOperator::Product => write!(f, ","),
            BinaryOperator::Or => write!(f, "|"),
            BinaryOperator::Xor => write!(f, ";"),
            BinaryOperator::And => write!(f, "&"),
            BinaryOperator::Compare(op) => write!(f, "{}", op),
            BinaryOperator::Add => write!(f, "+"),
            BinaryOperator::Sub => write!(f, "-"),
            BinaryOperator::Mul => write!(f, "*"),
            BinaryOperator::Div => write!(f, "/"),
            BinaryOperator::Mod => write!(f, "%"),
            BinaryOperator::Power => write!(f, "^"),
            BinaryOperator::Get => write!(f, "'"),
            BinaryOperator::Range => write!(f, "~"),
        }
    }
}

impl fmt::Display for CompareOp {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", match self {
            CompareOp::Less => "<",
            CompareOp::LessEqual => "<=",
            CompareOp::Equal => "=",
            CompareOp::NotEqual => "!=",
            CompareOp::GreaterEqual => ">=",
            CompareOp::Greater => ">",
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_operator_precedence() {
        // 定義は最も優先順位が低い
        assert!(BinaryOperator::Define.precedence() < BinaryOperator::Lambda.precedence());
        
        // 算術演算子の優先順位
        assert!(BinaryOperator::Add.precedence() < BinaryOperator::Mul.precedence());
        assert!(BinaryOperator::Mul.precedence() < BinaryOperator::Power.precedence());
        
        // 特殊演算子は最も優先順位が高い
        assert!(BinaryOperator::Add.precedence() < BinaryOperator::Get.precedence());
    }

    #[test]
    fn test_operator_associativity() {
        // 定義とべき乗は右結合
        assert!(BinaryOperator::Define.is_right_associative());
        assert!(BinaryOperator::Power.is_right_associative());
        
        // 加算と乗算は左結合
        assert!(!BinaryOperator::Add.is_right_associative());
        assert!(!BinaryOperator::Mul.is_right_associative());
    }

    #[test]
    fn test_unary_operator_position() {
        // 前置演算子のテスト
        assert!(UnaryOperator::Not.is_prefix());
        assert!(UnaryOperator::Import.is_prefix());
        assert!(UnaryOperator::RestParam.is_prefix());
        
        // 後置演算子のテスト
        assert!(!UnaryOperator::Factorial.is_prefix());
        assert!(!UnaryOperator::Spread.is_prefix());
        assert!(UnaryOperator::Factorial.is_postfix());
        assert!(UnaryOperator::Spread.is_postfix());
    }

    #[test]
    fn test_rest_param_operator() {
        let rest = UnaryOperator::RestParam;
        assert!(rest.is_prefix());
        assert_eq!(rest.to_string(), "~");
        // 残余パラメータは定義と同じ低い優先順位を持つ
        assert_eq!(rest.precedence(), 1);
    }

    #[test]
    fn test_operator_display() {
        // 単項演算子の表示
        assert_eq!(UnaryOperator::Export.to_string(), "#");
        assert_eq!(UnaryOperator::RestParam.to_string(), "~");
        assert_eq!(UnaryOperator::Spread.to_string(), "~");
        
        // 二項演算子の表示
        assert_eq!(BinaryOperator::Range.to_string(), "~");
        assert_eq!(BinaryOperator::Get.to_string(), "'");
        
        // 比較演算子の表示
        assert_eq!(BinaryOperator::Compare(CompareOp::LessEqual).to_string(), "<=");
    }
}
