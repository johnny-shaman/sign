// src/parser/expression.js

const { TokenType } = require('../lexer/token');

class ExpressionParser {
    constructor(tokens = []) {
        this.tokens = tokens;
        this.current = 0;
    }

    parseExpression() {
        return this.parseDefine();
    }

    parseDefine() {
        let expr = this.parseLambda();

        while (this.match(TokenType.DEFINE)) {
            expr = {
                type: 'Definition',
                name: expr,
                value: this.parseLambda()
            };
        }

        return expr;
    }

    parseLambda() {
        let params = [];
        
        while (this.peek() && !this.check(TokenType.LAMBDA)) {
            if (this.match(TokenType.SPREAD)) {
                if (this.check(TokenType.IDENTIFIER)) {
                    params.push({
                        type: 'RestParameter',
                        name: this.advance().value
                    });
                    break;
                }
            } else if (this.check(TokenType.IDENTIFIER)) {
                params.push({
                    type: 'Parameter',
                    name: this.advance().value
                });
            } else {
                break;
            }
        }

        if (this.match(TokenType.LAMBDA)) {
            return {
                type: 'Lambda',
                params,
                body: this.parseExpression()
            };
        }

        return this.parseProduct();
    }

    parseProduct() {
        let expr = this.parseLogicalOr();

        while (this.match(TokenType.PRODUCT)) {
            expr = {
                type: 'Product',
                left: expr,
                right: this.parseLogicalOr()
            };
        }

        return expr;
    }

    parseLogicalOr() {
        let expr = this.parseLogicalXor();

        while (this.match(TokenType.OR)) {
            expr = {
                type: 'BinaryOperation',
                operator: 'or',
                left: expr,
                right: this.parseLogicalXor()
            };
        }

        return expr;
    }

    parseLogicalXor() {
        let expr = this.parseLogicalAnd();

        while (this.match(TokenType.XOR)) {
            expr = {
                type: 'BinaryOperation',
                operator: 'xor',
                left: expr,
                right: this.parseLogicalAnd()
            };
        }

        return expr;
    }

    parseLogicalAnd() {
        let expr = this.parseComparison();

        while (this.match(TokenType.AND)) {
            expr = {
                type: 'BinaryOperation',
                operator: 'and',
                left: expr,
                right: this.parseComparison()
            };
        }

        return expr;
    }

    parseComparison() {
        let expr = this.parseAdditive();

        while (this.check(TokenType.LESS_THAN) || 
               this.check(TokenType.LESS_EQUAL) ||
               this.check(TokenType.EQUAL) ||
               this.check(TokenType.NOT_EQUAL) ||
               this.check(TokenType.GREATER_EQUAL) ||
               this.check(TokenType.GREATER_THAN)) {
            
            const operator = this.advance().type;
            const right = this.parseAdditive();
            const comparison = {
                type: 'Comparison',
                operator,
                left: expr,
                right
            };

            // 比較演算子の連鎖を処理
            expr = {
                type: 'BinaryOperation',
                operator: 'and',
                left: expr,
                right: comparison
            };
        }

        return expr;
    }

    parseAdditive() {
        let expr = this.parseMultiplicative();

        while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
            const operator = this.advance().type;
            expr = {
                type: 'BinaryOperation',
                operator: operator === TokenType.PLUS ? 'add' : 'sub',
                left: expr,
                right: this.parseMultiplicative()
            };
        }

        return expr;
    }

    parseMultiplicative() {
        let expr = this.parsePower();

        while (this.check(TokenType.MULTIPLY) || 
               this.check(TokenType.DIVIDE) || 
               this.check(TokenType.MODULO)) {
            const operator = this.advance().type;
            expr = {
                type: 'BinaryOperation',
                operator: operator === TokenType.MULTIPLY ? 'mul' :
                         operator === TokenType.DIVIDE ? 'div' : 'mod',
                left: expr,
                right: this.parsePower()
            };
        }

        return expr;
    }

    parsePower() {
        let expr = this.parseRange();

        while (this.match(TokenType.POWER)) {
            expr = {
                type: 'BinaryOperation',
                operator: 'power',
                left: expr,
                right: this.parseRange()
            };
        }

        return expr;
    }

    parseRange() {
        let expr = this.parseGet();

        if (this.match(TokenType.SPREAD)) {
            // 中置の ~ は範囲生成
            if (this.peek()) {
                return {
                    type: 'Range',
                    start: expr,
                    end: this.parseGet()
                };
            }
            // 後置の ~ はスプレッド
            return {
                type: 'UnaryOperation',
                operator: 'spread',
                expr,
                prefix: false
            };
        }

        return expr;
    }

    parseGet() {
        let expr = this.parseUnary();

        while (this.match(TokenType.GET)) {
            expr = {
                type: 'Get',
                object: expr,
                property: this.parseUnary()
            };
        }

        return expr;
    }

    parseUnary() {
        if (this.check(TokenType.NOT) ||
            this.check(TokenType.EXPORT) ||
            this.check(TokenType.IMPORT) ||
            this.check(TokenType.SPREAD) ||
            this.check(TokenType.MINUS)) {
            
            const operator = this.advance().type;
            return {
                type: 'UnaryOperation',
                operator,
                expr: this.parseUnary(),
                prefix: true
            };
        }

        return this.parsePostfix();
    }

    parsePostfix() {
        let expr = this.parsePrimary();

        while (this.check(TokenType.NOT) || this.check(TokenType.SPREAD)) {
            const operator = this.advance().type;
            expr = {
                type: 'UnaryOperation',
                operator,
                expr,
                prefix: false
            };
        }

        return expr;
    }

    parsePrimary() {
        if (this.match(TokenType.NUMBER)) {
            return {
                type: 'Number',
                value: this.previous().value
            };
        }

        if (this.match(TokenType.STRING_CHARS)) {
            return {
                type: 'String',
                value: this.previous().value
            };
        }

        if (this.match(TokenType.CHAR)) {
            return {
                type: 'Char',
                value: this.previous().value
            };
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return {
                type: 'Identifier',
                name: this.previous().value
            };
        }

        if (this.match(TokenType.LEFT_BRACKET) ||
            this.match(TokenType.LEFT_BRACE) ||
            this.match(TokenType.LEFT_PAREN)) {
            return this.parseBlock();
        }

        throw new Error(`Unexpected token: ${this.peek()?.type}`);
    }

    parseBlock() {
        const expressions = [];

        while (this.peek() && 
               !this.check(TokenType.RIGHT_BRACKET) &&
               !this.check(TokenType.RIGHT_BRACE) &&
               !this.check(TokenType.RIGHT_PAREN)) {
            expressions.push(this.parseExpression());
        }

        this.advance(); // 閉じ括弧をスキップ

        return {
            type: 'Block',
            expressions
        };
    }

    // ユーティリティメソッド
    peek() {
        return this.tokens[this.current] || null;
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.tokens[this.current - 1];
    }

    match(type) {
        if (this.check(type)) {
            this.advance();
            return true;
        }
        return false;
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    isAtEnd() {
        return this.peek()?.type === TokenType.EOF;
    }
}

module.exports = ExpressionParser;