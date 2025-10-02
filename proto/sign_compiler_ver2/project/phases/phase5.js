// phases/phase5.js
// Phase5: 多項式を二項演算の組・前置記法に変換する

/**
 * 標準的な操車場アルゴリズムによる前置記法への変換
 * @param {string} input - Phase5で処理されるコード
 * @returns {string} - 前置記法に変換されたコード
 */
function phase5(input) {
    // =================================================================
    // 文字・文字列保護による前処理
    // =================================================================

    const protection = protectLiterals(input);
    const protectedInput = protection.protectedText;
    const charMap = protection.charMap;
    const stringMap = protection.stringMap;

    // console.log('Phase5 保護処理後:', protectedInput);

    // =================================================================
    // 標準的な操車場アルゴリズムで後置記法を生成
    // =================================================================

    const precedenceTable = createPrecedenceTable();

    // 改行で分割して各行を独立処理
    const lines = protectedInput.split(/\r?\n/);
    const processedLines = lines.map(line => {
        if (!line.trim()) return line; // 空行はそのまま

        // 各行を独立してトークン化
        const tokens = tokenize(line);

        // 3. 各行で操車場アルゴリズムを適用
        if (tokens.length <= 1) return line; // 単一トークンはそのまま

        // ★ 演算子が含まれていない場合は元のまま返す
        const hasOperator = tokens.some(token => isOperator(token));
        if (!hasOperator) {
            // console.log(`演算子なし、スキップ: ${line}`);
            return line;
        }

        // 標準的な操車場アルゴリズムで後置記法を生成
        const outputQueue = [];
        const operatorStack = [];

        // 標準的な操車場アルゴリズム
        // - outputQueue: 後置記法（RPN）を生成
        // - operatorStack: 演算子を優先順位で管理
        for (const token of tokens) {
            // console.log(`処理中のトークン: ${token}`);

            // 開きカッコ処理
            if (token === '[' || token === '[|') {
                operatorStack.push(token);
                // console.log(`開きカッコプッシュ: ${token}, Stack: [${operatorStack.join(', ')}]`);
                continue;
            }

            // 閉じカッコ処理
            if (token === ']' || token === '|]') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '[' && operatorStack[operatorStack.length - 1] !== '[|') {
                    const poppedOperator = operatorStack.pop();
                    outputQueue.push(poppedOperator);
                    // console.log(`カッコ内演算子ポップ: ${poppedOperator}, Queue: [${outputQueue.join(', ')}]`);
                }

                // 対応する開きカッコの処理
                if (operatorStack.length > 0) {
                    const poppedBracket = operatorStack.pop();

                    if (poppedBracket === '[') {
                        // 通常のカッコは削除（出力キューには送らない）
                        // console.log(`対応する開きカッコ削除: ${poppedBracket}, Stack: [${operatorStack.join(', ')}]`);
                    } else if (poppedBracket === '[|') {
                        // 絶対値は演算子として出力キューに送る
                        outputQueue.push('|_|');  // 絶対値演算子として
                        // console.log(`絶対値演算子追加: |_|, Queue: [${outputQueue.join(', ')}]`);
                    }
                }
                continue;
            }

            // オペランドの場合（数値、識別子）
            // - 直接outputQueueに追加
            // - 例: "123", "variable"
            if (!isOperator(token)) {
                outputQueue.push(token);
                // console.log(`オペランド追加: ${token}, Queue: [${outputQueue.join(', ')}]`);
                continue;
            }

            // 通常の演算子の場合
            // - shouldPopOperator判定:
            //   A. スタックトップの優先度 > 現在の演算子の優先度
            //   B. スタックトップの優先度 = 現在の演算子の優先度 かつ 現在の演算子が左結合
            while (operatorStack.length > 0 &&
                shouldPopOperator(operatorStack[operatorStack.length - 1], token, precedenceTable)) {
                const poppedOperator = operatorStack.pop();
                outputQueue.push(poppedOperator);
                // console.log(`演算子ポップ: ${poppedOperator}, Queue: [${outputQueue.join(', ')}], Stack: [${operatorStack.join(', ')}]`);
            }

            operatorStack.push(token);
            // console.log(`演算子プッシュ: ${token}, Stack: [${operatorStack.join(', ')}]`);
        }

        // 残りの演算子をすべて出力（後置記法の完成）
        // - operatorStackが空になるまで全要素をoutputQueueにポップ
        while (operatorStack.length > 0) {
            const remainingOperator = operatorStack.pop();
            outputQueue.push(remainingOperator);
            // console.log(`残り演算子ポップ: ${remainingOperator}, Queue: [${outputQueue.join(', ')}]`);
        }

        // console.log(`後置記法完成: [${outputQueue.join(', ')}]`);

        // =================================================================
        // 後置記法から前置記法へ変換
        // =================================================================

        const signExpression = buildPrefixFromPostfix(outputQueue);
        // console.log(`Sign言語形式: ${signExpression}`);

        return signExpression;
    });

    // 4. 処理済みの行を改行で再結合
    let result = processedLines.join('\n');

    // =================================================================
    // 保護解除処理
    // =================================================================

    result = restoreLiterals(result, charMap, stringMap);
    // console.log('Phase5 保護解除後:', result);
    return result;


}

///////////////////////////////////////////////////////////////////////////////
// 演算子定義と補助関数
///////////////////////////////////////////////////////////////////////////////

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
 * @param {string} token - 判定対象のトークン
 * @returns {boolean} 演算子ならtrue、そうでなければfalse
 */
function isOperator(token) {
    const precedenceTable = createPrecedenceTable();
    return precedenceTable.hasOwnProperty(token);
}

/**
 * 操車場アルゴリズムでスタックから演算子をポップすべきかを判定
 * 標準的な判定ルール
 * @param {string} stackTop - スタックトップの演算子
 * @param {string} current - 現在処理中の演算子
 * @param {Object} precedenceTable - 演算子優先順位テーブル
 * @returns {boolean} ポップすべきならtrue、そうでなければfalse
 */
function shouldPopOperator(stackTop, current, precedenceTable) {
    // カッコはポップ条件から除外
    if (stackTop === '[' || stackTop === '[|') return false;

    const stackInfo = precedenceTable[stackTop];
    const currentInfo = precedenceTable[current];

    if (stackInfo.precedence > currentInfo.precedence) return true;
    if (stackInfo.precedence === currentInfo.precedence &&
        currentInfo.associativity === 'left') return true;  // 左結合
    return false;
}

/**
 * 後置記法（RPN）から前置記法（Sign言語形式）に変換
 * @param {Array} postfixTokens - 後置記法のトークン配列
 * @returns {string} Sign言語形式の完成した式
 */
function buildPrefixFromPostfix(postfixTokens) {
    const stack = [];

    // 後置記法は左から右に向かって処理
    for (const token of postfixTokens) {
        // console.log(`buildPrefixFromPostfix処理中: ${token}, スタック: [${stack.join(', ')}]`);

        if (!isOperator(token)) {
            if (token === '|_|') {
                // 絶対値演算子の特別処理（単項演算子）
                if (stack.length < 1) {
                    throw new Error(`絶対値演算子 ${token} に対する被演算子が不足しています`);
                }
                const arg = stack.pop();
                const expression = `[[|_|] ${arg}]`;
                stack.push(expression);
                // console.log(`絶対値処理: ${token}, 結果: ${expression}`);
            } else {
                // オペランドはそのままスタックにプッシュ
                stack.push(token);
                // console.log(`オペランドプッシュ: ${token}`);
            }
        } else {
            // 演算子が来たら2要素をpopして [[op] arg1 arg2] を構築
            // 後置記法では arg1 arg2 op なので、スタックからpopすると arg2, arg1 の順
            if (stack.length < 2) {
                console.log(`token: ${token}, stack: ${stack}`);
                throw new Error(`演算子 ${token} に対する被演算子が不足しています`);
            }

            const arg2 = stack.pop();
            const arg1 = stack.pop();
            const expression = `[[${token}] ${arg1} ${arg2}]`;
            stack.push(expression);
            // console.log(`演算子処理: ${token}, 結果: ${expression}`);
        }
    }

    if (stack.length !== 1) {
        throw new Error(`式の構築に失敗しました。スタック残余: [${stack.join(', ')}]`);
    }

    // 完成したSign言語式を返す
    return stack[0];
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


//test実行
// console.log(phase5(require('fs').readFileSync('./input/testcode_tmp.sn', 'utf8')));

module.exports = { phase5 };

