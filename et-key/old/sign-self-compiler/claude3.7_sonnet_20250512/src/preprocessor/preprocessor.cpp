// src/preprocessor/preprocessor.cpp
#include "preprocessor/preprocessor.h"
#include <sstream>
#include <vector>

namespace sign {

// メイン処理：全ての前処理を実行
std::string normalizeSourceCode(const std::string& sourceCode) {
    // 現在はコメント削除のみ実装
    std::string processed = removeComments(sourceCode);
    
    // TODO: 後で以下の処理を追加予定
    processed = unifyBrackets(processed);
    // processed = normalizeIndentation(processed);
    
    return processed;
}

// コメントと空行の削除
std::string removeComments(const std::string& sourceCode) {
    if (sourceCode.empty()) {
        return "";
    }
    
    // 行分割
    std::vector<std::string> lines;
    std::stringstream ss(sourceCode);
    std::string line;
    
    while (std::getline(ss, line)) {
        lines.push_back(line);
    }
    
    // 処理済み行を格納
    std::vector<std::string> processedLines;
    
    // 各行を処理
    for (const auto& line : lines) {
        // 空白を除いた行頭文字をチェック
        size_t firstNonSpace = line.find_first_not_of(" \t");
        
        // 行全体が空白の場合はスキップ
        if (firstNonSpace == std::string::npos) {
            continue;
        }
        
        // 行頭のバッククォートチェック
        if (line[firstNonSpace] == '`') {
            continue; // コメント行をスキップ
        }
        
        // 行末の空白を削除
        size_t lastNonSpace = line.find_last_not_of(" \t");
        std::string trimmedLine = line.substr(0, lastNonSpace + 1);
        
        // 空でない行のみ追加
        if (!trimmedLine.empty()) {
            processedLines.push_back(trimmedLine);
        }
    }
    
    // 結合して返す
    std::string result;
    for (size_t i = 0; i < processedLines.size(); ++i) {
        if (i > 0) result += "\n";
        result += processedLines[i];
    }
    
    return result;
}

// ブレースケット統一
std::string unifyBrackets(const std::string& sourceCode) {
    // 文字列リテラル内のカッコは変換しないよう注意する必要がある
    // バッククォートで囲まれた部分を一時的に置換して保護
    std::vector<std::string> stringLiterals;
    std::string protectedCode = sourceCode;
    
    // 文字列リテラルを保護
    size_t start = 0;
    while ((start = protectedCode.find('`', start)) != std::string::npos) {
        size_t end = protectedCode.find('`', start + 1);
        if (end == std::string::npos) {
            break; // 閉じていないバッククォートがある場合
        }
        
        // 文字列リテラルを抽出して保存
        std::string literal = protectedCode.substr(start, end - start + 1);
        stringLiterals.push_back(literal);
        
        // プレースホルダーに置換
        std::string placeholder = "STRING_LITERAL_" + std::to_string(stringLiterals.size() - 1) + "_";
        protectedCode.replace(start, end - start + 1, placeholder);
        
        // 次の検索位置を更新
        start += placeholder.length();
    }
    
    // すべての丸カッコと波カッコを角カッコに変換
    for (size_t i = 0; i < protectedCode.length(); ++i) {
        if (protectedCode[i] == '(') protectedCode[i] = '[';
        else if (protectedCode[i] == ')') protectedCode[i] = ']';
        else if (protectedCode[i] == '{') protectedCode[i] = '[';
        else if (protectedCode[i] == '}') protectedCode[i] = ']';
    }
    
    // 文字列リテラルを元に戻す
    for (size_t i = 0; i < stringLiterals.size(); ++i) {
        std::string placeholder = "STRING_LITERAL_" + std::to_string(i) + "_";
        size_t pos = 0;
        while ((pos = protectedCode.find(placeholder, pos)) != std::string::npos) {
            protectedCode.replace(pos, placeholder.length(), stringLiterals[i]);
            pos += stringLiterals[i].length();
        }
    }
    
    return protectedCode;
}

} // namespace sign