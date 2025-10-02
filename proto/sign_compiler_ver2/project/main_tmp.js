// main_tmp.js
// Sign言語パーサーのメイン処理
// 特定のphaseのみ使用した暫定版

const fs = require('fs');
const path = require('path');

// Phase1-6のインポート
const { phase1 } = require('./phases/phase1.js');
const { phase2 } = require('./phases/phase2.js');
const { phase3 } = require('./phases/phase3.js');
const { phase4 } = require('./phases/phase4.js');
const { phase4_5 } = require('./phases/phase4_5.js');
const { phase4_6 } = require('./phases/phase4_6.js');
const { phase5 } = require('./phases/phase5.js');
const { phase6 } = require('./phases/phase6.js');

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
function main_tmp() {
    console.log('Sign言語パーサーを開始します...');

    // 入力ファイルの読み込み
    // const inputPath = './input/testcode_tmp.sn';
    const inputPath = './input/testcode_all.sn';
    const inputContent = readFile(inputPath);

    console.log('入力ファイル読み込み完了:', inputPath);
    console.log('='.repeat(50));

    // Phase1: コメントを削除、改行コードとカッコの統一
    console.log('Phase1: コメントを削除、改行コードとカッコの統一 を実行中...');
    const phase1Result = phase1(inputContent);

    // Phase1の結果をファイルに保存
    writeFile('./output/phase1_result_tmp.sn', phase1Result);

    // Phase2: 絶対値囲みの前後にカッコ付けを行う


    // Phase4_5: リストにカッコ付け処理
    console.log('Phase4_5: リストにカッコ付け処理 を実行中...');
    const phase4_5Result = phase4_5(phase1Result);

    // Phase4_5の結果をファイルに保存
    writeFile('./output/phase4_5_result_tmp.sn', phase4_5Result);

    // Phase4_6: ポイントフリー記法と引数の組み合わせを{}で囲う
    console.log('Phase4_6: ポイントフリー記法と引数の組み合わせを()で囲う を実行中...');
    const phase4_6Result = phase4_6(phase4_5Result);

    // Phase4_6の結果をファイルに保存
    writeFile('./output/phase4_6_result_tmp.sn', phase4_6Result);

    // Phase3: ブロック構文を判定し、カッコ付けを行う
    console.log('Phase3: ブロック構文を判定し、カッコ付けを実行中...');
    const phase3Result = phase3(phase4_6Result);

    // Phase3の結果をファイルに保存
    writeFile('./output/phase3_result_tmp.sn', phase3Result);

    // Phase4: 改行コード統一後、文字列と文字トークンにカッコ付け処理
    console.log('Phase4: 改行コード統一後、文字列と文字トークンにカッコ付け処理 を実行中...');
    const phase4Result = phase4(phase3Result);

    // Phase4の結果をファイルに保存
    writeFile('./output/phase4_result_tmp.sn', phase4Result);


    // Phase5: 多項式を二項演算の組・前置記法に変換
    console.log('Phase5: 多項式を二項演算の組・前置記法に変換 を実行中...');
    const phase5Result = phase5(phase4Result);

    // Phase5の結果をファイルに保存
    writeFile('./output/phase5_result_tmp.sn', phase5Result);

    // Phase6: 単項演算子（前置・後置）をラムダ記法に変換
    console.log('Phase6: 単項演算子（前置・後置）をラムダ記法に変換 を実行中...');
    const phase6Result = phase6(phase5Result);

    // Phase6の結果をファイルに保存
    writeFile('./output/phase6_result_tmp.sn', phase6Result);

}

// スクリプトが直接実行された場合にメイン処理を実行
if (require.main === module) {
    main_tmp();
}

module.exports = { main_tmp };