// src/stream/processor.js
const { Transform } = require('stream');
const { Token } = require('../lexer/token');

class SignProcessor extends Transform {
    constructor(options = {}) {
        super({ 
            ...options,
            objectMode: true  // オブジェクトモードを有効化
        });
        this.buffer = '';
        this.context = {
            inString: false,
            indentLevel: 0,
            lineStart: true
        };
    }

    // バッファの処理
    processBuffer() {
        if (!this.buffer) return null;

        // 文字列リテラルの処理
        if (this.context.inString) {
            const endQuote = this.buffer.indexOf('`');
            if (endQuote === -1) return null;  // まだ文字列が終わっていない

            if (this.buffer.indexOf('\n', 0, endQuote) !== -1) {
                throw new Error('Newline is not allowed in string literals');
            }

            const content = this.buffer.slice(0, endQuote);
            this.buffer = this.buffer.slice(endQuote + 1);
            this.context.inString = false;
            return new Token('StringChars', content.split(''));
        }

        // 文字リテラルの処理
        if (this.buffer.startsWith('\\')) {
            if (this.buffer.length < 2) return null;
            const char = this.buffer[1];
            this.buffer = this.buffer.slice(2);
            return new Token('CharLiteral', char);
        }

        // その他のトークンの処理
        return this.processNextToken();
    }

    processNextToken() {
        // この部分は lexer の実装に近い形で
        // トークンを1つ処理して返す
    }

    _transform(chunk, encoding, callback) {
        try {
            this.buffer += chunk.toString();
            let token;
            
            while ((token = this.processBuffer()) !== null) {
                this.push(token);
            }
            
            callback();
        } catch (err) {
            callback(err);
        }
    }

    _flush(callback) {
        try {
            // 残りのバッファを処理
            let token;
            while ((token = this.processBuffer()) !== null) {
                this.push(token);
            }

            // バッファが残っているかチェック
            if (this.buffer.trim()) {
                if (this.context.inString) {
                    throw new Error('Unterminated string literal');
                }
                // 最後のトークンを処理
                const lastToken = this.processNextToken();
                if (lastToken) {
                    this.push(lastToken);
                }
            }

            this.push(new Token('EOF'));
            callback();
        } catch (err) {
            callback(err);
        }
    }
}

module.exports = SignProcessor;
