// src/preprocessor/sign_transformer.cpp
/**
 * Sign言語の処理済みコードを最終形式に変換する実装
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250516_1
 */

#include "preprocessor/sign_transformer.h"
#include "preprocessor/preprocessor.h"
#include "preprocessor/block_extractor.h"
#include "preprocessor/lambda_processor.h"
#include <fstream>
#include <iostream>
#include <sstream>

namespace sign {

// 処理されたブロックを結合して最終的なSignコードを生成する
std::string generateFinalCode(const std::vector<std::string>& processedBlocks) {
    std::stringstream result;
    
    for (size_t i = 0; i < processedBlocks.size(); ++i) {
        if (i > 0) {
            result << "\n"; // ブロック間に空行を挿入
        }
        result << processedBlocks[i];
    }
    
    return result.str();
}

// Sign言語コードをファイルに出力する
bool writeToFile(const std::string& code, const std::string& filename) {
    std::ofstream outFile(filename);
    if (!outFile.is_open()) {
        std::cerr << "ファイルを開けませんでした: " << filename << std::endl;
        return false;
    }
    
    outFile << code;
    outFile.close();
    
    return true;
}

// ソースコードを処理してプリプロセス済みのコードを生成する
std::string preprocessSourceCode(const std::string& sourceCode) {
    // ステップ1: コメント削除と空白の正規化
    std::string normalizedCode = normalizeSourceCode(sourceCode);
    
    // ステップ2: ブロック抽出
    std::vector<std::string> blocks = extractCodeBlocks(normalizedCode);
    
    // ステップ3: 各ブロックの処理
    std::vector<std::string> processedBlocks;
    for (const auto& block : blocks) {
        // ラムダ式の処理
        std::string processedBlock = processBlock(block);
        processedBlocks.push_back(processedBlock);
    }
    
    // ステップ4: 最終コード生成
    return generateFinalCode(processedBlocks);
}

// ファイルからソースコードを読み込み、処理して出力する
bool processFile(const std::string& inputFilename, const std::string& outputFilename) {
    // ファイルを開く
    std::ifstream inFile(inputFilename);
    if (!inFile.is_open()) {
        std::cerr << "入力ファイルを開けませんでした: " << inputFilename << std::endl;
        return false;
    }
    
    // ファイル内容を読み込む
    std::stringstream buffer;
    buffer << inFile.rdbuf();
    inFile.close();
    
    // ソースコードを処理
    std::string sourceCode = buffer.str();
    std::string processedCode = preprocessSourceCode(sourceCode);
    
    // 結果をファイルに書き込む
    return writeToFile(processedCode, outputFilename);
}

} // namespace sign