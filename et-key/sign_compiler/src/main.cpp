// src/main.cpp
/**
 * Sign言語プリプロセッサのメインエントリポイント
 *
 * 機能:
 * - コマンドライン引数の処理
 * - ファイル入出力
 * - 処理パイプラインの実行
 *
 * 使い方:
 * sign_compiler preprocess <入力ファイル> [--output <出力ファイル>]
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250427_0
 */

#include "preprocessor/sign_transformer.h"
#include <iostream>
#include <string>
#include <vector>
#include <cstring>
#include <fstream>
#include <sstream>

void printUsage()
{
    std::cout << "使い方: sign_compiler preprocess <入力ファイル> [--output <出力ファイル>]" << std::endl;
    std::cout << "オプション:" << std::endl;
    std::cout << "  --output <ファイル>  処理結果を指定ファイルに出力" << std::endl;
    std::cout << "  --dump               処理結果を標準出力に表示" << std::endl;
}

int main(int argc, char *argv[])
{
    // コマンドライン引数が不足している場合
    if (argc < 3)
    {
        printUsage();
        return 1;
    }

    // 最初の引数がpreprocessかどうか確認
    if (std::strcmp(argv[1], "preprocess") != 0)
    {
        std::cout << "サポートされていないコマンドです: " << argv[1] << std::endl;
        printUsage();
        return 1;
    }

    // 入力ファイル名の取得
    std::string inputFile = argv[2];

    // オプションの解析
    std::string outputFile = inputFile + ".processed.sn"; // デフォルトの出力ファイル名
    bool dumpToConsole = false;

    for (int i = 3; i < argc; i++)
    {
        if (std::strcmp(argv[i], "--output") == 0 && i + 1 < argc)
        {
            outputFile = argv[i + 1];
            i++; // 次の引数をスキップ
        }
        else if (std::strcmp(argv[i], "--dump") == 0)
        {
            dumpToConsole = true;
        }
        else
        {
            std::cout << "不明なオプション: " << argv[i] << std::endl;
            printUsage();
            return 1;
        }
    }

    try
    {
        // プリプロセッサの実行
        std::cout << "ファイル処理中: " << inputFile << std::endl;

        // ファイルを読み込んで処理
        std::ifstream inFile(inputFile);
        if (!inFile.is_open())
        {
            std::cerr << "入力ファイルを開けませんでした: " << inputFile << std::endl;
            return 1;
        }

        // ファイル内容を読み込む
        std::stringstream buffer;
        buffer << inFile.rdbuf();
        inFile.close();

        // ソースコードを処理
        std::string sourceCode = buffer.str();
        std::string processedCode = sign::preprocessSourceCode(sourceCode);

        // 結果をファイルに書き込む
        if (!sign::writeToFile(processedCode, outputFile))
        {
            std::cerr << "出力ファイルの書き込みに失敗しました: " << outputFile << std::endl;
            return 1;
        }

        std::cout << "処理完了: " << outputFile << std::endl;

        // 結果を標準出力に表示
        if (dumpToConsole)
        {
            std::cout << "\n===== 処理結果 =====\n"
                      << std::endl;
            std::cout << processedCode << std::endl;
            std::cout << "\n====================" << std::endl;
        }

        return 0;
    }
    catch (const std::exception &e)
    {
        std::cerr << "エラーが発生しました: " << e.what() << std::endl;
        return 1;
    }
}