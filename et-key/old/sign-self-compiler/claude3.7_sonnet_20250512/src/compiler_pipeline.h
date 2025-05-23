// src/compiler_pipeline.h の更新
#ifndef SIGN_COMPILER_PIPELINE_H
#define SIGN_COMPILER_PIPELINE_H

#include <string>
#include <vector>
#include <memory>
#include "common/error_reporter.h"
#include "preprocessor/preprocessor.h"
#include "lexer/token.h"  // 追加：トークン型のインクルード
#include "parser/ast/ast_node.h"  // ASTノードのインクルード追加

namespace sign {

// 前方宣言（今後実装）
class Lexer;
class Parser;

// コンパイラパイプラインクラス
class CompilerPipeline {
public:
    // ソースコードを入力としてパイプラインを開始
    CompilerPipeline(const std::string& source, const std::string& filename = "");
    
    // 前処理ステップ
    CompilerPipeline& preprocess();
    
    // トークン化ステップ（段階2で実装）
    CompilerPipeline& tokenize();
    
    // 構文解析ステップ（段階3-4で実装）
    CompilerPipeline& parse();
    
    // 意味解析ステップ（段階5で実装）
    CompilerPipeline& analyze();
    
    // コード生成ステップ（段階6で実装）
    CompilerPipeline& generate();
    
    // 前処理済みソースコードを取得
    std::string getPreprocessedSource() const { return preprocessedSource; }
    
    // トークン列を取得
    const std::vector<Token>& getTokens() const { return tokens; }
    
    // トークン列の文字列表現を取得
    std::string getTokensAsString() const;
    
    // トークン列のJSON表現を取得
    std::string getTokensAsJson() const;

    // ----- 段階3追加ここから -----
    // ASTを取得
    ASTNode* getAST() const { return ast.get(); }
    
    // ASTの文字列表現を取得
    std::string getASTAsString() const;
    
    // ASTのJSON表現を取得
    std::string getASTAsJson() const;
    // ----- 段階3追加ここまで -----


    // エラー関連のメソッド
    bool hasErrors() const { return errorReporter.hasErrors(); }
    bool hasWarnings() const { return errorReporter.hasWarnings(); }
    const std::vector<CompilerError>& getErrors() const { return errorReporter.getErrors(); }
    void printErrors(std::ostream& out = std::cerr) const { errorReporter.printErrors(out); }

private:
    // 入力と状態
    std::string sourceCode;       // 元のソースコード
    std::string filename;         // ソースファイル名
    std::string preprocessedSource; // 前処理済みソースコード
    
    // 処理結果
    std::vector<Token> tokens;    // トークン列
    std::unique_ptr<ASTNode> ast; // AST

    // 今後段階的に実装する処理結果
    // std::unique_ptr<ASTNode> ast; // 構文木
    // std::string generatedCode;    // 生成されたコード
    
    // 処理コンポーネント
    ErrorReporter errorReporter;  // エラー報告
};

} // namespace sign

#endif // SIGN_COMPILER_PIPELINE_H