// parser.js
'use strict';

// Sign言語の中置演算子優先順位テーブル
const OperatorList = [
    { ':': { precedence: 2, associativity: 'right' } },
    { '#': { precedence: 3, associativity: 'right' } },
    { ',': { precedence: 4, associativity: 'right' } },
    { '?': { precedence: 7, associativity: 'right' } },
    { '~': { precedence: 8, associativity: 'left' } },
    { ';': { precedence: 11, associativity: 'left' } },
    { '|': { precedence: 11, associativity: 'left' } },
    { '&': { precedence: 12, associativity: 'left' } },
    { '<': { precedence: 14, associativity: 'left' } },
    { '<=': { precedence: 14, associativity: 'left' } },
    { '=': { precedence: 14, associativity: 'left' } },
    { '>=': { precedence: 14, associativity: 'left' } },
    { '>': { precedence: 14, associativity: 'left' } },
    { '!=': { precedence: 14, associativity: 'left' } },
    { '+': { precedence: 15, associativity: 'left' } },
    { '-': { precedence: 15, associativity: 'left' } },
    { '*': { precedence: 16, associativity: 'left' } },
    { '/': { precedence: 16, associativity: 'left' } },
    { '%': { precedence: 16, associativity: 'left' } },
    { '^': { precedence: 17, associativity: 'right' } },
    { "'": { precedence: 22, associativity: 'left' } },
    { '@': { precedence: 22, associativity: 'right' } },
];

const precedenceMap = new Map(
    OperatorList.map(obj => Object.entries(obj)[0])
);

function isOperator(token) {
    return precedenceMap.has(token);
}

function getOperatorInfo(token) {
    return precedenceMap.get(token);
}

/**
 * トークン配列を優先順位に基づいてグループ化
 */
function groupByPrecedence(tokens) {
    if (!Array.isArray(tokens)) {
        return tokens;
    }

    if (tokens.length === 0) {
        return tokens;
    }

    if (tokens.length === 1) {
        return tokens[0];
    }

    // 再帰的に内側の配列を先に処理
    const processedTokens = tokens.map(token => 
        Array.isArray(token) ? groupByPrecedence(token) : token
    );

    // 演算子を探す
    let lowestPrecedence = Infinity;
    let targetIndex = -1;

    processedTokens.forEach((token, index) => {
        if (isOperator(token)) {
            const info = getOperatorInfo(token);
            
            if (info.precedence < lowestPrecedence) {
                lowestPrecedence = info.precedence;
                targetIndex = index;
            }
            else if (info.precedence === lowestPrecedence) {
                if (info.associativity === 'right') {
                    targetIndex = index;
                }
            }
        }
    });

    // 演算子が見つからない場合はそのまま返す
    if (targetIndex === -1) {
        return processedTokens;
    }

    // 演算子で分割してグループ化
    const left = processedTokens.slice(0, targetIndex);
    const operator = processedTokens[targetIndex];
    const right = processedTokens.slice(targetIndex + 1);

    if (left.length === 0 || right.length === 0) {
        return processedTokens;
    }

    const groupedLeft = left.length === 1 ? left[0] : groupByPrecedence(left);
    const groupedRight = right.length === 1 ? right[0] : groupByPrecedence(right);

    return [groupedLeft, operator, groupedRight];
}

/**
 * ブロック構造を統合（演算子処理はしない）
 */
function mergeBlocks(tokens) {
    const result = [];
    let i = 0;

    while (i < tokens.length) {
        const current = tokens[i];

        if (!Array.isArray(current)) {
            result.push(current);
            i++;
            continue;
        }

        // 行末が : または ? の場合
        const lastToken = current[current.length - 1];
        
        if ((lastToken === ':' || lastToken === '?')) {
            
            // 次の要素以降で、連続する配列要素を全て取得（ブロックの各行）
            const blockLines = [];
            let j = i + 1;
            while (j < tokens.length && Array.isArray(tokens[j])) {
                blockLines.push(tokens[j]);
                j++;
            }
            
            if (blockLines.length > 0) {
                // ブロック内の各行を,で結合
                const blockContent = mergeBlockLines(blockLines);
                
                // 統合: [...leftSide, operator, blockContent]
                const merged = [...current.slice(0, -1), lastToken, blockContent];
                result.push(merged);
                i = j;  // ブロック全体をスキップ
                continue;
            }
        }

        result.push(current);
        i++;
    }

    return result;
}

/**
 * ブロック内の各行を,で結合（再帰的にブロックもマージ）
 */
function mergeBlockLines(block) {
    if (!Array.isArray(block)) {
        return block;
    }

    // 各行をマージ処理
    const mergedLines = mergeBlocks(block);

    // 1行だけなら展開
    if (mergedLines.length === 1) {
        return mergedLines[0];
    }

    // 複数行を,で結合（右結合）
    return mergedLines.reduceRight((acc, curr, idx) => {
        if (idx === mergedLines.length - 1) {
            return curr;
        }
        return [curr, ',', acc];
    });
}

/**
 * トークン配列を再帰的に処理
 * - ブロック構造の認識と統合
 * - 演算子によるグループ化
 */
function parseTokens(tokens) {
    if (!Array.isArray(tokens)) {
        return tokens;
    }

    // Step 1: ブロック構造を統合
    const withBlocks = mergeBlocks(tokens);
    
    // Step 2: 各要素を再帰処理
    const processed = withBlocks.map(element => 
        Array.isArray(element) ? parseTokens(element) : element
    );
    
    // Step 3: 演算子でグループ化
    return groupByPrecedence(processed);
}

/**
 * メインのパース関数（エントリーポイント）
 */
function parse(tokensArray) {
    return parseTokens(tokensArray);
}

module.exports = { parse, groupByPrecedence };