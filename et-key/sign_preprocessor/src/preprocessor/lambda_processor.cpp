// src/preprocessor/lambda_processor.cpp
/**
 * Sign言語のラムダ式を処理する実装
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250517_0
 */

#include "preprocessor/lambda_processor.h"
#include <algorithm>
#include <sstream>

namespace sign
{

    // 変数の追加
    void Scope::addVariable(const std::string &name, const std::string &replacement)
    {
        varMap[name] = replacement;
    }

    // 変数の検索（現在のスコープと親スコープを探索）
    std::string Scope::findVariable(const std::string &name) const
    {
        auto it = varMap.find(name);
        if (it != varMap.end())
        {
            return it->second;
        }

        if (parent)
        {
            return parent->findVariable(name);
        }

        return ""; // 変数が見つからない場合は空文字列を返す
    }

    // 変数が現在のスコープに存在するか
    bool Scope::hasVariable(const std::string &name) const
    {
        return varMap.find(name) != varMap.end();
    }

// トークン列からラムダ式を検出して処理する
std::vector<Token> processLambdaExpressions(const std::vector<Token> &tokens)
{
    if (tokens.empty()) {
        return tokens;
    }
    
    // 入力トークンのコピーを作成
    std::vector<Token> result = tokens;
    
    // 処理位置を管理するインデックス
    size_t pos = 0;
    
    while (pos < result.size())
    {
        // ラムダ式を探す
        if (result[pos].type == TokenType::LAMBDA)
        {
            // ラムダ式を見つけた - 引数の位置と値を同時に保存
            std::vector<std::pair<size_t, std::string>> args;
            
            // ラムダの前にある引数を特定
            int j = static_cast<int>(pos) - 1;
            while (j >= 0 && result[j].type == TokenType::IDENTIFIER)
            {
                args.push_back({j, result[j].value});
                if (j == 0)
                    break;
                j--;
            }
            
            // 引数を逆順に（右から左に）処理
            std::reverse(args.begin(), args.end());
            
            // 引数がない場合は次のトークンへ
            if (args.empty())
            {
                pos++;
                continue;
            }
            
            // 引数名と置換後の値のマッピングを作成
            std::unordered_map<std::string, std::string> argMap;
            for (size_t argIdx = 0; argIdx < args.size(); ++argIdx)
            {
                const auto& [idx, argName] = args[argIdx];
                std::string replacement = "_" + std::to_string(argIdx);
                argMap[argName] = replacement;
                
                // 引数自体を置換
                result[idx].value = replacement;
            }
            
            // ラムダ本体の開始位置
            size_t bodyStart = pos + 1;
            int nestedCount = 0;
            
            // ラムダ本体内の変数参照を置換
            pos = bodyStart; // 処理位置をラムダ本体の開始位置に移動
            
            while (pos < result.size())
            {
                // ネストレベルの追跡
                if (result[pos].type == TokenType::BRACKET_OPEN)
                {
                    nestedCount++;
                }
                else if (result[pos].type == TokenType::BRACKET_CLOSE)
                {
                    nestedCount--;
                    if (nestedCount < 0)
                        break; // ラムダ本体の終了
                }
                
                // 識別子を置換
                if (result[pos].type == TokenType::IDENTIFIER)
                {
                    auto it = argMap.find(result[pos].value);
                    if (it != argMap.end())
                    {
                        result[pos].value = it->second;
                    }
                }
                
                pos++; // 次のトークンへ
            }
            
            // posはラムダ本体終了後の位置にあるので、ループの増分で再度インクリメントしないよう注意
            continue;
        }
        
        pos++; // 次のトークンへ
    }
    
    return result;
}

    // ラムダ式をカリー化形式に変換する（将来的な実装）
    std::vector<Token> convertToCurried(const std::vector<Token> &tokens)
    {
        // TODO: 複数引数を持つラムダ式をカリー化する高度な変換を実装
        // 例: f : x y ? x + y を f : _0 ? _1 ? _0 + _1 に変換

        // 現時点では単純に引数置換のみ
        return tokens;
    }

    // ブロックをトークン化、処理して再構築する
    std::string processBlock(const std::string &block)
    {
        // ブロックをトークン化
        std::vector<Token> tokens = tokenizeBlock(block);

        // ラムダ式を処理
        std::vector<Token> processedTokens = processLambdaExpressions(tokens);

        // トークンを文字列に再構築（シンプルなスペース挿入）
        std::stringstream result;
        for (size_t i = 0; i < processedTokens.size(); ++i)
        {
            // 現在のトークンを追加
            result << processedTokens[i].value;

            // 最後のトークンでなければスペースを追加
            if (i < processedTokens.size() - 1)
            {
                result << " ";
            }
        }

        return result.str();
    }

} // namespace sign