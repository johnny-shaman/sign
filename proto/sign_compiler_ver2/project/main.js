// main.js
// Sign言語パーサーのメイン処理

const fs = require('fs');
const path = require('path');

// Phase1-4のインポート
const { phase1 } = require('./phases/phase1.js');
const { phase2 } = require('./phases/phase2.js');
const { phase3 } = require('./phases/phase3.js');
const { phase4 } = require('./phases/phase4.js');
const { phase5 } = require('./phases/phase5.js');

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

    console.log('入力ファイル読み込み完了:', inputPath);
    console.log('='.repeat(50));

    // Phase1: コメントを削除、改行コードとカッコの統一
    console.log('Phase1: コメントを削除、改行コードとカッコの統一 を実行中...');
    const phase1Result = phase1(inputContent);

    // Phase1の結果をファイルに保存
    writeFile('./output/phase1_result.sn', phase1Result);

    // Phase1の結果をログ出力
    console.log('Phase1の結果:');
    console.log('-'.repeat(30));
    console.log(phase1Result);
    console.log('-'.repeat(30));

    console.log('\nPhase1完了');

    // Phase2: 絶対値囲みの前後にカッコ付けを行う
    console.log('Phase2: 絶対値囲みの前後にカッコ付けを実行中...');
    const phase2Result = phase2(phase1Result);

    // Phase2の結果をファイルに保存
    writeFile('./output/phase2_result.sn', phase2Result);

    // Phase2の結果をログ出力
    console.log('Phase2の結果:');
    console.log('-'.repeat(30));
    console.log(phase2Result);
    console.log('-'.repeat(30));

    console.log('\nPhase2完了');

    // Phase3: ブロック構文を判定し、カッコ付けを行う
    console.log('Phase3: ブロック構文を判定し、カッコ付けを実行中...');
    const phase3Result = phase3(phase2Result);

    // Phase3の結果をファイルに保存
    writeFile('./output/phase3_result.sn', phase3Result);

    // Phase3の結果をログ出力
    console.log('Phase3の結果:');
    console.log('-'.repeat(30));
    console.log(phase3Result);
    console.log('-'.repeat(30));

    console.log('\nPhase3完了');

    // Phase4: 改行コード統一後、文字列と文字トークンにカッコ付け処理
    console.log('Phase4: 改行コード統一後、文字列と文字トークンにカッコ付け処理を実行中...');
    const phase4Result = phase4(phase3Result);
    
    // Phase4の結果をファイルに保存
    writeFile('./output/phase4_result.sn', phase4Result);

    // Phase4の結果をログ出力
    console.log('Phase4の結果:');
    console.log('-'.repeat(30));
    console.log(phase4Result);
    console.log('-'.repeat(30));

    console.log('\nPhase4完了');
    console.log('='.repeat(50));

    // Phase5: 多項式を二項演算の組に直すために、優先順位に従ってカッコ付けを行う
    console.log('Phase5: 多項式を二項演算の組に直すために、優先順位に従ってカッコ付けを実行中...');
    const phase5Result = phase5(phase4Result);

    // Phase5の結果をファイルに保存
    writeFile('./output/phase5_result.sn', phase5Result);

    // Phase5の結果をログ出力
    console.log('Phase5の結果:');
    console.log('-'.repeat(30));
    console.log(phase5Result);
    console.log('-'.repeat(30));

    console.log('\nPhase5完了');

}

// スクリプトが直接実行された場合にメイン処理を実行
if (require.main === module) {
    main();
}

module.exports = { main };