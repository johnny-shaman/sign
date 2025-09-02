// phases/phase2.js
// Phase2: コメントと空行を削除、カッコの統一

/**
 * Phase2のコメントと空行を削除、改行コードとカッコの統一を実行
 * @param {string} input - 入力されたSign言語のコード
 * @returns {string} - 前処理後のコード
 */

function phase2 (input) {
    return input
        .split('\n') //行で分割して配列化
        .map(
                    // バリデーション
            line => line && line 
                // コメントか空行なら空文字列にする
                .replace(/^((`[\s\S]*)|\n)$/gm, '')
                // カッコ統一のための置換処理
                .replace(
                    /([^`]+)|`[^`\r\n]*`/g,
                    (m, c1) => (
                        c1
                        ? c1
                            .replace(/(?<!\\)([({])/g, '[')
                            .replace(/(?<!\\)([)}])/g, ']')
                        : m
                    )
                )
        )
        .filter( line => !!line )
        .join('\n');
}

module.exports = { phase2 };
