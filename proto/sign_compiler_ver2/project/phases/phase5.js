// phases/phase5.js
// Phase5: 多項式を二項演算の組に直すために、優先順位に従ってカッコ付けを行う
// ※作成中※ 中置演算子の前置記法変換（左単位元のみ）

/**
 * 中置演算子を前置記法に変換する
 * @param {string} input - Phase5で処理されるコード
 * @returns {string} - 前置記法に変換されたコード
 */

function phase5(input) {
    // 左単位元の中置演算子のみを抽出（優先順位の高い順）
    const leftAssociativeOperators = [
        "'",           // 22. 取得
        "\\*",         // 16. 乗算
        "/",           // 16. 除算
        "%",           // 16. 剰余
        "\\+",         // 15. 加算
        "-",           // 15. 減算
        "<",           // 14. より小さい
        "<=",          // 14. 以下
        "=",           // 14. 等しい
        ">=",          // 14. 以上
        ">",           // 14. より大きい
        "!=",          // 14. 等しくない
        "&",           // 12. 論理積
        ";",           // 11. 排他的論理和
        "\\|",         // 11. 論理和
        "~"            // 9. 範囲リスト構築
    ];

    let result = input;
    
    // 各演算子を優先順位順に処理
    leftAssociativeOperators.forEach(operator => {
        result = processOperator(result, operator);
    });
    
    return result;
}

/**
 * 特定の演算子を前置記法に変換
 * @param {string} text - 処理対象のテキスト
 * @param {string} operator - 処理する演算子（エスケープ済み）
 * @returns {string} - 変換後のテキスト
 */
function processOperator(text, operator) {
    // より正確なオペランドパターン（ネストしたブロックに対応）
    const operandPattern = '(\\[(?:[^\\[\\]]|\\[[^\\]]*\\])*\\]|[A-Za-z_][0-9A-Za-z_]*|[0-9]+(?:\\.[0-9]+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+|_)';
    
    // 通常の中置演算子パターン
    const pattern = new RegExp(`${operandPattern}\\s*(${operator})\\s*${operandPattern}`);
    
    // パターンが存在しない場合は即座に終了
    if (!pattern.test(text)) {
        return text;
    }
    
    let prevText, currentText = text;
    
    // 変化がなくなるまで一箇所ずつ変換
    do {
        prevText = currentText;
        
        // 一箇所のみ変換（最初にマッチした箇所）
        currentText = currentText.replace(pattern, (match, left, op, right, offset, string) => {
            // マッチした全体が絶対値ブロック内にあるかチェック
            const beforeMatch = string.substring(0, offset);
            const afterMatch = string.substring(offset + match.length);
            
            // 最も近い開始ブロックが [| かどうかチェック
            const lastOpenBlock = Math.max(
                beforeMatch.lastIndexOf('[|'),
                beforeMatch.lastIndexOf('[')
            );
            const isAbsoluteBlock = beforeMatch.charAt(lastOpenBlock + 1) === '|';
            
            // 対応する終了ブロックが |] かどうかチェック
            const nextCloseBlock = Math.min(
                afterMatch.indexOf('|]') !== -1 ? afterMatch.indexOf('|]') : Infinity,
                afterMatch.indexOf(']') !== -1 ? afterMatch.indexOf(']') : Infinity
            );
            const closesAbsoluteBlock = afterMatch.charAt(nextCloseBlock) === '|';
            
            if (isAbsoluteBlock && closesAbsoluteBlock) {
                // 絶対値ブロック内では単一のブラケット
                return `[${op}] ${left} ${right}`;
            } else {
                // 通常のブロック外では二重ブラケット
                return `[[${op}] ${left} ${right}]`;
            }
        });
        
    } while (currentText !== prevText);
    
    return currentText;
}

module.exports = { phase5 };