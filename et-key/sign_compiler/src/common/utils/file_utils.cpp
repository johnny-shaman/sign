// src/common/utils/file_utils.cpp
/**
 * Sign言語のファイル操作ユーティリティを実装
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */

#include "common/utils/file_utils.h"
#include <fstream>
#include <sstream>
#include <stdexcept>

namespace sign
{
    namespace common
    {

        // ファイルからコードを読み込む
        std::string readFromFile(const std::string &filename)
        {
            std::ifstream inFile(filename);
            if (!inFile.is_open())
            {
                throw std::runtime_error("Unable to open file: " + filename);
            }

            std::stringstream buffer;
            buffer << inFile.rdbuf();
            inFile.close();

            return buffer.str();
        }

        // コードをファイルに書き込む
        bool writeToFile(const std::string &code, const std::string &filename)
        {
            std::ofstream outFile(filename);
            if (!outFile.is_open())
            {
                return false;
            }

            outFile << code;
            outFile.close();

            return true;
        }

    } // namespace common
} // namespace sign