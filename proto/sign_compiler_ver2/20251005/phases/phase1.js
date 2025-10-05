// phases/phase1.js
// Phase1: コメントを削除、改行コードとカッコの統一

/**
 * Phase2のコメントと空行を削除、改行コードとカッコの統一を実行
 * @param {string} input - 入力されたSign言語のコード
 * @returns {string} - 前処理後のコード
 */

function phase1 (input) {
    return input
        .replace(/(\r\n)|[\r\n]/g, '\n') //改行コード統一
        .split('\n') //行で分割して配列化
        .map(
                    // バリデーション
            line => line && line 
                // コメントなら空行にする
                .replace(/^((`[\s\S]*))$/gm, '')
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
        .join('\n');
}

module.exports = { phase1 };
