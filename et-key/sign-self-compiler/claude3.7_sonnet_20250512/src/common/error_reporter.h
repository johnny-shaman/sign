// src/common/error_reporter.h
#ifndef SIGN_ERROR_REPORTER_H
#define SIGN_ERROR_REPORTER_H

#include <string>
#include <vector>
#include <iostream>
#include <optional>

namespace sign {

// ソースコード内の位置情報
struct SourceLocation {
    std::string filename;
    int line = 0;
    int column = 0;
    
    SourceLocation() = default;
    SourceLocation(std::string filename, int line, int column)
        : filename(std::move(filename)), line(line), column(column) {}
    
    std::string toString() const;
};

// エラーレベル
enum class ErrorLevel {
    INFO,    // 情報
    WARNING, // 警告
    ERROR    // エラー
};

// エラー情報
struct CompilerError {
    std::string phase;           // エラーが検出された処理段階
    std::string message;         // エラーメッセージ
    ErrorLevel level;            // エラーレベル
    std::optional<SourceLocation> location; // ソース位置（ない場合もある）
    
    CompilerError(std::string phase, std::string message, 
                 ErrorLevel level, 
                 std::optional<SourceLocation> location = std::nullopt)
        : phase(std::move(phase)), message(std::move(message)),
          level(level), location(std::move(location)) {}
    
    // エラー情報の文字列表現
    std::string toString() const;
};

// エラー報告クラス
class ErrorReporter {
public:
    // エラーの報告
    void report(const std::string& phase, const std::string& message,
               ErrorLevel level = ErrorLevel::ERROR,
               const std::optional<SourceLocation>& location = std::nullopt);
    
    // 情報レベルのメッセージを報告
    void info(const std::string& phase, const std::string& message,
              const std::optional<SourceLocation>& location = std::nullopt);
    
    // 警告レベルのメッセージを報告
    void warning(const std::string& phase, const std::string& message,
                const std::optional<SourceLocation>& location = std::nullopt);
    
    // エラーレベルのメッセージを報告
    void error(const std::string& phase, const std::string& message,
              const std::optional<SourceLocation>& location = std::nullopt);
    
    // エラーの有無を確認
    bool hasErrors() const { return errorCount > 0; }
    
    // 警告の有無を確認
    bool hasWarnings() const { return warningCount > 0; }
    
    // エラー数を取得
    int getErrorCount() const { return errorCount; }
    
    // 警告数を取得
    int getWarningCount() const { return warningCount; }
    
    // すべてのエラー/警告情報を取得
    const std::vector<CompilerError>& getErrors() const { return errors; }
    
    // エラー回復のためのマーク
    void markRecovered() { canContinueProcessing = true; }
    
    // 処理を続行できるかを確認
    bool canContinue() const { return !hasErrors() || canContinueProcessing; }
    
    // エラー情報のクリア
    void clear();
    
    // 標準エラー出力にすべてのエラーを出力
    void printErrors(std::ostream& out = std::cerr) const;

private:
    std::vector<CompilerError> errors;  // すべてのエラー情報
    int errorCount = 0;                 // エラー数
    int warningCount = 0;               // 警告数
    bool canContinueProcessing = false; // エラー後も処理を続行できるか
};

} // namespace sign

#endif // SIGN_ERROR_REPORTER_H