// src/parser/ast/ast_node.cpp
#include "parser/ast/ast_node.h"
#include <sstream>
#include <algorithm>

namespace sign {

// リテラルノード実装
LiteralNode::LiteralNode(LiteralType type, std::string value)
    : type(type), value(std::move(value)) {
}

void LiteralNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string LiteralNode::toString() const {
    std::string typeStr;
    switch (type) {
        case LiteralType::NUMBER:    typeStr = "数値"; break;
        case LiteralType::STRING:    typeStr = "文字列"; break;
        case LiteralType::CHARACTER: typeStr = "文字"; break;
        case LiteralType::UNIT:      typeStr = "単位元"; break;
    }
    
    return typeStr + "(" + value + ")";
}

// 識別子ノード実装
IdentifierNode::IdentifierNode(std::string name)
    : name(std::move(name)) {
}

void IdentifierNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string IdentifierNode::toString() const {
    return "識別子(" + name + ")";
}

// 二項演算ノード実装
BinaryExpressionNode::BinaryExpressionNode(std::string op, 
                                         std::unique_ptr<ASTNode> left,
                                         std::unique_ptr<ASTNode> right)
    : op(std::move(op)), left(std::move(left)), right(std::move(right)) {
}

void BinaryExpressionNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string BinaryExpressionNode::toString() const {
    return "二項演算(" + op + ", " + 
           (left ? left->toString() : "null") + ", " + 
           (right ? right->toString() : "null") + ")";
}

// 単項演算ノード実装
UnaryExpressionNode::UnaryExpressionNode(std::string op, bool isPrefix, 
                                        std::unique_ptr<ASTNode> operand)
    : op(std::move(op)), isPrefix(isPrefix), operand(std::move(operand)) {
}

void UnaryExpressionNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string UnaryExpressionNode::toString() const {
    if (isPrefix) {
        return "前置演算(" + op + ", " + 
               (operand ? operand->toString() : "null") + ")";
    } else {
        return "後置演算(" + 
               (operand ? operand->toString() : "null") + ", " + 
               op + ")";
    }
}

// ラムダ式ノード実装
LambdaNode::LambdaNode(std::vector<std::unique_ptr<ASTNode>> params,
                     std::unique_ptr<ASTNode> body)
    : params(std::move(params)), body(std::move(body)) {
}

void LambdaNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string LambdaNode::toString() const {
    std::ostringstream ss;
    ss << "ラムダ(";
    
    // パラメータ一覧
    ss << "[";
    for (size_t i = 0; i < params.size(); ++i) {
        if (i > 0) ss << ", ";
        ss << (params[i] ? params[i]->toString() : "null");
    }
    ss << "], ";
    
    // 本体
    ss << (body ? body->toString() : "null");
    ss << ")";
    
    return ss.str();
}

// 残余引数ノード実装
RestArgsNode::RestArgsNode(std::string name)
    : name(std::move(name)) {
}

void RestArgsNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string RestArgsNode::toString() const {
    return "残余引数(~" + name + ")";
}

// 展開ノード実装
ExpandNode::ExpandNode(std::unique_ptr<ASTNode> expr)
    : expr(std::move(expr)) {
}

void ExpandNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string ExpandNode::toString() const {
    return "展開(" + (expr ? expr->toString() : "null") + "~)";
}

// リストノード実装
ListNode::ListNode(std::vector<std::unique_ptr<ASTNode>> elements)
    : elements(std::move(elements)) {
}

void ListNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string ListNode::toString() const {
    std::ostringstream ss;
    ss << "リスト[";
    
    for (size_t i = 0; i < elements.size(); ++i) {
        if (i > 0) ss << ", ";
        ss << (elements[i] ? elements[i]->toString() : "null");
    }
    
    ss << "]";
    return ss.str();
}


// プログラムノード実装
ProgramNode::ProgramNode(std::vector<std::unique_ptr<ASTNode>> statements)
    : statements(std::move(statements)) {
}

void ProgramNode::accept([[maybe_unused]] ASTVisitor& visitor) {
    // ビジターパターンの実装（現段階では空）
}

std::string ProgramNode::toString() const {
    std::ostringstream ss;
    ss << "プログラム[\n";
    
    for (size_t i = 0; i < statements.size(); ++i) {
        ss << "  ";
        if (statements[i]) {
            ss << statements[i]->toString();
        } else {
            ss << "null";
        }
        if (i < statements.size() - 1) {
            ss << ",\n";
        }
    }
    
    ss << "\n]";
    return ss.str();
}


} // namespace sign