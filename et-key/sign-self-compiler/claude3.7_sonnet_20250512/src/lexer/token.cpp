// src/lexer/token.cpp
#include "lexer/token.h"
#include <sstream>

namespace sign {

Token::Token(TokenType type, std::string lexeme, int line, int column)
    : type(type), lexeme(std::move(lexeme)), literal(""), line(line), column(column) {
}

Token::Token(TokenType type, std::string lexeme, std::string literal, int line, int column)
    : type(type), lexeme(std::move(lexeme)), literal(std::move(literal)), line(line), column(column) {
}

SourceLocation Token::getLocation() const {
    return SourceLocation("", line, column);
}

std::string Token::toString() const {
    std::ostringstream ss;
    ss << tokenTypeToString(type) << " '" << lexeme << "'";
    
    if (!literal.empty() && lexeme != literal) {
        ss << " (値: " << literal << ")";
    }
    
    return ss.str();
}

bool Token::isOperator(const std::string& op) const {
    return type == TokenType::OPERATOR && lexeme == op;
}

std::string tokenTypeToString(TokenType type) {
    switch (type) {
        case TokenType::IDENTIFIER:    return "識別子";
        case TokenType::NUMBER:        return "数値";
        case TokenType::STRING:        return "文字列";
        case TokenType::CHARACTER:     return "文字";
        case TokenType::OPERATOR:      return "演算子";
        case TokenType::LEFT_BRACKET:  return "左括弧";
        case TokenType::RIGHT_BRACKET: return "右括弧";
        case TokenType::INDENT:        return "インデント";
        case TokenType::DEDENT:        return "デデント";
        case TokenType::NEWLINE:       return "改行";
        case TokenType::EOF_TOKEN:     return "EOF";
        case TokenType::ERROR:         return "エラー";
        default:                       return "不明";
    }
}

} // namespace sign