// phases/phase4.js
// Phase4: ブロック構文を判定し、カッコ付けを行う

/**
 * Phase4のブロック構文判定とカッコ付け処理を実行
 * @param {string} input - Phase3で処理されたコード
 * @returns {string} - ブロック構文をカッコ付けしたコード
 */
function phase4(input) {

    let result = input
        // 1. タブ付き行にカッコを追加
        // タブの後に識別子がある行を検出し、カッコで囲む
        .replace(/^(\t+)(.*)/gm, '$1[$2]')

        // 2. ブロック1階層目の開始・終了カッコ
        // : または ? の後の改行+タブを検出してブロック開始
        .replace(/([:\?])\s*$(?=\n\t)/gm, '$&\ [')
        // 改行+タブ以外またはファイル末尾でブロック終了を検出
        .replace(/^(\t.*$)(?=\n[^\t]|\Z)/gm, '$&]')
        // 3. 行頭タブを1つ削除
        .replace(/^\t/gm, '');
    // 4. 階層処理のループ
    let compareText;
    do {
        compareText = result;

        // 5. ブロックn階層目の処理
        // :] または ?] の後の改行+タブを検出
        result = result
            .replace(/([:\?])\]\s*\n(?=\t)/gm, '$1][\n')
            // 改行+タブ以外またはファイル末尾でブロック終了を検出
            .replace(/^(\t.*$)(?=\n[^\t]|\Z)/gm, '$&]')
            // ステップ⑥: 行頭タブを1つ削除（③と同じ）
            .replace(/^\t/gm, '');

        // 6. 差分比較
    } while (result !== compareText);

    // 7. 改行+[の削除
    return result.replace(/\n\[/g, '[');
}

module.exports = { phase4 };