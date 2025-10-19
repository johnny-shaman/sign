// main.js
// Sign言語パーサーのメイン処理

const fs = require('fs');
const path = require('path');
const lexer = require('./lexer.js');
const { parse } = require('./parser.js');

/**
 * ファイルを読み込む
 * @param {string} filePath - ファイルパス
 * @returns {string} - ファイルの内容
 */
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`ファイルの読み込みエラー: ${filePath}`, error.message);
        process.exit(1);
    }
}

/**
 * ファイルに書き込む
 * @param {string} filePath - ファイルパス
 * @param {string} content - 書き込む内容
 */
function writeFile(filePath, content) {
    try {
        // ディレクトリが存在しない場合は作成
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`結果を保存しました: ${filePath}`);
    } catch (error) {
        console.error(`ファイルの書き込みエラー: ${filePath}`, error.message);
    }
}

/**
 * メイン処理
 */
function main() {

    console.log('Sign言語パーサーを開始します...');

    // 入力ファイルの読み込み
    const inputPath = './input/testcode.sn';
    const inputContent = readFile(inputPath);
    console.log(inputContent);

    console.log('入力ファイル読み込み完了:', inputPath);
    console.log('='.repeat(50));

    // tokens: トークナイズ
    console.log('tokens: トークナイズ');
    const tokens = lexer(inputContent);

    // tokensの結果をファイルに保存
    console.log(tokens);
    writeFile('./output/tokens.json', JSON.stringify(tokens, null, 2));

    // tokensをパース
    const parsed = parse(tokens);
    writeFile('./output/parsed.json', JSON.stringify(parsed, null, 2));
}

// スクリプトが直接実行された場合にメイン処理を実行
if (require.main === module) {
    main();
}

module.exports = { main };