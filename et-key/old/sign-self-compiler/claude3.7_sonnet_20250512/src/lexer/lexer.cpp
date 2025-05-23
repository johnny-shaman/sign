// src/lexer/lexer.cpp
#include "lexer/lexer.h"
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cctype>

namespace sign {

// 演算子一覧
static const std::vector<std::string> OPERATORS = {
    // 単文字演算子
    "+", "-", "*", "/", "%", "^", "?", ":", ",", "~", "!", "&", "|", ";", "<", ">", "=", "'", "@", "#", "$",
    // 複数文字演算子
    "<=", ">=", "==", "!=", "><", "<>"
};

Lexer::Lexer(const std::string& source, const std::string& filename, ErrorReporter* reporter)
    : source(source), filename(filename), errorReporter(reporter) {
    // インデントレベルスタックを初期化（レベル0を追加）
    indentLevels.push(0);
}

std::vector<Token> Lexer::tokenize() {
    tokens.clear();
    
    // ソースコードをスキャンしてトークンに変換
    while (!isAtEnd()) {
        start = current;
        startColumn = column;
        
        Token token = scanToken();
        if (token.getType() != TokenType::ERROR) {
            tokens.push_back(token);
        }
    }
    
    // 最後に残っているデデントを追加
    while (indentLevels.top() > 0) {
        tokens.push_back(Token(TokenType::DEDENT, "", line, column));
        indentLevels.pop();
    }
    
    // EOFトークンを追加
    tokens.push_back(Token(TokenType::EOF_TOKEN, "", line, column));
    
    return tokens;
}

Token Lexer::scanToken() {
    // 行頭の場合はインデントを処理
    if (atLineStart && !isAtEnd()) {
        atLineStart = false;
        return processIndentation();
    }
    
    // 空白をスキップ
    while (!isAtEnd() && std::isspace(peek())) {
        if (peek() == '\n') {
            // 改行を処理
            line++;
            column = 1;
            advance();
            atLineStart = true;
            return Token(TokenType::NEWLINE, "\n", line - 1, column);
        }
        
        advance();
    }
    
    if (isAtEnd()) {
        return Token(TokenType::EOF_TOKEN, "", line, column);
    }
    
    char c = advance();
    
    // 識別子
    if (isIdentifierStart(c)) {
        return identifier();
    }
    
    // 数値
    if (isDigit(c)) {
        return number();
    }
    
    // 文字列リテラル
    if (c == '`') {
        return string();
    }
    
    // 文字リテラル
    if (c == '\\') {
        return character();
    }
    
    // 括弧
    if (c == '[' || c == '(' || c == '{') {
        return makeToken(TokenType::LEFT_BRACKET);
    }
    
    if (c == ']' || c == ')' || c == '}') {
        return makeToken(TokenType::RIGHT_BRACKET);
    }
    
    // 演算子（2文字演算子も考慮）
    std::string possibleOp(1, c);
    
    // 次の文字を見て2文字演算子を判定
    if (!isAtEnd()) {
        char next = peek();
        std::string twoCharOp = possibleOp + next;
        
        // 2文字演算子のチェック
        if (std::find(OPERATORS.begin(), OPERATORS.end(), twoCharOp) != OPERATORS.end()) {
            advance(); // 2文字目を消費
            return Token(TokenType::OPERATOR, twoCharOp, line, startColumn);
        }
    }
    
    // 1文字演算子のチェック
    if (std::find(OPERATORS.begin(), OPERATORS.end(), possibleOp) != OPERATORS.end()) {
        return Token(TokenType::OPERATOR, possibleOp, line, startColumn);
    }
    
    // 未知の文字
    return errorToken("予期しない文字です: '" + possibleOp + "'");
}

Token Lexer::processIndentation() {
    int indent = 0;
    
    // インデントレベルを計測
    while (!isAtEnd() && peek() == '\t') {
        indent++;
        advance();
    }
    
    // 現在のインデントレベルと比較
    int previousIndent = indentLevels.top();
    
    if (indent > previousIndent) {
        // インデント増加
        indentLevels.push(indent);
        return Token(TokenType::INDENT, std::string(indent - previousIndent, '\t'), line, startColumn);
    } else if (indent < previousIndent) {
        // インデント減少
        indentLevels.pop();
        
        // 適切なインデントレベルを見つける
        if (indentLevels.empty() || indentLevels.top() != indent) {
            // 適切なレベルが見つからない場合はエラー
            indentLevels.push(previousIndent); // 元に戻す
            return errorToken("不正なインデントレベルです");
        }
        
        // デデントトークンを返す
        return Token(TokenType::DEDENT, "", line, startColumn);
    }
    
    // インデントレベルが変わらない場合は次のトークンを解析
    return scanToken();
}

Token Lexer::identifier() {
    while (!isAtEnd() && isIdentifierPart(peek())) {
        advance();
    }
    
    // 現在のトークンの文字列を取得
    std::string text = source.substr(start, current - start);
    
    return Token(TokenType::IDENTIFIER, text, line, startColumn);
}

Token Lexer::number() {
    // 数値リテラルを解析
    
    // 整数部分
    while (!isAtEnd() && isDigit(peek())) {
        advance();
    }
    
    // 小数部分
    if (!isAtEnd() && peek() == '.' && !isAtEnd() && isDigit(peekNext())) {
        // '.' を消費
        advance();
        
        // 小数点以下の桁を消費
        while (!isAtEnd() && isDigit(peek())) {
            advance();
        }
    }
    
    // 16進数、8進数、2進数のチェック
    std::string number = source.substr(start, current - start);
    
    // リテラル値を生成
    return makeToken(TokenType::NUMBER, number);
}

Token Lexer::string() {
    // 開始の ` は既に消費されている
    
    // 閉じる ` まで読み込む
    while (!isAtEnd() && peek() != '`') {
        advance();
    }
    
    if (isAtEnd()) {
        return errorToken("閉じられていない文字列です");
    }
    
    // 閉じる ` を消費
    advance();
    
    // リテラル値を取得（開始と終了の ` も含む）
    std::string value = source.substr(start, current - start);
    
    return makeToken(TokenType::STRING, value);
}

Token Lexer::character() {
    // 開始の \ は既に消費されている
    
    if (isAtEnd()) {
        return errorToken("不完全な文字リテラルです");
    }
    
    // 次の文字を消費
    char c = advance();
    
    // リテラル値を生成
    std::string charLiteral = std::string("\\") + c;
    
    return makeToken(TokenType::CHARACTER, charLiteral);
}

bool Lexer::isAtEnd() const {
    return current >= source.length();
}

char Lexer::advance() {
    char c = source[current++];
    column++;
    return c;
}

char Lexer::peek() const {
    if (isAtEnd()) return '\0';
    return source[current];
}

char Lexer::peekNext() const {
    if (current + 1 >= source.length()) return '\0';
    return source[current + 1];
}

bool Lexer::match(char expected) {
    if (isAtEnd() || source[current] != expected) {
        return false;
    }
    
    current++;
    column++;
    return true;
}

Token Lexer::makeToken(TokenType type) const {
    std::string text = source.substr(start, current - start);
    return Token(type, text, line, startColumn);
}

Token Lexer::makeToken(TokenType type, const std::string& literal) const {
    std::string text = source.substr(start, current - start);
    return Token(type, text, literal, line, startColumn);
}

Token Lexer::errorToken(const std::string& message) const {
    reportError(message);
    return Token(TokenType::ERROR, message, line, startColumn);
}

bool Lexer::isDigit(char c) const {
    return c >= '0' && c <= '9';
}

bool Lexer::isAlpha(char c) const {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
}

bool Lexer::isAlphaNumeric(char c) const {
    return isAlpha(c) || isDigit(c);
}

bool Lexer::isIdentifierStart(char c) const {
    // 識別子は英字または_で始まる
    return isAlpha(c);
}

bool Lexer::isIdentifierPart(char c) const {
    // 識別子の途中は英数字または_
    return isAlphaNumeric(c);
}

void Lexer::reportError(const std::string& message) const {
    if (errorReporter) {
        SourceLocation location(filename, line, startColumn);
        errorReporter->error("lexer", message, location);
    }
}

std::string Lexer::tokensToString() const {
    std::ostringstream ss;
    for (size_t i = 0; i < tokens.size(); ++i) {
        ss << "[" << i << "] " << tokens[i].toString();
        if (i < tokens.size() - 1) {
            ss << '\n';
        }
    }
    return ss.str();
}

std::string Lexer::tokensToJson() const {
    std::ostringstream ss;
    ss << "{\n";
    ss << "  \"tokens\": [\n";
    
    for (size_t i = 0; i < tokens.size(); ++i) {
        const Token& token = tokens[i];
        
        ss << "    {\n";
        ss << "      \"type\": \"" << tokenTypeToString(token.getType()) << "\",\n";
        ss << "      \"lexeme\": \"" << token.getLexeme() << "\",\n";
        ss << "      \"line\": " << token.getLine() << ",\n";
        ss << "      \"column\": " << token.getColumn() << "\n";
        ss << "    }";
        
        if (i < tokens.size() - 1) {
            ss << ",";
        }
        ss << "\n";
    }
    
    ss << "  ]\n";
    ss << "}\n";
    
    return ss.str();
}

} // namespace sign