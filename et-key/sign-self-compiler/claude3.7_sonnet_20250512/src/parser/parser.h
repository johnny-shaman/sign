// src/parser/parser.h
#ifndef SIGN_PARSER_H
#define SIGN_PARSER_H

#include <memory>
#include <vector>
#include "lexer/token.h"
#include "parser/ast/ast_node.h"
#include "common/error_reporter.h"

namespace sign {

// 構文解析器クラス
class Parser {
public:
    Parser(const std::vector<Token>& tokens, ErrorReporter* reporter = nullptr);
    
    // トップレベルの式を解析
    std::unique_ptr<ASTNode> parse();
    
    // 式の種類別解析メソッド
    std::unique_ptr<ASTNode> parseExpression();
    std::unique_ptr<ASTNode> parseAssignment();
    std::unique_ptr<ASTNode> parseLambda();
    std::unique_ptr<ASTNode> parseLogicalOr();
    std::unique_ptr<ASTNode> parseLogicalAnd();
    std::unique_ptr<ASTNode> parseEquality();
    std::unique_ptr<ASTNode> parseComparison();
    std::unique_ptr<ASTNode> parseTerm();
    std::unique_ptr<ASTNode> parseFactor();
    std::unique_ptr<ASTNode> parseExponent();
    std::unique_ptr<ASTNode> parseUnary();
    std::unique_ptr<ASTNode> parseGet();
    std::unique_ptr<ASTNode> parsePrimary();
    
    // 特殊構造の解析
    std::unique_ptr<ASTNode> parseList();
    std::unique_ptr<ASTNode> parseIdentifier();
    std::unique_ptr<ASTNode> parseNumber();
    std::unique_ptr<ASTNode> parseString();
    std::unique_ptr<ASTNode> parseCharacter();
    
    // AST構造のダンプ（デバッグ用）
    std::string dumpAST() const;

private:
    std::vector<Token> tokens;
    size_t current = 0;
    ErrorReporter* errorReporter;
    
    // 現在解析中のAST
    std::unique_ptr<ASTNode> ast;
    
    // ユーティリティメソッド
    bool isAtEnd() const;
    const Token& peek() const;
    const Token& previous() const;
    const Token& advance();
    bool check(TokenType type) const;
    bool match(TokenType type);
    bool match(TokenType type, const std::string& lexeme);
    
    // 期待するトークンの確認
    const Token& consume(TokenType type, const std::string& message);
    const Token& consume(TokenType type, const std::string& lexeme, const std::string& message);
    
    // エラー報告
    void error(const std::string& message);
    void error(const Token& token, const std::string& message);
    
    // 同期処理（エラー回復用）
    void synchronize();
};

} // namespace sign

#endif // SIGN_PARSER_H