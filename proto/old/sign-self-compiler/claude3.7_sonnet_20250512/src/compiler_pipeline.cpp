// src/compiler_pipeline.cpp の更新
#include "compiler_pipeline.h"
#include "preprocessor/preprocessor.h"
#include "lexer/lexer.h"  // 追加：レキサークラスのインクルード
#include "parser/parser.h"  // パーサーのインクルード追加
#include <sstream>  // 追加: ostringstream のために必要

namespace sign {

CompilerPipeline::CompilerPipeline(const std::string& source, const std::string& filename)
    : sourceCode(source), filename(filename) {
}

CompilerPipeline& CompilerPipeline::preprocess() {
    try {
        // 既存のプリプロセッサコードを使用
        preprocessedSource = normalizeSourceCode(sourceCode);
    } catch (const std::exception& e) {
        errorReporter.error("preprocess", std::string("前処理中にエラーが発生しました: ") + e.what());
    }
    return *this;
}

CompilerPipeline& CompilerPipeline::tokenize() {
    try {
        // 前処理が行われていない場合、先に実行
        if (preprocessedSource.empty() && !sourceCode.empty()) {
            preprocess();
        }
        
        // レキサーを使用してトークン化
        Lexer lexer(preprocessedSource, filename, &errorReporter);
        tokens = lexer.tokenize();
    } catch (const std::exception& e) {
        errorReporter.error("tokenize", std::string("トークン化中にエラーが発生しました: ") + e.what());
    }
    return *this;
}

std::string CompilerPipeline::getTokensAsString() const {
    if (tokens.empty()) {
        return "トークンがありません";
    }
    
    std::ostringstream ss;
    for (size_t i = 0; i < tokens.size(); ++i) {
        ss << "[" << i << "] " << tokens[i].toString();
        if (i < tokens.size() - 1) {
            ss << '\n';
        }
    }
    return ss.str();
}

std::string CompilerPipeline::getTokensAsJson() const {
    if (tokens.empty()) {
        return "{ \"tokens\": [] }";
    }
    
    std::ostringstream ss;
    ss << "{\n";
    ss << "  \"tokens\": [\n";
    
    for (size_t i = 0; i < tokens.size(); ++i) {
        const Token& token = tokens[i];
        
        ss << "    {\n";
        ss << "      \"type\": \"" << tokenTypeToString(token.getType()) << "\",\n";
        ss << "      \"lexeme\": \"" << token.getLexeme() << "\",\n";
        ss << "      \"line\": " << token.getLine() << ",\n";
        ss << "      \"column\": " << token.getColumn() << "\n";
        ss << "    }";
        
        if (i < tokens.size() - 1) {
            ss << ",";
        }
        ss << "\n";
    }
    
    ss << "  ]\n";
    ss << "}\n";
    
    return ss.str();
}

    // ----- 段階3追加ここから -----
CompilerPipeline& CompilerPipeline::parse() {
    try {
        // トークン化が行われていない場合、先に実行
        if (tokens.empty() && !sourceCode.empty()) {
            tokenize();
        }
        
        // パーサーを使用して構文解析
        Parser parser(tokens, &errorReporter);
        ast = parser.parse();
    } catch (const std::exception& e) {
        errorReporter.error("parse", std::string("構文解析中にエラーが発生しました: ") + e.what());
    }
    return *this;
}

std::string CompilerPipeline::getASTAsString() const {
    if (!ast) {
        return "AST: null";
    }
    
    return ast->toString();
}

std::string CompilerPipeline::getASTAsJson() const {
    if (!ast) {
        return "{ \"ast\": null }";
    }
    
    std::ostringstream ss;
    ss << "{\n";
    ss << "  \"ast\": {\n";
    ss << "    \"type\": \"" << typeid(*ast).name() << "\",\n";
    ss << "    \"representation\": \"" << ast->toString() << "\"\n";
    ss << "  }\n";
    ss << "}\n";
    
    return ss.str();
}
    // ----- 段階3追加ここまで -----

CompilerPipeline& CompilerPipeline::analyze() {
    // 段階5で実装予定
    errorReporter.warning("analyze", "この機能はまだ実装されていません");
    return *this;
}

CompilerPipeline& CompilerPipeline::generate() {
    // 段階6で実装予定
    errorReporter.warning("generate", "この機能はまだ実装されていません");
    return *this;
}

} // namespace sign