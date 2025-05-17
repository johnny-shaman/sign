// src/preprocessor/sign_transformer.h
/**
 * Sign言語の処理済みコードを最終形式に変換するモジュール
 * 
 * 機能:
 * - 処理されたブロックを結合して最終的なコードを生成
 * - 出力形式の整形と整理
 * - ファイル出力
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250516_0
 */

#ifndef SIGN_TRANSFORMER_H
#define SIGN_TRANSFORMER_H

#include <string>
#include <vector>

namespace sign {

/**
 * 処理されたブロックを結合して最終的なSignコードを生成する
 * 
 * @param processedBlocks 処理済みのコードブロック配列
 * @return 結合された最終的なコード
 */
std::string generateFinalCode(const std::vector<std::string>& processedBlocks);

/**
 * Sign言語コードをファイルに出力する
 * 
 * @param code 出力するコード
 * @param filename 出力ファイル名
 * @return 成功した場合はtrue
 */
bool writeToFile(const std::string& code, const std::string& filename);

/**
 * ソースコードを処理してプリプロセス済みのコードを生成する
 * 
 * @param sourceCode 入力ソースコード
 * @return 処理済みのコード
 */
std::string preprocessSourceCode(const std::string& sourceCode);

/**
 * ファイルからソースコードを読み込み、処理して出力する
 * 
 * @param inputFilename 入力ファイル名
 * @param outputFilename 出力ファイル名
 * @return 成功した場合はtrue
 */
bool processFile(const std::string& inputFilename, const std::string& outputFilename);

} // namespace sign

#endif // SIGN_TRANSFORMER_H