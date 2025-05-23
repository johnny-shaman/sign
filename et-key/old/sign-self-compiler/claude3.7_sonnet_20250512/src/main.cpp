// src/main.cpp
#include <iostream>
#include <fstream>
#include <string>
#include "compiler_pipeline.h"

// 使用可能なコマンドのリスト（実装段階に応じて拡張）
enum class Command
{
    UNKNOWN,
    HELP,
    PREPROCESS,
    TOKENIZE,
    PARSE,
    ANALYZE,
    GENERATE,
    COMPILE,
    RUN
};

Command parseCommand(const std::string &cmd)
{
    if (cmd == "help")
        return Command::HELP;
    if (cmd == "preprocess")
        return Command::PREPROCESS;
    if (cmd == "tokenize")
        return Command::TOKENIZE;
    if (cmd == "parse")
        return Command::PARSE;
    if (cmd == "analyze")
        return Command::ANALYZE;
    if (cmd == "generate")
        return Command::GENERATE;
    if (cmd == "compile")
        return Command::COMPILE;
    if (cmd == "run")
        return Command::RUN;
    return Command::UNKNOWN;
}

void printUsage()
{
    std::cout << "使用法: sign_compiler [コマンド] [オプション] 入力ファイル\n\n"
              << "コマンド:\n"
              << "  preprocess  - 前処理を実行\n"
              << "  tokenize    - トークン化を実行（未実装）\n"
              << "  parse       - 構文解析を実行（未実装）\n"
              << "  analyze     - 意味解析を実行（未実装）\n"
              << "  generate    - コード生成を実行（未実装）\n"
              << "  compile     - フルコンパイルを実行（未実装）\n"
              << "  run         - コンパイルして実行（未実装）\n"
              << "\nオプション:\n"
              << "  --output <ファイル> - 出力先ファイルを指定\n"
              << "  --dump             - 中間結果を表示\n";
}

int main(int argc, char *argv[])
{
    // 引数が不足している場合
    if (argc < 2)
    {
        printUsage();
        return 1;
    }

    // コマンドを取得
    Command command = parseCommand(argv[1]);

    // コマンドがヘルプまたは不明な場合は使用法を表示
    if (command == Command::HELP || command == Command::UNKNOWN)
    {
        printUsage();
        return (command == Command::HELP) ? 0 : 1;
    }

    // オプションの処理
    bool dump = false;
    std::string outputFile = "";
    std::string inputFile = "";

    // コマンド以降の引数を処理
    for (int i = 2; i < argc; ++i)
    {
        std::string arg = argv[i];

        if (arg == "--dump")
        {
            dump = true;
        }
        else if (arg == "--output" && i + 1 < argc)
        {
            outputFile = argv[++i];
        }
        // "--"で始まらない引数は入力ファイル名として扱う
        else if (arg.rfind("--", 0) != 0 && inputFile.empty())
        {
            inputFile = arg;
        }
    }

    // 入力ファイルが指定されていない場合
    if (inputFile.empty())
    {
        std::cerr << "エラー: 入力ファイルが指定されていません。\n";
        printUsage();
        return 1;
    }

    // ファイル読み込み
    std::ifstream file(inputFile);
    if (!file)
    {
        std::cerr << "エラー: ファイル '" << inputFile << "' を開けません。\n";
        return 1;
    }

    std::string sourceCode((std::istreambuf_iterator<char>(file)),
                           std::istreambuf_iterator<char>());
    file.close();

    try
    {
        // コンパイラパイプラインの作成
        sign::CompilerPipeline pipeline(sourceCode, inputFile);

        // コマンドに基づいて処理を実行
        switch (command)
        {
        // ----- 段階1追加 -----
        case Command::PREPROCESS:
        {
            pipeline.preprocess();
            if (dump)
            {
                std::cout << "=== 前処理結果 ===\n"
                          << pipeline.getPreprocessedSource() << "\n";
            }
            if (!outputFile.empty())
            {
                std::ofstream out(outputFile);
                if (!out)
                {
                    std::cerr << "エラー: 出力ファイル '" << outputFile << "' を開けません。\n";
                    return 1;
                }
                out << pipeline.getPreprocessedSource();
            }
            break;
        }

        // ----- 段階2追加 -----
        case Command::TOKENIZE:
        {
            pipeline.preprocess().tokenize();
            if (dump)
            {
                std::cout << "=== トークン化結果 ===\n";
                std::cout << pipeline.getTokensAsString() << "\n";
            }
            if (!outputFile.empty())
            {
                std::ofstream out(outputFile);
                if (!out)
                {
                    std::cerr << "エラー: 出力ファイル '" << outputFile << "' を開けません。\n";
                    return 1;
                }
                out << pipeline.getTokensAsJson();
            }
            break;
        }

        // ----- 段階3追加 -----
        case Command::PARSE:
        {
            pipeline.preprocess().tokenize().parse();
            if (dump)
            {
                std::cout << "=== 構文解析結果 ===\n";
                std::cout << pipeline.getASTAsString() << "\n";
            }
            if (!outputFile.empty())
            {
                std::ofstream out(outputFile);
                if (!out)
                {
                    std::cerr << "エラー: 出力ファイル '" << outputFile << "' を開けません。\n";
                    return 1;
                }
                out << pipeline.getASTAsJson();
            }
            break;
        }

        case Command::ANALYZE:
        case Command::GENERATE:
        case Command::COMPILE:
        case Command::RUN:
        {
            std::cout << "※ このコマンドはまだ実装されていません\n";
            break;
        }

        case Command::HELP:
        case Command::UNKNOWN:
        default:
            printUsage();
            break;
        }

        // エラーがあれば表示
        if (pipeline.hasErrors() || pipeline.hasWarnings())
        {
            pipeline.printErrors();
            if (pipeline.hasErrors())
            {
                return 1;
            }
        }
    }
    catch (const std::exception &e)
    {
        std::cerr << "エラー: " << e.what() << '\n';
        return 1;
    }

    return 0;
}