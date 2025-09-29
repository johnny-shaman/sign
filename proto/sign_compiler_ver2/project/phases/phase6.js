// phases/phase6.js
// Phase6: 単項演算子（前置・後置）をラムダ記法に変換し、{}保護を[]に復元する

/**
 * 単項演算子を前置記法に変換
 * - 前置演算子: !x → [[!_] x]
 * - 後置演算子: x! → [[_!] x]
 * @param {string} input - Phase6で処理されるコード
 * @returns {string} - 単項演算子が変換されたコード
 */
function phase6(input) {
    return input
        // 前置演算子: !x → [[!_] x]
        .replace(
            /(?<=\s|^)([!~#$@])([a-zA-Z0-9_]+|\[[^\]]*\])/g,
            '[[$1_] $2]'
        )
        // 後置演算子: x! → [[_!] x]
        .replace(
            /([a-zA-Z0-9_]+|\[[^\]]*\])([!~@])(?=\s|$)/g,
            '[[_$2] $1]'
        )
        // {}保護を[]に復元
        .replace(/\{([^{}]*)\}/g, '[$1]');
}

//test実行
//console.log(phase6(require('fs').readFileSync('./input/testcode_tmp.sn', 'utf8')));

module.exports = { phase6 };