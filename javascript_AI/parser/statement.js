// src/parser/statement.js

const { TokenType } = require('../lexer/token');
const ExpressionParser = require('./expression');

class StatementParser {
    constructor(tokens = []) {
        this.tokens = tokens;
        this.current = 0;
        this.currentIndent = 0;
        this.expressionParser = new ExpressionParser(tokens);
    }

    parseStatement() {
        // インデントの処理
        this.handleIndentation();

        const token = this.peek();
        if (!token) return null;

        switch (token.type) {
            case TokenType.NEWLINE:
                this.advance();
                return this.parseStatement();

            case TokenType.EXPORT:
                return this.parseExportStatement();

            case TokenType.IMPORT:
                return this.parseImportStatement();

            case TokenType.LEFT_BRACKET:
            case TokenType.LEFT_BRACE:
            case TokenType.LEFT_PAREN:
                return this.parseBlockStatement();

            default:
                if (this.isPatternMatch()) {
                    return this.parsePatternMatch();
                }
                return this.parseExpressionStatement();
        }
    }

    handleIndentation() {
        while (this.match(TokenType.INDENT)) {
            this.currentIndent = this.previous().value;
        }
        while (this.match(TokenType.DEDENT)) {
            this.currentIndent--;
        }
    }

    parseExportStatement() {
        this.advance(); // skip #
        return {
            type: 'ExportStatement',
            expression: this.expressionParser.parseExpression()
        };
    }

    parseImportStatement() {
        this.advance(); // skip @
        return {
            type: 'ImportStatement',
            expression: this.expressionParser.parseExpression()
        };
    }

    parseBlockStatement() {
        const startToken = this.advance();
        const endToken = this.getMatchingEndToken(startToken.type);
        const statements = [];
        let expectingSeparator = false;

        while (this.peek() && !this.check(endToken)) {
            if (this.match(TokenType.NEWLINE)) {
                expectingSeparator = false;
                continue;
            }

            if (expectingSeparator) {
                throw new Error("Expected separator between statements");
            }

            statements.push(this.parseStatement());
            expectingSeparator = true;
        }

        this.advance(); // consume ending token

        return {
            type: 'BlockStatement',
            statements,
            style: this.getBlockStyle(startToken.type)
        };
    }

    parsePatternMatch() {
        const patterns = [];
        let currentPattern = [];

        while (this.peek() && !this.isBlockEnd()) {
            if (this.match(TokenType.OR)) {
                if (currentPattern.length > 0) {
                    patterns.push(currentPattern);
                    currentPattern = [];
                }
                continue;
            }

            const expr = this.expressionParser.parseExpression();
            currentPattern.push(expr);
            
            if (this.match(TokenType.DEFINE)) {
                const result = this.expressionParser.parseExpression();
                patterns.push({
                    pattern: currentPattern.length === 1 ? currentPattern[0] : currentPattern,
                    result
                });
                currentPattern = [];
            }
        }

        if (currentPattern.length > 0) {
            patterns.push({
                pattern: currentPattern.length === 1 ? currentPattern[0] : currentPattern,
                result: null // default case
            });
        }

        return {
            type: 'PatternMatch',
            cases: patterns
        };
    }

    parseExpressionStatement() {
        const expr = this.expressionParser.parseExpression();
        this.consumeNewline();
        return {
            type: 'ExpressionStatement',
            expression: expr
        };
    }

    // ユーティリティメソッド
    getMatchingEndToken(startToken) {
        const tokenMap = {
            [TokenType.LEFT_BRACKET]: TokenType.RIGHT_BRACKET,
            [TokenType.LEFT_BRACE]: TokenType.RIGHT_BRACE,
            [TokenType.LEFT_PAREN]: TokenType.RIGHT_PAREN
        };
        return tokenMap[startToken];
    }

    getBlockStyle(startToken) {
        const styleMap = {
            [TokenType.LEFT_BRACKET]: 'brackets',
            [TokenType.LEFT_BRACE]: 'braces',
            [TokenType.LEFT_PAREN]: 'parentheses'
        };
        return styleMap[startToken];
    }

    isPatternMatch() {
        let i = this.current;
        let hasDefine = false;
        let hasLambda = false;

        while (i < this.tokens.length) {
            const token = this.tokens[i];
            if (token.type === TokenType.DEFINE) hasDefine = true;
            if (token.type === TokenType.LAMBDA) hasLambda = true;
            if (hasDefine && hasLambda) return true;
            i++;
        }

        return false;
    }

    isBlockEnd() {
        return this.check(TokenType.RIGHT_BRACKET) ||
               this.check(TokenType.RIGHT_BRACE) ||
               this.check(TokenType.RIGHT_PAREN);
    }

    consumeNewline() {
        while (this.match(TokenType.NEWLINE)) {
            // consume all consecutive newlines
        }
    }

    // ExpressionParserと同じユーティリティメソッド
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

module.exports = StatementParser;
