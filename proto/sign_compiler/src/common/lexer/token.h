// src/common/lexer/token.h
/**
 * Sign言語のトークン定義と基本操作を提供するモジュール
 *
 * 機能:
 * - トークンタイプの定義
 * - トークン構造体の実装
 * - 演算子リストと判定関数
 * - 文字種別判定関数
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */
#ifndef SIGN_COMMON_LEXER_TOKEN_H
#define SIGN_COMMON_LEXER_TOKEN_H

#include <string>
#include <unordered_set>

namespace sign
{
    namespace common
    {

        // トークンの種類を表す列挙型
        enum class TokenType
        {
            IDENTIFIER,    // 識別子
            NUMBER,        // 数値リテラル
            STRING,        // 文字列リテラル
            CHAR,          // 文字リテラル
            OPERATOR,      // 演算子
            BRACKET_OPEN,  // 開きカッコ
            BRACKET_CLOSE, // 閉じカッコ
            LAMBDA,        // ラムダ演算子 ?
            DEFINE,        // 定義演算子 :
            COMMA,         // カンマ ,
            WHITESPACE,    // 空白文字
            NEWLINE,       // 改行
            INDENTATION,   // インデント
            UNKNOWN        // 不明なトークン
        };

        // トークン情報を格納する構造体
        struct Token
        {
            std::string value; // トークンの値
            TokenType type;    // トークンの種類

            // コンストラクタ
            Token(const std::string &val, TokenType t) : value(val), type(t) {}
        };

        // 演算子リスト
        extern const std::unordered_set<std::string> INFIX_OPERATORS;
        extern const std::unordered_set<std::string> PREFIX_OPERATORS;
        extern const std::unordered_set<std::string> POSTFIX_OPERATORS;

        // 演算子判定関数
        bool isInfixOperator(const std::string &str);
        bool isPrefixOperator(const std::string &str);
        bool isPostfixOperator(const std::string &str);

        // 文字判定関数
        bool isDelimiter(char c);
        bool isBracket(char c);
        bool isWhitespace(char c);

        // トークン種類判定
        TokenType determineTokenType(const std::string &token);

    } // namespace common
} // namespace sign

#endif // SIGN_COMMON_LEXER_TOKEN_H