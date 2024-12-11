// src/ast/mod.rs

mod node;
mod operator;
mod parameter;

pub use node::AST;
pub use operator::{UnaryOperator, BinaryOperator, CompareOp};
pub use parameter::Parameter;

/// 抽象構文木のノードが持つべき共通の振る舞い
pub trait ASTNode {
    /// ノードの表示用文字列を生成
    fn to_string(&self) -> String;
    
    /// ノードの子ノードのスライスを返す
    fn children(&self) -> Vec<&AST>;
    
    /// ノードが末端（リーフ）かどうかを判定
    fn is_leaf(&self) -> bool {
        self.children().is_empty()
    }
}

/// デバッグ表示用のヘルパー関数
pub(crate) fn indent(level: usize) -> String {
    "  ".repeat(level)
}

/// ASTノードの走査のためのビジター trait
pub trait Visitor {
    type Output;
    type Error;

    fn visit(&mut self, node: &AST) -> Result<Self::Output, Self::Error>;
    
    fn visit_children(&mut self, children: &[AST]) -> Result<Vec<Self::Output>, Self::Error> {
        children.iter().map(|child| self.visit(child)).collect()
    }
}

/// ASTの構築を補助するビルダー trait
pub trait Builder {
    type Error;

    fn build_unary(&mut self, op: UnaryOperator, expr: AST) -> Result<AST, Self::Error>;
    fn build_binary(&mut self, op: BinaryOperator, left: AST, right: AST) -> Result<AST, Self::Error>;
    fn build_parameter(&mut self, param: Parameter) -> Result<AST, Self::Error>;
    fn build_block(&mut self, expressions: Vec<AST>) -> Result<AST, Self::Error>;
}

/// ASTの最適化を行うための trait
pub trait Optimizer {
    type Error;

    fn optimize(&mut self, ast: &AST) -> Result<AST, Self::Error>;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::Result;

    // 単純なビジターの実装例
    struct NodeCounter {
        count: usize,
    }

    impl Visitor for NodeCounter {
        type Output = usize;
        type Error = std::convert::Infallible;

        fn visit(&mut self, _node: &AST) -> Result<Self::Output> {
            self.count += 1;
            Ok(self.count)
        }
    }

    #[test]
    fn test_visitor() {
        // テストケースは実際のASTノード実装後に追加
    }
}
