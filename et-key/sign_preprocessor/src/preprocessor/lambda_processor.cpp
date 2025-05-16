// src/preprocessor/lambda_processor.cpp
/**
 * Sign言語のラムダ式を処理する実装
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250516_0
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
        // 入力トークンのコピーを作成
        std::vector<Token> result = tokens;
        std::shared_ptr<Scope> rootScope = std::make_shared<Scope>();

        // すべてのラムダ式を探して処理
        for (size_t i = 0; i < result.size(); ++i)
        {
            if (result[i].type == TokenType::LAMBDA)
            {
                // ラムダ式を見つけた - 引数を探す
                std::vector<size_t> argIndices; // 引数のインデックスを保存

                // ラムダの前にある引数を特定
                // size_tは符号なし整数なので、intでループを回す
                int j = static_cast<int>(i) - 1;
                while (j >= 0 && result[j].type == TokenType::IDENTIFIER)
                {
                    argIndices.push_back(j);
                    if (j == 0)
                        break;
                    j--;
                }

                // 引数を逆順に（右から左に）処理
                std::reverse(argIndices.begin(), argIndices.end());

                // 新しいスコープを作成
                auto lambdaScope = std::make_shared<Scope>(rootScope);

                // 引数を置換 (_0, _1, ... に変換)
                for (size_t argIdx = 0; argIdx < argIndices.size(); ++argIdx)
                {
                    size_t idx = argIndices[argIdx];
                    std::string origName = result[idx].value;
                    std::string replacement = "_" + std::to_string(argIdx);

                    // スコープにマッピングを追加
                    lambdaScope->addVariable(origName, replacement);

                    // トークンを直接置換
                    result[idx].value = replacement;
                }

                // ラムダ本体内の変数参照を置換
                size_t bodyStart = i + 1;
                int nestedCount = 0;

                for (size_t k = bodyStart; k < result.size(); ++k)
                {
                    // ネストレベルの追跡
                    if (result[k].type == TokenType::BRACKET_OPEN)
                    {
                        nestedCount++;
                    }
                    else if (result[k].type == TokenType::BRACKET_CLOSE)
                    {
                        nestedCount--;
                        if (nestedCount < 0)
                            break;
                    }
                    else if (result[k].type == TokenType::DEFINE && nestedCount == 0)
                    {
                        break;
                    }

                    // 識別子を置換
                    if (result[k].type == TokenType::IDENTIFIER)
                    {
                        std::string replacement = lambdaScope->findVariable(result[k].value);
                        if (!replacement.empty())
                        {
                            result[k].value = replacement;
                        }
                    }

                    // ネストしたラムダ式は別途処理が必要（簡略化のためここでは省略）
                }
            }
        }

        return result;
    }

    // ラムダ式の引数部分を処理する
    size_t processLambdaArguments(const std::vector<Token> &tokens, size_t startIndex,
                                  std::shared_ptr<Scope> &scope, std::vector<Token> &processedTokens)
    {
        // 引数変数を抽出して置換
        std::vector<std::string> argNames;

        // ラムダ演算子の位置を探す
        size_t lambdaIndex = startIndex;
        while (lambdaIndex < tokens.size() && tokens[lambdaIndex].type != TokenType::LAMBDA)
        {
            lambdaIndex++;
        }

        // 引数の抽出
        for (size_t i = startIndex; i < lambdaIndex; ++i)
        {
            const Token &token = tokens[i];
            if (token.type == TokenType::IDENTIFIER)
            {
                argNames.push_back(token.value);
            }
        }

        // 引数を_0, _1, ...に置換
        for (size_t i = 0; i < argNames.size(); ++i)
        {
            std::string replacement = "_" + std::to_string(i);
            scope->addVariable(argNames[i], replacement);
        }

        // 置換後の引数トークンだけを追加
        for (size_t i = 0; i < argNames.size(); ++i)
        {
            std::string replacement = "_" + std::to_string(i);
            processedTokens.push_back(Token(replacement, TokenType::IDENTIFIER));
        }

        return lambdaIndex;
    }

    // ラムダ式の本体部分を処理する
    size_t processLambdaBody(const std::vector<Token> &tokens, size_t startIndex,
                             const std::shared_ptr<Scope> &scope, std::vector<Token> &processedTokens)
    {
        // 本体の終了位置を特定
        int nestedCount = 0;
        size_t endIndex = startIndex;

        while (endIndex < tokens.size())
        {
            const Token &token = tokens[endIndex];

            // ネストレベルの追跡
            if (token.type == TokenType::BRACKET_OPEN)
            {
                nestedCount++;
            }
            else if (token.type == TokenType::BRACKET_CLOSE)
            {
                nestedCount--;
                if (nestedCount < 0)
                {
                    break; // 対応する閉じカッコに到達
                }
            }
            else if (token.type == TokenType::DEFINE && nestedCount == 0)
            {
                // 同じレベルの定義演算子
                break;
            }

            endIndex++;
        }

        // 本体の処理
        for (size_t i = startIndex; i < endIndex; ++i)
        {
            const Token &token = tokens[i];

            // ネストしたラムダ式の処理
            if (token.type == TokenType::LAMBDA)
            {
                size_t lambdaIndex = i;
                size_t argStart = 0;

                // ラムダの前にある引数を探す
                for (int j = static_cast<int>(i) - 1; j >= static_cast<int>(startIndex); --j)
                {
                    if (tokens[j].type != TokenType::IDENTIFIER &&
                        tokens[j].type != TokenType::WHITESPACE)
                    {
                        argStart = j + 1;
                        break;
                    }

                    // 開始位置まで来た場合
                    if (j == static_cast<int>(startIndex))
                    {
                        argStart = startIndex;
                        break;
                    }
                }

                // 引数がない場合はスキップ
                if (argStart >= lambdaIndex)
                {
                    processedTokens.push_back(token);
                    continue;
                }

                // 子スコープを作成
                auto childScope = std::make_shared<Scope>(scope);

                // ネストしたラムダの引数を処理
                size_t bodyStart = processLambdaArguments(tokens, argStart, childScope, processedTokens);

                // ラムダ演算子を追加
                processedTokens.push_back(tokens[lambdaIndex]);

                // ネストしたラムダの本体を処理
                i = processLambdaBody(tokens, bodyStart + 1, childScope, processedTokens);

                // indexは次の処理位置になるよう調整
                i = i - 1;
            }
            else if (token.type == TokenType::IDENTIFIER)
            {
                // 変数の置換
                std::string replacement = scope->findVariable(token.value);
                if (!replacement.empty())
                {
                    processedTokens.push_back(Token(replacement, TokenType::IDENTIFIER));
                }
                else
                {
                    processedTokens.push_back(token);
                }
            }
            else
            {
                // その他のトークンはそのまま
                processedTokens.push_back(token);
            }
        }

        return endIndex;
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

    // ラムダ式をカリー化形式に変換する（将来的な実装）
    std::vector<Token> convertToCurried(const std::vector<Token> &tokens)
    {
        // TODO: 複数引数を持つラムダ式をカリー化する高度な変換を実装
        // 例: f : x y ? x + y を f : _0 ? _1 ? _0 + _1 に変換

        // 現時点では単純に引数置換のみ
        return tokens;
    }

} // namespace sign