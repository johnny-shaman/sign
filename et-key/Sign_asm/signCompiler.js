// signCompiler.js
/**
 * Sign言語コンパイラのメインファイル
 * 
 * 機能:
 * - コマンドライン引数の処理
 * - 各処理段階（字句解析、構文解析等）の実行制御
 * - エラーハンドリング
 * 
 * 使用方法:
 * node signCompiler.js <入力ファイル> [オプション]
 * 
 * CreateBy Claude3.7Sonet
 * ver_20250304_0
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');
const { Lexer } = require('./compiler/lexer');
const { Parser } = require('./compiler/parser');

// コンパイラのメインクラス
class SignCompiler {
    constructor(options = {}) {
        this.logger = logger;
        this.outputDir = options.outputDir || './output';
    }

    // ファイルの読み込み
    readFile(filePath) {
        this.logger.info(`ファイル ${filePath} を読み込みます...`);
        return fs.readFileSync(filePath, 'utf8');
    }

    // 出力ディレクトリの作成
    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    // 結果をファイルに書き出す
    writeToFile(fileName, content) {
        this.ensureOutputDir();
        const outputPath = path.join(this.outputDir, fileName);
        fs.writeFileSync(outputPath, content, 'utf8');
        this.logger.info(`結果を ${outputPath} に書き出しました`);
        return outputPath;
    }
    // コンパイル処理の実行
    compile(sourceCode, baseName) {
        // 入力ファイル名から基本名を取得（出力ファイル用）
        baseName = baseName || 'output';
        // 字句解析
        this.logger.info('字句解析を開始します...');
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        //this.logger.info('字句解析結果:', tokens);
        // トークンをファイルに書き出し
        const tokensJson = JSON.stringify(tokens, null, 2);
        this.writeToFile(`${baseName}_tokens.json`, tokensJson);
        this.logger.info('字句解析結果をファイルに書き出しました');
        
        // 構文解析
        this.logger.info('構文解析を開始します...');
        const parser = new Parser(tokens);
        const ast = parser.parse();
        // 構文解析結果をJSONとして整形して表示
        // this.logger.info('構文解析結果:');
        // console.log(JSON.stringify(ast, null, 2));
        
        // ASTをファイルに書き出し
        const astJson = JSON.stringify(ast, null, 2);
        this.writeToFile(`${baseName}_ast.json`, astJson);
        this.logger.info('構文解析結果をファイルに書き出しました');

        return {
            tokens,
            ast,
        };
    }
}

// メイン処理
async function main() {
    // コマンドライン引数の処理
    const fileName = process.argv[2];
    const outputDir = process.argv[3] || './output';

    if (!fileName) {
        logger.error('使用方法: node signCompiler.js <ファイル名> [出力ディレクトリ]');
        process.exit(1);
    }

    try {
        logger.info('コンパイルを開始します');
        logger.info(`入力ファイル: ${fileName}`);
        logger.info(`出力ディレクトリ: ${outputDir}`);

        // ファイル名から拡張子を除いた基本名を取得
        const baseName = path.basename(fileName, path.extname(fileName));
        
        const compiler = new SignCompiler({ outputDir });
        const sourceCode = compiler.readFile(fileName);
        
        // ソースコードが読み込めたか確認
        logger.info('ソースコードの長さ:', sourceCode.length, '文字');
        
        const result = compiler.compile(sourceCode, baseName);
        
        // 結果の出力
        logger.info('コンパイル完了');
        logger.info(`結果は ${outputDir} ディレクトリに保存されました`);

    } catch (error) {
        logger.error('コンパイルエラー:', error.message);
        if (error.code === 'ENOENT') {
            logger.error('ファイルが見つかりません:', fileName);
        }
        process.exit(1);
    }
}

// プログラムの実行（async/await対応）
main().catch(error => {
    logger.error('予期せぬエラー:', error);
    process.exit(1);
});