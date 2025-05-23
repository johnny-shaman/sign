// src/parser/operator_precedence.cpp
#include "parser/operator_precedence.h"
#include <algorithm>

namespace sign {

// 演算子の優先順位マップ
const std::unordered_map<std::string, Precedence> OperatorInfo::precedenceMap = {
    // 定義
    {":", Precedence::DEFINE},
    
    // IO
    {"#", Precedence::IO},
    {"@", Precedence::IO},
    
    // 構築域
    {" ", Precedence::CONSTRUCTION},
    {"?", Precedence::CONSTRUCTION},
    {",", Precedence::CONSTRUCTION},
    {"~", Precedence::CONSTRUCTION},
    
    // 論理域
    {"|", Precedence::LOGICAL_OR},
    {";", Precedence::LOGICAL_OR},
    {"&", Precedence::LOGICAL_AND},
    
    // 等値比較
    {"=", Precedence::EQUALITY},
    {"!=", Precedence::EQUALITY},
    {"><", Precedence::EQUALITY},
    {"<>", Precedence::EQUALITY},
    
    // 比較
    {"<", Precedence::COMPARISON},
    {"<=", Precedence::COMPARISON},
    {">=", Precedence::COMPARISON},
    {">", Precedence::COMPARISON},
    
    // 加減算
    {"+", Precedence::TERM},
    {"-", Precedence::TERM},
    
    // 乗除算
    {"*", Precedence::FACTOR},
    {"/", Precedence::FACTOR},
    {"%", Precedence::FACTOR},
    
    // 冪乗
    {"^", Precedence::EXPONENT},
    
    // ゲット
    {"'", Precedence::GET}
};

// 演算子の結合性マップ
const std::unordered_map<std::string, Associativity> OperatorInfo::associativityMap = {
    // 右結合性
    {":", Associativity::RIGHT},
    {"?", Associativity::RIGHT},
    {",", Associativity::RIGHT},
    {"^", Associativity::RIGHT},
    
    // 他は全て左結合性
    {" ", Associativity::LEFT},
    {"#", Associativity::LEFT},
    {"@", Associativity::LEFT},
    {"~", Associativity::LEFT},
    {"|", Associativity::LEFT},
    {";", Associativity::LEFT},
    {"&", Associativity::LEFT},
    {"=", Associativity::LEFT},
    {"!=", Associativity::LEFT},
    {"><", Associativity::LEFT},
    {"<>", Associativity::LEFT},
    {"<", Associativity::LEFT},
    {"<=", Associativity::LEFT},
    {">=", Associativity::LEFT},
    {">", Associativity::LEFT},
    {"+", Associativity::LEFT},
    {"-", Associativity::LEFT},
    {"*", Associativity::LEFT},
    {"/", Associativity::LEFT},
    {"%", Associativity::LEFT},
    {"'", Associativity::LEFT},
};

// 中置演算子
const std::vector<std::string> OperatorInfo::infixOperators = {
    ":", "#", " ", "?", ",", "~", "|", ";", "&", "=", "!=", "><", "<>",
    "<", "<=", ">=", ">", "+", "-", "*", "/", "%", "^", "'"
};

// 前置演算子
const std::vector<std::string> OperatorInfo::prefixOperators = {
    "!", "~", "-", "@", "$", "#"
};

// 後置演算子
const std::vector<std::string> OperatorInfo::postfixOperators = {
    "!", "~", "@"
};

Precedence OperatorInfo::getPrecedence(const std::string& op) {
    auto it = precedenceMap.find(op);
    if (it != precedenceMap.end()) {
        return it->second;
    }
    return Precedence::NONE;
}

Associativity OperatorInfo::getAssociativity(const std::string& op) {
    auto it = associativityMap.find(op);
    if (it != associativityMap.end()) {
        return it->second;
    }
    return Associativity::LEFT;  // デフォルトは左結合
}

bool OperatorInfo::isOperator(const std::string& token) {
    return isInfixOperator(token) || isPrefixOperator(token) || isPostfixOperator(token);
}

bool OperatorInfo::isPrefixOperator(const std::string& token) {
    return std::find(prefixOperators.begin(), prefixOperators.end(), token) != prefixOperators.end();
}

bool OperatorInfo::isPostfixOperator(const std::string& token) {
    return std::find(postfixOperators.begin(), postfixOperators.end(), token) != postfixOperators.end();
}

bool OperatorInfo::isInfixOperator(const std::string& token) {
    return std::find(infixOperators.begin(), infixOperators.end(), token) != infixOperators.end();
}

bool OperatorInfo::isRightAssociative(const std::string& op) {
    return getAssociativity(op) == Associativity::RIGHT;
}

const std::vector<std::string>& OperatorInfo::getInfixOperators() {
    return infixOperators;
}

const std::vector<std::string>& OperatorInfo::getPrefixOperators() {
    return prefixOperators;
}

const std::vector<std::string>& OperatorInfo::getPostfixOperators() {
    return postfixOperators;
}

} // namespace sign