// src/common/utils/file_utils.h
/**
 * Sign言語のファイル操作ユーティリティを提供するモジュール
 *
 * 機能:
 * - ファイルからのコード読み込み
 * - ファイルへのコード書き込み
 * - 入出力エラー処理
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */
#ifndef SIGN_COMMON_UTILS_FILE_UTILS_H
#define SIGN_COMMON_UTILS_FILE_UTILS_H

#include <string>

namespace sign
{
    namespace common
    {

        /**
         * ファイルからコードを読み込む
         *
         * @param filename 入力ファイル名
         * @return ファイルの内容
         * @throws std::runtime_error ファイルを開けない場合
         */
        std::string readFromFile(const std::string &filename);

        /**
         * コードをファイルに書き込む
         *
         * @param code 書き込むコード
         * @param filename 出力ファイル名
         * @return 成功した場合はtrue
         */
        bool writeToFile(const std::string &code, const std::string &filename);

    } // namespace common
} // namespace sign

#endif // SIGN_COMMON_UTILS_FILE_UTILS_H