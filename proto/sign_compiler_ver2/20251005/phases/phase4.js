// phases/phase1.js
// Phase4:文字列と文字トークンにカッコ付け

/**
 * 改行コード統一後、文字列と文字トークンにカッコ付け処理を実行
 * @param {string} input - Phase1で処理されるコード
 * @returns {string} - トークンにカッコを付けたコード
 */

function phase4(input) {
    return input
    .replace(/(`[^`\r\n]*`)|(\\[\s\S])/gm, '[$&]')
}

module.exports = { phase4 };