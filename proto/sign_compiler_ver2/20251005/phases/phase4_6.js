// phases/phase4_6.js
// Phase4_6: ポイントフリー記法と引数の組み合わせを()で囲う処理

/**
 * 連続するポイントフリー記法とその引数を()で囲み、関数適用として明示化する
 * @param {string} input - Phase4_6で処理されるコード
 * @returns {string} - 処理されたコード
 */
function phase4_6(input) {
    // =================================================================
    // 文字・文字列保護による前処理
    // =================================================================
    
    const protection = protectLiterals(input);
    const protectedInput = protection.protectedText;
    const charMap = protection.charMap;
    const stringMap = protection.stringMap;

    // =================================================================
    // 真の文境界での分割と処理
    // =================================================================

    const lines = protectedInput.split(/\r?\n/);
    
    // ポイントフリー記法と引数のパターン
    const pointfreePattern = /((?:\[\s*(?:(?:(?:-?\d+(?:\.\d+)?)\s+)?(?:<=|>=|!=|==|[+\-*\/%^<>=!&|;,])\s*(?:(?:-?\d+(?:\.\d+)?))?\s*(?:,)?|[!@$~]\s*_?\s*(?:,)?|_\s*[!~@]\s*(?:,)?)\s*\]\s*)+)\s*(\{[^\}]*\}|\[[^\[\]]*\]|-?\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*)?/g;
    
    const processedLines = lines.map(line => {
        // 空行やコメント行はそのまま
        if (!line.trim()) return line;
        if (line.trim().startsWith('`')) return line;

        // インデントを保持
        const indent = line.match(/^[\t ]*/)[0];
        const content = line.substring(indent.length);

        // パターンマッチして()で囲む
        const processed = content.replace(pointfreePattern, (match) => {
            // 既に全体が()で囲まれている場合はそのまま
            if (match.trim().startsWith('(') && match.trim().endsWith(')')) {
                return match;
            }
            
            // ポイントフリー記法内の余計な空白を削除
            const normalized = normalizePointfree(match.trim());
            
            // マッチした部分全体を{}で囲む
            return `(${normalized})`;
        });

        return indent + processed;
    });

    // 処理済みの行を改行で再結合
    let result = processedLines.join('\n');

    // =================================================================
    // 保護解除処理
    // =================================================================

    result = restoreLiterals(result, charMap, stringMap);
    return result;
}

/**
 * ポイントフリー記法内の余計な空白を削除
 * @param {string} text - 正規化対象の文字列
 * @returns {string} 正規化後の文字列
 */
function normalizePointfree(text) {
    // [ の直後の空白を削除
    let normalized = text.replace(/\[\s+/g, '[');
    
    // ] の直前の空白を削除（ただし、, の後の ] の場合は空白を保持しない）
    normalized = normalized.replace(/\s+\]/g, ']');
    
    // 範囲演算子 ~ の前後の空白は保持（[1~3] ではなく [1 ~ 3] の形式を維持）
    // ただし、前置・後置の~演算子の場合は空白を削除済みなので影響なし
    
    return normalized;
}

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
 * @returns {string} 復元後の文字列
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

module.exports = { phase4_6 };