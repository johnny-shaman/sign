// src/common/utils/string_utils.h
/**
 * Sign言語の文字列操作ユーティリティを提供するモジュール
 *
 * 機能:
 * - コメント削除
 * - カッコの統一
 * - 文字列の分割と結合
 * - 空白の正規化
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */

#ifndef SIGN_COMMON_UTILS_STRING_UTILS_H
#define SIGN_COMMON_UTILS_STRING_UTILS_H

#include <string>
#include <vector>

namespace sign
{
    namespace common
    {

        /**
         * コメント除去
         * @param sourceCode 処理対象のソースコード
         * @return コメントが除去されたソースコード
         */
        std::string removeComments(const std::string &sourceCode);

        /**
         * カッコの統一
         * @param sourceCode 処理対象のソースコード
         * @return カッコが統一されたソースコード
         */
        std::string unifyBrackets(const std::string &sourceCode);

        /**
         * 文字列を行に分割
         * @param source 分割する文字列
         * @return 行の配列
         */
        std::vector<std::string> splitLines(const std::string &source);

        /**
         * 行を結合して文字列に変換
         * @param lines 行の配列
         * @return 結合された文字列
         */
        std::string joinLines(const std::vector<std::string> &lines);

        /**
         * 行末の空白を削除
         * @param line 処理対象の行
         * @return 空白が削除された行
         */
        std::string trimRight(const std::string &line);

    } // namespace common
} // namespace sign

#endif // SIGN_COMMON_UTILS_STRING_UTILS_H