// phases/phase4_5.js
// Phase4_5: 空白区切りのリストをカッコで囲う処理

/**
 * 空白区切りで演算子を含まないトークン列を [...]で囲み、明示的なリスト構造にする
 * @param {string} input - Phase4_5で処理されるコード
 * @returns {string} - リスト化処理されたコード
 */
function phase4_5(input) {
    // =================================================================
    // 文字・文字列保護による前処理
    // =================================================================
    
    const protection = protectLiterals(input);
    const protectedInput = protection.protectedText;
    const charMap = protection.charMap;
    const stringMap = protection.stringMap;

    // console.log('保護処理後:', protectedInput);

    // =================================================================
    // 真の文境界での分割と処理
    // =================================================================

    // 保護処理後の文字列で改行分割（この時点で残っている改行は真の文境界）
    const lines = protectedInput.split(/\r?\n/);
    
    const processedLines = lines.map(line => {
        // 空行やコメント行はそのまま
        if (!line.trim()) return line;
        if (line.trim().startsWith('`')) return line;

        // インデントを保持
        const indent = line.match(/^[\t ]*/)[0];
        const content = line.substring(indent.length);

        // 既にカッコで囲まれている場合はそのまま
        // if (content.match(/^\s*[\[\{\(].*[\]\}\)]\s*$/)) {
            //console.log(`既にカッコで囲まれている、スキップ: ${line}`);
            //return line;
        // }

        // トークン化（phase5から流用）
        const tokens = tokenize(content);
        // console.log('トークン化結果:', tokens);

        // 単一トークンまたは空の場合はそのまま
        if (tokens.length <= 1) return line;

        // 連続する識別子（非演算子）を検出してリスト化
        const resultTokens = [];
        let consecutiveIdentifiers = [];

        for (const token of tokens) {
            if (!isDelimiter(token)) {
                // 識別子の場合、連続区間に追加
                consecutiveIdentifiers.push(token);
            } else {
                // 演算子の場合、これまでの連続区間を処理
                if (consecutiveIdentifiers.length >= 2) {
                    const listExpression = `{${consecutiveIdentifiers.join(' ')}}`;
                    resultTokens.push(listExpression);
                    // console.log(`連続識別子をリスト化: ${consecutiveIdentifiers.join(' ')} → ${listExpression}`);
                } else if (consecutiveIdentifiers.length === 1) {
                    resultTokens.push(consecutiveIdentifiers[0]);
                }
                consecutiveIdentifiers = [];
                resultTokens.push(token);
            }
        }

        // 最後の連続区間も処理
        if (consecutiveIdentifiers.length >= 2) {
            const listExpression = `{${consecutiveIdentifiers.join(' ')}}`;
            resultTokens.push(listExpression);
            // console.log(`最後の連続識別子をリスト化: ${consecutiveIdentifiers.join(' ')} → ${listExpression}`);
        } else if (consecutiveIdentifiers.length === 1) {
            resultTokens.push(consecutiveIdentifiers[0]);
        }

        // 変換済みトークンを結合
        const finalExpression = resultTokens.join(' ');
        // console.log(`最終結果: ${content} → ${finalExpression}`);
        return indent + finalExpression;
    });

    // 処理済みの行を改行で再結合
    let result = processedLines.join('\n');

    // =================================================================
    // 保護解除処理
    // =================================================================

    result = restoreLiterals(result, charMap, stringMap);
    // console.log('保護解除後:', result);
    return result;
}

/**
 * トークンが連続識別子の区切りとなる要素かを判定
 * （演算子、またはブロック/リスト構造）
 * @param {string} token - 判定対象のトークン
 * @returns {boolean} 区切りとなる要素ならtrue
 */
function isDelimiter(token) {
    return isOperator(token) || token === '[' || token === ']';
}

///////////////////////////////////////////////////////////////////////////////
// phase5から流用する演算子定義と補助関数
// ※以下のコードはphase5と同一内容
///////////////////////////////////////////////////////////////////////////////

// phase5と同じ演算子リスト
const OperatorList = [
    { "'": { precedence: 22, associativity: 'left' } },   // get（左単位元）
    { '@': { precedence: 22, associativity: 'right' } },  // get（右単位元）
    { '^': { precedence: 17, associativity: 'right' } },  // 冪乗
    { '*': { precedence: 16, associativity: 'left' } },   // 乗算
    { '/': { precedence: 16, associativity: 'left' } },   // 除算
    { '%': { precedence: 16, associativity: 'left' } },   // 剰余
    { '+': { precedence: 15, associativity: 'left' } },   // 加算
    { '-': { precedence: 15, associativity: 'left' } },   // 減算
    { '<': { precedence: 14, associativity: 'left' } },   // より小さい
    { '<=': { precedence: 14, associativity: 'left' } },  // 以下
    { '=': { precedence: 14, associativity: 'left' } },   // 等しい
    { '==': { precedence: 14, associativity: 'left' } },  // 等しい
    { '>=': { precedence: 14, associativity: 'left' } },  // 以上
    { '>': { precedence: 14, associativity: 'left' } },   // より大きい
    { '!=': { precedence: 14, associativity: 'left' } },  // 等しくない
    { '&': { precedence: 12, associativity: 'left' } },   // 論理積
    { ';': { precedence: 11, associativity: 'left' } },   // 排他的論理和
    { '|': { precedence: 11, associativity: 'left' } },   // 論理和
    { ',': { precedence: 8, associativity: 'right' } },   // 積
    { '?': { precedence: 7, associativity: 'right' } },   // ラムダ構築
    { '#': { precedence: 3, associativity: 'right' } },   // output（中置演算子）
    { ':': { precedence: 2, associativity: 'right' } },   // 定義
];

/**
 * OperatorListから通常の演算子優先順位テーブルを生成
 * ※phase5と同一の関数
 * @returns {Object} 演算子をキーとした優先順位・結合性情報のオブジェクト
 */
function createPrecedenceTable() {
    const table = {};

    OperatorList.forEach(operatorObj => {
        const [operator, info] = Object.entries(operatorObj)[0];
        table[operator] = info;
    });

    return table;
}

/**
 * 入力文字列を空白で分割してトークン配列を作成
 * 初期版では純粋な中置記法のみ対応（ブロック構文は後の実装で追加）
 * @param {string} text - トークン化対象の文字列
 * @returns {Array} トークンの配列
 */
function tokenize(text) {
    const regex = /\([^)]*\)|\{[^{}]*\}|\[[a-zA-Z0-9_\s,~]+\]|\[`[^`\r\n]*`\]|\[\\[\s\S]\]|\[\||\|\]|[\[\]]|[^ \t\[\]|{}()]+/g;
    /*
    正規表現の構成要素:
     \([^)]*\)            - ()で囲まれた部分を一つのトークンとして認識（中に{}を含んでもOK、ネストなし）
     \{[^{}]*\}           - {}で囲まれた部分を一つのトークンとして認識（ネストなし）
     \[[a-zA-Z0-9_\s,~]+\] - カッコ内「識別子、空白、コメント、積、中置~のみ」一つのトークンとして認識
     \[`[^`\r\n]*`\]      - 文字列[``]を個別トークンとして認識
     \[\\[\s\S]\]         - 文字[\]を個別トークンとして認識
     \[\|                 - 絶対値開始記号 [| を個別トークンとして認識
     \|\]                 - 絶対値終了記号 |] を個別トークンとして認識
     [\[\]]               - 通常のカッコ [ または ] を個別トークンとして認識
     [^ \t\[\]|{}()]+     - 以下以外の連続する文字をトークンとして認識:
                             スペース（ ）/タブ（\t）/角カッコ（[ ]）/パイプ（|）/波括弧（{ }）/丸括弧（( )）
    
    制限事項: 
     - ()の中に{}を含めることは可能（例: ([-] {3 1})）
     - {}のネスト（例: {[-] {3 1}}）には対応できません
     - 完全なネスト対応が必要な場合は手動パース実装が必要です
    */
    return text.match(regex) || [];
}

/**
 * 指定されたトークンが演算子かどうかを判定
 * 演算子優先順位テーブルに存在するかで判定
 * ※phase5と同一の関数
 * @param {string} token - 判定対象のトークン
 * @returns {boolean} 演算子ならtrue、そうでなければfalse
 */
function isOperator(token) {
    const precedenceTable = createPrecedenceTable();
    return precedenceTable.hasOwnProperty(token);
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

// テスト実行用（コメントアウト）
// console.log(phase4_5(require('fs').readFileSync('./input/testcode_tmp.sn', 'utf8')));

module.exports = { phase4_5 };