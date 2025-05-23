// src/lexer/lexer.h
#ifndef SIGN_LEXER_H
#define SIGN_LEXER_H

#include <string>
#include <vector>
#include <stack>
#include "lexer/token.h"
#include "common/error_reporter.h"

namespace sign {

// 字句解析器（レキサー）クラス
class Lexer {
public:
    // コンストラクタ
    Lexer(const std::string& source, const std::string& filename = "", ErrorReporter* reporter = nullptr);
    
    // トークン化実行
    std::vector<Token> tokenize();
    
    // 各トークンを生成する内部メソッド
    Token scanToken();
    
    // トークンの文字列表現を取得
    std::string tokensToString() const;
    
    // JSON形式のトークン表現を取得
    std::string tokensToJson() const;

private:
    std::string source;           // ソースコード
    std::string filename;         // ファイル名
    ErrorReporter* errorReporter; // エラー報告用オブジェクト
    
    std::vector<Token> tokens;    // 生成されたトークン列
    
    // 内部状態
    size_t start = 0;            // 現在のトークンの開始位置
    size_t current = 0;          // 現在の解析位置
    int line = 1;                // 現在の行番号
    int column = 1;              // 現在の列番号
    int startColumn = 1;         // 現在のトークンの開始列
    
    // インデント管理用
    std::stack<int> indentLevels;   // インデントレベルスタック
    bool atLineStart = true;        // 行頭にいるか
    int currentIndent = 0;          // 現在のインデントレベル
    
    // ユーティリティメソッド
    bool isAtEnd() const;
    char advance();
    char peek() const;
    char peekNext() const;
    bool match(char expected);
    
    // トークン生成ヘルパー
    Token makeToken(TokenType type) const;
    Token makeToken(TokenType type, const std::string& literal) const;
    Token errorToken(const std::string& message) const;
    
    // 各種トークンの解析
    Token identifier();
    Token number();
    Token string();
    Token character();
    Token processIndentation();
    
    // 文字の種類判定
    bool isDigit(char c) const;
    bool isAlpha(char c) const;
    bool isAlphaNumeric(char c) const;
    bool isIdentifierStart(char c) const;
    bool isIdentifierPart(char c) const;
    
    // エラーレポート
    void reportError(const std::string& message) const;
};

} // namespace sign

#endif // SIGN_LEXER_H