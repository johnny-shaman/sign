// src/preprocessor/token_processor.h
/**
 * Sign言語のソースコードをトークン化するモジュール
 * 
 * 機能:
 * - ソースコードのトークン化
 * - 文字列リテラルの適切な処理
 * - 演算子やリテラルの識別
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250518_0
 */

#ifndef SIGN_TOKEN_PROCESSOR_H
#define SIGN_TOKEN_PROCESSOR_H

#include <string>
#include <vector>
#include <unordered_set>

namespace sign {

// トークンの種類を表す列挙型
enum class TokenType {
    IDENTIFIER,     // 識別子
    NUMBER,         // 数値リテラル
    STRING,         // 文字列リテラル
    CHAR,           // 文字リテラル
    OPERATOR,       // 演算子
    BRACKET_OPEN,   // 開きカッコ
    BRACKET_CLOSE,  // 閉じカッコ
    LAMBDA,         // ラムダ演算子 ?
    DEFINE,         // 定義演算子 :
    COMMA,          // カンマ ,
    WHITESPACE,     // 空白文字
    NEWLINE,        // 改行
    INDENTATION,    // インデント
    UNKNOWN         // 不明なトークン
};

// トークン情報を格納する構造体
struct Token {
    std::string value;  // トークンの値
    TokenType type;     // トークンの種類
    
    // コンストラクタ
    Token(const std::string& val, TokenType t) : value(val), type(t) {}
};

/**
 * ソースコードブロックをトークン化する
 * 
 * @param block トークン化するコードブロック
 * @return トークン配列
 */
std::vector<Token> tokenizeBlock(const std::string& block);

/**
 * トークンの種類を判定する
 * 
 * @param token 判定するトークン文字列
 * @return トークンの種類
 */
TokenType determineTokenType(const std::string& token);

/**
 * 中置演算子かどうかを判定
 * 
 * @param str 判定する文字列
 * @return 中置演算子ならtrue
 */
bool isInfixOperator(const std::string& str);

/**
 * 前置演算子かどうかを判定
 * 
 * @param str 判定する文字列
 * @return 前置演算子ならtrue
 */
bool isPrefixOperator(const std::string& str);

/**
 * 後置演算子かどうかを判定
 * 
 * @param str 判定する文字列
 * @return 後置演算子ならtrue
 */
bool isPostfixOperator(const std::string& str);

/**
 * 区切り文字かどうかを判定
 * 
 * @param c 判定する文字
 * @return 区切り文字ならtrue
 */
bool isDelimiter(char c);

/**
 * カッコ文字かどうかを判定
 * 
 * @param c 判定する文字
 * @return カッコ文字ならtrue
 */
bool isBracket(char c);

/**
 * 空白文字かどうかを判定
 * 
 * @param c 判定する文字
 * @return 空白文字ならtrue
 */
bool isWhitespace(char c);

/**
 * トークン配列を文字列に変換
 * 
 * @param tokens トークン配列
 * @return トークンを結合した文字列
 */
std::string tokensToString(const std::vector<Token>& tokens);

/**
 * トークンから前置演算子部分を抽出する
 * 
 * @param token 対象トークン
 * @return 前置演算子部分の文字列（なければ空文字列）
 */
std::string extractPrefixOperator(const std::string& token);

/**
 * トークンから後置演算子部分を抽出する
 * 
 * @param token 対象トークン
 * @return 後置演算子部分の文字列（なければ空文字列）
 */
std::string extractPostfixOperator(const std::string& token);

/**
 * トークンから識別子部分を抽出する
 * 前置演算子と後置演算子を除いた部分を返す
 * 
 * @param token 対象トークン
 * @return 識別子部分の文字列
 */
std::string extractIdentifier(const std::string& token);


// 演算子リスト
extern const std::unordered_set<std::string> INFIX_OPERATORS;
extern const std::unordered_set<std::string> PREFIX_OPERATORS;
extern const std::unordered_set<std::string> POSTFIX_OPERATORS;

} // namespace sign

#endif // SIGN_TOKEN_PROCESSOR_H