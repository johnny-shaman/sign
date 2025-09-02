// phases/phase1.js
// Phase1: 文字列と文字トークンにカッコ付け

/**
 * Phase1の文字列と文字トークンにカッコ付け処理を実行
 * @param {string} input - Phase1で処理されるコード
 * @returns {string} - トークンにカッコを付けたコード
 */
function phase1(input) {
    return input
    .replace(/((?!^[`].*)(`[^`\r\n]*`))|\\./gm, '[$&]')
    .replace(/(\r\n)|[\r\n]/g, '[$&]');
}

module.exports = { phase1 };