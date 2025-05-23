// src/preprocessor/token_processor.cpp
/**
 * Sign言語のソースコードをトークン化する実装
 * シンプルな区切りルールに基づく設計
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250518_0
 */

#include "preprocessor/token_processor.h"
#include <cctype>
#include <sstream>

namespace sign {

// 演算子リストの定義
const std::unordered_set<std::string> INFIX_OPERATORS = {
    ":", "?", " ", ",", "~", ";", "|", "&", "<", "<=", "=", ">=", ">", "!=",
    "+", "-", "*", "/", "%", "^", "'", "@"
};

const std::unordered_set<std::string> PREFIX_OPERATORS = {
    "#", "~", "!", "$", "@", "[", "{", "("
};

const std::unordered_set<std::string> POSTFIX_OPERATORS = {
    "~", "!", "]", "}", ")"
};

// ブラケットとして扱う文字のリスト
const std::unordered_set<char> BRACKETS = {
    '[', ']', '(', ')', '{', '}'
};

bool isInfixOperator(const std::string& str) {
    return INFIX_OPERATORS.find(str) != INFIX_OPERATORS.end();
}

bool isPrefixOperator(const std::string& str) {
    return PREFIX_OPERATORS.find(str) != PREFIX_OPERATORS.end();
}

bool isPostfixOperator(const std::string& str) {
    return POSTFIX_OPERATORS.find(str) != POSTFIX_OPERATORS.end();
}

bool isDelimiter(char c) {
    return c == ':' || c == '?' || c == ',';
}

bool isBracket(char c) {
    return BRACKETS.find(c) != BRACKETS.end();
}

bool isWhitespace(char c) {
    return std::isspace(c);
}

// トークンタイプを判定する関数
TokenType determineTokenType(const std::string& token) {
    if (token.empty()) return TokenType::UNKNOWN;
    
    if (token == "?") {
        return TokenType::LAMBDA;
    } else if (token == ":") {
        return TokenType::DEFINE;
    } else if (token == ",") {
        return TokenType::COMMA;
    } else if (isBracket(token[0])) {
        return (token[0] == '[' || token[0] == '(' || token[0] == '{') 
              ? TokenType::BRACKET_OPEN : TokenType::BRACKET_CLOSE;
    } else if (isInfixOperator(token) || isPrefixOperator(token) || isPostfixOperator(token)) {
        return TokenType::OPERATOR;
    } else if (token[0] == '`') {
        return TokenType::STRING;
    } else if (token[0] == '\\') {
        return TokenType::CHAR;
    } else if (std::isdigit(token[0]) || 
              (token[0] == '-' && token.size() > 1 && std::isdigit(token[1]))) {
        return TokenType::NUMBER;
    } else if (token.find('\n') != std::string::npos) {
        return TokenType::NEWLINE;
    } else if (token.find('\t') != std::string::npos) {
        return TokenType::INDENTATION;
    } else if (std::isspace(token[0])) {
        return TokenType::WHITESPACE;
    }
    
    return TokenType::IDENTIFIER;
}

// トークン配列を文字列に変換
std::string tokensToString(const std::vector<Token>& tokens) {
    std::stringstream ss;
    for (const auto& token : tokens) {
        ss << token.value;
    }
    return ss.str();
}

std::vector<Token> tokenizeBlock(const std::string& block) {
    if (block.empty()) {
        return {};
    }

    std::vector<Token> tokens;
    std::string currentToken;
    bool inString = false;       // 文字列リテラル内かどうか
    bool inCharLiteral = false;  // 特殊文字リテラル内かどうか
    bool inIndent = false;       // インデントパターン内かどうか

    // 現在のトークンを追加してリセットする関数
    auto addCurrentToken = [&]() {
        if (!currentToken.empty()) {
            TokenType tokenType = determineTokenType(currentToken);
            tokens.push_back(Token(currentToken, tokenType));
            currentToken.clear();
        }
    };

    // 文字ごとに処理
    for (size_t i = 0; i < block.size(); ++i) {
        char c = block[i];

        // 文字列リテラル内の処理
        if (inString) {
            currentToken += c;
            if (c == '`') {
                addCurrentToken();
                inString = false;
            }
            continue;
        }

        // 特殊文字リテラル内の処理
        if (inCharLiteral) {
            currentToken += c;
            addCurrentToken();
            inCharLiteral = false;
            continue;
        }

        // インデントパターン内の処理
        if (inIndent) {
            if (c == '\t') {
                currentToken += c;
            } else {
                addCurrentToken();
                inIndent = false;
                --i; // 現在の文字を再処理
            }
            continue;
        }

        // 新しいトークンの開始
        if (c == '`') {
            // 文字列リテラル開始
            addCurrentToken();
            currentToken = c;
            inString = true;
        } else if (c == '\\') {
            // 特殊文字リテラル
            addCurrentToken();
            currentToken = c;
            inCharLiteral = true;
        } else if (c == '\n') {
            // 改行 - インデントパターン開始の可能性
            addCurrentToken();
            currentToken = c;
            inIndent = true; // 次のタブ文字があればインデント
        } else if (isWhitespace(c)) {
            // 空白はトークン区切り
            addCurrentToken();
        } else if (isBracket(c)) {
            // カッコは独立したトークン
            addCurrentToken();
            tokens.push_back(Token(std::string(1, c), determineTokenType(std::string(1, c))));
        } else if (isDelimiter(c)) {
            // 特定の区切り文字も独立したトークン
            addCurrentToken();
            tokens.push_back(Token(std::string(1, c), determineTokenType(std::string(1, c))));
        } else {
            // 通常の文字の場合
            currentToken += c;
        }
    }

    // 最後のトークンを追加
    addCurrentToken();

    return tokens;
}

std::string extractPrefixOperator(const std::string& token) {
    if (token.empty()) return "";
    
    // 最長の前置演算子を検索
    std::string prefix = "";
    for (size_t i = 1; i <= token.length(); ++i) {
        std::string candidate = token.substr(0, i);
        
        // 単一文字の演算子チェック
        if (i == 1 && PREFIX_OPERATORS.find(candidate) != PREFIX_OPERATORS.end()) {
            prefix = candidate;
        }
        // 複数文字の演算子（例：$@）のチェック
        else if (i > 1 && PREFIX_OPERATORS.find(token.substr(i-1, 1)) != PREFIX_OPERATORS.end()) {
            prefix = token.substr(0, i);
        }
        else {
            // 演算子でない文字が見つかったら終了
            break;
        }
    }
    
    return prefix;
}

std::string extractPostfixOperator(const std::string& token) {
    if (token.empty()) return "";
    
    // 後置演算子は通常単一文字なので、最後の文字をチェック
    if (POSTFIX_OPERATORS.find(token.substr(token.length() - 1)) != POSTFIX_OPERATORS.end()) {
        return token.substr(token.length() - 1);
    }
    
    return "";
}

std::string extractIdentifier(const std::string& token) {
    if (token.empty()) return "";
    
    std::string prefix = extractPrefixOperator(token);
    
    // 前置演算子を除いた残りの部分から識別子と後置演算子を分離
    std::string remainder = token.substr(prefix.length());
    std::string postfix = extractPostfixOperator(remainder);
    
    // 識別子部分を抽出
    return remainder.substr(0, remainder.length() - postfix.length());
}

} // namespace sign