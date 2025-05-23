// src/common/lexer/token.cpp
/**
 * Sign言語のトークン定義と基本操作を実装
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */

#include "common/lexer/token.h"
#include <cctype>

namespace sign
{
    namespace common
    {

        // 演算子リストの定義
        const std::unordered_set<std::string> INFIX_OPERATORS = {
            ":", "?", " ", ",", "~", ";", "|", "&", "<", "<=", "=", ">=", ">", "!=",
            "+", "-", "*", "/", "%", "^", "'", "@"};

        const std::unordered_set<std::string> PREFIX_OPERATORS = {
            "#", "~", "!", "$", "@", "[", "{", "("};

        const std::unordered_set<std::string> POSTFIX_OPERATORS = {
            "~", "!", "]", "}", ")"};

        // ブラケットとして扱う文字のリスト
        const std::unordered_set<char> BRACKETS = {
            '[', ']', '(', ')', '{', '}'};

        bool isInfixOperator(const std::string &str)
        {
            return INFIX_OPERATORS.find(str) != INFIX_OPERATORS.end();
        }

        bool isPrefixOperator(const std::string &str)
        {
            return PREFIX_OPERATORS.find(str) != PREFIX_OPERATORS.end();
        }

        bool isPostfixOperator(const std::string &str)
        {
            return POSTFIX_OPERATORS.find(str) != POSTFIX_OPERATORS.end();
        }

        bool isDelimiter(char c)
        {
            return c == ':' || c == '?' || c == ',';
        }

        bool isBracket(char c)
        {
            return BRACKETS.find(c) != BRACKETS.end();
        }

        bool isWhitespace(char c)
        {
            return std::isspace(c);
        }

        // トークンタイプを判定する関数
        TokenType determineTokenType(const std::string &token)
        {
            if (token.empty())
                return TokenType::UNKNOWN;

            if (token == "?")
            {
                return TokenType::LAMBDA;
            }
            else if (token == ":")
            {
                return TokenType::DEFINE;
            }
            else if (token == ",")
            {
                return TokenType::COMMA;
            }
            else if (isBracket(token[0]))
            {
                return (token[0] == '[' || token[0] == '(' || token[0] == '{')
                           ? TokenType::BRACKET_OPEN
                           : TokenType::BRACKET_CLOSE;
            }
            else if (isInfixOperator(token) || isPrefixOperator(token) || isPostfixOperator(token))
            {
                return TokenType::OPERATOR;
            }
            else if (token[0] == '`')
            {
                return TokenType::STRING;
            }
            else if (token[0] == '\\')
            {
                return TokenType::CHAR;
            }
            else if (std::isdigit(token[0]) ||
                     (token[0] == '-' && token.size() > 1 && std::isdigit(token[1])))
            {
                return TokenType::NUMBER;
            }
            else if (token.find('\n') != std::string::npos)
            {
                return TokenType::NEWLINE;
            }
            else if (token.find('\t') != std::string::npos)
            {
                return TokenType::INDENTATION;
            }
            else if (std::isspace(token[0]))
            {
                return TokenType::WHITESPACE;
            }

            return TokenType::IDENTIFIER;
        }

    } // namespace common
} // namespace sign