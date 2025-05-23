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
 * ver_20250522_0
 */

#ifndef SIGN_LAMBDA_PROCESSOR_H
#define SIGN_LAMBDA_PROCESSOR_H

// 直接共通モジュールを参照するように変更
#include "common/lexer/token.h"
#include "common/lexer/tokenizer.h"
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace sign
{

    // スコープを表す構造体
    struct Scope
    {
        std::unordered_map<std::string, std::string> varMap; // 変数名と変換後の名前のマッピング
        std::shared_ptr<Scope> parent;                       // 親スコープ

        // コンストラクタ
        Scope(std::shared_ptr<Scope> p = nullptr) : parent(p) {}

        // 変数の追加
        void addVariable(const std::string &name, const std::string &replacement);

        // 変数の検索（現在のスコープと親スコープを探索）
        std::string findVariable(const std::string &name) const;

        // 変数が現在のスコープに存在するか
        bool hasVariable(const std::string &name) const;
    };

    /**
     * トークン列からラムダ式を検出して処理する
     *
     * @param tokens 処理対象のトークン列
     * @return 変数が位置ベースの識別子に置換されたトークン列
     */
    std::vector<common::Token> processLambdaExpressions(const std::vector<common::Token> &tokens);

    /**
     * トークン列から部分適用パターンを検出して処理する
     * 例: `f : g _ 2 _` → `f : _0 _1 ? g _0 2 _1`
     *
     * @param tokens 処理対象のトークン列
     * @return 部分適用がラムダ式に変換されたトークン列
     */
    std::vector<common::Token> processPartialApplications(const std::vector<common::Token> &tokens);

    /**
     * すべてのブロックから定義を抽出する
     *
     * @param blocks 処理対象のコードブロック配列
     * @return 定義テーブル (識別子 -> 定義トークン)
     */
    std::unordered_map<std::string, std::vector<common::Token>> extractDefinitions(const std::vector<std::string> &blocks);

    /**
     * 与えられた定義テーブルを使用してブロックを処理する
     *
     * @param block 処理対象のコードブロック
     * @param definitions 定義テーブル
     * @return 処理されたコードブロック
     */
    std::string applyDefinitions(const std::string &block,
                                 const std::unordered_map<std::string, std::vector<common::Token>> &definitions);

    /**
     * ネストされた定義を解決し、展開する
     *
     * @param definitions 元の定義テーブル
     * @return 依存関係を解決した定義テーブル
     */
    std::unordered_map<std::string, std::vector<common::Token>> resolveNestedDefinitions(
        const std::unordered_map<std::string, std::vector<common::Token>> &definitions);

    /**
     * 特殊識別子を適切に処理する
     *
     * @param tokens 処理対象のトークン列
     * @return 特殊処理されたトークン列
     */
    std::vector<common::Token> processSpecialIdentifiers(const std::vector<common::Token> &tokens);

} // namespace sign

#endif // SIGN_LAMBDA_PROCESSOR_H