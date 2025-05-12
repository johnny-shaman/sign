// src/lexer/token.h
#ifndef SIGN_TOKEN_H
#define SIGN_TOKEN_H

#include <string>
#include "common/error_reporter.h"

namespace sign {

// トークンの種類
enum class TokenType {
    // リテラル
    IDENTIFIER,        // 識別子
    NUMBER,            // 数値（整数、浮動小数点、その他の基数）
    STRING,            // 文字列リテラル（`で囲まれた文字列）
    CHARACTER,         // 文字リテラル（\で始まる文字）
    
    // 演算子
    OPERATOR,          // 演算子（+, -, *, /, :, ?など）
    
    // 構造関連
    LEFT_BRACKET,      // 左括弧 ([, {, ()
    RIGHT_BRACKET,     // 右括弧 (], }, ))
    INDENT,            // インデント（行頭の空白増加）
    DEDENT,            // デデント（行頭の空白減少）
    NEWLINE,           // 改行
    
    // 特殊
    EOF_TOKEN,         // ファイル終端
    ERROR              // エラートークン
};

// トークンクラス
class Token {
public:
    // コンストラクタ
    Token(TokenType type, std::string lexeme, 
          int line, int column);
    
    // リテラル値を持つトークン用コンストラクタ
    Token(TokenType type, std::string lexeme, std::string literal,
          int line, int column);
    
    // ゲッター
    TokenType getType() const { return type; }
    const std::string& getLexeme() const { return lexeme; }
    const std::string& getLiteral() const { return literal; }
    int getLine() const { return line; }
    int getColumn() const { return column; }
    
    // ソースコード位置情報を取得
    SourceLocation getLocation() const;
    
    // トークンの文字列表現を取得
    std::string toString() const;
    
    // 演算子トークンのヘルパーメソッド
    bool isOperator(const std::string& op) const;
    
    // 括弧トークンのヘルパーメソッド
    bool isLeftBracket() const { return type == TokenType::LEFT_BRACKET; }
    bool isRightBracket() const { return type == TokenType::RIGHT_BRACKET; }
    
    // 末尾かどうかを確認
    bool isEOF() const { return type == TokenType::EOF_TOKEN; }

private:
    TokenType type;       // トークンの種類
    std::string lexeme;   // 元のテキスト
    std::string literal;  // リテラル値（数値や文字列の場合）
    int line;             // 行番号
    int column;           // 列番号
};

// トークン種別を文字列に変換する関数
std::string tokenTypeToString(TokenType type);

} // namespace sign

#endif // SIGN_TOKEN_H