// src/common/lexer/tokenizer.h
/**
 * Sign言語のソースコードをトークン化するモジュール
 *
 * 機能:
 * - ソースコードのトークン化
 * - 文字列リテラルの適切な処理
 * - トークン列の操作と変換
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */

#ifndef SIGN_COMMON_LEXER_TOKENIZER_H
#define SIGN_COMMON_LEXER_TOKENIZER_H

#include "common/lexer/token.h"
#include <string>
#include <vector>

namespace sign
{
    namespace common
    {

        /**
         * ソースコードブロックをトークン化する
         *
         * @param block トークン化するコードブロック
         * @return トークン配列
         */
        std::vector<Token> tokenizeBlock(const std::string &block);

        /**
         * トークン配列を文字列に変換
         *
         * @param tokens トークン配列
         * @return トークンを結合した文字列
         */
        std::string tokensToString(const std::vector<Token> &tokens);

        /**
         * トークンから前置演算子部分を抽出する
         *
         * @param token 対象トークン
         * @return 前置演算子部分の文字列（なければ空文字列）
         */
        std::string extractPrefixOperator(const std::string &token);

        /**
         * トークンから後置演算子部分を抽出する
         *
         * @param token 対象トークン
         * @return 後置演算子部分の文字列（なければ空文字列）
         */
        std::string extractPostfixOperator(const std::string &token);

        /**
         * トークンから識別子部分を抽出する
         * 前置演算子と後置演算子を除いた部分を返す
         *
         * @param token 対象トークン
         * @return 識別子部分の文字列
         */
        std::string extractIdentifier(const std::string &token);

    } // namespace common
} // namespace sign

#endif // SIGN_COMMON_LEXER_TOKENIZER_H