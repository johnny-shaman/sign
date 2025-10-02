// phases/phase6.js
// Phase6: 単項演算子（前置・後置）をラムダ記法に変換し、{}保護を[]に復元する

/**
 * Phase6メイン処理：単項演算子を前置記法に変換
 * Phase5で処理済みの二項演算子構造は保持
 * @param {string} input - Phase6で処理されるコード
 * @returns {string} - 単項演算子が前置記法に変換されたコード
 */
function phase6(input) {
    // =================================================================
    // 文字・文字列保護による前処理
    // =================================================================
    
    const protection = protectLiterals(input);
    const protectedInput = protection.protectedText;
    const charMap = protection.charMap;
    const stringMap = protection.stringMap;

    // =================================================================
    // 1行ずつ処理（Phase5と同様）
    // =================================================================

    const lines = protectedInput.split(/\r?\n/);
    const processedLines = lines.map(line => {
        if (!line.trim()) return line; // 空行はそのまま

        // 空白区切りでトークン化
        const tokens = line.split(/\s+/);
        
        // 各トークンを処理
        const processedTokens = tokens.map(token => {
            if (!token) return token; // 空トークンはスキップ
            
            // 前置演算子パターン: [演算子連続][被演算子]（空白なし）
            // 例: !x, @@$a, #value
            const prefixMatch = token.match(/^([!~#$@]+)([a-zA-Z0-9_]+|\[[^\]]*\]|\{[^{}]*\})$/);
            if (prefixMatch) {
                const operators = prefixMatch[1];
                const operand = prefixMatch[2];
                return processUnaryExpression(operators, operand, 'prefix');
            }
            
            // 後置演算子パターン: [被演算子][演算子連続]（空白なし）
            // 例: x!, value@~, io@
            const postfixMatch = token.match(/^([a-zA-Z0-9_]+|\[[^\]]*\]|\{[^{}]*\})([!~@]+)$/);
            if (postfixMatch) {
                const operand = postfixMatch[1];
                const operators = postfixMatch[2];
                return processUnaryExpression(operators, operand, 'postfix');
            }
            
            // 該当しない場合はそのまま
            return token;
        });
        
        // トークンを再結合
        return processedTokens.join(' ');
    });

    let result = processedLines.join('\n');

    // =================================================================
    // 保護解除処理
    // =================================================================

    result = restoreLiterals(result, charMap, stringMap);
    
    // {}保護を[]に復元
    // result = result.replace(/\{([^{}]*)\}/g, '[$1]');
    
    return result;
}

/**
 * 単項演算子式を操車場アルゴリズムで処理
 * @param {string} operators - 演算子列（例: "@@$"）
 * @param {string} operand - 被演算子（例: "a"）
 * @param {string} type - 'prefix' or 'postfix'
 * @returns {string} - 前置記法の式（例: "[[@_] [[@_] [[$_] a]]]"）
 */
function processUnaryExpression(operators, operand, type) {
    // トークン化：演算子を1文字ずつ分割
    const operatorTokens = operators.split('');
    
    // 操車場アルゴリズムで後置記法を生成
    const postfixTokens = [];
    
    if (type === 'prefix') {
        // 前置演算子: 内側から外側へ処理
        // 例: @@$a → トークン順: ['@', '@', '$', 'a']
        // 後置記法: ['a', '$', '@', '@']（内側の$が先）
        postfixTokens.push(operand);
        // 演算子を逆順にpush（最も内側の演算子が先）
        for (let i = operatorTokens.length - 1; i >= 0; i--) {
            postfixTokens.push(operatorTokens[i]);
        }
    } else {
        // 後置演算子: 内側から外側へ処理
        // 例: a~@ → トークン順: ['a', '~', '@']
        // 後置記法: ['a', '~', '@']（内側の~が先）
        postfixTokens.push(operand);
        operatorTokens.forEach(op => postfixTokens.push(op));
    }
    
    // 後置記法から前置記法へ変換
    return buildPrefixFromPostfixUnary(postfixTokens, type);
}

/**
 * 単項演算子の後置記法から前置記法（Sign言語形式）に変換
 * @param {Array} postfixTokens - 後置記法のトークン配列
 * @param {string} type - 'prefix' or 'postfix'
 * @returns {string} - Sign言語形式の式
 */
function buildPrefixFromPostfixUnary(postfixTokens, type) {
    const stack = [];
    
    for (const token of postfixTokens) {
        if (isUnaryOperator(token)) {
            // 単項演算子の場合、スタックから1つpop
            if (stack.length < 1) {
                throw new Error(`単項演算子 ${token} に対する被演算子が不足しています`);
            }
            
            const arg = stack.pop();
            let expression;
            
            if (type === 'prefix') {
                // 前置演算子: [[op_] arg]
                expression = `[[${token}_] ${arg}]`;
            } else {
                // 後置演算子: [[_op] arg]
                expression = `[[_${token}] ${arg}]`;
            }
            
            stack.push(expression);
        } else {
            // 被演算子はそのままpush
            stack.push(token);
        }
    }
    
    if (stack.length !== 1) {
        throw new Error(`単項演算子式の構築に失敗しました。スタック残余: [${stack.join(', ')}]`);
    }
    
    return stack[0];
}

/**
 * トークンが単項演算子かどうかを判定
 * @param {string} token - 判定対象のトークン
 * @returns {boolean} - 単項演算子ならtrue
 */
function isUnaryOperator(token) {
    const unaryOps = ['!', '~', '#', '$', '@'];
    return unaryOps.includes(token);
}

///////////////////////////////////////////////////////////////////////////////
// 保護・復元関数（Phase5から流用）
///////////////////////////////////////////////////////////////////////////////

/**
 * 文字・文字列リテラルを一時的に置換して保護する
 * @param {string} input - 保護対象の文字列
 * @returns {Object} 保護処理結果 {protectedText, charMap, stringMap}
 */
function protectLiterals(input) {
    let protectedInput = input;
    const charMap = [];
    const stringMap = [];
    let charIndex = 0;
    let stringIndex = 0;

    // 1. 文字リテラル（\+任意の1文字）を一時的に置換
    protectedInput = protectedInput.replace(/\\[\s\S]/g, (match) => {
        charMap[charIndex] = match;
        return `__CHAR_${charIndex++}__`;
    });

    // 2. 文字列リテラル（`...`）を一時的に置換
    protectedInput = protectedInput.replace(/`[^`\r\n]*`/g, (match) => {
        stringMap[stringIndex] = match;
        return `__STRING_${stringIndex++}__`;
    });

    return {
        protectedText: protectedInput,
        charMap: charMap,
        stringMap: stringMap
    };
}

/**
 * 保護されたリテラルを元に戻す
 * @param {string} input - 復元対象の文字列
 * @param {Array} charMap - 文字リテラルのマップ
 * @param {Array} stringMap - 文字列リテラルのマップ
 * @returns {string} - 復元後の文字列
 */
function restoreLiterals(input, charMap, stringMap) {
    let result = input;

    // 文字トークンを元に戻す
    result = result.replace(/__CHAR_(\d+)__/g, (match, index) => {
        return charMap[index] || match;
    });

    // 文字列トークンを元に戻す
    result = result.replace(/__STRING_(\d+)__/g, (match, index) => {
        return stringMap[index] || match;
    });

    return result;
}

//test実行
//console.log(phase6(require('fs').readFileSync('./input/testcode_tmp.sn', 'utf8')));

module.exports = { phase6 };