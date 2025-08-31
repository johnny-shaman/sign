// phases/phase4.js
// Phase4: 絶対値囲みの前後にカッコ付けを行う

/**
 * Phase4の絶対値囲みカッコ付け処理を実行
 * @param {string} input - Phase3で処理されたコード
 * @returns {string} - 絶対値囲みをカッコ付けしたコード
 */
function phase4(input) {
    let result = input;
    let prevResult;
    
    do {
        prevResult = result;
        // 既にカッコで囲まれていない |...| パターンのみを [|...|] に変換
        result = result.replace(/(?<!\[)\|((?:[^\|]|\[.*?\])*)\|(?!\])/g, '[|$1|]');
    } while (result !== prevResult);
    
    return result;
}

module.exports = { phase4 };