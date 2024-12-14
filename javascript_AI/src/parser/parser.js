// src/parser/parser.js
const { Transform } = require('stream');
const { TokenType } = require('../lexer/token');

class Parser extends Transform {
    constructor(options = {}) {
        super({ ...options, objectMode: true });
        this.tokens = [];
        this.currentIndent = 0;
    }

    peek() {
        return this.tokens[0] || null;
    }

    consume() {
        return this.tokens.shift();
    }

    isAtEnd() {
        return this.peek()?.type === TokenType.EOF;
    }

    // 優先順位テーブル
    getOperatorPrecedence(tokenType) {
        const precedence = {
            [TokenType.DEFINE]: 1,        // :
            [TokenType.LAMBDA]: 2,        // ?
            [TokenType.PRODUCT]: 3,       // ,
            [TokenType.OR]: 4,           // |
            [TokenType.XOR]: 5,          // ;
            [TokenType.AND]: 6,          // &
            // 比較演算子
            [TokenType.LESS_THAN]: 7,
            [TokenType.LESS_EQUAL]: 7,
            [TokenType.EQUAL]: 7,
            [TokenType.NOT_EQUAL]: 7,
            [TokenType.GREATER_EQUAL]: 7,
            [TokenType.GREATER_THAN]: 7,
            // 算術演算子
            [TokenType.PLUS]: 8,
            [TokenType.MINUS]: 8,
            [TokenType.MULTIPLY]: 9,
            [TokenType.DIVIDE]: 9,
            [TokenType.MODULO]: 9,
            [TokenType.POWER]: 10,
            // 特殊演算子
            [TokenType.GET]: 11,
            [TokenType.SPREAD]: 11,
        };
        return precedence[tokenType] || 0;
    }

    isRightAssociative(tokenType) {
        return [
            TokenType.DEFINE,  // :
            TokenType.LAMBDA,  // ?
            TokenType.POWER,   // ^
        ].includes(tokenType);
    }

    parseExpression(precedence = 0) {
        let left = this.parsePrefixExpression();

        while (!this.isAtEnd()) {
            const token = this.peek();
            const nextPrecedence = this.getOperatorPrecedence(token.type);

            if (nextPrecedence < precedence) break;

            if (token.type === TokenType.EOF) break;

            this.consume(); // 演算子を消費

            // 右結合性の考慮
            const rightPrecedence = this.isRightAssociative(token.type) 
                ? nextPrecedence
                : nextPrecedence + 1;

            const right = this.parseExpression(rightPrecedence);
            
            left = {
                type: 'BinaryExpression',
                operator: token.type,
                left,
                right
            };
        }

        return left;
    }

    parsePrefixExpression() {
        const token = this.peek();

        if (token.isPrefixOperator()) {
            this.consume();
            const operand = this.parsePrefixExpression();
            return {
                type: 'UnaryExpression',
                operator: token.type,
                prefix: true,
                operand
            };
        }

        return this.parsePostfixExpression();
    }

    parsePostfixExpression() {
        let expr = this.parsePrimary();

        while (!this.isAtEnd()) {
            const token = this.peek();
            if (!token.isPostfixOperator()) break;

            this.consume();
            expr = {
                type: 'UnaryExpression',
                operator: token.type,
                prefix: false,
                operand: expr
            };
        }

        return expr;
    }

    parsePrimary() {
        const token = this.consume();

        switch (token.type) {
            case TokenType.NUMBER:
                return {
                    type: 'NumberLiteral',
                    value: token.value
                };

            case TokenType.STRING_CHARS:
                return {
                    type: 'StringLiteral',
                    value: token.value
                };

            case TokenType.CHAR:
                return {
                    type: 'CharLiteral',
                    value: token.value
                };

            case TokenType.IDENTIFIER:
                return {
                    type: 'Identifier',
                    name: token.value
                };

            case TokenType.LEFT_BRACKET:
            case TokenType.LEFT_BRACE:
            case TokenType.LEFT_PAREN:
                return this.parseBlock();

            default:
                throw new Error(`Unexpected token: ${token.type}`);
        }
    }

    parseBlock() {
        const expressions = [];

        while (!this.isAtEnd()) {
            const token = this.peek();
            if (token.type === TokenType.RIGHT_BRACKET ||
                token.type === TokenType.RIGHT_BRACE ||
                token.type === TokenType.RIGHT_PAREN) {
                this.consume();
                break;
            }

            expressions.push(this.parseExpression());
        }

        return {
            type: 'Block',
            expressions
        };
    }

    _transform(token, encoding, callback) {
        try {
            this.tokens.push(token);
            
            // トークンがある程度たまったら処理を開始
            if (this.tokens.length > 2) {
                const ast = this.parseExpression();
                this.push(ast);
                // 使用済みトークンのクリア
                this.tokens = this.tokens.slice(-2);
            }
            
            callback();
        } catch (err) {
            callback(err);
        }
    }

    _flush(callback) {
        try {
            if (this.tokens.length > 0) {
                const ast = this.parseExpression();
                this.push(ast);
            }
            callback();
        } catch (err) {
            callback(err);
        }
    }
}

module.exports = Parser;
