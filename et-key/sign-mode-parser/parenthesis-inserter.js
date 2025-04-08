// parenthesis-inserter.js
/**
 * Sign言語のトークン配列に適切なカッコを挿入するモジュール
 * 
 * 機能:
 * - トークン配列の構造解析
 * - 演算子優先順位に基づくカッコ挿入
 * - ブロック構造の適切な処理
 * - 特殊演算子の処理
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250404_0
 */

// 演算子優先度情報をインポート
const operatorInfo = require('./operator-precedence');

/**
 * トークン配列にカッコを挿入する
 * 
 * @param {string[]} tokens - カッコを挿入するトークン配列
 * @returns {string[]} カッコが挿入されたトークン配列
 */
function insertParentheses(tokens) {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        return tokens;
    }

    // 1. 初期化フェーズ
    const context = initializeContext();

    // トークン配列のコピーを作成して操作
    let processedTokens = [...tokens];

    try {
        // 2. トークン分類とインデント処理フェーズ
        // インデントをブロック構造に変換
        processedTokens = processIndentation(processedTokens);

        // トークンを分類
        classifyTokens(processedTokens, context);

        // 3. 構造認識フェーズ
        identifyStructures(processedTokens, context);

        // 4. 文字列リテラル処理フェーズ
        processedTokens = processStringLiterals(processedTokens, context);

        // 5. 単項演算子処理フェーズ
        processedTokens = processPrefixOperators(processedTokens, context);
        processedTokens = processPostfixOperators(processedTokens, context);

        // 6. 二項演算子処理フェーズ
        processedTokens = processRightAssociativeOperators(processedTokens, context);
        processedTokens = processLeftAssociativeOperators(processedTokens, context);

        // 7. カッコ挿入実行フェーズ
        processedTokens = applyParentheses(processedTokens, context.parenthesisInsertions);

        // 最終チェック
        validateFinalResult(processedTokens);

        return processedTokens;
    } catch (error) {
        console.error('カッコ挿入処理中にエラーが発生しました:', error);
        // エラーが発生しても元のトークン配列を返す
        return tokens;
    }
}

/**
 * 処理コンテキストを初期化する
 * 
 * @returns {Object} 初期化されたコンテキストオブジェクト
 */
function initializeContext() {
    return {
        // カッコ挿入情報 - {position, token, type} 形式のオブジェクトの配列
        parenthesisInsertions: [],

        // 演算子スタック - 処理中の演算子を格納
        operatorStack: [],

        // 式のスタック - 処理中の式を格納
        expressionStack: [],

        // ブロック情報 - ブロックの開始/終了位置を格納
        blocks: [],

        // 現在のブロックレベル - インデントレベルやブロック階層を追跡
        blockLevel: 0,

        // トークン情報 - 各トークンの種類や位置情報を格納
        tokenInfo: {},

        // 構造情報 - ラムダ式や条件分岐などの特殊構造の情報を格納
        structures: {
            lambdas: [], // ラムダ式の情報 {position, paramStart, paramEnd, bodyStart, bodyEnd}
            conditionals: [], // 条件分岐の情報 {position, conditionStart, conditionEnd, resultStart, resultEnd}
            definitions: [] // 定義の情報 {position, nameStart, nameEnd, valueStart, valueEnd}
        }
    };
}

/**
 * インデント（タブ）に基づいてブロック構造を構築する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @returns {string[]} ブロック構造が適用されたトークン配列
 */
function processIndentation(tokens) {
    if (!tokens || tokens.length === 0) {
        return tokens;
    }

    // 結果を格納する新しい配列
    const result = [];

    // インデントレベル管理
    let currentLevel = 0;
    let previousLevel = 0;

    // トークンを順に処理
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // インデントトークンか確認
        if (token.startsWith('\n\t')) {
            // タブの数を数えてインデントレベルを取得
            const level = getIndentationLevel(token);

            // レベルの変化を処理
            if (level > previousLevel) {
                // レベル増加: 開始括弧を挿入
                for (let j = 0; j < level - previousLevel; j++) {
                    result.push('[');
                }
            } else if (level < previousLevel) {
                // レベル減少: 終了括弧を挿入
                for (let j = 0; j < previousLevel - level; j++) {
                    result.push(']');
                }
            } else {
                // 同じレベル: 前のブロックを閉じて新しいブロックを開始
                // 連続するインデント行は通常、同じ親に属する兄弟要素
                if (i > 0 && tokens[i - 1] !== '[' && tokens[i - 1] !== ']') {
                    // 直前が括弧でなければ、区切りを挿入
                    // 言語仕様に応じてカンマやブロック区切りを選択
                    if (isEndOfStatement(tokens, i - 1)) {
                        // 文の終わりなら新しいブロック
                        result.push(']');
                        result.push('[');
                    } else {
                        // そうでなければリスト要素として扱う
                        if (result[result.length - 1] !== ',') {
                            result.push(',');
                        }
                    }
                }
            }

            // 現在のレベルを更新
            currentLevel = level;
            previousLevel = level;

            // インデントトークン自体は削除
            continue;
        }

        // 通常のトークンをそのまま追加
        result.push(token);
    }

    // 残っているインデントレベルに対応する終了括弧を追加
    for (let j = 0; j < currentLevel; j++) {
        result.push(']');
    }

    return result;
}

/**
 * トークンが文の終わりを示すかどうかを判定する
 * 
 * @param {string[]} tokens - トークン配列
 * @param {number} index - 判定するトークンのインデックス
 * @returns {boolean} 文の終わりの場合はtrue
 */
function isEndOfStatement(tokens, index) {
    if (index < 0 || index >= tokens.length) {
        return false;
    }

    // 文の終わりを示すトークンのリスト
    // Sign言語の仕様に応じて調整が必要
    const statementEndTokens = [';', ':', '?'];

    // 特定のトークンで終わる場合
    if (statementEndTokens.includes(tokens[index])) {
        return true;
    }

    // ブロック終了の場合
    if (tokens[index] === ']' || tokens[index] === '}' || tokens[index] === ')') {
        return true;
    }

    return false;
}

/**
 * トークンを種類別に分類する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 */
function classifyTokens(tokens, context) {
    if (!tokens || tokens.length === 0) {
        return;
    }

    // トークン情報を格納するオブジェクトを初期化
    context.tokenInfo = {};

    // 各トークンを処理
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const info = {
            index: i,
            type: 'unknown',
            precedence: 0
        };

        // 文字列リテラル（バッククォートで囲まれた文字列）
        if (token.startsWith('`') && token.endsWith('`')) {
            info.type = 'string_literal';
        }
        // 数値リテラル
        else if (!isNaN(Number(token)) || (token.startsWith('0x') || token.startsWith('0b') || token.startsWith('0o'))) {
            info.type = 'number_literal';
        }
        // 特殊文字リテラル
        else if (token.startsWith('\\') && token.length > 1) {
            info.type = 'char_literal';
        }
        // ブロック開始
        else if (operatorInfo.isBlockStart(token)) {
            info.type = 'block_start';
        }
        // ブロック終了
        else if (operatorInfo.isBlockEnd(token)) {
            info.type = 'block_end';
        }
        // 前置演算子
        else if (isPrefixOperator(token, tokens, i)) {
            info.type = 'prefix_operator';
            info.precedence = operatorInfo.getPrecedence(token, 'prefix');
        }
        // 後置演算子
        else if (isPostfixOperator(token, tokens, i)) {
            info.type = 'postfix_operator';
            info.precedence = operatorInfo.getPrecedence(token, 'postfix');
        }
        // 中置演算子
        else if (isInfixOperator(token, tokens, i)) {
            info.type = 'infix_operator';
            info.precedence = operatorInfo.getPrecedence(token);

            // 右結合性かどうかを記録
            info.rightAssociative = operatorInfo.isRightAssociative(token);

            // 特殊演算子の分類
            if (token === ':') {
                // コンテキストに応じて定義演算子か条件分岐かを判断
                if (isDefinitionOperator(tokens, i)) {
                    info.type = 'definition_operator';
                } else {
                    info.type = 'conditional_operator';
                }
            } else if (token === '?') {
                info.type = 'lambda_operator';
            }
        }
        // 識別子
        else if (isIdentifier(token)) {
            info.type = 'identifier';
        }

        // トークン情報をコンテキストに格納
        context.tokenInfo[i] = info;
    }
}

/**
 * ブロック構造、ラムダ式、条件分岐などの構造を認識する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 */
function identifyStructures(tokens, context) {
    if (!tokens || tokens.length === 0) {
        return;
    }

    // ブロック構造の追跡
    const blockStack = [];
    context.blocks = [];

    // ラムダ式、条件分岐、定義の構造情報をリセット
    context.structures = {
        lambdas: [],
        conditionals: [],
        definitions: []
    };

    // 各トークンを順に処理
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const tokenInfo = context.tokenInfo[i] || {};

        // ブロック開始トークンの処理
        if (tokenInfo.type === 'block_start') {
            blockStack.push({ start: i, token: token });
        }
        // ブロック終了トークンの処理
        else if (tokenInfo.type === 'block_end') {
            if (blockStack.length > 0) {
                const block = blockStack.pop();
                context.blocks.push({
                    start: block.start,
                    end: i,
                    startToken: block.token,
                    endToken: token
                });
            }
        }

        // ラムダ式の認識
        else if (tokenInfo.type === 'lambda_operator') {
            // ラムダ演算子(?)の左側が引数リスト、右側が本体
            const paramEnd = i - 1;
            let paramStart = findExpressionStart(tokens, context, paramEnd);

            // 本体の範囲を探す
            let bodyStart = i + 1;
            let bodyEnd = findExpressionEnd(tokens, context, bodyStart);

            // ネストされたブロック構造を考慮
            bodyEnd = findCompleteExpressionEnd(tokens, context, bodyStart, bodyEnd);

            // ラムダ式の情報を記録
            context.structures.lambdas.push({
                position: i,
                paramStart: paramStart,
                paramEnd: paramEnd,
                bodyStart: bodyStart,
                bodyEnd: bodyEnd
            });

            // カッコ挿入位置を記録
            recordParenthesisInsertion(paramStart, 'open', '(', context);
            recordParenthesisInsertion(paramEnd + 1, 'close', ')', context);

            // 本体が既にブロックで囲まれているか確認
            const isAlreadyBlocked = isEnclosedInBlock(tokens, context, bodyStart, bodyEnd);
            if (!isAlreadyBlocked) {
                recordParenthesisInsertion(bodyStart, 'open', '[', context);
                recordParenthesisInsertion(bodyEnd + 1, 'close', ']', context);
            }
        }

        // 条件分岐の認識
        else if (tokenInfo.type === 'conditional_operator') {
            // 条件分岐演算子(:)の左側が条件、右側が結果
            const conditionEnd = i - 1;
            let conditionStart = findExpressionStart(tokens, context, conditionEnd);

            // 結果の範囲を探す
            let resultStart = i + 1;
            let resultEnd = findExpressionEnd(tokens, context, resultStart);

            // ネストされた条件分岐を考慮
            resultEnd = findCompleteExpressionEnd(tokens, context, resultStart, resultEnd);

            // 条件分岐の情報を記録
            context.structures.conditionals.push({
                position: i,
                conditionStart: conditionStart,
                conditionEnd: conditionEnd,
                resultStart: resultStart,
                resultEnd: resultEnd
            });

            // カッコ挿入位置を記録
            // 条件部分が既にブロックで囲まれているか確認
            const isConditionBlocked = isEnclosedInBlock(tokens, context, conditionStart, conditionEnd);
            if (!isConditionBlocked) {
                recordParenthesisInsertion(conditionStart, 'open', '[', context);
                recordParenthesisInsertion(conditionEnd + 1, 'close', ']', context);
            }

            // 結果部分が複雑な式なら括弧で囲む
            const isResultBlocked = isEnclosedInBlock(tokens, context, resultStart, resultEnd);
            if (isComplexExpression(tokens, context, resultStart, resultEnd) && !isResultBlocked) {
                recordParenthesisInsertion(resultStart, 'open', '[', context);
                recordParenthesisInsertion(resultEnd + 1, 'close', ']', context);
            }
        }

        // 定義の認識
        else if (tokenInfo.type === 'definition_operator') {
            // 定義演算子(:)の左側が名前、右側が値
            const nameEnd = i - 1;
            let nameStart = findExpressionStart(tokens, context, nameEnd);

            // 値の範囲を探す
            let valueStart = i + 1;
            let valueEnd = findExpressionEnd(tokens, context, valueStart);

            // ネストされた定義を考慮
            valueEnd = findCompleteExpressionEnd(tokens, context, valueStart, valueEnd);

            // 定義の情報を記録
            context.structures.definitions.push({
                position: i,
                nameStart: nameStart,
                nameEnd: nameEnd,
                valueStart: valueStart,
                valueEnd: valueEnd
            });

            // カッコ挿入は定義の場合、値の部分のみ必要に応じて
            const isValueBlocked = isEnclosedInBlock(tokens, context, valueStart, valueEnd);
            if (isComplexExpression(tokens, context, valueStart, valueEnd) && !isValueBlocked) {
                recordParenthesisInsertion(valueStart, 'open', '[', context);
                recordParenthesisInsertion(valueEnd + 1, 'close', ']', context);
            }
        }
    }
}

/**
 * ネスト構造を考慮して式の完全な終了位置を見つける
 * 単純な式の終了位置から、ネストされた構造を含めた本当の終了位置を特定する
 * 
 * @param {string[]} tokens - トークン配列
 * @param {Object} context - 処理コンテキスト
 * @param {number} startPos - 式の開始位置
 * @param {number} initialEndPos - 初期の終了位置
 * @returns {number} 完全な式の終了位置
 */
function findCompleteExpressionEnd(tokens, context, startPos, initialEndPos) {
    {
        // すでに計算された終了位置
        let endPos = initialEndPos;

        // 開始位置から終了位置までのコンテンツを確認
        // ネストされた構造がある場合はそれを考慮
        const openBlocks = [];

        for (let i = startPos; i <= endPos; i++) {
            const tokenInfo = context.tokenInfo[i] || {};

            // ブロック開始トークンを追跡
            if (tokenInfo.type === 'block_start') {
                openBlocks.push({ position: i, token: tokens[i] });
            }
            // ブロック終了トークンを追跡
            else if (tokenInfo.type === 'block_end') {
                if (openBlocks.length > 0) {
                    openBlocks.pop();
                }
            }
            // 特殊な演算子（ラムダ、条件分岐など）を検出
            else if ((tokenInfo.type === 'lambda_operator' ||
                tokenInfo.type === 'conditional_operator' ||
                tokenInfo.type === 'definition_operator') &&
                i < endPos) {
                // 特殊演算子の右側の式を再帰的に検索
                const operatorPos = i;
                const rightStart = operatorPos + 1;
                const rightEnd = findExpressionEnd(tokens, context, rightStart);

                // もし現在の終了位置よりも右側の式の終了位置が大きければ更新
                if (rightEnd > endPos) {
                    endPos = rightEnd;
                }
            }
        }

        // まだ開いているブロックがある場合、それらの閉じ括弧を探す
        for (let i = openBlocks.length - 1; i >= 0; i--) {
            const openBlock = openBlocks[i];

            // このブロックに対応する閉じ括弧を探す
            for (let j = endPos + 1; j < tokens.length; j++) {
                const tokenInfo = context.tokenInfo[j] || {};

                if (tokenInfo.type === 'block_end') {
                    // 対応する閉じ括弧を見つけたら終了位置を更新
                    endPos = j;
                    break;
                }
            }
        }

        return endPos;
    }
}

/**
 * 式が既にブロックで囲まれているかをチェックする
 * カッコの冗長な挿入を避けるために使用する
 * 
 * @param {string[]} tokens - トークン配列
 * @param {Object} context - 処理コンテキスト
 * @param {number} startPos - 式の開始位置
 * @param {number} endPos - 式の終了位置
 * @returns {boolean} ブロックで囲まれている場合はtrue
 */
function isEnclosedInBlock(tokens, context, startPos, endPos) {
    // すでに既存のブロック内にあるかをチェック
    for (const block of context.blocks) {
        if (block.start === startPos - 1 && block.end === endPos + 1) {
            return true;
        }
    }

    // 開始位置の直前と終了位置の直後のトークンを確認
    if (startPos > 0 && endPos < tokens.length - 1) {
        const startInfo = context.tokenInfo[startPos - 1] || {};
        const endInfo = context.tokenInfo[endPos + 1] || {};

        if (startInfo.type === 'block_start' && endInfo.type === 'block_end') {
            return true;
        }
    }

    return false;
}

/**
 * 前置演算子を処理する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 * @returns {string[]} 処理後のトークン配列
 */
function processPrefixOperators(tokens, context) {
    if (!tokens || tokens.length === 0) {
        return tokens;
    }

    // 各トークンを順に処理
    for (let i = 0; i < tokens.length; i++) {
        const tokenInfo = context.tokenInfo[i] || {};

        // 前置演算子を処理
        if (tokenInfo.type === 'prefix_operator') {
            // 演算子の右側のオペランドを見つける
            const rightStart = i + 1;
            if (rightStart >= tokens.length) {
                continue; // 演算子の右側にトークンがない場合はスキップ
            }

            const rightEnd = findExpressionEnd(tokens, context, rightStart);

            // オペランドが複雑な式の場合はカッコで囲む
            if (isComplexExpression(tokens, context, rightStart, rightEnd)) {
                recordParenthesisInsertion(rightStart, 'open', '(', context);
                recordParenthesisInsertion(rightEnd + 1, 'close', ')', context);
            }

            // 前置演算子と右側のオペランド全体をカッコで囲む
            // （必要に応じて調整可能）
            recordParenthesisInsertion(i, 'open', '(', context);
            recordParenthesisInsertion(rightEnd + 1, 'close', ')', context);
        }
    }

    return tokens;
}

/**
 * 後置演算子を処理する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 * @returns {string[]} 処理後のトークン配列
 */
function processPostfixOperators(tokens, context) {
    if (!tokens || tokens.length === 0) {
        return tokens;
    }

    // 各トークンを順に処理
    for (let i = 0; i < tokens.length; i++) {
        const tokenInfo = context.tokenInfo[i] || {};

        // 後置演算子を処理
        if (tokenInfo.type === 'postfix_operator') {
            // 演算子の左側のオペランドを見つける
            const leftEnd = i - 1;
            if (leftEnd < 0) {
                continue; // 演算子の左側にトークンがない場合はスキップ
            }

            const leftStart = findExpressionStart(tokens, context, leftEnd);

            // オペランドが複雑な式の場合はカッコで囲む
            if (isComplexExpression(tokens, context, leftStart, leftEnd)) {
                recordParenthesisInsertion(leftStart, 'open', '(', context);
                recordParenthesisInsertion(leftEnd + 1, 'close', ')', context);
            }

            // 左側のオペランドと後置演算子全体をカッコで囲む
            // （必要に応じて調整可能）
            recordParenthesisInsertion(leftStart, 'open', '(', context);
            recordParenthesisInsertion(i + 1, 'close', ')', context);
        }
    }

    return tokens;
}

/**
 * 右結合演算子を処理する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 * @returns {string[]} 処理後のトークン配列
 */
function processRightAssociativeOperators(tokens, context) {
    if (!tokens || tokens.length === 0) {
        return tokens;
    }

    // 右結合演算子を優先順位の高い順に処理
    const rightAssociativeOperators = Object.keys(context.tokenInfo)
        .map(index => {
            const info = context.tokenInfo[index];
            return { index: parseInt(index), info };
        })
        .filter(item =>
            item.info.type &&
            item.info.type.includes('operator') &&
            item.info.rightAssociative
        )
        .sort((a, b) => b.info.precedence - a.info.precedence); // 優先順位の高い順

    // 各右結合演算子を処理
    for (const operatorInfo of rightAssociativeOperators) {
        const opIndex = operatorInfo.index;
        const operator = tokens[opIndex];

        // 既存の構造情報と重複しないか確認
        if (isPartOfExistingStructure(opIndex, context)) {
            continue;
        }

        // 右結合演算子の左右のオペランドを見つける
        const leftEnd = opIndex - 1;
        const leftStart = findExpressionStart(tokens, context, leftEnd);

        const rightStart = opIndex + 1;
        const rightEnd = findExpressionEnd(tokens, context, rightStart);

        // 左オペランドにカッコを挿入
        if (isComplexExpression(tokens, context, leftStart, leftEnd)) {
            recordParenthesisInsertion(leftStart, 'open', '(', context);
            recordParenthesisInsertion(leftEnd + 1, 'close', ')', context);
        }

        // 右オペランドにカッコを挿入
        if (isComplexExpression(tokens, context, rightStart, rightEnd)) {
            recordParenthesisInsertion(rightStart, 'open', '(', context);
            recordParenthesisInsertion(rightEnd + 1, 'close', ')', context);
        }
    }

    return tokens;
}

/**
 * 左結合演算子を処理する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 * @returns {string[]} 処理後のトークン配列
 */
function processLeftAssociativeOperators(tokens, context) {
    if (!tokens || tokens.length === 0) {
        return tokens;
    }

    // 操車場アルゴリズムの実装
    const operatorStack = [];
    const outputQueue = [];  // 出力キュー

    // 1. トークンを左から右へ処理
    for (let i = 0; i < tokens.length; i++) {
        const tokenInfo = context.tokenInfo[i] || {};

        // オペランド（識別子、リテラルなど）を処理
        if (tokenInfo.type === 'identifier' ||
            tokenInfo.type === 'string_literal' ||
            tokenInfo.type === 'number_literal' ||
            tokenInfo.type === 'char_literal') {
            outputQueue.push({ index: i, token: tokens[i] });
        }
        // ブロック開始を処理
        else if (tokenInfo.type === 'block_start') {
            operatorStack.push({ index: i, token: tokens[i] });
        }
        // ブロック終了を処理
        else if (tokenInfo.type === 'block_end') {
            // ブロック開始が見つかるまでスタックからポップ
            while (operatorStack.length > 0) {
                const topOp = operatorStack[operatorStack.length - 1];
                const topInfo = context.tokenInfo[topOp.index] || {};

                if (topInfo.type === 'block_start') {
                    break;
                }

                // 演算子を出力キューに追加
                operatorStack.pop();
                outputQueue.push(topOp);
            }

            // 対応するブロック開始をポップ
            if (operatorStack.length > 0) {
                operatorStack.pop();
            }
        }
        // 左結合演算子を処理
        else if (tokenInfo.type &&
            tokenInfo.type.includes('infix_operator') &&
            !tokenInfo.rightAssociative) {

            // 既存の構造情報と重複しないか確認
            if (isPartOfExistingStructure(i, context)) {
                continue;
            }

            const currentOperator = tokens[i];
            const currentPrecedence = tokenInfo.precedence;

            // スタックから優先順位の高い演算子を処理（操車場アルゴリズムのコア）
            while (operatorStack.length > 0) {
                const topOp = operatorStack[operatorStack.length - 1];
                const topInfo = context.tokenInfo[topOp.index] || {};

                // ブロック開始なら終了
                if (topInfo.type === 'block_start') {
                    break;
                }

                // 優先順位比較
                if ((topInfo.type && topInfo.type.includes('operator')) &&
                    ((topInfo.precedence > currentPrecedence) ||
                        (topInfo.precedence === currentPrecedence && !topInfo.rightAssociative))) {
                    // 高優先度の演算子を出力キューに追加
                    operatorStack.pop();
                    outputQueue.push(topOp);
                } else {
                    break;
                }
            }

            // 現在の演算子をスタックに追加
            operatorStack.push({ index: i, token: currentOperator });
        }
        // その他の演算子（右結合演算子など）
        else if (tokenInfo.type && tokenInfo.type.includes('operator')) {
            operatorStack.push({ index: i, token: tokens[i] });
        }
    }

    // 残りの演算子をすべて出力キューに追加
    while (operatorStack.length > 0) {
        const operator = operatorStack.pop();
        outputQueue.push(operator);
    }

    // 出力キューを使用して式のカッコ挿入位置を決定
    const expressionStack = [];

    for (const item of outputQueue) {
        const { index, token } = item;
        const tokenInfo = context.tokenInfo[index] || {};

        // オペランドの場合はスタックに追加
        if (tokenInfo.type === 'identifier' ||
            tokenInfo.type === 'string_literal' ||
            tokenInfo.type === 'number_literal' ||
            tokenInfo.type === 'char_literal') {
            expressionStack.push({ start: index, end: index });
        }
        // 演算子の場合は必要な数のオペランドをポップ
        else if (tokenInfo.type && tokenInfo.type.includes('operator')) {
            // 基本的に二項演算子を想定
            if (expressionStack.length >= 2) {
                const right = expressionStack.pop();
                const left = expressionStack.pop();

                // 左右のオペランドと演算子をまとめて式として扱う
                const expr = {
                    start: Math.min(left.start, index, right.start),
                    end: Math.max(left.end, index, right.end),
                    operator: { index, token }
                };

                // 左オペランドにカッコを挿入（必要な場合）
                if (isComplexExpression(tokens, context, left.start, left.end)) {
                    recordParenthesisInsertion(left.start, 'open', '(', context);
                    recordParenthesisInsertion(left.end + 1, 'close', ')', context);
                }

                // 右オペランドにカッコを挿入（必要な場合）
                if (isComplexExpression(tokens, context, right.start, right.end)) {
                    recordParenthesisInsertion(right.start, 'open', '(', context);
                    recordParenthesisInsertion(right.end + 1, 'close', ')', context);
                }

                // 式全体を括弧で囲む
                recordParenthesisInsertion(expr.start, 'open', '(', context);
                recordParenthesisInsertion(expr.end + 1, 'close', ')', context);

                // 新しい式をスタックに追加
                expressionStack.push(expr);
            }
            // 単項演算子の場合
            else if (expressionStack.length >= 1) {
                const operand = expressionStack.pop();

                // オペランドと演算子をまとめて式として扱う
                const expr = {
                    start: Math.min(operand.start, index),
                    end: Math.max(operand.end, index),
                    operator: { index, token }
                };

                // 必要に応じてカッコを挿入
                if (isComplexExpression(tokens, context, operand.start, operand.end)) {
                    recordParenthesisInsertion(operand.start, 'open', '(', context);
                    recordParenthesisInsertion(operand.end + 1, 'close', ')', context);
                }

                // 式全体を括弧で囲む
                recordParenthesisInsertion(expr.start, 'open', '(', context);
                recordParenthesisInsertion(expr.end + 1, 'close', ')', context);

                // 新しい式をスタックに追加
                expressionStack.push(expr);
            }
        }
    }
    return tokens;
}

/**
 * 文字列リテラルを処理する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 * @returns {string[]} 処理後のトークン配列
 */
function processStringLiterals(tokens, context) {
    if (!tokens || tokens.length === 0) {
        return tokens;
    }

    // 各トークンを順に処理
    for (let i = 0; i < tokens.length; i++) {
        const tokenInfo = context.tokenInfo[i] || {};

        // 文字列リテラルや文字リテラルはそのまま利用
        // 必要に応じて特別な処理を追加できる
        if (tokenInfo.type === 'string_literal' || tokenInfo.type === 'char_literal') {
            // 通常は特別な処理は不要
            // 必要に応じてカッコ挿入などをここで行う
        }
    }

    return tokens;
}

/**
 * 記録されたカッコ挿入情報に基づいてトークン配列にカッコを挿入する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Array} insertions - カッコ挿入情報の配列
 * @returns {string[]} カッコ挿入後のトークン配列
 */
function applyParentheses(tokens, insertions) {
    if (!tokens || !insertions || insertions.length === 0) {
        return tokens;
    }

    // トークン配列のコピーを作成
    const result = [...tokens];

    // 挿入位置の混乱を避けるため、位置の降順でソート（後ろから挿入）
    insertions.sort((a, b) => b.position - a.position);

    // 重複排除のために挿入済み位置を記録
    const insertedPositions = new Set();

    // 各挿入情報を処理
    for (const insertion of insertions) {
        const { position, token, type } = insertion;

        // 範囲外チェック
        if (position < 0 || position > result.length) {
            continue;
        }

        // 重複チェック - 同じ位置に同じタイプのカッコを挿入しない
        const posKey = `${position}-${type}`;
        if (insertedPositions.has(posKey)) {
            continue;
        }

        // カッコを挿入
        result.splice(position, 0, token);

        // 挿入済み位置を記録
        insertedPositions.add(posKey);
    }

    return result;
}

/**
 * 最終的なトークン配列を検証する
 * 
 * @param {string[]} tokens - 検証するトークン配列
 * @returns {boolean} 検証結果
 */
function validateFinalResult(tokens) {
    if (!tokens || tokens.length === 0) {
        return false;
    }

    // ブロック開始トークンと終了トークンのバランスをチェック
    const stack = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // ブロック開始トークンならスタックに追加
        if (operatorInfo.isBlockStart(token)) {
            stack.push({
                token,
                index: i,
                expected: operatorInfo.getMatchingBlockEnd(token)
            });
        }
        // ブロック終了トークンならスタックから対応する開始トークンを取り出す
        else if (operatorInfo.isBlockEnd(token)) {
            if (stack.length === 0) {
                console.warn(`検証エラー: 対応する開始トークンがない終了トークン '${token}' (位置: ${i})`);
                return false;
            }

            const start = stack.pop();
            if (start.expected !== token) {
                console.warn(`検証エラー: ブロックの対応が不正 - '${start.token}' (位置: ${start.index}) に対して '${token}' (位置: ${i})`);
                return false;
            }
        }
    }

    // スタックが空でない場合、閉じられていないブロックがある
    if (stack.length > 0) {
        console.warn(`検証エラー: ${stack.length}個の閉じられていないブロックがあります`);
        return false;
    }

    return true;
}

// 補助関数
/**
 * トークンが演算子かどうかを判定する
 * 
 * @param {string} token - 判定するトークン
 * @param {string|null} type - 演算子タイプ (prefix, infix, postfix)
 * @returns {boolean} 演算子の場合はtrue
 */
function isOperator(token, type = null) {
    if (!token) return false;

    if (type === 'prefix') {
        return operatorInfo.isPrefixOperator(token);
    } else if (type === 'infix') {
        return operatorInfo.isInfixOperator(token);
    } else if (type === 'postfix') {
        return operatorInfo.isPostfixOperator(token);
    }

    // タイプ指定なしの場合は、すべての演算子タイプをチェック
    return operatorInfo.isOperator(token);
}

/**
 * 文脈に基づいてトークンが前置演算子かどうかを判定する
 * 
 * @param {string} token - 判定するトークン
 * @param {string[]} tokens - トークン配列
 * @param {number} index - 現在のトークンインデックス
 * @returns {boolean} 前置演算子の場合はtrue
 */
function isPrefixOperator(token, tokens, index) {
    // 前置演算子の候補リストに含まれるか確認
    if (!operatorInfo.PREFIX_OPERATORS.includes(token)) {
        return false;
    }

    // トークン配列の先頭にある場合は常に前置演算子
    if (index === 0) {
        return true;
    }

    // 前のトークンをチェック
    const prevToken = tokens[index - 1];

    // チルダ(~)の特殊処理
    if (token === '~') {
        // 前のトークンが識別子で、直後に?が続く場合は前置演算子（残余引数構文）
        if (isIdentifier(prevToken) &&
            index + 1 < tokens.length &&
            tokens[index + 1] === '?') {
            return true;
        }

        // 前のトークンが空白や演算子なら前置演算子
        if (operatorInfo.isOperator(prevToken) ||
            operatorInfo.isBlockStart(prevToken) ||
            prevToken === ',') {
            return true;
        }

        // それ以外は前置演算子ではない（中置または後置）
        return false;
    }

    // 前のトークンがブロック開始や別の演算子なら前置演算子
    if (operatorInfo.isBlockStart(prevToken) ||
        operatorInfo.isOperator(prevToken) ||
        prevToken === ',') {
        return true;
    }

    // その他の場合は前置演算子ではない
    return false;
}

/**
 * 文脈に基づいてトークンが後置演算子かどうかを判定する
 * 
 * @param {string} token - 判定するトークン
 * @param {string[]} tokens - トークン配列
 * @param {number} index - 現在のトークンインデックス
 * @returns {boolean} 後置演算子の場合はtrue
 */
function isPostfixOperator(token, tokens, index) {
    // 後置演算子の候補リストに含まれるか確認
    if (!operatorInfo.POSTFIX_OPERATORS.includes(token)) {
        return false;
    }

    // トークン配列の末尾にある場合は常に後置演算子
    if (index === tokens.length - 1) {
        return true;
    }

    // 次のトークンをチェック
    const nextToken = tokens[index + 1];

    // チルダ(~)の特殊処理
    if (token === '~') {
        // 前のトークンが識別子または閉じ括弧の場合は後置演算子（展開構文）
        const prevToken = index > 0 ? tokens[index - 1] : null;
        if (prevToken && (isIdentifier(prevToken) || operatorInfo.isBlockEnd(prevToken))) {
            // 次のトークンが演算子や区切り文字なら後置演算子
            if (operatorInfo.isOperator(nextToken) ||
                operatorInfo.isBlockEnd(nextToken) ||
                nextToken === ',') {
                return true;
            }
        }

        // それ以外は後置演算子ではない
        return false;
    }

    // 次のトークンがブロック終了や別の演算子なら後置演算子
    if (operatorInfo.isBlockEnd(nextToken) ||
        operatorInfo.isOperator(nextToken) ||
        nextToken === ',') {
        return true;
    }

    // その他の場合は後置演算子ではない
    return false;
}

/**
 * 文脈に基づいてトークンが中置演算子かどうかを判定する
 * 
 * @param {string} token - 判定するトークン
 * @param {string[]} tokens - トークン配列
 * @param {number} index - 現在のトークンインデックス
 * @returns {boolean} 中置演算子の場合はtrue
 */
function isInfixOperator(token, tokens, index) {
    // 中置演算子の候補リストに含まれるか確認
    if (!operatorInfo.INFIX_OPERATORS.includes(token)) {
        return false;
    }

    // トークン配列の先頭または末尾にある場合は中置演算子ではない
    if (index === 0 || index === tokens.length - 1) {
        return false;
    }

    // 特殊ケース: チルダ(~)の場合、文脈によって異なる
    if (token === '~') {
        // 前後のトークンをチェック
        const prevToken = tokens[index - 1];
        const nextToken = tokens[index + 1];

        // 前のトークンがリテラルまたは識別子で、次のトークンもリテラルまたは識別子なら中置演算子
        // （範囲リスト構文 a ~ b）
        if ((isIdentifier(prevToken) ||
            isLiteral(prevToken, context, index - 1) ||
            operatorInfo.isBlockEnd(prevToken)) &&
            (isIdentifier(nextToken) ||
                isLiteral(nextToken, context, index + 1) ||
                operatorInfo.isBlockStart(nextToken))) {
            return true;
        }

        // 上記以外は中置演算子ではない
        return false;
    }

    // 前後のトークンをチェック
    const prevToken = tokens[index - 1];
    const nextToken = tokens[index + 1];

    // 前後のトークンがブロック開始/終了や演算子でなければ中置演算子
    const validPrev = !operatorInfo.isBlockStart(prevToken) &&
        (!operatorInfo.isOperator(prevToken) ||
            operatorInfo.isPostfixOperator(prevToken));

    const validNext = !operatorInfo.isBlockEnd(nextToken) &&
        (!operatorInfo.isOperator(nextToken) ||
            operatorInfo.isPrefixOperator(nextToken));

    return validPrev && validNext;
}


/**
 * トークンがリテラル（文字列、数値、文字）かどうかを判定する
 * 
 * @param {string} token - 判定するトークン
 * @param {Object} context - 処理コンテキスト
 * @param {number} index - トークンのインデックス
 * @returns {boolean} リテラルの場合はtrue
 */
function isLiteral(token, context, index) {
    if (!token) return false;

    const tokenInfo = context.tokenInfo[index] || {};
    return tokenInfo.type === 'string_literal' ||
        tokenInfo.type === 'number_literal' ||
        tokenInfo.type === 'char_literal';
}

/**
 * トークンが定義演算子(:)として使用されているかを判定する
 * 
 * @param {string[]} tokens - トークン配列
 * @param {number} index - 現在のトークンインデックス
 * @returns {boolean} 定義演算子の場合はtrue
 */
function isDefinitionOperator(tokens, index) {
    if (tokens[index] !== ':') {
        return false;
    }

    // 先頭にあるコロンは定義演算子として扱う
    if (index === 0) {
        return true;
    }

    // 前のトークンが識別子かどうかをチェック
    const prevToken = tokens[index - 1];
    return isIdentifier(prevToken);
}

/**
 * トークンが識別子かどうかを判定する
 * 
 * @param {string} token - 判定するトークン
 * @returns {boolean} 識別子の場合はtrue
 */
function isIdentifier(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }

    // 識別子のパターン: 英字または_で始まり、英数字または_を含む
    const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

    // 演算子やキーワードでないことを確認
    const isNotOperator = !operatorInfo.isOperator(token);
    const isNotBlock = !operatorInfo.isBlockStart(token) && !operatorInfo.isBlockEnd(token);

    return pattern.test(token) && isNotOperator && isNotBlock;
}

/**
 * トークンがブロック開始/終了トークンかどうかを判定する
 * 
 * @param {string} token - 判定するトークン
 * @returns {Object|null} ブロックの情報またはnull
 */
function isBlock(token) {
    if (!token) return null;

    if (operatorInfo.isBlockStart(token)) {
        return {
            type: 'start',
            token: token,
            match: operatorInfo.getMatchingBlockEnd(token)
        };
    } else if (operatorInfo.isBlockEnd(token)) {
        return {
            type: 'end',
            token: token,
            match: operatorInfo.getMatchingBlockStart(token)
        };
    }

    return null;
}

/**
 * インデントトークンのレベルを取得する
 * 
 * @param {string} token - インデントトークン
 * @returns {number} インデントレベル（タブの数）
 */
function getIndentationLevel(token) {
    if (!token || typeof token !== 'string') {
        return 0;
    }

    // インデントトークンから改行を取り除く
    const withoutNewline = token.replace('\n', '');

    // タブの数をカウント
    let count = 0;
    for (let i = 0; i < withoutNewline.length; i++) {
        if (withoutNewline[i] === '\t') {
            count++;
        }
    }

    return count;
}

/**
 * 式の開始位置を見つける
 * 
 * @param {string[]} tokens - トークン配列
 * @param {Object} context - 処理コンテキスト
 * @param {number} endPos - 式の終了位置
 * @returns {number} 式の開始位置
 */
function findExpressionStart(tokens, context, endPos) {
    if (endPos <= 0) {
        return 0;
    }

    // ブロック内か確認
    for (const block of context.blocks) {
        // 終了位置がブロック内にある場合
        if (endPos >= block.start && endPos <= block.end) {
            // ブロックの開始位置を返す
            return block.start;
        }
    }

    // トークンの種類を取得
    const tokenInfo = context.tokenInfo[endPos] || {};

    // 識別子や文字列の場合は単一トークン
    if (tokenInfo.type === 'identifier' ||
        tokenInfo.type === 'string_literal' ||
        tokenInfo.type === 'number_literal' ||
        tokenInfo.type === 'char_literal') {
        return endPos;
    }

    // 中置演算子の左側の式を探す
    if (tokenInfo.type && tokenInfo.type.includes('operator')) {
        for (let i = endPos - 1; i >= 0; i--) {
            const prevInfo = context.tokenInfo[i] || {};

            // 別の演算子に到達したら、そこで式の境界
            if (prevInfo.type && prevInfo.type.includes('operator') &&
                prevInfo.precedence >= tokenInfo.precedence) {
                return i + 1;
            }

            // ブロック開始トークンに到達したら、そこで境界
            if (prevInfo.type === 'block_start') {
                return i + 1;
            }
        }
    }

    // デフォルトは現在の位置
    return endPos;
}

/**
 * 式の終了位置を見つける
 * 
 * @param {string[]} tokens - トークン配列
 * @param {Object} context - 処理コンテキスト
 * @param {number} startPos - 式の開始位置
 * @returns {number} 式の終了位置
 */
function findExpressionEnd(tokens, context, startPos) {
    if (startPos >= tokens.length - 1) {
        return tokens.length - 1;
    }

    // ブロック内か確認
    for (const block of context.blocks) {
        // 開始位置がブロック内にある場合
        if (startPos >= block.start && startPos <= block.end) {
            // ブロックの終了位置を返す
            return block.end;
        }
    }

    // トークンの種類を取得
    const tokenInfo = context.tokenInfo[startPos] || {};

    // 識別子や文字列の場合は単一トークン
    if (tokenInfo.type === 'identifier' ||
        tokenInfo.type === 'string_literal' ||
        tokenInfo.type === 'number_literal' ||
        tokenInfo.type === 'char_literal') {
        return startPos;
    }

    // 中置演算子の右側の式を探す
    if (tokenInfo.type && tokenInfo.type.includes('operator')) {
        for (let i = startPos + 1; i < tokens.length; i++) {
            const nextInfo = context.tokenInfo[i] || {};

            // 別の演算子に到達したら、そこで式の境界
            if (nextInfo.type && nextInfo.type.includes('operator') &&
                nextInfo.precedence >= tokenInfo.precedence) {
                return i - 1;
            }

            // ブロック終了トークンに到達したら、そこで境界
            if (nextInfo.type === 'block_end') {
                return i - 1;
            }
        }
    }

    // デフォルトは現在の位置
    return startPos;
}

/**
 * 複雑な式かどうかを判定する
 * 
 * @param {string[]} tokens - トークン配列
 * @param {Object} context - 処理コンテキスト
 * @param {number} startPos - 式の開始位置
 * @param {number} endPos - 式の終了位置
 * @returns {boolean} 複雑な式の場合はtrue
 */
function isComplexExpression(tokens, context, startPos, endPos) {
    // 複数のトークンからなる式は複雑とみなす
    if (endPos - startPos > 0) {
        return true;
    }

    // 演算子を含む式は複雑とみなす
    for (let i = startPos; i <= endPos; i++) {
        const tokenInfo = context.tokenInfo[i] || {};
        if (tokenInfo.type && tokenInfo.type.includes('operator')) {
            return true;
        }
    }

    return false;
}

/**
 * カッコ挿入情報を記録する
 * 
 * @param {number} position - 挿入位置
 * @param {string} type - 挿入タイプ ('open' または 'close')
 * @param {string} bracketToken - カッコトークン
 * @param {Object} context - 処理コンテキスト
 */
function recordParenthesisInsertion(position, type, bracketToken, context) {
    context.parenthesisInsertions.push({
        position: position,
        token: bracketToken,
        type: type
    });
}

/**
 * 指定された範囲内で式の境界を見つける
 * 
 * @param {string[]} tokens - トークン配列
 * @param {Object} context - 処理コンテキスト
 * @param {number} startPos - 開始位置
 * @param {number} endPos - 終了位置
 * @returns {Object} 式の境界情報
 */
function findExpressionBoundaries(tokens, context, startPos, endPos) {
    const start = findExpressionStart(tokens, context, startPos);
    const end = findExpressionEnd(tokens, context, endPos);
    return { start, end };
}

/**
 * 指定されたインデックスのトークンが既存の構造の一部かをチェック
 * 
 * @param {number} index - チェックするトークンのインデックス
 * @param {Object} context - 処理コンテキスト
 * @returns {boolean} 既存の構造の一部である場合はtrue
 */
function isPartOfExistingStructure(index, context) {
    // ラムダ式の一部かチェック
    for (const lambda of context.structures.lambdas || []) {
        if (index === lambda.position ||
            (index >= lambda.paramStart && index <= lambda.paramEnd) ||
            (index >= lambda.bodyStart && index <= lambda.bodyEnd)) {
            return true;
        }
    }

    // 条件分岐の一部かチェック
    for (const cond of context.structures.conditionals || []) {
        if (index === cond.position ||
            (index >= cond.conditionStart && index <= cond.conditionEnd) ||
            (index >= cond.resultStart && index <= cond.resultEnd)) {
            return true;
        }
    }

    // 定義の一部かチェック
    for (const def of context.structures.definitions || []) {
        if (index === def.position ||
            (index >= def.nameStart && index <= def.nameEnd) ||
            (index >= def.valueStart && index <= def.valueEnd)) {
            return true;
        }
    }

    return false;
}

/**
 * 対応するブロック終了トークンを取得する
 * 
 * @param {string} startToken - ブロック開始トークン
 * @returns {string} 対応するブロック終了トークン
 */
function getMatchingBlockEnd(startToken) {
    return operatorInfo.getMatchingBlockEnd(startToken);
}

// モジュールのエクスポート
module.exports = {
    insertParentheses
};