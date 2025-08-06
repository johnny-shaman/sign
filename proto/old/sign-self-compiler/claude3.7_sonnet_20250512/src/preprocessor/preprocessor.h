// src/preprocessor/preprocessor.h
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