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
 * ver_20250516_0
 */
#ifndef SIGN_PREPROCESSOR_H
#define SIGN_PREPROCESSOR_H

#include <string>

namespace sign {

/**
 * コメント除去
 * @param sourceCode 処理対象のソースコード
 * @return コメントが除去されたソースコード
 */
std::string removeComments(const std::string& sourceCode);

/**
 * カッコの統一
 * @param sourceCode 処理対象のソースコード
 * @return カッコが統一されたソースコード
 */
std::string unifyBrackets(const std::string& sourceCode);

/**
 * ソースコード正規化
 * @param sourceCode 処理対象のソースコード
 * @return 正規化されたソースコード
 */
std::string normalizeSourceCode(const std::string& sourceCode);

} // namespace sign

#endif // SIGN_PREPROCESSOR_H