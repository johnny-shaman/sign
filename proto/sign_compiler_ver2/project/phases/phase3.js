// phases/phase3.js
// Phase3: ブロック構文を判定し、カッコ付けを行う

/**
 * Phase3のブロック構文判定とカッコ付け処理を実行
 * @param {string} input - Phase2で処理されたコード
 * @returns {string} - ブロック構文をカッコ付けしたコード
 */
function phase3(input) {
    return input
        // Step1: ブロック開始行（: または ? で終わる行）の後にインデントがある場合の処理
        .replace(/^(\s*)(.+[:?])\s*\n(\t+.+(?:\n\t+.+)*)/gm, function(match, leadingSpace, blockStart, indentedContent) {
            // インデントされた内容を処理
            const processedContent = processIndentedBlock(indentedContent);
            return `${leadingSpace}${blockStart}\n${processedContent}`;
        })
        // Step2: 処理されたブロックを [] で囲む
        .replace(/^(\s*)(.+[:?])\n(\s*\([^)]+\)(?:\s+\([^)]+\))*)/gm, '$1$2 [$3]')
        // Step3: 余分な空白を整理
        .replace(/\[\s+/g, '[')
        .replace(/\s+\]/g, ']')
        .replace(/\)\s+\(/g, ') (');
}

/**
 * インデントされたブロック内容を処理する
 * @param {string} indentedContent - インデントされたブロック内容
 * @returns {string} - 処理済みの内容
 */
function processIndentedBlock(indentedContent) {
    // 各行を処理
    const lines = indentedContent.split('\n');
    const processedLines = lines.map(line => {
        // タブを除去してから () で囲む
        const content = line.replace(/^\t+/, '');
        if (content.trim()) {
            return `(${content})`;
        }
        return '';
    }).filter(line => line); // 空行を除去

    return processedLines.join(' ');
}

module.exports = { phase3 };