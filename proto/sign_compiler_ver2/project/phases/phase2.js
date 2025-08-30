// phases/phase2.js
// Phase2: トークンにカッコ付けを行う

/**
 * Phase2のトークンカッコ付け処理を実行
 * @param {string} input - Phase1で処理されたコード
 * @returns {string} - トークンにカッコを付けたコード
 */
function phase2(input) {
    let result = input;

    // 1. 文字列を一時的に保護
    const stringMap = new Map();
    result = protectStrings(result, stringMap);

    // 2. 後置演算子付きトークンにカッコ付け
    result = processPostfixOperators(result);

    // 3. 数値処理（1文字の数字は除く）
    result = processNumbers(result);

    console.log('3:----------------------------');
    console.log(result);
    console.log('3:----------------------------');

    // 4. 絶対値内のトークンにカッコ付け
    result = processAbsoluteValues(result);

    console.log('4:----------------------------');
    console.log(result);
    console.log('4:----------------------------');


    // 5. すでにカッコで囲われた部分を処理
    result = processExistingParentheses(result);

    // 6. 空白区切りリスト処理
    result = processSpaceSeparatedLists(result);
    // 7. 文字処理
    result = processCharacters(result);

    // 8. 識別子処理（2文字以上）
    result = processIdentifiers(result);

    // 9. 前置演算子付きトークンにカッコ付け
    result = processPrefixOperators(result);

    // 10. 文字列復元とカッコ付け
    result = restoreAndProcessStrings(result, stringMap);

    return result;
}

/**
 * 文字列を一時的に保護する
 * @param {string} input - 入力文字列
 * @param {Map} stringMap - 文字列マップ
 * @returns {string} - 保護された文字列
 */
function protectStrings(input, stringMap) {
    let result = input;
    let stringCounter = 0;

    // `で囲まれた文字列を保護
    result = result.replace(/`[^`\n\r]*`?/g, (match) => {
        const placeholder = `__STRING_${stringCounter}__`;
        stringMap.set(placeholder, match);
        stringCounter++;
        return placeholder;
    });

    return result;
}

/**
/**
 * 後置演算子付きトークンにカッコ付けを行う
  * @param {string} input - 入力文字列
 * @returns {string} - 後置演算子処理後の文字列
  */
function processPostfixOperators(input) {
    let result = input;

    // 後置演算子: !, ~, @

    // 階乗（後置!）
    result = result.replace(/([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+)!/g, '{$1!}');

    // expand（後置~）
    result = result.replace(/([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+)~/g, '{$1~}');

    // import（後置@）
    result = result.replace(/([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+)@/g, '{$1@}');

    return result;
}

/**
 * 前置演算子付きトークンにカッコ付けを行う
 * @param {string} input - 入力文字列
 * @returns {string} - 前置演算子処理後の文字列
 */
function processPrefixOperators(input) {
    let result = input;

    // 前置演算子: #, !, ~, $, @
    // export（前置#）
    result = result.replace(/#([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+)/g, '{#$1}');

    // not（前置!）
    result = result.replace(/!([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+)/g, '{!$1}');

    // continuous（前置~）
    result = result.replace(/~([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+)/g, '{~$1}');

    // address（前置$）
    result = result.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+)/g, '{$$1}');

    // input（前置@）
    result = result.replace(/@([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|0x[0-9A-Fa-f]+|0o[0-7]+|0b[01]+)/g, '{@$1}');

    return result;
}

/**
 * 絶対値内のトークンにカッコ付けを行う
 * - |123| → |{123}|
 * - |123 + 45| → |{123} + {45}|
 * - ネスト対応
 * - 演算子は囲まない
 */
function processAbsoluteValues(input) {
    const chars = input.split('');
    const stack = [];
    const ranges = [];

    const isTokenChar = c => /[a-zA-Z0-9_.-]/.test(c); // 数字・識別子の一部

    for (let i = 0; i < chars.length; i++) {
        if (chars[i] === '|') {
            const prev = chars[i - 1] || '';
            const next = chars[i + 1] || '';

            const isStart = isTokenChar(next);  // | の直後がトークンなら開始
            const isEnd   = isTokenChar(prev);  // | の直前がトークンなら終了

            if (isStart) {
                stack.push(i);
            } else if (isEnd && stack.length > 0) {
                const start = stack.pop();
                ranges.push([start, i]);
            }
        }
    }

    let result = input;

    // 内側から外側へ（右から左へ処理）
    ranges.sort((a, b) => b[0] - a[0]).forEach(([start, end]) => {
        const inner = result.slice(start + 1, end);

        const processedInner = inner.replace(
            /[a-zA-Z_][a-zA-Z0-9_]*|-?\d+(?:\.\d+)?/g,
            m => (m.startsWith("{") && m.endsWith("}")) ? m : `{${m}}`
        );

        result = result.slice(0, start + 1) + processedInner + result.slice(end);
    });

    return result;
}

/**
 * すでにカッコで囲われた部分を処理
 * @param {string} input - 入力文字列
 * @returns {string} - カッコ処理後の文字列
 */
function processExistingParentheses(input) {
    let result = input;

    // (...)の形式を見つけて、空白区切りリストかどうか判定
    result = result.replace(/\(([^()]+)\)/g, (match, content) => {
        const trimmedContent = content.trim();

        // カンマを含む場合は空白区切りリストではない
        if (trimmedContent.includes(',')) {
            return match; // そのまま
        }

        // 中置演算子を含む場合は空白区切りリストではない
        const infixOperators = ['+', '-', '*', '/', '%', '^', '<', '<=', '=', '>=', '>', '!=', '&', '|', ';', ':', '?', "'", '@'];
        const hasInfixOperator = infixOperators.some(op =>
            trimmedContent.includes(` ${op} `) ||
            trimmedContent.includes(`${op} `) ||
            trimmedContent.includes(` ${op}`)
        );

        if (hasInfixOperator) {
            return match; // そのまま
        }

        // 空白区切りの識別子のみの場合
        const tokens = trimmedContent.split(/\s+/);
        const isSpaceSeparatedIdentifiers = tokens.every(token =>
            /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)
        );

        if (isSpaceSeparatedIdentifiers && tokens.length > 1) {
            return `{(${content})~}`;
        }

        return match; // その他はそのまま
    });

    return result;
}

/**
 * 空白区切りリストを処理（行レベル）
 * @param {string} input - 入力文字列
 * @returns {string} - 空白区切りリスト処理後の文字列
 */
function processSpaceSeparatedLists(input) {
    const lines = input.split('\n');
    const processedLines = [];

    for (let line of lines) {
        // インデント部分を保持
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        const content = line.substring(indent.length);

        // 空行、:で終わる行、?で終わる行はスキップ
        if (!content.trim() || content.trim().endsWith(':') || content.trim().endsWith('?')) {
            processedLines.push(line);
            continue;
        }

        // 既にカッコや{}で処理されている場合はスキップ
        if (content.includes('(') || content.includes('{')) {
            processedLines.push(line);
            continue;
        }

        // 中置演算子を含む場合はスキップ
        const infixOperators = ['+', '-', '*', '/', '%', '^', '<', '<=', '=', '>=', '>', '!=', '&', '|', ';', ':', '?', ',', '~', "'", '@'];
        const hasInfixOperator = infixOperators.some(op =>
            content.includes(` ${op} `) ||
            content.includes(` ${op}`) ||
            content.includes(`${op} `)
        );

        if (hasInfixOperator) {
            processedLines.push(line);
            continue;
        }

        // 空白区切りの複数トークンがある場合
        const tokens = content.trim().split(/\s+/);
        if (tokens.length > 1) {
            // 全て識別子または数値の場合
            const isValidTokens = tokens.every(token =>
                /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) || /^\d+$/.test(token)
            );

            if (isValidTokens) {
                processedLines.push(indent + `{(${content.trim()})~}`);
                continue;
            }
        }

        processedLines.push(line);
    }

    return processedLines.join('\n');
}

/**
 * 数値にカッコ付けを行う（1文字の数字は除く）
 * @param {string} input - 入力文字列
 * @returns {string} - 数値処理後の文字列
 */
function processNumbers(input) {
    let result = input;

    // 16進数（常に処理）
    result = result.replace(/\b0x[0-9A-Fa-f]+\b/g, '{$&}');
    // 8進数（常に処理）
    result = result.replace(/\b0o[0-7]+\b/g, '{$&}');
    // 2進数（常に処理）
    result = result.replace(/\b0b[01]+\b/g, '{$&}');

    // 前後が空白、かつ直前直後が '|' でない数値のみ対象
    result = result.replace(/(?<=\s)(-?\d+\.\d+|-?\d{2,}|-\d)(?=\s)(?!\|)/g,'{$&}');

    return result;
}

/**
 * 文字にカッコ付けを行う
 * @param {string} input - 入力文字列
 * @returns {string} - 文字処理後の文字列
 */
function processCharacters(input) {
    let result = input;

    // \の後に任意の1文字が続く文字リテラルにカッコを追加
    result = result.replace(/\\./g, '{$&}');

    return result;
}

/**
 * 識別子にカッコ付けを行う（2文字以上のみ）
 * @param {string} input - 入力文字列
 * @returns {string} - 識別子処理後の文字列
 */
function processIdentifiers(input) {
    let result = input;

    // 2文字以上の識別子のみカッコ付け
    result = result.replace(/\b[a-zA-Z_][a-zA-Z0-9_]{1,}\b/g, (match) => {
        // 既に{}で囲われている場合はスキップ
        if (result.includes(`{${match}}`)) {
            return match;
        }
        return `{${match}}`;
    });

    return result;
}

/**
 * 文字列の保護を解除してカッコ付けを行う
 * @param {string} input - 入力文字列
 * @param {Map} stringMap - 文字列マップ
 * @returns {string} - 文字列処理後の文字列
 */
function restoreAndProcessStrings(input, stringMap) {
    let result = input;

    // 保護された文字列を復元してカッコを付ける
    for (const [placeholder, originalString] of stringMap) {
        result = result.replace(placeholder, `{${originalString}}`);
    }

    return result;
}

module.exports = { phase2 };