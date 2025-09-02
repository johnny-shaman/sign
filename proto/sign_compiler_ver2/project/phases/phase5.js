// phases/phase5.js
// Phase5: 多項式を二項演算の組に直すために、優先順位に従ってカッコ付けを行う

/**
 * 演算子の優先順位テーブル（高い順）
 * 同じ優先順位の演算子は配列でグループ化
 */
const OPERATOR_PRECEDENCE = [
    // 優先順位18: 階乗（後置演算子なので除外）
    
    // 優先順位17: 冪乗（右結合）
    ['^'],
    
    // 優先順位16: 乗除算
    ['*', '/', '%'],
    
    // 優先順位15: 加減算
    ['+', '-'],
    
    // 優先順位14: 比較演算
    ['<=', '>=', '!=', '<', '>', '='],
    
    // 優先順位13: 否定（前置演算子なので除外）
    
    // 優先順位12: 論理積
    ['&'],
    
    // 優先順位11: 論理和
    ['|', ';'],
    
    // 優先順位10: 連続リスト構築（前置演算子なので除外）
    
    // 優先順位9: 範囲リスト構築
    ['~'],
    
    // 優先順位8: 積
    [','],
    
    // 優先順位7: ラムダ構築（右結合）
    ['?'],
    
    // 優先順位6以下: 余積、定義、出力、エクスポートは別phase処理
];

/**
 * 右結合演算子のセット
 */
const RIGHT_ASSOCIATIVE = new Set(['^', '?']);

/**
 * 単一演算子に対して左結合処理を実行
 * @param {string} input - 処理対象のコード
 * @param {string} operator - 処理する演算子
 * @returns {string} - 処理済みのコード
 */
function processLeftAssociativeOperator(input, operator) {
    let processed = false;
    
    // エスケープが必要な演算子を処理
    const escapedOp = operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const regex = new RegExp(
        `(?<!\\[)(\\[(?:[^\\[\\]]*|\\[[^\\[\\]]*\\])*\\]|[^\\s\\[\\]]+)\\s*(${escapedOp})\\s*(\\[(?:[^\\[\\]]*|\\[[^\\[\\]]*\\])*\\]|[^\\s\\[\\]]+)(?!\\])`,
        'g'
    );
    
    return input.replace(regex, (match, left, op, right) => {
        if (!processed) {
            processed = true;
            return `[${left} ${op} ${right}]`;
        }
        return match;
    });
}

/**
 * 単一演算子に対して右結合処理を実行
 * @param {string} input - 処理対象のコード
 * @param {string} operator - 処理する演算子
 * @returns {string} - 処理済みのコード
 */
function processRightAssociativeOperator(input, operator) {
    let processed = false;
    let lastMatchIndex = -1;
    let result = '';
    
    // エスケープが必要な演算子を処理
    const escapedOp = operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const regex = new RegExp(
        `(?<!\\[)(\\[(?:[^\\[\\]]*|\\[[^\\[\\]]*\\])*\\]|[^\\s\\[\\]]+)\\s*(${escapedOp})\\s*(\\[(?:[^\\[\\]]*|\\[[^\\[\\]]*\\])*\\]|[^\\s\\[\\]]+)(?!\\])`,
        'g'
    );
    
    let match;
    let matches = [];
    
    // すべてのマッチを収集
    while ((match = regex.exec(input)) !== null) {
        matches.push({
            match: match[0],
            left: match[1],
            op: match[2],
            right: match[3],
            index: match.index
        });
    }
    
    if (matches.length === 0) return input;
    
    // 右結合なので最後のマッチを処理
    const lastMatch = matches[matches.length - 1];
    return input.substring(0, lastMatch.index) + 
           `[${lastMatch.left} ${lastMatch.op} ${lastMatch.right}]` + 
           input.substring(lastMatch.index + lastMatch.match.length);
}

/**
 * 特定の演算子グループを完全に処理（変更がなくなるまで繰り返し）
 * @param {string} input - 処理対象のコード
 * @param {string[]} operators - 処理する演算子の配列
 * @param {boolean} isRightAssociative - 右結合かどうか
 * @returns {string} - 処理済みのコード
 */
function processOperatorGroup(input, operators, isRightAssociative = false) {
    let code = input;
    let changed = true;
    
    while (changed) {
        changed = false;
        
        for (const operator of operators) {
            const newCode = isRightAssociative 
                ? processRightAssociativeOperator(code, operator)
                : processLeftAssociativeOperator(code, operator);
                
            if (newCode !== code) {
                code = newCode;
                changed = true;
                break; // 1つの演算子で変更があったら、再度最初から
            }
        }
    }
    
    return code;
}

/**
 * Phase5の多項式優先順位処理を実行
 * @param {string} input - Phase4で処理されたコード
 * @returns {string} - 優先順位に従ってカッコ付けされたコード
 */
function phase5(input) {
    let code = input;
    
    // 高優先度から低優先度へ順次処理
    for (const operatorGroup of OPERATOR_PRECEDENCE) {
        // 右結合演算子かどうかを判定
        const isRightAssociative = operatorGroup.some(op => RIGHT_ASSOCIATIVE.has(op));
        
        // 演算子グループを完全に処理
        code = processOperatorGroup(code, operatorGroup, isRightAssociative);
    }
    
    return code;
}

/**
 * デバッグ用：段階的な処理結果を表示
 * @param {string} input - 処理対象のコード
 * @returns {string} - 処理済みのコード
 */
function phase5Debug(input) {
    let code = input;
    console.log('Phase5開始:', code);
    
    for (let i = 0; i < OPERATOR_PRECEDENCE.length; i++) {
        const operatorGroup = OPERATOR_PRECEDENCE[i];
        const isRightAssociative = operatorGroup.some(op => RIGHT_ASSOCIATIVE.has(op));
        
        console.log(`\n優先順位${17-i}: [${operatorGroup.join(', ')}] ${isRightAssociative ? '(右結合)' : '(左結合)'}`);
        
        const beforeCode = code;
        code = processOperatorGroup(code, operatorGroup, isRightAssociative);
        
        if (code !== beforeCode) {
            console.log('変更後:', code);
        } else {
            console.log('変更なし');
        }
    }
    
    console.log('\nPhase5完了:', code);
    return code;
}

module.exports = { 
    phase5, 
    phase5Debug,
    OPERATOR_PRECEDENCE,
    RIGHT_ASSOCIATIVE 
};