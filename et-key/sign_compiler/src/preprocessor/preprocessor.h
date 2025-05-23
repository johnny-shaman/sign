// src/preprocessor/preprocessor.h
/**
 * Sign言語の基本的な前処理を行うモジュール
 *
 * 機能:
 * - コメントの除去
 * - カッコ記号の統一
 * - 空白の正規化
 * - ソースコードの前処理パイプライン管理
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */
#ifndef SIGN_PREPROCESSOR_H
#define SIGN_PREPROCESSOR_H

#include "common/utils/string_utils.h"
#include <string>

namespace sign
{

    /**
     * コメント除去 (common::removeCommentsへの転送)
     * @param sourceCode 処理対象のソースコード
     * @return コメントが除去されたソースコード
     */
    inline std::string removeComments(const std::string &sourceCode)
    {
        return common::removeComments(sourceCode);
    }

    /**
     * カッコの統一 (common::unifyBracketsへの転送)
     * @param sourceCode 処理対象のソースコード
     * @return カッコが統一されたソースコード
     */
    inline std::string unifyBrackets(const std::string &sourceCode)
    {
        return common::unifyBrackets(sourceCode);
    }

    /**
     * ソースコード正規化
     * @param sourceCode 処理対象のソースコード
     * @return 正規化されたソースコード
     */
    std::string normalizeSourceCode(const std::string &sourceCode);

} // namespace sign

#endif // SIGN_PREPROCESSOR_H