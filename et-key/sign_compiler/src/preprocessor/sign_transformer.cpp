// src/preprocessor/sign_transformer.cpp
/**
 * Sign言語の処理済みコードを最終形式に変換する実装
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */

#include "preprocessor/sign_transformer.h"
#include "preprocessor/preprocessor.h"
#include "common/parser/block_extractor.h"
#include "preprocessor/lambda_processor.h"
#include "common/utils/file_utils.h"
#include <iostream>
#include <sstream>

namespace sign
{

    // 処理されたブロックを結合して最終的なSignコードを生成する
    std::string generateFinalCode(const std::vector<std::string> &processedBlocks)
    {
        std::stringstream result;

        for (size_t i = 0; i < processedBlocks.size(); ++i)
        {
            if (i > 0)
            {
                result << "\n"; // ブロック間に空行を挿入
            }
            result << processedBlocks[i];
        }

        return result.str();
    }

    // ソースコードを処理してプリプロセス済みのコードを生成する
    std::string preprocessSourceCode(const std::string &sourceCode)
    {
        // ステップ1: コメント削除と空白の正規化
        std::string normalizedCode = normalizeSourceCode(sourceCode);

        // ステップ2: ブロック抽出
        std::vector<std::string> blocks = common::extractCodeBlocks(normalizedCode);

        // ステップ3: ラムダ式と部分適用の処理
        std::vector<std::string> processedBlocks;
        for (const auto &block : blocks)
        {
            // ラムダ式と部分適用の処理のみを行う
            std::vector<common::Token> tokens = common::tokenizeBlock(block);
            std::vector<common::Token> afterLambda = processLambdaExpressions(tokens);
            std::vector<common::Token> afterPartial = processPartialApplications(afterLambda);

            // 処理済みブロックに追加
            std::stringstream result;
            for (size_t i = 0; i < afterPartial.size(); ++i)
            {
                result << afterPartial[i].value;
                if (i < afterPartial.size() - 1)
                {
                    result << " ";
                }
            }
            processedBlocks.push_back(result.str());
        }

        // ステップ4: すべてのブロックから定義を抽出
        auto definitions = extractDefinitions(processedBlocks);

        // ステップ5: 抽出した定義でブロックを処理
        std::vector<std::string> finalBlocks;
        for (const auto &block : processedBlocks)
        {
            finalBlocks.push_back(applyDefinitions(block, definitions));
        }

        // ステップ6: 最終コード生成
        return generateFinalCode(finalBlocks);
    }

    // ファイルからソースコードを読み込み、処理して出力する
    bool processFile(const std::string &inputFilename, const std::string &outputFilename)
    {
        try
        {
            // ファイル内容を読み込む
            std::string sourceCode = common::readFromFile(inputFilename);

            // ソースコードを処理
            std::string processedCode = preprocessSourceCode(sourceCode);

            // 結果をファイルに書き込む
            return common::writeToFile(processedCode, outputFilename);
        }
        catch (const std::exception &e)
        {
            std::cerr << "Error processing file: " << e.what() << std::endl;
            return false;
        }
    }

} // namespace sign