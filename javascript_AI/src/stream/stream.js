// src/stream/stream.js
const { Transform, pipeline } = require('stream');
const { SignProcessor } = require('./processor');
const { Lexer } = require('../lexer/lexer');
const { Parser } = require('../parser/parser');

// 基本的なストリーム変換クラス
class BaseTransform extends Transform {
    constructor(options = {}) {
        super({ ...options, objectMode: true });
    }

    _transform(chunk, encoding, callback) {
        try {
            this.processChunk(chunk, callback);
        } catch (err) {
            callback(err);
        }
    }

    processChunk(chunk, callback) {
        // 派生クラスで実装
        callback(new Error('Not implemented'));
    }
}

// エラーハンドリング用のストリーム
class ErrorHandler extends BaseTransform {
    processChunk(chunk, callback) {
        if (chunk.type === 'Error') {
            callback(new Error(chunk.message));
            return;
        }
        this.push(chunk);
        callback();
    }
}

// Sign言語のストリームパイプライン作成
function createSignStream(options = {}) {
    const processor = new SignProcessor(options);
    const lexer = new Lexer(options);
    const parser = new Parser(options);
    const errorHandler = new ErrorHandler(options);

    return pipeline(
        processor,
        lexer,
        parser,
        errorHandler,
        (err) => {
            if (err) {
                console.error('Pipeline failed:', err);
            }
        }
    );
}

// ユーティリティ関数
async function processSignCode(code, options = {}) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const stream = createSignStream(options);

        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(chunks));
        stream.on('error', reject);

        // コードを流し込む
        stream.write(code);
        stream.end();
    });
}

// ストリーム変換のための補助関数
function transformStream(transform) {
    return new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
            try {
                const result = transform(chunk);
                this.push(result);
                callback();
            } catch (err) {
                callback(err);
            }
        }
    });
}

module.exports = {
    BaseTransform,
    ErrorHandler,
    createSignStream,
    processSignCode,
    transformStream
};
