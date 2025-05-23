// src/parser/ast/ast_node.h
#ifndef SIGN_AST_NODE_H
#define SIGN_AST_NODE_H

#include <string>
#include <memory>
#include <vector>
#include "common/error_reporter.h"

namespace sign {

// 前方宣言
class ASTVisitor;

// AST基本クラス
class ASTNode {
public:
    virtual ~ASTNode() = default;
    
    // 各ノードがビジターを受け入れるためのメソッド
    virtual void accept(ASTVisitor& visitor) = 0;
    
    // ノードの文字列表現を取得（デバッグ用）
    virtual std::string toString() const = 0;
    
    // ソースコード上の位置情報
    SourceLocation location;
};

// AST訪問者インターフェース
class ASTVisitor {
public:
    virtual ~ASTVisitor() = default;
};

// リテラルノード
class LiteralNode : public ASTNode {
public:
    enum class LiteralType {
        NUMBER,     // 数値
        STRING,     // 文字列
        CHARACTER,  // 文字
        UNIT        // 単位元（_）
    };
    
    LiteralNode(LiteralType type, std::string value);
    
    LiteralType getType() const { return type; }
    const std::string& getValue() const { return value; }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    LiteralType type;
    std::string value;
};

// 識別子ノード
class IdentifierNode : public ASTNode {
public:
    IdentifierNode(std::string name);
    
    const std::string& getName() const { return name; }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    std::string name;
};

// 二項演算ノード
class BinaryExpressionNode : public ASTNode {
public:
    BinaryExpressionNode(std::string op, 
                        std::unique_ptr<ASTNode> left,
                        std::unique_ptr<ASTNode> right);
    
    const std::string& getOperator() const { return op; }
    ASTNode* getLeft() const { return left.get(); }
    ASTNode* getRight() const { return right.get(); }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    std::string op;
    std::unique_ptr<ASTNode> left;
    std::unique_ptr<ASTNode> right;
};

// 単項演算ノード
class UnaryExpressionNode : public ASTNode {
public:
    UnaryExpressionNode(std::string op, bool isPrefix, 
                       std::unique_ptr<ASTNode> operand);
    
    const std::string& getOperator() const { return op; }
    bool isPrefixOperator() const { return isPrefix; }
    ASTNode* getOperand() const { return operand.get(); }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    std::string op;
    bool isPrefix;  // 前置演算子ならtrue、後置演算子ならfalse
    std::unique_ptr<ASTNode> operand;
};

// ラムダ式ノード
class LambdaNode : public ASTNode {
public:
    LambdaNode(std::vector<std::unique_ptr<ASTNode>> params,
              std::unique_ptr<ASTNode> body);
    
    const std::vector<std::unique_ptr<ASTNode>>& getParams() const { return params; }
    ASTNode* getBody() const { return body.get(); }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    std::vector<std::unique_ptr<ASTNode>> params;
    std::unique_ptr<ASTNode> body;
};

// 残余引数ノード
class RestArgsNode : public ASTNode {
public:
    RestArgsNode(std::string name);
    
    const std::string& getName() const { return name; }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    std::string name;
};

// 展開ノード
class ExpandNode : public ASTNode {
public:
    ExpandNode(std::unique_ptr<ASTNode> expr);
    
    ASTNode* getExpression() const { return expr.get(); }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    std::unique_ptr<ASTNode> expr;
};

// リストノード
class ListNode : public ASTNode {
public:
    ListNode(std::vector<std::unique_ptr<ASTNode>> elements);
    
    const std::vector<std::unique_ptr<ASTNode>>& getElements() const { return elements; }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    std::vector<std::unique_ptr<ASTNode>> elements;
};

// プログラムノード（複数の式を格納）
class ProgramNode : public ASTNode {
public:
    ProgramNode(std::vector<std::unique_ptr<ASTNode>> statements);
    
    const std::vector<std::unique_ptr<ASTNode>>& getStatements() const { return statements; }
    
    void accept(ASTVisitor& visitor) override;
    std::string toString() const override;
    
private:
    std::vector<std::unique_ptr<ASTNode>> statements;
};

// ここで基本的なASTノードのみ定義。より高度なノード（条件分岐、定義など）は
// 段階4で追加予定

} // namespace sign

#endif // SIGN_AST_NODE_H