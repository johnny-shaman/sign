// phases/phase4.js
// Phase4: ブロック構文を判定し、カッコ付けを行う

/**
 * Phase4のブロック構文判定とカッコ付け処理を実行
 * @param {string} input - Phase3で処理されたコード
 * @returns {string} - ブロック構文をカッコ付けしたコード
 */

function phase4(input) {

    return input.replace(/^[\s\S]+/g, )

    return input
    .replace(/^(\t*)((\w+[ ,]?)+)([:?] *)$/gm, '$& [')
    .replace(/^(\t+)((\w+[ ,]?)+)([:?] *)$/gm, '$1[$2$4')
    .replace(/^(\t+)([\s\S]+)(?!\[)$/gm, '$1[$2]')
    //.replace(/([\r\n]\t+[ \S]+)+/g, '$&\n]')

    //=========================デッドコード===========================

    let result = input
        // 1. タブ付き行にカッコを追加
        // タブの後に識別子がある行を検出し、カッコで囲む
        .replace(/^(\t+)([\s\S]+)$/gm, '$1[$2]')

        // 2. ブロック1階層目の開始・終了カッコ
        // : または ? の後の改行+タブを検出してブロック開始
        .replace(/([:?])\s*$(?=\n\t)/gm, '$&\ [')
        // 改行+タブ以外またはファイル末尾でブロック終了を検出
        .replace(/^(\t.*$)(?=\n[^\t]|\Z)/gm, '$&]')
        // 3. 行頭タブを1つ削除
        .replace(/^\t/gm, '');
    // 4. 階層処理のループ
    //let compareText;
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

    //=========================デッドコード===========================

}


function phase4ed(input) {

    return input
    //ブロック開始[
    .replace(/([:?] *)([\r\n])([\t])/g, '$1 [\n$3')
    //各ブロック[要素]
    .replace(/(?!\t+[ \S]+\[)(\t+)([ \S]+)/g, '$1[$2]')
    //絶対値行を抽出しないため下記に修正
    //.replace(/(?!\t+[ \S]+\[(?!\|))(\t+)([ \S]+)/g, '$1[$2]')
    //各ブロック要素開始[（ネストのみ）  //意図しない絶対値行を抽出するため下記に修正
    //.replace(/(\t+)([ \S]+)(\[)(?!\|)/g, '$1[$2$3')
    .replace(/(\t+)([ \S]+)(\[)/g, '$1[$2$3')
    //大外ブロック終了]　改行あり
    // .replace(/([\r\n]\t+[ \S]+)+/g, '$&\n]')
    //大外ブロック終了]　改行なし
    .replace(/([\r\n]\t+[ \S]+)+/g, '$&]')
    //追加　ブロック終了]
        .split('\n') //行で分割して配列化
        .map((line, index, array) => {
            const currentLevel = (line.match(/^(\t*)/) || ['', ''])[1].length;
            const nextLine = array[index + 1];
            const nextLevel = nextLine ? (nextLine.match(/^(\t*)/) || ['', ''])[1].length : 0;
            const levelDiff = currentLevel - nextLevel;
            
            // 次の行がブロック外の場合はカッコを付けない
            if (!nextLine) {
                return line;
            }

            return line + (levelDiff > 0 ? ']'.repeat(levelDiff) : '');
        })
        .join('\n')
    //追加　改行タブ削除
        .replace(/([\r\n][\t]+)/g, '');

    //=========================デッドコード===========================

    let result = input
        // 1. タブ付き行にカッコを追加
        // タブの後に識別子がある行を検出し、カッコで囲む
        .replace(/^(\t+)([\s\S]+)$/gm, '$1[$2]')

        // 2. ブロック1階層目の開始・終了カッコ
        // : または ? の後の改行+タブを検出してブロック開始
        .replace(/([:?])\s*$(?=\n\t)/gm, '$&\ [')
        // 改行+タブ以外またはファイル末尾でブロック終了を検出
        .replace(/^(\t.*$)(?=\n[^\t]|\Z)/gm, '$&]')
        // 3. 行頭タブを1つ削除
        .replace(/^\t/gm, '');
    // 4. 階層処理のループ
    //let compareText;
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

    //=========================デッドコード===========================

}

module.exports = { phase4 };