// src/preprocessor/lambda_processor.cpp
/**
 * Sign言語のラムダ式を処理する実装
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_1
 */

#include "preprocessor/lambda_processor.h"
#include "common/lexer/tokenizer.h"
#include <algorithm>
#include <sstream>
#include <functional> 

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
    std::vector<common::Token> processLambdaExpressions(const std::vector<common::Token> &tokens)
    {
        using namespace common;

        if (tokens.empty())
        {
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
                    // 演算子を除いた識別子部分を抽出
                    std::string identifier = extractIdentifier(result[j].value);

                    // 識別子が空でなければ引数として追加
                    if (!identifier.empty())
                    {
                        args.push_back({j, identifier});
                    }

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
                    const auto &[idx, argName] = args[argIdx];
                    std::string replacement = "_" + std::to_string(argIdx);
                    argMap[argName] = replacement;

                    // 引数自体を置換 - 前置演算子と後置演算子を保持
                    std::string tokenValue = result[idx].value;
                    std::string prefixOp = extractPrefixOperator(tokenValue);
                    std::string postfixOp = extractPostfixOperator(tokenValue);

                    // 置換後の値を設定
                    result[idx].value = prefixOp + replacement + postfixOp;
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
                        std::string tokenValue = result[pos].value;
                        std::string prefixOp = extractPrefixOperator(tokenValue);
                        std::string identifier = extractIdentifier(tokenValue);
                        std::string postfixOp = extractPostfixOperator(tokenValue);

                        auto it = argMap.find(identifier);
                        if (it != argMap.end())
                        {
                            // 置換後の値を設定（前置演算子 + 置換後の識別子 + 後置演算子）
                            result[pos].value = prefixOp + it->second + postfixOp;
                        }
                    }

                    pos++; // 次のトークンへ
                }

                // posはラムダ本体終了後の位置にあるので、ループの増分で再度インクリメントしないよう継続
                continue;
            }

            pos++; // 次のトークンへ
        }

        return result;
    }

    // トークン列から部分適用パターンを検出して処理する
    std::vector<common::Token> processPartialApplications(const std::vector<common::Token> &tokens)
    {
        using namespace common;

        if (tokens.empty())
        {
            return tokens;
        }

        // 入力トークンのコピーを作成
        std::vector<Token> result = tokens;

        for (size_t i = 0; i < result.size(); ++i)
        {
            // 定義演算子 (:) を見つける
            if (result[i].type == TokenType::DEFINE)
            {
                // 左側が単一の識別子か確認
                if (i > 0 && result[i - 1].type == TokenType::IDENTIFIER)
                {
                    // 定義の右側を検索
                    bool hasLambdaOperator = false;
                    std::vector<size_t> unitPositions; // すべての単独 '_' 位置を記録

                    // 右側の範囲を特定
                    size_t defineStart = i + 1;
                    size_t defineEnd = result.size();

                    // 右側のスコープを特定
                    int nestedLevel = 0;

                    for (size_t j = defineStart; j < result.size(); ++j)
                    {
                        // ネストレベルの追跡
                        if (result[j].type == TokenType::BRACKET_OPEN)
                        {
                            nestedLevel++;
                        }
                        else if (result[j].type == TokenType::BRACKET_CLOSE)
                        {
                            nestedLevel--;
                            if (nestedLevel < 0 && defineEnd == result.size())
                            {
                                defineEnd = j; // 定義の終了位置を記録
                                break;
                            }
                        }

                        // 別の定義の開始を検出
                        if (result[j].type == TokenType::DEFINE && nestedLevel == 0)
                        {
                            defineEnd = j;
                            break;
                        }

                        // ラムダ演算子を検出
                        if (result[j].type == TokenType::LAMBDA)
                        {
                            hasLambdaOperator = true;
                        }

                        // 単独の '_' を検出
                        if (result[j].type == TokenType::IDENTIFIER &&
                            result[j].value == "_" &&
                            extractIdentifier(result[j].value) == "_")
                        {
                            unitPositions.push_back(j);
                        }
                    }

                    // 単独の '_' が1つ以上含まれ、ラムダ演算子を含まない場合に変換
                    if (!unitPositions.empty() && !hasLambdaOperator)
                    {
                        // 新しいトークン列を構築
                        std::vector<Token> newTokens;

                        // ラムダ引数部分を生成 (_0 _1 ... _n)
                        for (size_t k = 0; k < unitPositions.size(); ++k)
                        {
                            std::string argName = "_" + std::to_string(k);
                            newTokens.push_back(Token(argName, TokenType::IDENTIFIER));
                        }

                        // ラムダ演算子 "?" を追加
                        newTokens.push_back(Token("?", TokenType::LAMBDA));

                        // 右側の式をコピーし、各 '_' を対応する '_k' に置き換える
                        size_t unitIndex = 0; // 現在処理中のUnit位置インデックス

                        for (size_t j = defineStart; j < defineEnd; ++j)
                        {
                            if (unitIndex < unitPositions.size() && j == unitPositions[unitIndex])
                            {
                                // 対応する引数名に置き換え
                                std::string argName = "_" + std::to_string(unitIndex);
                                newTokens.push_back(Token(argName, TokenType::IDENTIFIER));
                                unitIndex++;
                            }
                            else
                            {
                                newTokens.push_back(result[j]);
                            }
                        }

                        // 定義の右側を新しいトークン列で置き換え
                        result.erase(result.begin() + defineStart, result.begin() + defineEnd);
                        result.insert(result.begin() + defineStart, newTokens.begin(), newTokens.end());

                        // 位置インデックスを調整
                        i = defineStart + newTokens.size() - 1;
                    }
                }
            }
        }

        return result;
    }

    // すべてのブロックから定義を抽出する
    std::unordered_map<std::string, std::vector<common::Token>> extractDefinitions(const std::vector<std::string> &blocks)
    {
        using namespace common;

        std::unordered_map<std::string, std::vector<Token>> definitions;
        std::unordered_set<std::string> recursiveDefinitions; // 再帰的定義の検出用

        // 各ブロックから定義を抽出
        for (const auto &block : blocks)
        {
            std::vector<Token> tokens = tokenizeBlock(block);

            // 定義検出
            for (size_t i = 0; i < tokens.size(); ++i)
            {
                // 定義演算子 (:) を検出
                if (tokens[i].type == TokenType::DEFINE)
                {
                    // 左側が単一の識別子か確認
                    if (i > 0 && tokens[i - 1].type == TokenType::IDENTIFIER)
                    {
                        std::string definitionName = extractIdentifier(tokens[i - 1].value);

                        // 右側の範囲を特定
                        size_t defineStart = i + 1;
                        size_t defineEnd = tokens.size();
                        int nestedLevel = 0;

                        for (size_t j = defineStart; j < tokens.size(); ++j)
                        {
                            // ネストレベルの追跡
                            if (tokens[j].type == TokenType::BRACKET_OPEN)
                            {
                                nestedLevel++;
                            }
                            else if (tokens[j].type == TokenType::BRACKET_CLOSE)
                            {
                                nestedLevel--;
                                if (nestedLevel < 0 && defineEnd == tokens.size())
                                {
                                    defineEnd = j + 1; // 定義の終了位置を記録
                                    break;
                                }
                            }

                            // 別の定義の開始を検出
                            if (tokens[j].type == TokenType::DEFINE && nestedLevel == 0)
                            {
                                defineEnd = j;
                                break;
                            }
                        }

                        // 右側の式を抽出
                        if (defineEnd > defineStart)
                        {
                            std::vector<Token> definitionTokens(tokens.begin() + defineStart, tokens.begin() + defineEnd);

                            // 自己参照のチェックと処理（既存コードと同様）
                            bool isSelfReferential = false;
                            for (const auto &token : definitionTokens)
                            {
                                if (token.type == TokenType::IDENTIFIER &&
                                    extractIdentifier(token.value) == definitionName)
                                {
                                    isSelfReferential = true;
                                    recursiveDefinitions.insert(definitionName);
                                    break;
                                }
                            }

                            // 自己参照でない定義のみ保存
                            if (!isSelfReferential)
                            {
                                definitions[definitionName] = definitionTokens;
                            }
                        }
                    }
                }
            }
        }

        return definitions;
    }

    // 与えられた定義テーブルを使用してブロックを処理する
    std::string applyDefinitions(const std::string &block,
                                 const std::unordered_map<std::string, std::vector<common::Token>> &definitions)
    {
        using namespace common;

        // ブロックをトークン化
        std::vector<Token> tokens = tokenizeBlock(block);

        // ネストされた定義を解決
        auto resolvedDefinitions = resolveNestedDefinitions(definitions);

        // 識別子置換を実行
        std::vector<Token> result = tokens;
        bool modified = true;
        int iterationLimit = 10; // 無限ループ防止

        // ネストされた定義を処理するための複数パス
        while (modified && iterationLimit > 0)
        {
            modified = false;
            iterationLimit--;

            for (size_t i = 0; i < result.size(); ++i)
            {
                if (result[i].type == TokenType::IDENTIFIER)
                {
                    std::string identifierName = extractIdentifier(result[i].value);

                    // 定義テーブルに存在するか確認
                    auto it = resolvedDefinitions.find(identifierName);
                    if (it != resolvedDefinitions.end())
                    {
                        // この識別子がラムダ引数でないことを確認
                        bool isLambdaArg = false;
                        // 後方を検索してラムダ演算子を見つける
                        for (int j = static_cast<int>(i) - 1; j >= 0; --j)
                        {
                            if (result[j].type == TokenType::LAMBDA)
                            {
                                isLambdaArg = true;
                                break;
                            }
                            // 別の定義や文の区切りを見つけた場合は検索終了
                            if (result[j].type == TokenType::DEFINE)
                            {
                                break;
                            }
                        }

                        // ラムダ引数でない場合のみ置換
                        if (!isLambdaArg)
                        {
                            // 定義された識別子の後に引数がある場合（関数呼び出し）
                            size_t nextPos = i + 1;

                            // 前置/後置演算子を除いた純粋な識別子部分
                            std::string prefix = extractPrefixOperator(result[i].value);
                            std::string postfix = extractPostfixOperator(result[i].value);

                            // 演算子部分は保持
                            if (!prefix.empty() || !postfix.empty())
                            {
                                continue; // 演算子付きは現時点ではスキップ
                            }

                            // 関数呼び出しとして使われているか確認
                            if (nextPos < result.size() &&
                                (result[nextPos].type == TokenType::IDENTIFIER ||
                                 result[nextPos].type == TokenType::NUMBER ||
                                 result[nextPos].type == TokenType::BRACKET_OPEN))
                            {

                                // 定義を複製して置換
                                std::vector<Token> replacementTokens = it->second;

                                // 元の識別子を削除し、定義トークンを挿入
                                result.erase(result.begin() + i);
                                result.insert(result.begin() + i, replacementTokens.begin(), replacementTokens.end());

                                // 位置インデックスを調整
                                i += replacementTokens.size() - 1;
                                modified = true;
                            }
                        }
                    }
                }
            }
        }

        // 特殊識別子の処理
        result = processSpecialIdentifiers(result);

        // ラムダ式を括弧で囲む処理
        result = wrapFunctionApplications(result);

        // トークンを文字列に再構築
        std::stringstream output;
        for (size_t i = 0; i < result.size(); ++i)
        {
            output << result[i].value;
            if (i < result.size() - 1)
            {
                output << " ";
            }
        }

        return output.str();
    }

    // ネストされた定義を解決し、展開する関数
    std::unordered_map<std::string, std::vector<common::Token>> resolveNestedDefinitions(
        const std::unordered_map<std::string, std::vector<common::Token>> &definitions)
    {

        using namespace common;

        // 結果となる定義テーブル
        std::unordered_map<std::string, std::vector<Token>> resolvedDefs = definitions;

        // 定義の依存関係を記録
        std::unordered_map<std::string, std::unordered_set<std::string>> dependencies;

        // 定義内で使用されている他の定義を検出
        for (const auto &[name, tokens] : definitions)
        {
            for (const auto &token : tokens)
            {
                if (token.type == TokenType::IDENTIFIER)
                {
                    std::string idName = extractIdentifier(token.value);
                    // 定義テーブルに存在する識別子の場合、依存関係に追加
                    if (definitions.find(idName) != definitions.end() && idName != name)
                    {
                        dependencies[name].insert(idName);
                    }
                }
            }
        }

        // 循環参照チェック（循環が見つかった定義は処理しない）
        std::unordered_set<std::string> circularRefs;
        std::function<bool(const std::string &, std::unordered_set<std::string> &)> detectCycle;

        detectCycle = [&](const std::string &defName, std::unordered_set<std::string> &visited) -> bool
        {
            if (visited.find(defName) != visited.end())
            {
                return true; // 循環を検出
            }

            if (dependencies.find(defName) == dependencies.end())
            {
                return false; // 依存関係なし
            }

            visited.insert(defName);
            for (const auto &dep : dependencies[defName])
            {
                if (detectCycle(dep, visited))
                {
                    circularRefs.insert(defName);
                    return true;
                }
            }
            visited.erase(defName);
            return false;
        };

        // すべての定義の循環参照をチェック
        for (const auto &[name, _] : definitions)
        {
            std::unordered_set<std::string> visited;
            detectCycle(name, visited);
        }

        // 定義を解決するためのヘルパー関数
        std::function<std::vector<Token>(const std::string &, std::unordered_set<std::string> &)> resolveDefinition;

        resolveDefinition = [&](const std::string &defName, std::unordered_set<std::string> &processed) -> std::vector<Token>
        {
            // 循環参照を持つ定義は解決せずにそのまま返す
            if (circularRefs.find(defName) != circularRefs.end())
            {
                return resolvedDefs[defName];
            }

            // 既に処理済みの定義はキャッシュから返す
            if (processed.find(defName) != processed.end())
            {
                return resolvedDefs[defName];
            }

            processed.insert(defName);

            // 依存関係がない場合はそのまま返す
            if (dependencies.find(defName) == dependencies.end() || dependencies[defName].empty())
            {
                return resolvedDefs[defName];
            }

            // 現在の定義トークンをコピー
            std::vector<Token> currentDef = resolvedDefs[defName];
            std::vector<Token> newDef;

            // 定義内の識別子を展開
            for (const auto &token : currentDef)
            {
                if (token.type == TokenType::IDENTIFIER)
                {
                    std::string idName = extractIdentifier(token.value);

                    // 依存する定義があり、自己参照でない場合
                    if (definitions.find(idName) != definitions.end() &&
                        idName != defName &&
                        circularRefs.find(idName) == circularRefs.end())
                    {

                        // 依存する定義を先に解決
                        std::vector<Token> resolvedDep = resolveDefinition(idName, processed);

                        // 前置・後置演算子を保持
                        std::string prefix = extractPrefixOperator(token.value);
                        std::string postfix = extractPostfixOperator(token.value);

                        // 展開した定義を囲む括弧が必要か判断
                        bool needsBrackets = resolvedDep.size() > 1;

                        if (needsBrackets)
                        {
                            // 括弧で囲む
                            newDef.push_back(Token("[", TokenType::BRACKET_OPEN));
                        }

                        if (!prefix.empty())
                        {
                            newDef.push_back(Token(prefix, TokenType::OPERATOR));
                        }

                        // 展開した定義を追加
                        newDef.insert(newDef.end(), resolvedDep.begin(), resolvedDep.end());

                        if (!postfix.empty())
                        {
                            newDef.push_back(Token(postfix, TokenType::OPERATOR));
                        }

                        if (needsBrackets)
                        {
                            newDef.push_back(Token("]", TokenType::BRACKET_CLOSE));
                        }
                    }
                    else
                    {
                        // 通常の識別子はそのまま追加
                        newDef.push_back(token);
                    }
                }
                else
                {
                    // 識別子以外のトークンはそのまま追加
                    newDef.push_back(token);
                }
            }

            // 更新された定義を保存
            resolvedDefs[defName] = newDef;
            return newDef;
        };

        // すべての定義を解決
        std::unordered_set<std::string> processed;
        for (const auto &[name, _] : resolvedDefs)
        {
            if (processed.find(name) == processed.end() &&
                circularRefs.find(name) == circularRefs.end())
            {
                resolveDefinition(name, processed);
            }
        }

        return resolvedDefs;
    }

    // 関数適用パターンを検出し、必要に応じて括弧で囲む
    std::vector<common::Token> wrapFunctionApplications(const std::vector<common::Token> &tokens)
    {
        using namespace common;

        if (tokens.empty())
        {
            return tokens;
        }

        std::vector<Token> result = tokens;
        std::vector<std::pair<size_t, size_t>> lambdaBlocks; // ラムダ式のブロック位置を記録

        // ラムダ式ブロックを特定
        for (size_t i = 0; i < result.size(); i++)
        {
            if (result[i].type == TokenType::LAMBDA)
            {
                size_t blockStart = i - 1; // ラムダの前にある引数位置
                // ラムダの開始位置を特定（引数部分）
                while (blockStart > 0 && result[blockStart].type == TokenType::IDENTIFIER)
                {
                    blockStart--;
                }
                blockStart++; // 補正

                // ラムダ本体の終端を探す
                size_t blockEnd = i + 1;
                int nestedLevel = 0;
                bool foundEnd = false;

                while (blockEnd < result.size() && !foundEnd)
                {
                    if (result[blockEnd].type == TokenType::BRACKET_OPEN)
                    {
                        nestedLevel++;
                    }
                    else if (result[blockEnd].type == TokenType::BRACKET_CLOSE)
                    {
                        nestedLevel--;
                        if (nestedLevel < 0)
                        {
                            foundEnd = true;
                            break;
                        }
                    }
                    else if (result[blockEnd].type == TokenType::DEFINE && nestedLevel == 0)
                    {
                        foundEnd = true;
                        break;
                    }
                    blockEnd++;
                }

                lambdaBlocks.push_back({blockStart, blockEnd});
                i = blockEnd - 1; // 処理位置を更新
            }
        }

        // 関数適用コンテキストを特定して括弧で囲む
        for (size_t i = 0; i < result.size(); i++)
        {
            // 識別子の直後に別の識別子/数値/括弧がある場合（関数適用パターン）
            if (i > 0 && i + 1 < result.size() &&
                result[i].type == TokenType::IDENTIFIER &&
                (result[i + 1].type == TokenType::IDENTIFIER ||
                 result[i + 1].type == TokenType::NUMBER ||
                 result[i + 1].type == TokenType::BRACKET_OPEN))
            {

                // この識別子がラムダ式で生成された関数かチェック
                for (const auto &[start, end] : lambdaBlocks)
                {
                    if (i == start && end + 1 < result.size() &&
                        (result[end + 1].type == TokenType::IDENTIFIER ||
                         result[end + 1].type == TokenType::NUMBER ||
                         result[end + 1].type == TokenType::BRACKET_OPEN))
                    {
                        // 括弧で囲む
                        std::vector<Token> bracketedFunc;
                        bracketedFunc.push_back(Token("[", TokenType::BRACKET_OPEN));
                        bracketedFunc.insert(bracketedFunc.end(), result.begin() + start, result.begin() + end);
                        bracketedFunc.push_back(Token("]", TokenType::BRACKET_CLOSE));

                        // 元のラムダ式を括弧付きに置換
                        result.erase(result.begin() + start, result.begin() + end);
                        result.insert(result.begin() + start, bracketedFunc.begin(), bracketedFunc.end());

                        // インデックスとブロック位置を調整
                        size_t adjustment = bracketedFunc.size() - (end - start);
                        i += adjustment;

                        // 他のブロック位置も調整
                        for (auto &[bStart, bEnd] : lambdaBlocks)
                        {
                            if (bStart > end)
                            {
                                bStart += adjustment;
                                bEnd += adjustment;
                            }
                            else if (bEnd > end)
                            {
                                bEnd += adjustment;
                            }
                        }

                        break;
                    }
                }
            }
        }

        return result;
    }

    // 特殊識別子を適切に処理する
    std::vector<common::Token> processSpecialIdentifiers(const std::vector<common::Token> &tokens)
    {
        using namespace common;

        std::vector<Token> result = tokens;

        for (size_t i = 0; i < result.size(); i++)
        {
            // 特殊識別子の処理
            if (result[i].type == TokenType::IDENTIFIER)
            {
                std::string idName = extractIdentifier(result[i].value);

                // nop の特殊処理: nop → _
                if (idName == "nop")
                {
                    // 定義コンテキストでnopが使われている場合
                    if (i > 0 && i + 1 < result.size() &&
                        result[i - 1].type == TokenType::DEFINE)
                    {
                        result[i] = Token("_", TokenType::IDENTIFIER);
                    }
                    // 関数呼び出しコンテキストでnopが使われている場合は置換しない
                }

                // 他の特殊識別子も必要に応じて処理
            }
        }

        return result;
    }

} // namespace sign