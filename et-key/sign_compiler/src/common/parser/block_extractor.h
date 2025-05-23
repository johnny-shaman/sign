// src/common/parser/block_extractor.h
/**
 * Sign言語のソースコードからコードブロックを抽出するモジュール
 *
 * 機能:
 * - 処理のまとまり（コードブロック）を抽出
 * - インデントによるブロック構造の検出
 * - 各ブロックを独立した処理単位として分離
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */

#ifndef SIGN_COMMON_PARSER_BLOCK_EXTRACTOR_H
#define SIGN_COMMON_PARSER_BLOCK_EXTRACTOR_H

#include <string>
#include <vector>

namespace sign
{
    namespace common
    {

        /**
         * ソースコードから処理のまとまり（コードブロック）を抽出する
         *
         * @param sourceCode 前処理済みのソースコード
         * @return 抽出されたコードブロックの配列
         */
        std::vector<std::string> extractCodeBlocks(const std::string &sourceCode);

        /**
         * 抽出されたコードブロックに対して前処理を行う
         * - ブロックを[]で囲む（オプション）
         * - インデントを正規化
         *
         * @param blocks 抽出されたコードブロックの配列
         * @param wrapWithBrackets ブロックを[]で囲むかどうか
         * @return 処理されたコードブロックの配列
         */
        std::vector<std::string> processBlocks(const std::vector<std::string> &blocks, bool wrapWithBrackets = false);

        /**
         * コードブロックの抽出と前処理を一度に行う
         *
         * @param sourceCode 前処理済みのソースコード
         * @param wrapWithBrackets ブロックを[]で囲むかどうか
         * @return 処理されたコードブロックの配列
         */
        std::vector<std::string> extractAndProcessBlocks(const std::string &sourceCode, bool wrapWithBrackets = false);

    } // namespace common
} // namespace sign

#endif // SIGN_COMMON_PARSER_BLOCK_EXTRACTOR_H