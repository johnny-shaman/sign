// parser.js
'use strict';

// ====================================================================
// 演算子優先順位テーブル
// ====================================================================
// Sign言語の中置演算子の優先順位と結合性を定義
// precedence: 数値が小さいほど優先順位が低い（後から評価される）
// associativity: 'left' = 左結合、'right' = 右結合
const OperatorList = [
    { ':': { precedence: 2, associativity: 'right' } },   // 定義演算子
    { '#': { precedence: 3, associativity: 'right' } },   // 出力演算子
    { ',': { precedence: 4, associativity: 'right' } },   // 積演算子（リスト構築）
    { '?': { precedence: 7, associativity: 'right' } },   // ラムダ構築演算子
    { '~': { precedence: 8, associativity: 'left' } },    // 範囲演算子
    { ';': { precedence: 11, associativity: 'left' } },   // XOR
    { '|': { precedence: 11, associativity: 'left' } },   // OR
    { '&': { precedence: 12, associativity: 'left' } },   // AND
    { '<': { precedence: 14, associativity: 'left' } },   // 比較演算子
    { '<=': { precedence: 14, associativity: 'left' } },
    { '=': { precedence: 14, associativity: 'left' } },
    { '>=': { precedence: 14, associativity: 'left' } },
    { '>': { precedence: 14, associativity: 'left' } },
    { '!=': { precedence: 14, associativity: 'left' } },
    { '+': { precedence: 15, associativity: 'left' } },   // 加減算
    { '-': { precedence: 15, associativity: 'left' } },
    { '*': { precedence: 16, associativity: 'left' } },   // 乗除算
    { '/': { precedence: 16, associativity: 'left' } },
    { '%': { precedence: 16, associativity: 'left' } },
    { '^': { precedence: 17, associativity: 'right' } },  // 冪乗
    { "'": { precedence: 22, associativity: 'left' } },   // get演算子（左単位元）
    { '@': { precedence: 22, associativity: 'right' } },  // get演算子（右単位元）
];

// 演算子の高速検索用マップを構築
const precedenceMap = new Map(
    OperatorList.map(obj => Object.entries(obj)[0])
);

// ====================================================================
// 汎用ヘルパー関数
// ====================================================================
const isArray = Array.isArray;              // 配列判定
const isEmpty = arr => arr.length === 0;    // 空配列判定
const first = arr => arr[0];                // 先頭要素取得
const last = arr => arr[arr.length - 1];    // 末尾要素取得
const init = arr => arr.slice(0, -1);       // 末尾を除く配列
const tail = arr => arr.slice(1);           // 先頭を除く配列

// ====================================================================
// 演算子判定関数
// ====================================================================

/**
 * トークンが中置演算子かどうかを判定
 * @param {string} token - 判定対象のトークン
 * @returns {boolean} 中置演算子ならtrue
 */
const isOperator = token => precedenceMap.has(token);

/**
 * 演算子の優先順位と結合性の情報を取得
 * @param {string} token - 演算子トークン
 * @returns {Object} { precedence: 優先順位, associativity: 結合性 }
 */
const getOperatorInfo = token => precedenceMap.get(token);

/**
 * ブロック演算子（:または?）かどうかを判定
 * これらの演算子の後に続く配列要素はブロック本体として扱われる
 * @param {string} token - 判定対象のトークン
 * @returns {boolean} ブロック演算子ならtrue
 */
const isBlockOperator = token => token === ':' || token === '?';

// ====================================================================
// 単項演算子の定義と判定
// ====================================================================

// 前置演算子のリスト（!、@、$、#、~、!!）
const prefixOperators = ['!', '@', '$', '#', '~', '!!'];

// 後置演算子のリスト（!、~、@）
const postfixOperators = ['!', '~', '@'];

/**
 * 前置演算子かどうかを判定
 * @param {string} token - 判定対象のトークン
 * @returns {boolean} 前置演算子ならtrue
 */
const isPrefixOperator = token => prefixOperators.includes(token);

/**
 * 後置演算子かどうかを判定
 * @param {string} token - 判定対象のトークン
 * @returns {boolean} 後置演算子ならtrue
 */
const isPostfixOperator = token => postfixOperators.includes(token);

// ====================================================================
// 演算子優先順位解析
// ====================================================================

/**
 * トークン配列内で最も優先順位の低い演算子のインデックスを見つける
 * 同じ優先順位の場合、結合性に従って選択
 * - 左結合: 最初に見つかった演算子（左から右へ評価）
 * - 右結合: 最後に見つかった演算子（右から左へ評価）
 * 
 * @param {Array} tokens - トークン配列
 * @returns {Object} { index: 演算子のインデックス, precedence: 優先順位 }
 */
const findLowestPrecedenceOp = tokens => 
    tokens.reduce(
        ({ index, precedence }, token, i) => 
            // 演算子でない場合は現在の状態を維持
            !isOperator(token) ? { index, precedence }
            // 演算子の場合、優先順位を比較して更新判定
            : (() => {
                const info = getOperatorInfo(token);
                // より低い優先順位が見つかった場合は更新
                return info.precedence < precedence ? { index: i, precedence: info.precedence }
                    // 同じ優先順位で右結合の場合は更新（最後の出現を記録）
                    : info.precedence === precedence && info.associativity === 'right' ? { index: i, precedence }
                    // それ以外は現在の値を維持
                    : { index, precedence };
            })(),
        { index: -1, precedence: Infinity }  // 初期値: 演算子なし
    );

// ====================================================================
// 演算子優先順位に基づくグループ化
// ====================================================================

/**
 * トークン配列を演算子の優先順位に基づいて階層構造にグループ化
 * 
 * 処理の流れ:
 * 1. 配列でない場合 → そのまま返す
 * 2. 空配列 → そのまま返す
 * 3. 要素が1つ → その要素を返す
 * 4. 複数要素:
 *    a. 再帰的に内側の配列を先に処理
 *    b. 最低優先順位の演算子を見つける
 *    c. 演算子がなければ処理済み配列を返す
 *    d. 演算子で左右に分割し、再帰的にグループ化
 * 
 * 例: [1, '+', 2, '*', 3] → [1, '+', [2, '*', 3]]
 * 
 * @param {Array|*} tokens - トークン配列または単一トークン
 * @returns {Array|*} グループ化された構造
 */
const groupByPrecedence = tokens =>
    !isArray(tokens) ? tokens
    : isEmpty(tokens) ? tokens
    : tokens.length === 1 ? first(tokens)
    : (() => {
        // ステップ1: 内側の配列を再帰的に処理
        const processedTokens = tokens.map(token => 
            isArray(token) ? groupByPrecedence(token) : token
        );

        // ステップ2: 最低優先順位の演算子を探す
        const { index: targetIndex } = findLowestPrecedenceOp(processedTokens);

        // ステップ3: 演算子が見つからない場合はそのまま返す
        return targetIndex === -1 ? processedTokens
            : (() => {
                // ステップ4: 演算子で分割
                const left = processedTokens.slice(0, targetIndex);
                const operator = processedTokens[targetIndex];
                const right = processedTokens.slice(targetIndex + 1);

                // 左辺または右辺が空の場合は分割せずに返す
                return isEmpty(left) || isEmpty(right) ? processedTokens
                    // 左辺と右辺を再帰的にグループ化して結合
                    : [
                        left.length === 1 ? first(left) : groupByPrecedence(left),
                        operator,
                        right.length === 1 ? first(right) : groupByPrecedence(right)
                    ];
            })();
    })();

// ====================================================================
// ブロック構造の認識と統合
// ====================================================================

/**
 * 指定位置から連続する配列要素（ブロックの各行）を収集
 * 
 * 配列要素が続く限り収集を続け、配列でない要素が現れたら終了
 * 
 * 例: tokens = [['x', ':', '1'], ['y', ':', '2'], 'z']
 *     startIdx = 0 の場合
 *     → { lines: [['x', ':', '1'], ['y', ':', '2']], count: 2 }
 * 
 * @param {Array} tokens - トークン配列
 * @param {number} startIdx - 開始インデックス
 * @returns {Object} { lines: 収集した行の配列, count: 収集した行数 }
 */
const collectBlockLines = (tokens, startIdx) =>
    tokens.slice(startIdx).reduce(
        ({ lines, count }, token) => 
            // 配列でない要素が現れたら収集終了（現在の状態を維持）
            !isArray(token) ? { lines, count }
            // 配列要素を収集に追加
            : { lines: [...lines, token], count: count + 1 },
        { lines: [], count: 0 }  // 初期値: 空の行リスト、カウント0
    );

/**
 * ブロック内の各行を , 演算子で結合
 * 
 * 複数行を右結合で結合することで、最後の行の値が返される構造を作る
 * 
 * 例:
 * [['a', '+', 'b'], ['c', '*', 'd'], ['e']]
 * ↓
 * [['a', '+', 'b'], ',', [['c', '*', 'd'], ',', 'e']]
 * 
 * @param {Array|*} block - ブロック行の配列または単一要素
 * @returns {Array|*} , で結合された構造
 */
const mergeBlockLines = block =>
    !isArray(block) ? block
    : (() => {
        // 各行のブロック構造を再帰的に処理
        const mergedLines = mergeBlocks(block);
        
        // 1行だけの場合はその行を返す
        return mergedLines.length === 1 ? first(mergedLines)
            // 複数行を右結合で , で結合
            // reduceRight を使って右から左へ結合（右結合）
            // 例: [a, b, c] → [a, ',', [b, ',', c]]
            : mergedLines.reduceRight((acc, curr, idx) => 
                idx === mergedLines.length - 1 ? curr
                : [curr, ',', acc]
            );
    })();

/**
 * ブロック構造を認識して統合（再帰処理版）
 * 
 * 処理の流れ:
 * - 行末が : または ? の場合、次の行以降の配列要素をブロック本体として統合
 * - ブロック本体の各行は , で結合される
 * 
 * 例:
 * [
 *   ['x', ':'],        // ブロック演算子で終わる行
 *   ['a', '+', 'b'],   // ブロック本体の1行目
 *   ['c', '*', 'd']    // ブロック本体の2行目
 * ]
 * ↓
 * [
 *   ['x', ':', [['a', '+', 'b'], ',', ['c', '*', 'd']]]
 * ]
 * 
 * @param {Array} tokens - トークン配列
 * @returns {Array} ブロック構造を統合した配列
 */
const mergeBlocks = tokens => {
    /**
     * 再帰的にトークンを処理する内部関数
     * @param {Array} tokens - 処理対象のトークン配列
     * @param {number} idx - 現在処理中のインデックス
     * @param {Array} result - これまでの処理結果を蓄積
     * @returns {Array} 処理済みトークン配列
     */
    const process = (tokens, idx, result) =>
        // 全要素を処理し終えたら結果を返す
        idx >= tokens.length ? result
        // 配列でない要素はそのまま結果に追加して次へ
        : !isArray(tokens[idx]) ? process(tokens, idx + 1, [...result, tokens[idx]])
        : (() => {
            const current = tokens[idx];
            const lastToken = last(current);
            
            // ブロック演算子で終わっていない場合はそのまま追加して次へ
            return !isBlockOperator(lastToken) ? process(tokens, idx + 1, [...result, current])
                : (() => {
                    // 次の行以降から連続する配列要素（ブロック行）を収集
                    const { lines: blockLines, count } = collectBlockLines(tokens, idx + 1);
                    
                    // ブロック行がない場合はそのまま追加して次へ
                    return isEmpty(blockLines) ? process(tokens, idx + 1, [...result, current])
                        : (() => {
                            // ブロック行を統合して本体を作成
                            const blockContent = mergeBlockLines(blockLines);
                            // [...演算子の左辺, 演算子, ブロック本体] の形に統合
                            const merged = [...init(current), lastToken, blockContent];
                            // ブロック全体をスキップして次へ進む
                            return process(tokens, idx + 1 + count, [...result, merged]);
                        })();
                })();
        })();
    
    return process(tokens, 0, []);
};

// ====================================================================
// 単項演算子の前処理
// ====================================================================

/**
 * 前置演算子がトークンの先頭に付いているかチェック
 * 
 * 例: "!x" → { found: true, operator: "!", operand: "x" }
 * 例: "abc" → { found: false }
 * 
 * @param {string} token - チェック対象のトークン
 * @returns {Object} { found: boolean, operator?: string, operand?: string }
 */
const checkPrefixAttached = token =>
    typeof token !== 'string' ? { found: false }
    : prefixOperators.reduce(
        (result, op) => 
            result.found ? result
            : token.startsWith(op) && token.length > op.length
                ? { found: true, operator: op, operand: token.slice(op.length) }
                : result,
        { found: false }
    );

/**
 * 後置演算子がトークンの末尾に付いているかチェック
 * 
 * 例: "x!" → { found: true, operator: "!", operand: "x" }
 * 例: "abc" → { found: false }
 * 
 * @param {string} token - チェック対象のトークン
 * @returns {Object} { found: boolean, operator?: string, operand?: string }
 */
const checkPostfixAttached = token =>
    typeof token !== 'string' ? { found: false }
    : postfixOperators.reduce(
        (result, op) => 
            result.found ? result
            : token.endsWith(op) && token.length > op.length
                ? { found: true, operator: op, operand: token.slice(0, -op.length) }
                : result,
        { found: false }
    );

/**
 * 単項演算子を前処理して [演算子_, オペランド] 形式に変換
 * 
 * 処理パターン:
 * 1. 前置演算子がリテラルに付着: "!x" → ["!_", "x"]
 * 2. 前置演算子が単独: ["!", "x"] → ["!_", "x"]
 * 3. 後置演算子がリテラルに付着: "x!" → ["x", "_!"]
 * 4. 後置演算子が単独: ["x", "!"] → ["x", "_!"]
 * 
 * @param {Array} tokens - トークン配列
 * @returns {Array} 前処理済みトークン配列
 */
const preprocessUnaryOperators = tokens =>
    !isArray(tokens) ? tokens
    : isEmpty(tokens) ? tokens
    : (() => {
        /**
         * トークンを順次処理する再帰関数
         * @param {number} idx - 現在のインデックス
         * @param {Array} result - これまでの処理結果
         * @returns {Array} 処理済みトークン配列
         */
        const process = (idx, result) =>
            // 全トークンを処理し終えたら結果を返す
            idx >= tokens.length ? result
            : (() => {
                const current = tokens[idx];
                const next = idx + 1 < tokens.length ? tokens[idx + 1] : null;
                const prev = result.length > 0 ? last(result) : null;
                
                // 前置演算子がリテラルに付着している場合
                const prefixCheck = checkPrefixAttached(current);
                return prefixCheck.found 
                    ? process(idx + 1, [...result, [prefixCheck.operator + '_', prefixCheck.operand]])
                    // 前置演算子が単独の場合（ブロックにも対応）
                    : isPrefixOperator(current) && next !== null
                        ? process(idx + 2, [...result, [current + '_', next]])
                        // 後置演算子が単独の場合（ブロックにも対応）
                        : isPostfixOperator(current) && prev !== null
                            ? process(idx + 1, [...init(result), [prev, '_' + current]])
                            // 後置演算子がリテラルに付着している場合
                            : (() => {
                                const postfixCheck = checkPostfixAttached(current);
                                return postfixCheck.found
                                    ? process(idx + 1, [...result, [postfixCheck.operand, '_' + postfixCheck.operator]])
                                    // 通常のトークンはそのまま追加
                                    : process(idx + 1, [...result, current]);
                            })();
            })();
        
        return process(0, []);
    })();

// ====================================================================
// 前置記法への変換
// ====================================================================

/**
 * 中置記法を前置記法（ポーランド記法）に変換
 * 
 * 変換パターン:
 * - 二項演算: [x, +, y] → [[+], x, y]
 * - 前置単項演算: [!_, x] → [[!_], x]
 * - 後置単項演算: [x, _!] → [[_!], x]
 * 
 * 処理の流れ:
 * 1. 配列でない → そのまま返す
 * 2. 空配列 → そのまま返す
 * 3. 要素が1つ → 配列なら再帰処理、そうでなければそのまま
 * 4. 要素が2つ → 単項演算子のパターンをチェック
 * 5. 要素が3つ → 二項演算子のパターンをチェック
 * 6. それ以外 → 各要素を再帰処理
 * 
 * @param {Array|*} tokens - トークン配列または単一トークン
 * @returns {Array|*} 前置記法に変換された構造
 */
const convertToPrefix = tokens =>
    // 配列でない場合はそのまま返す
    !isArray(tokens) ? tokens
    // 空配列はそのまま返す
    : isEmpty(tokens) ? tokens
    // 要素が1つの場合
    : tokens.length === 1 ? (() => {
        const elem = first(tokens);
        // 配列要素なら再帰的に処理、そうでなければそのまま
        return isArray(elem) ? convertToPrefix(elem) : elem;
    })()
    // 要素が2つの場合（単項演算の可能性）
    : tokens.length === 2 ? (() => {
        const [firstElem, secondElem] = tokens;
        
        // 前置単項演算子の形式 [演算子_, オペランド] → [演算子_, オペランド]
        return typeof firstElem === 'string' && firstElem.endsWith('_')
            ? [firstElem, isArray(secondElem) ? convertToPrefix(secondElem) : secondElem]
            // 後置単項演算子の形式 [オペランド, _演算子] → [_演算子, オペランド]
            : typeof secondElem === 'string' && secondElem.startsWith('_')
                ? [secondElem, isArray(firstElem) ? convertToPrefix(firstElem) : firstElem]
                // それ以外の2要素配列は各要素を再帰的に処理
                : [
                    isArray(firstElem) ? convertToPrefix(firstElem) : firstElem,
                    isArray(secondElem) ? convertToPrefix(secondElem) : secondElem
                ];
    })()
    // 要素が3つの場合（二項演算の可能性）
    : tokens.length === 3 ? (() => {
        const [left, operator, right] = tokens;
        
        // 中置演算子の形式 [左辺, 演算子, 右辺] → [演算子, 左辺, 右辺]
        return isOperator(operator)
            ? [
                operator,
                isArray(left) ? convertToPrefix(left) : left,
                isArray(right) ? convertToPrefix(right) : right
            ]
            // 演算子でない場合は各要素を再帰処理
            : tokens.map(token => isArray(token) ? convertToPrefix(token) : token);
    })()
    // それ以外の場合は各要素を再帰的に処理
    : tokens.map(token => isArray(token) ? convertToPrefix(token) : token);

// ====================================================================
// メインパース処理
// ====================================================================

/**
 * トークン配列を構文木に変換
 * 
 * 処理の流れ:
 * 1. ブロック構造の統合（: や ? の後の複数行をブロックとして認識）
 * 2. 各要素を再帰的に処理
 * 3. 単項演算子の前処理（!x → [!_, x] など）
 * 4. 演算子優先順位に基づくグループ化
 * 5. 前置記法への変換
 * 
 * @param {Array|*} tokens - トークン配列または単一トークン
 * @returns {Array|*} パース済みの構文木
 */
const parseTokens = tokens =>
    !isArray(tokens) ? tokens
    : (() => {
        // ステップ1: ブロック構造の統合
        const withBlocks = mergeBlocks(tokens);
        
        // ステップ2: 各要素を再帰的に処理
        const processed = withBlocks.map(element => 
            isArray(element) ? parseTokens(element) : element
        );
        
        // ステップ3: 単項演算子の前処理（この階層のみ）
        const withUnary = preprocessUnaryOperators(processed);
        
        // ステップ4: 演算子優先順位に基づくグループ化
        const grouped = groupByPrecedence(withUnary);
        
        // ステップ5: 前置記法に変換
        return convertToPrefix(grouped);
    })();

/**
 * パーサーのエントリーポイント
 * 
 * レキサーから渡されたトークン配列を受け取り、
 * 構文解析を行って前置記法の構文木を返す
 * 
 * @param {Array} tokensArray - レキサーから渡されたトークン配列
 * @returns {Array} パース済みの構文木（前置記法）
 */
const parse = tokensArray => parseTokens(tokensArray);

// ====================================================================
// エクスポート
// ====================================================================
module.exports = { parse, groupByPrecedence };