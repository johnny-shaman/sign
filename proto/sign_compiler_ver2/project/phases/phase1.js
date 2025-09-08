// phases/phase1.js
// Phase1:改行コード統一、文字列と文字トークンにカッコ付け

/**
 * 改行コード統一後、文字列と文字トークンにカッコ付け処理を実行
 * @param {string} input - Phase1で処理されるコード
 * @returns {string} - トークンにカッコを付けたコード
 */

function phase1(input) {
    return input
    .replace(/(\r\n)|[\r\n]/g, '\n')
    .replace(/((?!^[`].*)(`[^`\r\n]*`))|(\\[\s\S])/gm, '[$&]')
    .replace(/(\[\\\n\])\t+/g, '$1')
}

module.exports = { phase1 };