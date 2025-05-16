// src/preprocessor/lambda_processor.h
/**
 * Sign言語のラムダ式を処理するモジュール
 * 
 * 機能:
 * - ラムダ式の検出と変数置換
 * - 引数名を位置ベースの識別子に変換
 * - スコープ管理と変換済みラムダ式の再構築
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250516_0
 */

#ifndef SIGN_LAMBDA_PROCESSOR_H
#define SIGN_LAMBDA_PROCESSOR_H

#include "preprocessor/token_processor.h"
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace sign {

// スコープを表す構造体
struct Scope {
    std::unordered_map<std::string, std::string> varMap; // 変数名と変換後の名前のマッピング
    std::shared_ptr<Scope> parent; // 親スコープ
    
    // コンストラクタ
    Scope(std::shared_ptr<Scope> p = nullptr) : parent(p) {}
    
    // 変数の追加
    void addVariable(const std::string& name, const std::string& replacement);
    
    // 変数の検索（現在のスコープと親スコープを探索）
    std::string findVariable(const std::string& name) const;
    
    // 変数が現在のスコープに存在するか
    bool hasVariable(const std::string& name) const;
};

/**
 * トークン列からラムダ式を検出して処理する
 * 
 * @param tokens 処理対象のトークン列
 * @return 変数が位置ベースの識別子に置換されたトークン列
 */
std::vector<Token> processLambdaExpressions(const std::vector<Token>& tokens);

/**
 * ラムダ式の引数部分を処理する
 * 
 * @param tokens トークン列
 * @param startIndex 開始インデックス
 * @param scope 現在のスコープ
 * @param processedTokens 処理結果を格納するトークン列
 * @return ラムダ式の?の位置のインデックス
 */
size_t processLambdaArguments(const std::vector<Token>& tokens, size_t startIndex, 
                              std::shared_ptr<Scope>& scope, std::vector<Token>& processedTokens);

/**
 * ラムダ式の本体部分を処理する
 * 
 * @param tokens トークン列
 * @param startIndex 開始インデックス
 * @param scope 現在のスコープ
 * @param processedTokens 処理結果を格納するトークン列
 * @return 処理後の位置のインデックス
 */
size_t processLambdaBody(const std::vector<Token>& tokens, size_t startIndex, 
                         const std::shared_ptr<Scope>& scope, std::vector<Token>& processedTokens);

/**
 * ラムダ式をカリー化形式に変換する
 * 
 * @param tokens 処理対象のトークン列
 * @return カリー化されたトークン列
 */
std::vector<Token> convertToCurried(const std::vector<Token>& tokens);

/**
 * ブロックをトークン化、処理して再構築する
 * 
 * @param block 処理対象のコードブロック
 * @return 変数が位置ベースの識別子に置換されたコードブロック
 */
std::string processBlock(const std::string& block);

} // namespace sign

#endif // SIGN_LAMBDA_PROCESSOR_H