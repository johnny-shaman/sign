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
 * ver_20250427_0
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
 * ソースコード内のすべてのカッコを統一する
 * - 丸カッコ () → 角カッコ []
 * - 波カッコ {} → 角カッコ []
 * 
 * @param {string} sourceCode - 処理対象のソースコード文字列
 * @returns {string} カッコが統一されたソースコード
 */
function unifyBrackets(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    return '';
  }

  // 文字列リテラル内のカッコは変換しないよう注意する必要がある
  // バッククォートで囲まれた部分を一時的に置換して保護
  const stringLiterals = [];
  let protectedCode = sourceCode.replace(/`[^`]*`/g, match => {
    stringLiterals.push(match);
    return `__STRING_LITERAL_${stringLiterals.length - 1}__`;
  });

  // すべての丸カッコと波カッコを角カッコに変換
  protectedCode = protectedCode
    .replace(/\(/g, '[')
    .replace(/\)/g, ']')
    .replace(/\{/g, '[')
    .replace(/\}/g, ']');

  // 文字列リテラルを元に戻す
  let resultCode = protectedCode;
  for (let i = 0; i < stringLiterals.length; i++) {
    resultCode = resultCode.replace(`__STRING_LITERAL_${i}__`, stringLiterals[i]);
  }

  return resultCode;
}

/**
 * ソースコードを正規化する
 * - コメントと空行の削除
 * - 行末の空白除去
 * - スペースベースのインデントをタブに変換
 * - すべてのカッコの種類を角カッコ[]に統一
 * 
 * @param {string} sourceCode - 処理対象のソースコード文字列
 * @returns {string} 正規化されたソースコード
 */
function normalizeSourceCode(sourceCode) {
  // コメントと空行の削除、行末の空白除去
  let processed = removeComments(sourceCode);

  // カッコの統一
  processed = unifyBrackets(processed);

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
  normalizeSourceCode,
  unifyBrackets
};