// block-extractor.js
/**
 * Sign言語のソースコードからコードブロックを抽出するモジュール
 * 
 * 機能:
 * - 処理のまとまり（コードブロック）を抽出
 * - インデントによるブロック構造の検出
 * - 各ブロックを独立した処理単位として分離
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250327_0
 */

/**
 * ソースコードから処理のまとまり（コードブロック）を抽出する
 * 
 * @param {string} sourceCode - 前処理済みのソースコード
 * @returns {string[]} 抽出されたコードブロックの配列
 */
function extractCodeBlocks(sourceCode) {
    if (!sourceCode || typeof sourceCode !== 'string') {
        return [];
    }

    // 行ごとに分割
    const lines = sourceCode.split(/\r?\n/);

    // 抽出されたブロックを格納する配列
    const blocks = [];

    // 現在処理中のブロック
    let currentBlock = [];

    // 現在の行がブロックの先頭かどうかを追跡
    let isNewBlock = true;

    // 各行を処理
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 空行はスキップ
        if (line.trim() === '') {
            // ただし、ブロックの途中にある空行は保持
            if (currentBlock.length > 0) {
                currentBlock.push('');
            }
            continue;
        }

        // タブで始まるかチェック
        const startsWithTab = line.startsWith('\t');

        if (isNewBlock || !startsWithTab) {
            // 前のブロックがあれば保存
            if (currentBlock.length > 0) {
                blocks.push(currentBlock.join('\n'));
                currentBlock = [];
            }

            // 新しいブロックの開始
            currentBlock.push(line);
            isNewBlock = false;
        } else {
            // 既存のブロックの続き（インデントされた行）
            currentBlock.push(line);
        }

        // 次の行を先読みしてブロックの区切りを判断
        const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

        if (nextLine === null || // ファイルの終端
            nextLine.trim() === '' || // 空行
            (!nextLine.startsWith('\t') && !startsWithTab)) { // インデントなしの新しい行
            // 次の行が新しいブロックの開始
            isNewBlock = true;
        }
    }

    // 最後のブロックがあれば追加
    if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
    }

    return blocks;
}

/**
 * 抽出されたコードブロックに対して前処理を行う
 * - ブロックを[]で囲む（オプション）
 * - インデントを正規化
 * 
 * @param {string[]} blocks - 抽出されたコードブロックの配列
 * @param {Object} options - 処理オプション
 * @param {boolean} options.wrapWithBrackets - ブロックを[]で囲むかどうか
 * @returns {string[]} 処理されたコードブロックの配列
 */
function processBlocks(blocks, options = { wrapWithBrackets: true }) {
    return blocks.map(block => {
        if (options.wrapWithBrackets) {
            return `[${block}]`;
        }
        return block;
    });
}

/**
 * コードブロックの抽出と前処理を一度に行う
 * 
 * @param {string} sourceCode - 前処理済みのソースコード
 * @param {Object} options - 処理オプション
 * @returns {string[]} 処理されたコードブロックの配列
 */
function extractAndProcessBlocks(sourceCode, options = { wrapWithBrackets: true }) {
    const blocks = extractCodeBlocks(sourceCode);
    return processBlocks(blocks, options);
}

// モジュールとしてエクスポート
module.exports = {
    extractCodeBlocks,
    processBlocks,
    extractAndProcessBlocks
};