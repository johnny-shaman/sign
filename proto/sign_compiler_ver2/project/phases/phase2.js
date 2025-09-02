// phases/phase2.js
// Phase2: コメントと空行を削除、カッコの統一

/**
 * Phase2のコメントと空行を削除、改行コードとカッコの統一を実行
 * @param {string} input - 入力されたSign言語のコード
 * @returns {string} - 前処理後のコード
 */

function phase2(input) {
        // 改行コードLFに統一し、CRLF(\r\n)またはCR(\r)をLF(\n)に変換後、１行ごとに分割
    return input
        .split('\n')
        .map(
            line => line && line
                .replace(/^((`[\s\S]*)|\n)$/gm, '')
                .replace(
                    /([^`]+)|(`[^`\r\n]*`)/g,
                    (m, c1, c2) => (
                        c1
                        ? c1
                            .replace(/([({])/g, '[')
                            .replace(/([)}])/g, ']')
                        : c2
                    )
                )
        )
        .filter( line => !!line )
        .join('\n');

}

module.exports = { phase2 };
