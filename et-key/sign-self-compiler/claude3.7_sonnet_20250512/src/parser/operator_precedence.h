// src/parser/operator_precedence.h
#ifndef SIGN_OPERATOR_PRECEDENCE_H
#define SIGN_OPERATOR_PRECEDENCE_H

#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace sign {

// 演算子優先順位定義
enum class Precedence {
    NONE,            // 演算子ではない
    DEFINE,          // : (定義）
    IO,              // # (出力), @ (入力)
    CONSTRUCTION,    // 空白 (余積), ? (ラムダ), , (積), ~ (範囲)
    LOGICAL_OR,      // | (論理和), ; (排他的論理和)
    LOGICAL_AND,     // & (論理積)
    EQUALITY,        // = (等しい), != (等しくない)
    COMPARISON,      // <, <=, >=, > (比較演算子)
    TERM,            // + (加算), - (減算)
    FACTOR,          // * (乗算), / (除算), % (剰余)
    EXPONENT,        // ^ (冪乗)
    UNARY,           // ! (否定), ~ (展開), - (負数) 
    GET,             // ' (ゲット)
    PRIMARY          // 最高優先度（リテラル、識別子など）
};

// 演算子の結合性
enum class Associativity {
    LEFT,   // 左結合
    RIGHT   // 右結合
};

// 演算子情報クラス
class OperatorInfo {
public:
    static Precedence getPrecedence(const std::string& op);
    static Associativity getAssociativity(const std::string& op);
    
    static bool isOperator(const std::string& token);
    static bool isPrefixOperator(const std::string& token);
    static bool isPostfixOperator(const std::string& token);
    static bool isInfixOperator(const std::string& token);
    
    static bool isRightAssociative(const std::string& op);
    
    // 演算子のグループ取得
    static const std::vector<std::string>& getInfixOperators();
    static const std::vector<std::string>& getPrefixOperators();
    static const std::vector<std::string>& getPostfixOperators();
    
private:
    // 優先順位マップ
    static const std::unordered_map<std::string, Precedence> precedenceMap;
    
    // 結合性マップ
    static const std::unordered_map<std::string, Associativity> associativityMap;
    
    // 演算子グループ
    static const std::vector<std::string> infixOperators;
    static const std::vector<std::string> prefixOperators;
    static const std::vector<std::string> postfixOperators;
};

} // namespace sign

#endif // SIGN_OPERATOR_PRECEDENCE_H