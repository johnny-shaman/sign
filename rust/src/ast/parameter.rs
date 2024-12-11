// src/ast/parameter.rs
use std::fmt;
use crate::error::{CompileError, Result};

/// 関数パラメータの種類を表す列挙型
#[derive(Debug, Clone, PartialEq)]
pub enum Parameter {
    /// 通常のパラメータ (x)
    Normal(String),
    
    /// 残余パラメータ (~xs)
    Rest(String),
}

impl Parameter {
    /// パラメータ名を取得
    pub fn name(&self) -> &str {
        match self {
            Parameter::Normal(name) | Parameter::Rest(name) => name,
        }
    }

    /// 残余パラメータかどうかを判定
    pub fn is_rest(&self) -> bool {
        matches!(self, Parameter::Rest(_))
    }

    /// パラメータリストの検証
    /// - 残余パラメータは最後にのみ許可される
    /// - 残余パラメータは1つまで
    pub fn validate_params(params: &[Parameter]) -> Result<()> {
        let mut found_rest = false;
        
        for (i, param) in params.iter().enumerate() {
            if param.is_rest() {
                if found_rest {
                    return Err(CompileError::MultipleRestParameters);
                }
                if i != params.len() - 1 {
                    return Err(CompileError::InvalidSyntax(
                        "Rest parameter must be the last parameter".to_string()
                    ));
                }
                found_rest = true;
            }
        }
        
        Ok(())
    }

    /// パラメータ名の有効性を検証
    pub fn validate_name(name: &str) -> Result<()> {
        if name.is_empty() {
            return Err(CompileError::InvalidIdentifier(
                "Parameter name cannot be empty".to_string()
            ));
        }

        // 先頭は文字またはアンダースコア
        if !name.chars().next().map_or(false, |c| c.is_alphabetic() || c == '_') {
            return Err(CompileError::InvalidIdentifier(
                format!("Invalid parameter name: {}", name)
            ));
        }

        // 残りは文字、数字、アンダースコア
        if !name.chars().all(|c| c.is_alphanumeric() || c == '_') {
            return Err(CompileError::InvalidIdentifier(
                format!("Invalid parameter name: {}", name)
            ));
        }

        Ok(())
    }
}

impl fmt::Display for Parameter {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Parameter::Normal(name) => write!(f, "{}", name),
            Parameter::Rest(name) => write!(f, "~{}", name),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parameter_creation() {
        let normal = Parameter::Normal("x".to_string());
        let rest = Parameter::Rest("xs".to_string());
        
        assert!(!normal.is_rest());
        assert!(rest.is_rest());
        
        assert_eq!(normal.name(), "x");
        assert_eq!(rest.name(), "xs");
    }

    #[test]
    fn test_parameter_display() {
        let normal = Parameter::Normal("x".to_string());
        let rest = Parameter::Rest("xs".to_string());
        
        assert_eq!(normal.to_string(), "x");
        assert_eq!(rest.to_string(), "~xs");
    }

    #[test]
    fn test_parameter_validation() {
        // 有効なパラメータリスト
        let params = vec![
            Parameter::Normal("x".to_string()),
            Parameter::Normal("y".to_string()),
            Parameter::Rest("xs".to_string()),
        ];
        assert!(Parameter::validate_params(&params).is_ok());

        // 複数の残余パラメータ（エラー）
        let invalid_params = vec![
            Parameter::Rest("xs".to_string()),
            Parameter::Rest("ys".to_string()),
        ];
        assert!(matches!(
            Parameter::validate_params(&invalid_params),
            Err(CompileError::MultipleRestParameters)
        ));

        // 残余パラメータが最後でない（エラー）
        let invalid_params = vec![
            Parameter::Rest("xs".to_string()),
            Parameter::Normal("y".to_string()),
        ];
        assert!(matches!(
            Parameter::validate_params(&invalid_params),
            Err(CompileError::InvalidSyntax(_))
        ));
    }

    #[test]
    fn test_name_validation() {
        // 有効な名前
        assert!(Parameter::validate_name("x").is_ok());
        assert!(Parameter::validate_name("_x").is_ok());
        assert!(Parameter::validate_name("x1").is_ok());
        assert!(Parameter::validate_name("valid_name_123").is_ok());

        // 無効な名前
        assert!(Parameter::validate_name("").is_err());
        assert!(Parameter::validate_name("1x").is_err());
        assert!(Parameter::validate_name("invalid-name").is_err());
        assert!(Parameter::validate_name("$invalid").is_err());
    }

    #[test]
    fn test_parameter_equality() {
        let p1 = Parameter::Normal("x".to_string());
        let p2 = Parameter::Normal("x".to_string());
        let p3 = Parameter::Rest("x".to_string());
        
        assert_eq!(p1, p2);
        assert_ne!(p1, p3);
    }
}
