// src/lexer/token.js

// トークンの種類を定義
const TokenType = {
    // リテラル
    IDENTIFIER: 'IDENTIFIER',
    STRING_CHARS: 'STRING_CHARS',
    NUMBER: 'NUMBER',
    CHAR: 'CHAR',

    // 括弧類
    LEFT_BRACKET: 'LEFT_BRACKET',   // [
    RIGHT_BRACKET: 'RIGHT_BRACKET', // ]
    LEFT_BRACE: 'LEFT_BRACE',      // {
    RIGHT_BRACE: 'RIGHT_BRACE',    // }
    LEFT_PAREN: 'LEFT_PAREN',      // (
    RIGHT_PAREN: 'RIGHT_PAREN',    // )

    // 演算子
    DEFINE: 'DEFINE',         // :
    LAMBDA: 'LAMBDA',         // ?
    PRODUCT: 'PRODUCT',       // ,
    OR: 'OR',                // |
    XOR: 'XOR',              // ;
    AND: 'AND',              // &
    SPREAD: 'SPREAD',        // ~
    EXPORT: 'EXPORT',        // #
    IMPORT: 'IMPORT',        // @
    NOT: 'NOT',              // !
    GET: 'GET',              // '

    // 比較演算子
    LESS_THAN: 'LESS_THAN',         // 
    LESS_EQUAL: 'LESS_EQUAL',       // <=
    EQUAL: 'EQUAL',                 // = or ==
    NOT_EQUAL: 'NOT_EQUAL',         // != or >< or <>
    GREATER_EQUAL: 'GREATER_EQUAL', // >=
    GREATER_THAN: 'GREATER_THAN',   // >

    // 算術演算子
    PLUS: 'PLUS',         // +
    MINUS: 'MINUS',       // -
    MULTIPLY: 'MULTIPLY', // *
    DIVIDE: 'DIVIDE',     // /
    MODULO: 'MODULO',     // %
    POWER: 'POWER',       // ^

    // その他
    NEWLINE: 'NEWLINE',
    EOF: 'EOF'
};

// トークンクラス
class Token {
    constructor(type, value = null) {
        this.type = type;
        this.value = value;
    }

    isOperator() {
        return [
            TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY,
            TokenType.DIVIDE, TokenType.MODULO, TokenType.POWER,
            TokenType.AND, TokenType.OR, TokenType.XOR,
            TokenType.LESS_THAN, TokenType.LESS_EQUAL,
            TokenType.EQUAL, TokenType.NOT_EQUAL,
            TokenType.GREATER_EQUAL, TokenType.GREATER_THAN,
            TokenType.GET, TokenType.SPREAD,
            TokenType.EXPORT, TokenType.IMPORT, TokenType.NOT
        ].includes(this.type);
    }

    isPrefixOperator() {
        return [
            TokenType.EXPORT,
            TokenType.IMPORT,
            TokenType.NOT,
            TokenType.MINUS
        ].includes(this.type);
    }

    isPostfixOperator() {
        return [
            TokenType.SPREAD,
            TokenType.NOT  // 後置の!（階乗）
        ].includes(this.type);
    }

    toString() {
        if (this.value !== null) {
            return `${this.type}(${this.value})`;
        }
        return this.type;
    }
}

module.exports = {
    TokenType,
    Token
};
