// src/common/lexer/tokenizer.cpp
/**
 * Sign言語のソースコードをトークン化する実装
 * シンプルな区切りルールに基づく設計
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */

#include "common/lexer/tokenizer.h"
#include <sstream>

namespace sign
{
    namespace common
    {

        // トークン配列を文字列に変換
        std::string tokensToString(const std::vector<Token> &tokens)
        {
            std::stringstream ss;
            for (const auto &token : tokens)
            {
                ss << token.value;
            }
            return ss.str();
        }

        std::vector<Token> tokenizeBlock(const std::string &block)
        {
            if (block.empty())
            {
                return {};
            }

            std::vector<Token> tokens;
            std::string currentToken;
            bool inString = false;      // 文字列リテラル内かどうか
            bool inCharLiteral = false; // 特殊文字リテラル内かどうか
            bool inIndent = false;      // インデントパターン内かどうか

            // 現在のトークンを追加してリセットする関数
            auto addCurrentToken = [&]()
            {
                if (!currentToken.empty())
                {
                    TokenType tokenType = determineTokenType(currentToken);
                    tokens.push_back(Token(currentToken, tokenType));
                    currentToken.clear();
                }
            };

            // 文字ごとに処理
            for (size_t i = 0; i < block.size(); ++i)
            {
                char c = block[i];

                // 文字列リテラル内の処理
                if (inString)
                {
                    currentToken += c;
                    if (c == '`')
                    {
                        addCurrentToken();
                        inString = false;
                    }
                    continue;
                }

                // 特殊文字リテラル内の処理
                if (inCharLiteral)
                {
                    currentToken += c;
                    addCurrentToken();
                    inCharLiteral = false;
                    continue;
                }

                // インデントパターン内の処理
                if (inIndent)
                {
                    if (c == '\t')
                    {
                        currentToken += c;
                    }
                    else
                    {
                        addCurrentToken();
                        inIndent = false;
                        --i; // 現在の文字を再処理
                    }
                    continue;
                }

                // 新しいトークンの開始
                if (c == '`')
                {
                    // 文字列リテラル開始
                    addCurrentToken();
                    currentToken = c;
                    inString = true;
                }
                else if (c == '\\')
                {
                    // 特殊文字リテラル
                    addCurrentToken();
                    currentToken = c;
                    inCharLiteral = true;
                }
                else if (c == '\n')
                {
                    // 改行 - インデントパターン開始の可能性
                    addCurrentToken();
                    currentToken = c;
                    inIndent = true; // 次のタブ文字があればインデント
                }
                else if (isWhitespace(c))
                {
                    // 空白はトークン区切り
                    addCurrentToken();
                }
                else if (isBracket(c))
                {
                    // カッコは独立したトークン
                    addCurrentToken();
                    tokens.push_back(Token(std::string(1, c), determineTokenType(std::string(1, c))));
                }
                else if (isDelimiter(c))
                {
                    // 特定の区切り文字も独立したトークン
                    addCurrentToken();
                    tokens.push_back(Token(std::string(1, c), determineTokenType(std::string(1, c))));
                }
                else
                {
                    // 通常の文字の場合
                    currentToken += c;
                }
            }

            // 最後のトークンを追加
            addCurrentToken();

            return tokens;
        }

        std::string extractPrefixOperator(const std::string &token)
        {
            if (token.empty())
                return "";

            // 最長の前置演算子を検索
            std::string prefix = "";
            for (size_t i = 1; i <= token.length(); ++i)
            {
                std::string candidate = token.substr(0, i);

                // 単一文字の演算子チェック
                if (i == 1 && isPrefixOperator(candidate))
                {
                    prefix = candidate;
                }
                // 複数文字の演算子（例：$@）のチェック
                else if (i > 1 && isPrefixOperator(token.substr(i - 1, 1)))
                {
                    prefix = token.substr(0, i);
                }
                else
                {
                    // 演算子でない文字が見つかったら終了
                    break;
                }
            }

            return prefix;
        }

        std::string extractPostfixOperator(const std::string &token)
        {
            if (token.empty())
                return "";

            // 後置演算子は通常単一文字なので、最後の文字をチェック
            if (isPostfixOperator(token.substr(token.length() - 1)))
            {
                return token.substr(token.length() - 1);
            }

            return "";
        }

        std::string extractIdentifier(const std::string &token)
        {
            if (token.empty())
                return "";

            std::string prefix = extractPrefixOperator(token);

            // 前置演算子を除いた残りの部分から識別子と後置演算子を分離
            std::string remainder = token.substr(prefix.length());
            std::string postfix = extractPostfixOperator(remainder);

            // 識別子部分を抽出
            return remainder.substr(0, remainder.length() - postfix.length());
        }

    } // namespace common
} // namespace sign