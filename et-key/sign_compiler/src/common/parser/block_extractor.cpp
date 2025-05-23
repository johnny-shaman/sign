// src/common/parser/block_extractor.cpp
/**
 * Sign言語のソースコードからコードブロックを抽出する実装
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */

#include "common/parser/block_extractor.h"
#include <sstream>

namespace sign
{
    namespace common
    {

        std::vector<std::string> extractCodeBlocks(const std::string &sourceCode)
        {
            if (sourceCode.empty())
            {
                return {};
            }

            // 行ごとに分割
            std::vector<std::string> lines;
            std::stringstream ss(sourceCode);
            std::string line;

            while (std::getline(ss, line))
            {
                lines.push_back(line);
            }

            // 抽出されたブロックを格納する配列
            std::vector<std::string> blocks;

            // 現在処理中のブロック
            std::vector<std::string> currentBlock;

            // 現在の行がブロックの先頭かどうかを追跡
            bool isNewBlock = true;

            // 各行を処理
            for (size_t i = 0; i < lines.size(); ++i)
            {
                const auto &line = lines[i];

                // 空行はスキップ
                if (line.empty() || line.find_first_not_of(" \t") == std::string::npos)
                {
                    // ただし、ブロックの途中にある空行は保持
                    if (!currentBlock.empty())
                    {
                        currentBlock.push_back("");
                    }
                    continue;
                }

                // タブで始まるかチェック
                const bool startsWithTab = line[0] == '\t';

                if (isNewBlock || !startsWithTab)
                {
                    // 前のブロックがあれば保存
                    if (!currentBlock.empty())
                    {
                        std::string blockContent;
                        for (size_t j = 0; j < currentBlock.size(); ++j)
                        {
                            if (j > 0)
                                blockContent += "\n";
                            blockContent += currentBlock[j];
                        }
                        blocks.push_back(blockContent);
                        currentBlock.clear();
                    }

                    // 新しいブロックの開始
                    currentBlock.push_back(line);
                    isNewBlock = false;
                }
                else
                {
                    // 既存のブロックの続き（インデントされた行）
                    currentBlock.push_back(line);
                }

                // 次の行を先読みしてブロックの区切りを判断
                const std::string *nextLine = (i + 1 < lines.size()) ? &lines[i + 1] : nullptr;

                if (!nextLine ||                                               // ファイルの終端
                    nextLine->empty() ||                                       // 空行
                    nextLine->find_first_not_of(" \t") == std::string::npos || // 空白のみの行
                    (nextLine->size() > 0 && nextLine->at(0) != '\t' && !startsWithTab))
                { // インデントなしの新しい行
                    // 次の行が新しいブロックの開始
                    isNewBlock = true;
                }
            }

            // 最後のブロックがあれば追加
            if (!currentBlock.empty())
            {
                std::string blockContent;
                for (size_t j = 0; j < currentBlock.size(); ++j)
                {
                    if (j > 0)
                        blockContent += "\n";
                    blockContent += currentBlock[j];
                }
                blocks.push_back(blockContent);
            }

            return blocks;
        }

        std::vector<std::string> processBlocks(const std::vector<std::string> &blocks, bool wrapWithBrackets)
        {
            std::vector<std::string> processedBlocks;

            for (const auto &block : blocks)
            {
                if (wrapWithBrackets)
                {
                    processedBlocks.push_back("[" + block + "]");
                }
                else
                {
                    processedBlocks.push_back(block);
                }
            }

            return processedBlocks;
        }

        std::vector<std::string> extractAndProcessBlocks(const std::string &sourceCode, bool wrapWithBrackets)
        {
            auto blocks = extractCodeBlocks(sourceCode);
            return processBlocks(blocks, wrapWithBrackets);
        }

    } // namespace common
} // namespace sign