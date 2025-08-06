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
 * ver_20250502_0
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
        // インデントをブロック構造に変換（トークンの\n\tを [ , ] に変換）
        processedTokens = processIndentation(processedTokens);

        // 3. トークンを分類
        classifyTokens(processedTokens, context);

        // 4. 連続リテラル処理
        processConsecutiveLiterals(processedTokens, context);

        // 5. 構造認識フェーズ（ラムダ?と条件:のカッコ挿入あり）
        identifyStructures(processedTokens, context);

        // x. 文字列リテラル処理フェーズ
        //processedTokens = processStringLiterals(processedTokens, context);

        // x. 単項演算子処理フェーズ
        //processedTokens = processPrefixOperators(processedTokens, context);
        //processedTokens = processPostfixOperators(processedTokens, context);

        // 6. 二項演算子処理フェーズ（カッコ挿入あり）
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
            token: token,  // トークン自体も保存
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
 * 連続するリテラル/識別子の処理
 * 複数の連続するリテラルや識別子をグループ化し、適切なカッコで囲む
 * 
 * 主な処理：
 * - スペース区切りの連続リテラル/識別子をグループとして検出
 * - ラムダ引数リスト、関数適用、リスト定義など様々なパターンを判別
 * - 適切なカッコタイプで囲んでグループ化
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 */
function processConsecutiveLiterals(tokens, context) {
    let i = 0;

    // 処理済みの範囲を記録するための配列
    context.processedLiteralGroups = context.processedLiteralGroups || [];

    while (i < tokens.length) {
        // 連続リテラルの開始を特定
        const start = i;
        let end = i;

        // 現在のトークンが演算子またはブロック境界でないことを確認
        const currentTokenInfo = context.tokenInfo[i] || {};
        const isCurrentOperator = currentTokenInfo.type &&
            (currentTokenInfo.type.includes('operator') ||
                currentTokenInfo.type.includes('block'));

        // 現在のトークンが演算子でない場合のみ処理
        if (!isCurrentOperator) {
            // 連続するリテラル/識別子を検出
            while (end + 1 < tokens.length) {
                const nextTokenInfo = context.tokenInfo[end + 1] || {};
                // 次のトークンが演算子またはブロック境界でなければ連続している
                const isNextOperator = nextTokenInfo.type &&
                    (nextTokenInfo.type.includes('operator') ||
                        nextTokenInfo.type.includes('block'));

                if (!isNextOperator) {
                    end++;
                } else {
                    break;
                }
            }

            // 2つ以上のリテラル/識別子が連続している場合、グループとして処理
            if (end > start) {
                // 次のトークンを確認してグループの種類を判断
                const nextPos = end + 1;
                const nextToken = nextPos < tokens.length ? tokens[nextPos] : null;
                const nextTokenInfo = nextPos < tokens.length ? context.tokenInfo[nextPos] || {} : {};

                // ラムダ引数リストの場合 (次が ? 演算子)
                const isLambdaArgs = nextToken === '?' && nextTokenInfo.type === 'lambda_operator';

                // 関数適用の場合 (最初が識別子で残りがリテラル/識別子)
                const isFirstIdentifier = currentTokenInfo.type === 'identifier';
                const isFunctionApplication = isFirstIdentifier && end > start;

                // カッコ挿入情報を記録
                recordParenthesisInsertion(start, 'open', '[', context);
                recordParenthesisInsertion(end + 1, 'close', ']', context);

                // 処理済みの範囲を記録
                context.processedLiteralGroups.push({
                    start: start,
                    end: end,
                    type: isLambdaArgs ? 'lambda_args' :
                        isFunctionApplication ? 'function_application' :
                            'literal_group'
                });
            }
        }

        // 次のトークンへ
        i = end + 1;
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
            // ?演算子の位置
            const lambdaPos = i;

            // 引数部分の範囲特定 - :演算子を探す
            let paramStart = lambdaPos - 1;
            while (paramStart >= 0) {
                // :演算子か、ブロック開始トークンを見つけたら停止
                if (tokens[paramStart] === ':' ||
                    operatorInfo.isBlockStart(tokens[paramStart])) {
                    paramStart++; // :の次、またはブロック開始の次から引数開始
                    break;
                }
                paramStart--;
            }

            // 見つからなければ0を使用
            if (paramStart < 0) paramStart = 0;

            // ラムダの直前が引数末尾
            const paramEnd = lambdaPos - 1;

            // 本体部分の範囲特定
            let bodyStart = lambdaPos + 1;

            // 本体の終了位置を特定
            // 1. 同じブロックレベル内の次の主要演算子まで
            // 2. またはブロック終了位置まで
            let bodyEnd = tokens.length - 1; // デフォルトは最後まで

            // ブロック内か確認
            for (const block of context.blocks) {
                // ラムダ演算子がこのブロック内にある場合
                if (lambdaPos >= block.start && lambdaPos <= block.end) {
                    // ブロック終了位置を本体の終了位置とする
                    bodyEnd = block.end;
                    break;
                }
            }

            // ネストされたブロック構造を考慮
            bodyEnd = findCompleteExpressionEnd(tokens, context, bodyStart, bodyEnd);

            // ラムダ式の情報を記録
            context.structures.lambdas.push({
                position: lambdaPos,
                paramStart: paramStart,
                paramEnd: paramEnd,
                bodyStart: bodyStart,
                bodyEnd: bodyEnd
            });

            // ラムダ式をカッコで囲む（ラムダ全体としては:定義演算子で囲っているため省略）
            // 左辺・引数部分のカッコは processConsecutiveLiterals で処理
            // ここでは右辺・本体部分のカッコを挿入
            recordParenthesisInsertion(bodyStart, 'open', '[', context);
            recordParenthesisInsertion(bodyEnd, 'close', ']', context);
        }


        // 条件分岐の認識
        else if (tokenInfo.type === 'conditional_operator') {
            // インデント処理フェーズで?後ろの\n\tが[に変換、後続の\n\tが,と]に置き換えられるため、それを探す

            // 条件分岐演算子(:)の左側条件
            const conditionEnd = i - 1;
            let conditionStart = -1;
            // 左側の式を探す
            for (let i = conditionEnd; i >= 0; i--) {
                // [または,に到達したら、そこで式の境界
                if (tokens[i].includes('[') | tokens[i].includes(',')) {
                    conditionStart = i + 1;
                    break;
                }
            }

            // 条件分岐演算子(:)の右側結果
            let resultStart = i + 1;
            let resultEnd = -1;
            // 右側の式を探す
            for (let i = resultStart; i >= 0; i++) {
                // ,または]に到達したら、そこで式の境界
                if (tokens[i].includes(']') | tokens[i].includes(',')) {
                    resultEnd = i;
                    break;
                }
            }

            // ネストされた条件分岐を考慮
            // ★最小実装版では考慮しない★
            // resultEnd = findCompleteExpressionEnd(tokens, context, resultStart, resultEnd);

            // 条件分岐の情報を記録
            context.structures.conditionals.push({
                position: i,
                conditionStart: conditionStart,
                conditionEnd: conditionEnd,
                resultStart: resultStart,
                resultEnd: resultEnd
            });


            recordParenthesisInsertion(conditionStart, 'open', '[', context);
            recordParenthesisInsertion(resultEnd, 'close', ']', context);
        }

        // 定義の認識
        else if (tokenInfo.type === 'definition_operator') {
            // ★最小実装では辞書型扱わないので大外のカッコだけで十分、辞書型追加時にここのカッコ追加処理必要★

            // ★定義の場合、右辺全体をカッコで囲う。冗長になる見込みなので後で処理修正予定？★
            if (i === 2) {
                recordParenthesisInsertion(3, 'open', '[', context);
                recordParenthesisInsertion(tokens.length - 1, 'close', ']', context);
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

// /**
//  * 式が既にブロックで囲まれているかをチェックする
//  * カッコの冗長な挿入を避けるために使用する
//  * 
//  * @param {string[]} tokens - トークン配列
//  * @param {Object} context - 処理コンテキスト
//  * @param {number} startPos - 式の開始位置
//  * @param {number} endPos - 式の終了位置
//  * @returns {boolean} ブロックで囲まれている場合はtrue
//  */
// function isEnclosedInBlock(tokens, context, startPos, endPos) {
//     // すでに既存のブロック内にあるかをチェック
//     for (const block of context.blocks) {
//         if (block.start === startPos - 1 && block.end === endPos + 1) {
//             return true;
//         }
//     }

//     // 開始位置の直前と終了位置の直後のトークンを確認
//     if (startPos > 0 && endPos < tokens.length - 1) {
//         const startInfo = context.tokenInfo[startPos - 1] || {};
//         const endInfo = context.tokenInfo[endPos + 1] || {};

//         if (startInfo.type === 'block_start' && endInfo.type === 'block_end') {
//             return true;
//         }
//     }

//     return false;
// }

// /**
//  * 前置演算子を処理する
//  * 
//  * @param {string[]} tokens - 処理対象のトークン配列
//  * @param {Object} context - 処理コンテキスト
//  * @returns {string[]} 処理後のトークン配列
//  */
// function processPrefixOperators(tokens, context) {
//     if (!tokens || tokens.length === 0) {
//         return tokens;
//     }

//     // 各トークンを順に処理
//     for (let i = 0; i < tokens.length; i++) {
//         const tokenInfo = context.tokenInfo[i] || {};

//         // 前置演算子を処理
//         if (tokenInfo.type === 'prefix_operator') {
//             // 演算子の右側のオペランドを見つける
//             const rightStart = i + 1;
//             if (rightStart >= tokens.length) {
//                 continue; // 演算子の右側にトークンがない場合はスキップ
//             }

//             const rightEnd = findExpressionEnd(tokens, context, rightStart);

//             // オペランドが複雑な式の場合はカッコで囲む
//             if (isComplexExpression(tokens, context, rightStart, rightEnd)) {
//                 recordParenthesisInsertion(rightStart, 'open', '(', context);
//                 recordParenthesisInsertion(rightEnd + 1, 'close', ')', context);
//             }

//             // 前置演算子と右側のオペランド全体をカッコで囲む
//             // （必要に応じて調整可能）
//             recordParenthesisInsertion(i, 'open', '(', context);
//             recordParenthesisInsertion(rightEnd + 1, 'close', ')', context);
//         }
//     }

//     return tokens;
// }

// /**
//  * 後置演算子を処理する
//  * 
//  * @param {string[]} tokens - 処理対象のトークン配列
//  * @param {Object} context - 処理コンテキスト
//  * @returns {string[]} 処理後のトークン配列
//  */
// function processPostfixOperators(tokens, context) {
//     if (!tokens || tokens.length === 0) {
//         return tokens;
//     }

//     // 各トークンを順に処理
//     for (let i = 0; i < tokens.length; i++) {
//         const tokenInfo = context.tokenInfo[i] || {};

//         // 後置演算子を処理
//         if (tokenInfo.type === 'postfix_operator') {
//             // 演算子の左側のオペランドを見つける
//             const leftEnd = i - 1;
//             if (leftEnd < 0) {
//                 continue; // 演算子の左側にトークンがない場合はスキップ
//             }

//             const leftStart = findExpressionStart(tokens, context, leftEnd);

//             // オペランドが複雑な式の場合はカッコで囲む
//             if (isComplexExpression(tokens, context, leftStart, leftEnd)) {
//                 recordParenthesisInsertion(leftStart, 'open', '(', context);
//                 recordParenthesisInsertion(leftEnd + 1, 'close', ')', context);
//             }

//             // 左側のオペランドと後置演算子全体をカッコで囲む
//             // （必要に応じて調整可能）
//             recordParenthesisInsertion(leftStart, 'open', '(', context);
//             recordParenthesisInsertion(i + 1, 'close', ')', context);
//         }
//     }

//     return tokens;
// }

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

    // カンマリスト（連続するカンマによるリスト）を特定して処理
    processCommaLists(tokens, context);

    // カンマリストのmin-max保持定義
    let minCommaIndex = -1;
    let maxCommaIndex = -1;

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

        // 既存の構造情報と重複するか確認
        const isPartOfStructure = isPartOfExistingStructure(opIndex, context);

        // 演算子が?でなく、かつラムダ式内部の演算子かどうかをチェック
        const isOperatorInsideLambda = isInsideLambdaBody(opIndex, context);

        // ラムダ式内部の演算子は処理する、それ以外の既存構造の一部は処理しない
        if (isPartOfStructure && !isOperatorInsideLambda) {
            continue;
        }

        // 演算子タイプに応じた範囲計算方法を決定
        let leftStart, rightEnd;

        if (tokens[opIndex] === '^') {
            leftStart = opIndex - 1;
            rightEnd = opIndex + 1;
        } else if (tokens[opIndex] === ',') {
            // 左側は通常通り
            leftStart = opIndex - 1;

            // 処理済みのカンマリストがあるか確認
            if (context.processedCommaOperators && context.processedCommaOperators.size > 0) {
                // カンマリストのmin-maxが初期値でない場合、リスト内最大最小,を探す
                if (minCommaIndex === -1 | maxCommaIndex === -1) {
                    const commaSequence = findCommaSequence(tokens, opIndex, context.processedCommaOperators);
                    minCommaIndex = commaSequence.min;
                    maxCommaIndex = commaSequence.max;
                }

                // 現在のカンマインデックスが最小のインデックスの場合はスキップ（外側カッコ処理済みのため）
                if (minCommaIndex === opIndex) {
                    continue;
                }

                // 現在のカンマインデックスより大きい場合は、次の処理済みカンマを探す
                if (maxCommaIndex > opIndex) {
                    rightEnd = maxCommaIndex + 1; // カンマの直後の右辺位置（共通処理で+1するため）
                } else {
                    rightEnd = maxCommaIndex + 1; // カンマの直後の右辺位置（共通処理で+1するため）
                    //カンマインデックス最大値と判断し、インデックスを初期化
                    minCommaIndex = -1;
                    maxCommaIndex = -1;
                }

            } else {
                // ★処理済みカンマない場合は最小実装版で想定しないため、何もしない★
                continue;
            }
        } else if (tokens[opIndex] === ':') {
            // ★:演算子のカッコはブロック構造に変換で対応済み。最小実装版で他パターン想定しないため、何もしない★
            continue;
        }

        // 式全体をカッコで囲む - 共通処理
        recordParenthesisInsertion(leftStart, 'open', '[', context);
        recordParenthesisInsertion(rightEnd + 1, 'close', ']', context);
    }

    return tokens;
}

/**
 * 指定されたインデックスのトークンがラムダ式の本体内部にあるかをチェック
 * 
 * @param {number} index - チェックするトークンのインデックス
 * @param {Object} context - 処理コンテキスト
 * @returns {boolean} ラムダ式の本体内部にある場合はtrue
 */
function isInsideLambdaBody(index, context) {
    // ラムダ式内部かチェック
    for (const lambda of context.structures.lambdas || []) {
        // ラムダ演算子自体は除外し、本体部分に含まれる場合はtrue
        if (index !== lambda.position &&
            (index > lambda.position && index <= lambda.bodyEnd)) {
            return true;
        }
    }
    return false;
}

/**
 * 連続するカンマ演算子を特定し、リストとして処理する
 * 
 * @param {string[]} tokens - 処理対象のトークン配列
 * @param {Object} context - 処理コンテキスト
 */
function processCommaLists(tokens, context) {
    if (!tokens || tokens.length === 0) {
        return;
    }

    // 連続するカンマの追跡用
    const commaSequences = [];
    let currentSequence = null;

    // 処理済みのカンマ演算子を記録するためのセット
    if (!context.processedCommaOperators) {
        context.processedCommaOperators = new Set();
    }

    // トークンを順に処理して連続するカンマを検出
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const tokenInfo = context.tokenInfo[i] || {};

        // カンマ演算子を検出
        if (token === ',' && tokenInfo.type && tokenInfo.type.includes('operator')) {
            if (!currentSequence) {
                // 新しいシーケンスを開始
                currentSequence = {
                    start: i - 1, // カンマの左側の要素
                    commas: [i],
                    elements: [i - 1] // 最初の要素
                };
            } else {
                // 既存のシーケンスにカンマを追加
                currentSequence.commas.push(i);
                // カンマの右側の要素も追加
                currentSequence.elements.push(i + 1);
            }
        }
        // カンマ以外の演算子または区切り記号が見つかった場合
        else if (
            (tokenInfo.type && tokenInfo.type.includes('operator') && token !== ',') ||
            operatorInfo.isBlockEnd(token) ||
            operatorInfo.isBlockStart(token)
        ) {
            // 現在のシーケンスを確定して新しいシーケンスを開始
            if (currentSequence && currentSequence.commas.length > 0) {
                currentSequence.end = i - 1; // 最後の要素
                commaSequences.push(currentSequence);
                currentSequence = null;
            }
        }
    }

    // 最後のシーケンスを処理
    if (currentSequence && currentSequence.commas.length > 0) {
        currentSequence.end = tokens.length - 1;
        commaSequences.push(currentSequence);
    }

    // 検出されたカンマリストを処理
    for (const sequence of commaSequences) {
        // リストが複数の要素を持つ場合のみ処理
        if (sequence.elements.length > 1) {
            // リスト全体を括弧で囲む
            recordParenthesisInsertion(sequence.start, 'open', '[', context);
            recordParenthesisInsertion(sequence.end + 1, 'close', ']', context);

            // 各カンマ演算子を処理済みとしてマーク
            for (const commaIndex of sequence.commas) {
                context.processedCommaOperators.add(commaIndex);
            }

            // オプション: 内部のカンマにカッコをつけないようにするため、
            // 特別なマーキングを行うこともできます
        }
    }
}

/**
 * 現在のカンマを含む連続カンマシーケンスの最小と最大インデックスを取得
 * 
 * @param {string[]} tokens - トークン配列
 * @param {number} currentIndex - 現在処理中のカンマインデックス
 * @param {Set} processedIndices - 処理済みカンマインデックスのセット
 * @returns {Object} min: 最小インデックス, max: 最大インデックス
 */
function findCommaSequence(tokens, currentIndex, processedIndices) {
    // 処理済みインデックスの配列を取得してソート
    const sortedIndices = [...processedIndices].sort((a, b) => a - b);

    // 現在のインデックスが属するシーケンスを特定
    let sequenceStart = -1;
    let sequenceEnd = -1;
    let currentSequence = [];

    // インデックスの差が2でつながっているものをシーケンスとして特定
    for (let i = 0; i < sortedIndices.length; i++) {
        // 新しいシーケンスの開始
        if (currentSequence.length === 0) {
            currentSequence.push(sortedIndices[i]);
            continue;
        }

        // 連続するインデックスかチェック（リスト要素間のカンマは常に+2の関係）
        const lastIndex = currentSequence[currentSequence.length - 1];
        if (sortedIndices[i] === lastIndex + 2) {
            // 連続するので同じシーケンスに追加
            currentSequence.push(sortedIndices[i]);
        } else {
            // 連続しないので新しいシーケンスとして扱う
            // 現在処理中のインデックスがこのシーケンスに含まれるかチェック
            if (currentSequence.includes(currentIndex)) {
                sequenceStart = currentSequence[0];
                sequenceEnd = currentSequence[currentSequence.length - 1];
                break;
            }

            // 新しいシーケンスを開始
            currentSequence = [sortedIndices[i]];
        }
    }

    // 最後のシーケンスをチェック
    if (sequenceStart === -1 && currentSequence.includes(currentIndex)) {
        sequenceStart = currentSequence[0];
        sequenceEnd = currentSequence[currentSequence.length - 1];
    }

    // シーケンスが見つからなければ、現在のインデックスだけがシーケンス
    if (sequenceStart === -1) {
        sequenceStart = currentIndex;
        sequenceEnd = currentIndex;
    }

    return { min: sequenceStart, max: sequenceEnd };
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

    // 左結合演算子を優先順位の高い順に処理
    const leftAssociativeOperators = Object.keys(context.tokenInfo)
        .map(index => {
            const info = context.tokenInfo[index];
            return { index: parseInt(index), info };
        })
        .filter(item =>
            item.info.type &&
            item.info.type.includes('infix_operator') &&
            !item.info.rightAssociative
        )
        .sort((a, b) => b.info.precedence - a.info.precedence); // 優先順位の高い順

    // 各左結合演算子を処理
    for (const operatorInfo of leftAssociativeOperators) {
        const opIndex = operatorInfo.index;
        const operator = tokens[opIndex];

        // 既存の構造情報と重複するか確認
        // if (isPartOfExistingStructure(opIndex, context)) {
        //     continue;
        // }

        // 演算子の左右のオペランド範囲を特定
        const leftStart = opIndex - 1;
        const rightEnd = opIndex + 1;

        // 左右のオペランドが存在するか確認
        if (leftStart < 0 || rightEnd >= tokens.length) {
            continue;
        }

        // 左右のオペランド全体を特定するために、式の範囲を調べる
        // 左側の式の開始位置を特定
        let leftExprStart = leftStart;
        while (leftExprStart > 0) {
            const prevTokenInfo = context.tokenInfo[leftExprStart - 1] || {};

            // 前のトークンが演算子、ブロック開始、またはカンマの場合は式の境界
            if ((prevTokenInfo.type && prevTokenInfo.type.includes('operator') &&
                prevTokenInfo.precedence <= operatorInfo.info.precedence) ||
                prevTokenInfo.type === 'block_start' ||
                tokens[leftExprStart - 1] === ',') {
                break;
            }
            leftExprStart--;
        }

        // 右側の式の終了位置を特定
        let rightExprEnd = rightEnd;
        while (rightExprEnd < tokens.length - 1) {
            const nextTokenInfo = context.tokenInfo[rightExprEnd + 1] || {};

            // 次のトークンが演算子、ブロック終了、またはカンマの場合は式の境界
            if ((nextTokenInfo.type && nextTokenInfo.type.includes('operator') &&
                nextTokenInfo.precedence <= operatorInfo.info.precedence) ||
                nextTokenInfo.type === 'block_end' ||
                tokens[rightExprEnd + 1] === ',') {
                break;
            }
            rightExprEnd++;
        }

        // 式全体をカッコで囲む
        recordParenthesisInsertion(leftExprStart, 'open', '[', context);
        recordParenthesisInsertion(rightExprEnd + 1, 'close', ']', context);
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

    // 各挿入情報を処理
    for (const insertion of insertions) {
        const { position, token, type } = insertion;

        // 範囲外チェックのみ実施
        if (position < 0 || position > result.length) {
            continue;
        }

        // カッコを挿入（重複チェックなし）
        result.splice(position, 0, token);
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

        // 前後にトークンがあるかを確認
        if (index > 0 && index < tokens.length - 1) {
            // 前が数値リテラルで次も数値リテラルなら、範囲リスト構文
            const isPrevNumber = !isNaN(Number(prevToken));
            const isNextNumber = !isNaN(Number(nextToken));

            if (isPrevNumber && isNextNumber) {
                return true;
            }
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

    // コロンの前後があるか確認
    if (index <= 1 || index >= tokens.length - 1) {
        return false; // index-2 が存在するために index > 1 が必要
    }

    // index-2 の位置にあるトークンが[を含むかどうかを確認()
    const hasTabs = tokens[index - 2] && tokens[index - 2].includes('[');

    // タブを含む場合は条件演算子、そうでなければ定義演算子
    // ★前タブの条件式しか考慮しないため、1行で条件まとめる場合は修正必要★
    if (hasTabs) {
        return true; // 定義演算子
    } else {
        return false; // 条件演算子
    }
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