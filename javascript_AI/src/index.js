// src/index.js
const { createSignStream, processSignCode } = require('./stream/stream');
const { SignProcessor } = require('./stream/processor');
const { Lexer } = require('./lexer/lexer');
const { Parser } = require('./parser/parser');
const ast = require('./ast/ast');
const nodes = require('./ast/nodes');
const operators = require('./ast/operators');

// バージョン情報
const VERSION = '0.1.0';
const LANG_NAME = 'Sign Language';

// メイン処理関数
async function processCode(code, options = {}) {
    try {
        return await processSignCode(code, options);
    } catch (err) {
        console.error('Error processing code:', err);
        throw err;
    }
}

// CLIのためのヘルパー関数
function createCLIStream(options = {}) {
    const stream = createSignStream(options);
    
    stream.on('data', node => {
        console.log(node.toString());
    });
    
    stream.on('error', err => {
        console.error('Error:', err.message);
    });

    return stream;
}

// 公開API
module.exports = {
    // コア機能
    processCode,
    createSignStream,
    createCLIStream,

    // 構成要素
    SignProcessor,
    Lexer,
    Parser,

    // AST関連
    ast,
    nodes,
    operators,

    // メタ情報
    VERSION,
    LANG_NAME,

    // ユーティリティ
    async evaluateFile(filePath, options = {}) {
        const fs = require('fs').promises;
        const code = await fs.readFile(filePath, 'utf8');
        return processCode(code, options);
    },

    async evaluateString(code, options = {}) {
        return processCode(code, options);
    }
};

// CLIとして実行された場合の処理
if (require.main === module) {
    const fs = require('fs');
    const path = require('path');

    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // REPLモード
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'sign> '
        });

        const stream = createCLIStream();

        rl.prompt();

        rl.on('line', line => {
            if (line.trim()) {
                stream.write(line);
            }
            rl.prompt();
        }).on('close', () => {
            stream.end();
            process.exit(0);
        });

    } else {
        // ファイル実行モード
        const filePath = path.resolve(args[0]);
        
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }

        const stream = createCLIStream();
        fs.createReadStream(filePath).pipe(stream);
    }
}
