// phases/phase2.js
// Phase2: コメントと空行を削除、改行コードとカッコの統一

/**
 * Phase2のコメントと空行を削除、改行コードとカッコの統一を実行
 * @param {string} input - 入力されたSign言語のコード
 * @returns {string} - 前処理後のコード
 */
function phase2(input) {
        // 改行コードLFに統一し、CRLF(\r\n)またはCR(\r)をLF(\n)に変換後、１行ごとに分割
    return input
        .replace(/(\r\n)|[\r\n]/g, '\n')
        .split('\n')
        .filter(
            line => (
                !line.startsWith('`') 
                || !!line.trim().length
            )
        )
        .map(
            line => line.replace(
                /([^`]+)|(`[^`\r\n]*`)/g,
                (m, c1, c2) => {
                    return (
                        c1 ? c1.replace(
                            /([(){}])/g,
                            m => {
                                switch (m) {
                                    case '(': case '{': return '['
                                    case ')': case '}': return '['
                                }
                            }
                        )
                        : c2
                    )
                }
            )
        )
        .join('\n');

    //＝＝＝＝＝＝＝＝＝＝＝以下はデッドコードだがバックアップ目的＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    const lins = input
        .replace(/(\r\n)|[\r\n]/g, '\n')
        .split('\n');

    const processedLines = [];

    for (let line of lines) {
        // 1. コメント行の削除（行頭が`で始まる行）
        if (line.trim().startsWith('`')) {
            continue; // コメント行をスキップ
        }

        // 2. 空白行の削除（空行、タブのみ、スペースのみの行）
        if (line.trim() === '') {
            continue; // 空白行をスキップ
        }

        // 3. カッコの統一（文字列内は除く）
        const unifiedLine = unifyBrackets(line);
        processedLines.push(unifiedLine);
    }

    return processedLines.join('\n');

    //＝＝＝＝＝＝＝＝＝＝＝バックアップ目的デッドコードはここまで＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

}

//＝＝＝＝＝＝＝＝＝＝＝以下はデッドコードだがバックアップ目的＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

/**
 * カッコを[]統一する（文字列内は除く）
 * @param {string} line - 処理対象の行
 * @returns {string} - カッコを統一した行
 */

//
function unifyBrackets(line) {
    let result = '';
    let inString = false;
    let stringChar = null;
    let i = 0;

    while (i < line.length) {
        const char = line[i];

        // 文字列の開始・終了判定
        if (char === '`' && !inString) {
            inString = true;
            stringChar = '`';
            result += char;
        } else if (char === '`' && inString && stringChar === '`') {
            inString = false;
            stringChar = null;
            result += char;
        } else if (!inString) {
            // 文字列外でのカッコ統一
            switch (char) {
                case '(':
                case '{':
                    result += '[';
                    break;
                case ')':
                case '}':
                    result += ']';
                    break;
                default:
                    result += char;
                    break;
            }
        } else {
            // 文字列内ではそのまま
            result += char;
        }
        i++;
    }

    return result;
}

//＝＝＝＝＝＝＝＝＝＝＝バックアップ目的デッドコードはここまで＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

module.exports = { phase2 };
