// src/lexer/lexer.js
const { Transform } = require('stream');
const { TokenType, Token } = require('./token');

class Lexer extends Transform {
    constructor(options = {}) {
        super({ ...options, objectMode: true });
        this.buffer = '';
        this.isInString = false;
        this.currentIndent = 0;
        this.isLineStart = true;
    }

    processChar() {
        // バックスラッシュの後の1文字を必ず文字リテラルとして扱う
        if (this.buffer.startsWith('\\')) {
            if (this.buffer.length < 2) return null;
            const char = this.buffer[1];
            this.buffer = this.buffer.slice(2);
            return new Token(TokenType.CHAR, char);
        }
        return null;
    }

    processString() {
        // バッククォートで囲まれた部分を文字列として処理
        if (this.buffer.startsWith('`')) {
            const endIndex = this.buffer.indexOf('`', 1);
            if (endIndex === -1) return null;
            
            // 文字列内に改行があればエラー
            const content = this.buffer.slice(1, endIndex);
            if (content.includes('\n')) {
                throw new Error('Newline is not allowed in string literals');
            }

            this.buffer = this.buffer.slice(endIndex + 1);
            return new Token(TokenType.STRING_CHARS, content.split(''));
        }
        return null;
    }

    processNumber() {
        const match = this.buffer.match(/^-?\d+(\.\d+)?/);
        if (match) {
            const num = match[0];
            this.buffer = this.buffer.slice(num.length);
            return new Token(TokenType.NUMBER, parseFloat(num));
        }
        return null;
    }

    processIdentifier() {
        const match = this.buffer.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
        if (match) {
            const identifier = match[0];
            this.buffer = this.buffer.slice(identifier.length);
            return new Token(TokenType.IDENTIFIER, identifier);
        }
        return null;
    }

    processOperator() {
        const operatorMap = {
            ':': TokenType.DEFINE,
            '?': TokenType.LAMBDA,
            ',': TokenType.PRODUCT,
            '|': TokenType.OR,
            ';': TokenType.XOR,
            '&': TokenType.AND,
            '~': TokenType.SPREAD,
            '#': TokenType.EXPORT,
            '@': TokenType.IMPORT,
            '!': TokenType.NOT,
            "'": TokenType.GET,
            '+': TokenType.PLUS,
            '*': TokenType.MULTIPLY,
            '/': TokenType.DIVIDE,
            '%': TokenType.MODULO,
            '^': TokenType.POWER,
            // 二文字の演算子は別途処理
        };

        // 二文字演算子の処理
        if (this.buffer.length >= 2) {
            const twoChars = this.buffer.slice(0, 2);
            const twoCharOps = {
                '<=': TokenType.LESS_EQUAL,
                '>=': TokenType.GREATER_EQUAL,
                '==': TokenType.EQUAL,
                '!=': TokenType.NOT_EQUAL,
                '><': TokenType.NOT_EQUAL,
                '<>': TokenType.NOT_EQUAL,
            };

            if (twoChars in twoCharOps) {
                this.buffer = this.buffer.slice(2);
                return new Token(twoCharOps[twoChars]);
            }
        }

        // 一文字演算子の処理
        const firstChar = this.buffer[0];
        if (firstChar in operatorMap) {
            this.buffer = this.buffer.slice(1);
            return new Token(operatorMap[firstChar]);
        }

        return null;
    }

    skipWhitespace() {
        const match = this.buffer.match(/^\s+/);
        if (match) {
            if (this.isLineStart) {
                this.currentIndent = match[0].length;
            }
            this.buffer = this.buffer.slice(match[0].length);
            return true;
        }
        return false;
    }

    processToken() {
        if (this.buffer.length === 0) return null;

        // 空白文字のスキップ
        if (this.skipWhitespace()) return null;

        // 各種トークンの処理
        return (
            this.processChar() ||
            this.processString() ||
            this.processNumber() ||
            this.processIdentifier() ||
            this.processOperator()
        );
    }

    _transform(chunk, encoding, callback) {
        try {
            this.buffer += chunk.toString();
            let token;
            
            while ((token = this.processToken())) {
                this.push(token);
            }
            
            callback();
        } catch (err) {
            callback(err);
        }
    }

    _flush(callback) {
        try {
            if (this.buffer.trim()) {
                const token = this.processToken();
                if (token) {
                    this.push(token);
                }
            }
            this.push(new Token(TokenType.EOF));
            callback();
        } catch (err) {
            callback(err);
        }
    }
}

module.exports = Lexer;
