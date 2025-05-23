// src/parser/parser.cpp
#include "parser/parser.h"
#include "parser/operator_precedence.h"
#include <sstream>

namespace sign {

Parser::Parser(const std::vector<Token>& tokens, ErrorReporter* reporter)
    : tokens(tokens), errorReporter(reporter) {
}

std::unique_ptr<ASTNode> Parser::parse() {
    try {
        std::vector<std::unique_ptr<ASTNode>> statements;
        
        // ファイルの終わりまで各式を解析
        while (!isAtEnd()) {
            // 改行トークンをスキップ
            while (match(TokenType::NEWLINE)) {
                // 改行トークンを消費するだけ
            }
            
            // EOF に達したらループを抜ける
            if (isAtEnd()) break;
            
            // 式を解析してプログラムに追加
            auto expr = parseExpression();
            if (expr) {
                statements.push_back(std::move(expr));
            }
            
            // 式の後に改行または EOF があることを期待
            if (!isAtEnd() && !check(TokenType::NEWLINE)) {
                error(peek(), "式の後に改行が必要です");
                synchronize();
            }
        }
        
        // プログラムノードを作成
        ast = std::make_unique<ProgramNode>(std::move(statements));
        return std::move(ast);
    } catch (const std::exception& e) {
        error(e.what());
        return nullptr;
    }
}

std::unique_ptr<ASTNode> Parser::parseExpression() {
    // 最も優先度の低い式から開始
    return parseAssignment();
}

std::unique_ptr<ASTNode> Parser::parseAssignment() {
    auto expr = parseLambda();
    
    if (match(TokenType::OPERATOR, ":")) {
        auto value = parseAssignment(); // 代入は右結合なので再帰的に解析
        
        // 左辺が識別子であることを確認
        if ([[maybe_unused]] auto* idNode = dynamic_cast<IdentifierNode*>(expr.get())) {
            // Define/Assignノードを作成
            // ※段階4でDefineノードの実装が必要
            return std::make_unique<BinaryExpressionNode>(
                ":", std::move(expr), std::move(value)
            );
        }
        
        error("代入の左辺が不正です");
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseLambda() {
    // ラムダ引数を解析
    auto expr = parseLogicalOr();
    
    if (match(TokenType::OPERATOR, "?")) {
        // ラムダ本体を解析
        auto body = parseExpression();
        
        // ラムダパラメータの処理（左辺が識別子またはリストであることを想定）
        std::vector<std::unique_ptr<ASTNode>> params;
        
        if (auto* idNode = dynamic_cast<IdentifierNode*>(expr.get())) {
            // 単一パラメータの場合
            params.push_back(std::make_unique<IdentifierNode>(idNode->getName()));
        } else if ([[maybe_unused]] auto* listNode = dynamic_cast<ListNode*>(expr.get())) {
            // パラメータリストの場合
            // TODO: ListNodeからパラメータを抽出する処理
            // 現段階では単純化のため、expr自体をそのまま使用
            return std::make_unique<LambdaNode>(
                std::vector<std::unique_ptr<ASTNode>>(),
                std::move(body)
            );
        } else {
            error("ラムダ式のパラメータが不正です");
            return nullptr;
        }
        
        return std::make_unique<LambdaNode>(std::move(params), std::move(body));
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseLogicalOr() {
    auto expr = parseLogicalAnd();
    
    while (match(TokenType::OPERATOR, "|") || match(TokenType::OPERATOR, ";")) {
        auto op = previous().getLexeme();
        auto right = parseLogicalAnd();
        expr = std::make_unique<BinaryExpressionNode>(
            op, std::move(expr), std::move(right)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseLogicalAnd() {
    auto expr = parseEquality();
    
    while (match(TokenType::OPERATOR, "&")) {
        auto op = previous().getLexeme();
        auto right = parseEquality();
        expr = std::make_unique<BinaryExpressionNode>(
            op, std::move(expr), std::move(right)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseEquality() {
    auto expr = parseComparison();
    
    while (match(TokenType::OPERATOR, "=") || 
           match(TokenType::OPERATOR, "!=") ||
           match(TokenType::OPERATOR, "><") || 
           match(TokenType::OPERATOR, "<>")) {
        auto op = previous().getLexeme();
        auto right = parseComparison();
        expr = std::make_unique<BinaryExpressionNode>(
            op, std::move(expr), std::move(right)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseComparison() {
    auto expr = parseTerm();
    
    while (match(TokenType::OPERATOR, "<") || 
           match(TokenType::OPERATOR, "<=") ||
           match(TokenType::OPERATOR, ">") || 
           match(TokenType::OPERATOR, ">=")) {
        auto op = previous().getLexeme();
        auto right = parseTerm();
        expr = std::make_unique<BinaryExpressionNode>(
            op, std::move(expr), std::move(right)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseTerm() {
    auto expr = parseFactor();
    
    while (match(TokenType::OPERATOR, "+") || match(TokenType::OPERATOR, "-")) {
        auto op = previous().getLexeme();
        auto right = parseFactor();
        expr = std::make_unique<BinaryExpressionNode>(
            op, std::move(expr), std::move(right)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseFactor() {
    auto expr = parseExponent();
    
    while (match(TokenType::OPERATOR, "*") || 
           match(TokenType::OPERATOR, "/") || 
           match(TokenType::OPERATOR, "%")) {
        auto op = previous().getLexeme();
        auto right = parseExponent();
        expr = std::make_unique<BinaryExpressionNode>(
            op, std::move(expr), std::move(right)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseExponent() {
    auto expr = parseUnary();
    
    if (match(TokenType::OPERATOR, "^")) {
        auto op = previous().getLexeme();
        auto right = parseExponent(); // 冪乗は右結合
        expr = std::make_unique<BinaryExpressionNode>(
            op, std::move(expr), std::move(right)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseUnary() {
    // 前置演算子
    if (match(TokenType::OPERATOR, "!") || 
        match(TokenType::OPERATOR, "~") || 
        match(TokenType::OPERATOR, "-")) {
        auto op = previous().getLexeme();
        auto right = parseUnary(); // 単項演算子は右結合
        return std::make_unique<UnaryExpressionNode>(
            op, true, std::move(right)
        );
    }
    
    auto expr = parseGet();
    
    // 後置演算子
    if (match(TokenType::OPERATOR, "!") || match(TokenType::OPERATOR, "~")) {
        auto op = previous().getLexeme();
        return std::make_unique<UnaryExpressionNode>(
            op, false, std::move(expr)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parseGet() {
    auto expr = parsePrimary();
    
    while (match(TokenType::OPERATOR, "'")) {
        auto key = parsePrimary();
        expr = std::make_unique<BinaryExpressionNode>(
            "'", std::move(expr), std::move(key)
        );
    }
    
    return expr;
}

std::unique_ptr<ASTNode> Parser::parsePrimary() {
    // 識別子
    if (match(TokenType::IDENTIFIER)) {
        return std::make_unique<IdentifierNode>(previous().getLexeme());
    }
    
    // 数値
    if (match(TokenType::NUMBER)) {
        return std::make_unique<LiteralNode>(
            LiteralNode::LiteralType::NUMBER, 
            previous().getLexeme()
        );
    }
    
    // 文字列
    if (match(TokenType::STRING)) {
        return std::make_unique<LiteralNode>(
            LiteralNode::LiteralType::STRING, 
            previous().getLexeme()
        );
    }
    
    // 文字
    if (match(TokenType::CHARACTER)) {
        return std::make_unique<LiteralNode>(
            LiteralNode::LiteralType::CHARACTER, 
            previous().getLexeme()
        );
    }
    
    // 括弧内の式
    if (match(TokenType::LEFT_BRACKET)) {
        auto expr = parseExpression();
        consume(TokenType::RIGHT_BRACKET, "式の後ろに閉じ括弧が必要です");
        return expr;
    }
    
    error(peek(), "式が必要です");
    return nullptr;
}

std::unique_ptr<ASTNode> Parser::parseList() {
    std::vector<std::unique_ptr<ASTNode>> elements;
    
    // 空リストでないか確認
    if (!check(TokenType::RIGHT_BRACKET)) {
        do {
            elements.push_back(parseExpression());
        } while (match(TokenType::OPERATOR, ",") || 
                 (!check(TokenType::RIGHT_BRACKET) && !isAtEnd()));
    }
    
    consume(TokenType::RIGHT_BRACKET, "リストの末尾に閉じ括弧が必要です");
    return std::make_unique<ListNode>(std::move(elements));
}

bool Parser::isAtEnd() const {
    return peek().getType() == TokenType::EOF_TOKEN;
}

const Token& Parser::peek() const {
    return tokens[current];
}

const Token& Parser::previous() const {
    return tokens[current - 1];
}

const Token& Parser::advance() {
    if (!isAtEnd()) current++;
    return previous();
}

bool Parser::check(TokenType type) const {
    if (isAtEnd()) return false;
    return peek().getType() == type;
}

bool Parser::match(TokenType type) {
    if (check(type)) {
        advance();
        return true;
    }
    return false;
}

bool Parser::match(TokenType type, const std::string& lexeme) {
    if (check(type) && peek().getLexeme() == lexeme) {
        advance();
        return true;
    }
    return false;
}

const Token& Parser::consume(TokenType type, const std::string& message) {
    if (check(type)) return advance();
    error(peek(), message);
    throw std::runtime_error(message);
}

const Token& Parser::consume(TokenType type, const std::string& lexeme, const std::string& message) {
    if (check(type) && peek().getLexeme() == lexeme) return advance();
    error(peek(), message);
    throw std::runtime_error(message);
}

void Parser::error(const std::string& message) {
    error(peek(), message);
}

void Parser::error(const Token& token, const std::string& message) {
    if (errorReporter) {
        SourceLocation location(token.getLocation());
        errorReporter->error("parser", message, location);
    }
}

void Parser::synchronize() {
    advance();
    
    while (!isAtEnd()) {
        if (previous().getType() == TokenType::NEWLINE) {
            // 改行が見つかったらそこで同期
            return;
        }
        
        // 次の式の開始と思われるトークンを探す
        if (check(TokenType::IDENTIFIER) && 
            peek().getColumn() == 1) {  // 行頭にある識別子
            return;
        }
        
        advance();
    }
}

std::string Parser::dumpAST() const {
    if (!ast) return "AST: null";
    return ast->toString();
}

} // namespace sign