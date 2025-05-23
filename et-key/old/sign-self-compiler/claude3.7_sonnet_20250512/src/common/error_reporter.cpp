// src/common/error_reporter.cpp
#include "common/error_reporter.h"

namespace sign {

std::string SourceLocation::toString() const {
    if (filename.empty()) {
        if (line == 0 && column == 0) {
            return "";
        }
        return "行 " + std::to_string(line) + "、列 " + std::to_string(column);
    }
    
    std::string result = filename;
    if (line > 0) {
        result += ":" + std::to_string(line);
        if (column > 0) {
            result += ":" + std::to_string(column);
        }
    }
    return result;
}

std::string CompilerError::toString() const {
    std::string levelStr;
    switch (level) {
        case ErrorLevel::INFO:
            levelStr = "情報";
            break;
        case ErrorLevel::WARNING:
            levelStr = "警告";
            break;
        case ErrorLevel::ERROR:
            levelStr = "エラー";
            break;
    }
    
    std::string result = levelStr + " [" + phase + "] ";
    
    if (location && !location->toString().empty()) {
        result += location->toString() + ": ";
    }
    
    result += message;
    return result;
}

void ErrorReporter::report(const std::string& phase, const std::string& message,
                          ErrorLevel level,
                          const std::optional<SourceLocation>& location) {
    errors.emplace_back(phase, message, level, location);
    
    if (level == ErrorLevel::ERROR) {
        errorCount++;
    } else if (level == ErrorLevel::WARNING) {
        warningCount++;
    }
}

void ErrorReporter::info(const std::string& phase, const std::string& message,
                        const std::optional<SourceLocation>& location) {
    report(phase, message, ErrorLevel::INFO, location);
}

void ErrorReporter::warning(const std::string& phase, const std::string& message,
                           const std::optional<SourceLocation>& location) {
    report(phase, message, ErrorLevel::WARNING, location);
}

void ErrorReporter::error(const std::string& phase, const std::string& message,
                         const std::optional<SourceLocation>& location) {
    report(phase, message, ErrorLevel::ERROR, location);
}

void ErrorReporter::clear() {
    errors.clear();
    errorCount = 0;
    warningCount = 0;
    canContinueProcessing = false;
}

void ErrorReporter::printErrors(std::ostream& out) const {
    for (const auto& error : errors) {
        out << error.toString() << '\n';
    }
}

} // namespace sign