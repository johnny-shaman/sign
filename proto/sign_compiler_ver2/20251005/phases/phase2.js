// phases/phase2.js
// Phase2: 絶対値囲みの前後にカッコ付けを行う

/**
 * Phase2の絶対値囲みカッコ付け処理を実行
 * @param {string} input - Phase1で処理されたコード
 * @returns {string} - 絶対値囲みをカッコ付けしたコード
 */
function phase2(input) {
    return input
        .replace(
            /(?<=[ \t])[|]+(?=[\S])/g,
            m => m.replace(/[|]/g, '[$&')
        )
        .replace(
            /(?<=\S)[|]+(?=\s|$)/gm,
            m => m.replace(/[|]/g, '$&]')
        );
}

module.exports = { phase2 };
