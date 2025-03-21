// index.js
/**
 * Sign言語モードベースパーサーのメインプログラム
 * 
 * 機能:
 * - コマンドライン引数の処理
 * - ファイル入出力
 * - 字句解析と式木ビルダーの統合
 * - 処理結果の表示と保存
 * 
 * 使い方:
 *   node index.js <入力ファイル> [--out]
 *   --out: 結果をファイルに保存 (入力ファイル名.json)
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250321_0
 */

// Node.js標準モジュール
const fs = require('fs');
const path = require('path');

// プロジェクトモジュール
const { tokenize } = require('./lexer');
const { buildExpressionTree } = require('./builder');

/**
 * メイン処理関数
 */
function main() {
  // コマンドライン引数の解析
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('使い方: node index.js <入力ファイル> [--out]');
    process.exit(1);
  }

  // 入力ファイルパスと出力オプションの取得
  const inputFile = args[0];
  const saveToFile = args.includes('--out');

  try {
    // ファイルの読み込み
    console.log(`ファイル '${inputFile}' を読み込んでいます...`);
    const sourceCode = fs.readFileSync(inputFile, 'utf8');

    // 字句解析
    console.log('字句解析中...');
    const tokens = tokenize(sourceCode);
    
    // デバッグ出力（オプション）
    console.log(`トークン数: ${tokens.length}`);
    if (tokens.length < 100) {  // トークン数が多い場合は省略
      console.log('トークン:', tokens);
    } else {
      console.log('トークン (最初の20個):', tokens.slice(0, 20), '...');
    }

    // 式木構築
    console.log('式木構築中...');
    const expressionTree = buildExpressionTree(tokens);

    // 結果の整形
    const result = {
      sourceFile: inputFile,
      tokenCount: tokens.length,
      expressionTree: expressionTree
    };

    // 結果の出力
    const jsonResult = JSON.stringify(result, null, 2);
    
    if (saveToFile) {
      // ファイルに保存
      const outputFile = `${inputFile}.json`;
      fs.writeFileSync(outputFile, jsonResult, 'utf8');
      console.log(`結果を '${outputFile}' に保存しました`);
    } else {
      // 標準出力に表示
      console.log('\n===== 処理結果 =====\n');
      console.log(jsonResult);
      console.log('\n====================\n');
    }

    console.log('処理が完了しました');
    
  } catch (error) {
    // エラー処理
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// プログラム実行
main();