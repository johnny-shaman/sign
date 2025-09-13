// phases/phase5.js
// Phase5: 多項式を二項演算の組・前置記法に変換する

/**
 * 逆順処理による前置記法への直接変換
 * @param {string} input - Phase5で処理されるコード
 * @returns {string} - 前置記法に変換されたコード
 */
function phase5(input) {
    // =================================================================
    // 逆順処理による前置記法への直接変換
    // =================================================================

    // 前置記法変換のための前処理(共通)
    // - 結合性を反転: 左結合→右結合として、右結合→左結合として扱う
    const precedenceTable = createReversedPrecedenceTable();

    // 改行で分割して各行を独立処理
    const lines = input.split(/\r?\n/);
    const processedLines = lines.map(line => {
        if (!line.trim()) return line; // 空行はそのまま

        // 各行を独立してトークン化
        const tokens = tokenize(line);
        // console.log('トークン化結果:', tokens);

        // 3. 各行で操車場アルゴリズムを適用
        if (tokens.length <= 1) return line; // 単一トークンはそのまま

        // 前置記法変換のための前処理（各行）
        // - tokens配列を逆順にする: tokens.reverse()
        const reversedTokens = [...tokens].reverse(); // 元の配列を保持するためスプレッド演算子使用
        console.log('逆順化トークン:', reversedTokens);

        // 操車場アルゴリズム処理開始
        const outputQueue = [];
        const operatorStack = [];

        // 5-3. 修正された操車場アルゴリズムで直接前置記法を生成
        // - outputQueue: 前置記法の要素を順次格納
        // - operatorStack: 演算子を優先順位で管理
        for (const token of reversedTokens) {
            console.log(`処理中のトークン: ${token}`);

            // 5-3-1. 逆順での開きカッコ処理（元の ']'）
            if (token === ']') {
                operatorStack.push(token);
                console.log(`開きカッコプッシュ: ${token}, Stack: [${operatorStack.join(', ')}]`);
                continue;
            }

            // 5-3-2. 逆順での閉じカッコ処理（元の '[' と '[|'）
            if (token === '[' || token === '[|') {
                // 対応する開きカッコが見つかるまでスタックからポップ
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== ']' && operatorStack[operatorStack.length - 1] !== '|]') {
                    const poppedOperator = operatorStack.pop();
                    outputQueue.push(poppedOperator);
                    console.log(`カッコ内演算子ポップ: ${poppedOperator}, Queue: [${outputQueue.join(', ')}]`);
                }

                // 対応する開きカッコの処理
                if (operatorStack.length > 0) {
                    const poppedBracket = operatorStack.pop();

                    if (poppedBracket === ']') {
                        // 通常のカッコは削除（出力キューには送らない）
                        console.log(`対応する開きカッコ削除: ${poppedBracket}, Stack: [${operatorStack.join(', ')}]`);
                    } else if (poppedBracket === '|]') {
                        // 絶対値は演算子として出力キューに送る
                        outputQueue.push('|_|');  // 絶対値演算子として
                        console.log(`絶対値演算子追加: |_|, Queue: [${outputQueue.join(', ')}]`);
                    }
                }
                continue;
            }

            // 5-3-3. オペランドの場合（数値、識別子）
            // - 直接outputQueueに追加
            // - 例: "123", "variable"
            if (!isOperator(token) && token !== '[' && token !== ']' && token !== '[|' && token !== '|]') {
                outputQueue.push(token);
                console.log(`オペランド追加: ${token}, Queue: [${outputQueue.join(', ')}]`);
                continue;
            }

            // 5-3-4. 通常の演算子の場合
            // - while文でスタックから条件に合う演算子をポップ
            // - shouldPopOperator判定（反転された結合性で判定）:
            //   A. スタックトップの優先度 > 現在の演算子の優先度
            //   B. スタックトップの優先度 = 現在の演算子の優先度 かつ 現在の演算子が右結合（反転後）
            // - ポップした演算子はoutputQueueに追加
            // - 現在の演算子をスタックにプッシュ
            while (operatorStack.length > 0 &&
                shouldPopOperator(operatorStack[operatorStack.length - 1], token, precedenceTable)) {
                const poppedOperator = operatorStack.pop();
                outputQueue.push(poppedOperator);
                console.log(`演算子ポップ: ${poppedOperator}, Queue: [${outputQueue.join(', ')}], Stack: [${operatorStack.join(', ')}]`);
            }

            operatorStack.push(token);
            console.log(`演算子プッシュ: ${token}, Stack: [${operatorStack.join(', ')}]`);
        }

        // 5-4. 残りの演算子をすべて出力
        // - operatorStackが空になるまで全要素をoutputQueueにポップ
        while (operatorStack.length > 0) {
            const remainingOperator = operatorStack.pop();
            outputQueue.push(remainingOperator);
            console.log(`残り演算子ポップ: ${remainingOperator}, Queue: [${outputQueue.join(', ')}]`);
        }

        // 5-5. 結果を逆順にして前置記法を完成
        // - outputQueue.reverse()
        // - Sign言語形式に整形: 演算子を関数形式 [[op] arg1 arg2] に変換
        outputQueue.reverse();
        console.log(`前置記法完成: [${outputQueue.join(', ')}]`);


        // =================================================================
        // 最終整形（Sign言語形式）
        // =================================================================

        // buildPrefixExpression(outputQueue)を呼び出し
        // - 前置記法の配列から Sign言語の [[op] arg1 arg2] 形式に変換
        // - スタックを使って構造化: 演算子が出現したら直前の2要素を取って構造化
        // Sign言語形式に整形
        const signExpression = buildPrefixExpression(outputQueue);
        console.log(`Sign言語形式: ${signExpression}`);

        return signExpression;
    });

    // 4. 処理済みの行を改行で再結合
    return processedLines.join('\n');


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
 * 前置記法変換用に結合性を反転した演算子優先順位テーブルを生成
 * 逆順処理で正しい前置記法を得るために、左結合↔右結合を反転
 * @returns {Object} 結合性が反転された演算子優先順位テーブル
 */
function createReversedPrecedenceTable() {
    const originalTable = createPrecedenceTable();
    const reversedTable = {};

    Object.entries(originalTable).forEach(([operator, info]) => {
        reversedTable[operator] = {
            precedence: info.precedence,
            associativity: info.associativity === 'left' ? 'right' : 'left'
        };
    });
    return reversedTable;
}

/**
 * 入力文字列を空白で分割してトークン配列を作成
 * 初期版では純粋な中置記法のみ対応（ブロック構文は後の実装で追加）
 * @param {string} text - トークン化対象の文字列
 * @returns {Array} トークンの配列
 */
function tokenize(text) {
    const regex = /\[[a-zA-Z0-9_\s,~]+\]|\[\`[^`]*\`\]|\[\||\|\]|[\[\]]|[^ \t\[\]|]+/g;
    /*
    正規表現の構成要素:
     \[[a-zA-Z0-9_\s,]+\]| - カッコ内「識別子、空白、コメント、積、中置~のみ」一つのトークンとして認識
     \[\`[^`]*\`\]        - 文字列[``]を個別トークンとして認識
     \[\|                 - 絶対値開始記号 [| を個別トークンとして認識
     \|\]                 - 絶対値終了記号 |] を個別トークンとして認識
     [\[\]]               - 通常のカッコ [ または ] を個別トークンとして認識
     [^ \t\[\]|]+         - 以下以外の連続する文字をトークンとして認識:
                             スペース（ ）/タブ（\t）/角カッコ（[ ]）/パイプ（|）
    注意: より具体的なパターンを先に記述することで、意図しないマッチを防いでいる
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
 * 反転された結合性で判定することで前置記法を直接生成
 * @param {string} stackTop - スタックトップの演算子
 * @param {string} current - 現在処理中の演算子
 * @param {Object} precedenceTable - 演算子優先順位テーブル（結合性反転済み）
 * @returns {boolean} ポップすべきならtrue、そうでなければfalse
 */
function shouldPopOperator(stackTop, current, precedenceTable) {
    // カッコと絶対値は最低優先度として扱う
    if (stackTop === ']' || stackTop === '|]') return false;
    const stackInfo = precedenceTable[stackTop];
    const currentInfo = precedenceTable[current];

    if (stackInfo.precedence > currentInfo.precedence) return true;
    if (stackInfo.precedence === currentInfo.precedence &&
        currentInfo.associativity === 'right') return true;  // 反転後
    return false;
}

/**
 * 前置記法のトークン配列からSign言語形式に変換
 * スタックを使用して演算子と被演算子を組み立て、[[op] arg1 arg2]形式を構築
 * @param {Array} prefixTokens - 前置記法のトークン配列
 * @returns {string} Sign言語形式の完成した式
 */
function buildPrefixExpression(prefixTokens) {
    // スタックを使用して演算子と被演算子を組み立て
    const stack = [];

    // 前置記法は右から左（末尾から先頭）に向かって処理
    for (let i = prefixTokens.length - 1; i >= 0; i--) {
        const token = prefixTokens[i];
        console.log(`buildPrefix処理中: ${token}, スタック: [${stack.join(', ')}]`);

        if (!isOperator(token)) {
            // 絶対値演算子の特別処理（単項演算子）
            if (token === '|_|') {
                if (stack.length < 1) {
                    throw new Error(`絶対値演算子 ${token} に対する被演算子が不足しています`);
                }
                const arg = stack.pop();
                const expression = `[[|_|] ${arg}]`;
                stack.push(expression);
                console.log(`絶対値処理: ${token}, 結果: ${expression}`);
            } else {
                // オペランドはそのままスタックにプッシュ
                stack.push(token);
                console.log(`オペランドプッシュ: ${token}`);
            }
        } else {
            // 演算子が来たら直前の2要素をpopして [[op] arg1 arg2] を構築
            if (stack.length < 2) {
                throw new Error(`演算子 ${token} に対する被演算子が不足しています`);
            }

            const arg1 = stack.pop();
            const arg2 = stack.pop();
            const expression = `[[${token}] ${arg1} ${arg2}]`;
            stack.push(expression);
            console.log(`演算子処理: ${token}, 結果: ${expression}`);
        }
    }

    if (stack.length !== 1) {
        throw new Error(`式の構築に失敗しました。スタック残余: [${stack.join(', ')}]`);
    }

    // 完成したSign言語式を返す
    return stack[0];
}


//test実行
console.log(phase5(require('fs').readFileSync('./input/testcode_tmp.sn', 'utf8')));

module.exports = { phase5 };

