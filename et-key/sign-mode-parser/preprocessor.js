// preprocessor.js
/**
 * Sign言語のソースコードからコメントと空行を削除し、空白を正規化するモジュール
 * 
 * 機能:
 * - 行頭のバッククォート(`)で始まるコメント行の削除
 * - 行末の空白の除去
 * - すべての空行の削除
 * - インデントの正規化（スペース→タブ変換）
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250327_0
 */

/**
 * ソースコードからコメントと空行を削除し、空白を正規化する
 * 
 * @param {string} sourceCode - 処理対象のソースコード文字列
 * @returns {string} コメントと空行が削除され、空白が正規化されたソースコード
 */
function removeComments(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    return '';
  }

  // 行ごとに分割
  const lines = sourceCode.split(/\r?\n/);

  // 処理後の行を格納する配列
  const processedLines = [];

  // 各行を処理
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 行頭の空白を保持したまま、行頭が`で始まるコメント行をスキップ
    if (line.trimLeft().startsWith('`')) {
      continue;
    }

    // 空でない行のみを追加（行末の空白は除去）
    if (line.trim() !== '') {
      processedLines.push(line.trimRight());
    }
  }

  // 処理済みの行を結合して返す
  return processedLines.join('\n');
}

/**
 * ソースコードを正規化する
 * - コメントと空行の削除
 * - 行末の空白除去
 * - スペースベースのインデントをタブに変換
 * 
 * @param {string} sourceCode - 処理対象のソースコード文字列
 * @returns {string} 正規化されたソースコード
 */
function normalizeSourceCode(sourceCode) {
  // コメントと空行の削除、行末の空白除去
  let processed = removeComments(sourceCode);

  // インデントをタブで統一
  // 行頭の連続スペース4つをタブに変換（エディタの設定に応じて調整可能）
  processed = processed.replace(/^(    )+/gm, match => {
    return '\t'.repeat(match.length / 4);
  });

  return processed;
}

// モジュールとしてエクスポート
module.exports = {
  removeComments,
  normalizeSourceCode
};