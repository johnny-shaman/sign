// phases/phase3.js
// Phase3: ブロック構文を判定し、カッコ付けを行う

/**
 * Phase3のブロック構文判定とカッコ付け処理を実行
 * @param {string} input - Phase3で処理されたコード
 * @returns {string} - ブロック構文をカッコ付けしたコード
 */
function phase3(input) {
    // =================================================================
    // 文字・文字列保護による前処理（phase4_5から流用）
    // =================================================================

    const protection = protectLiterals(input);
    const protectedInput = protection.protectedText;
    const charMap = protection.charMap;
    const stringMap = protection.stringMap;

    // console.log('保護処理後:', protectedInput);

    // =================================================================
    // 既存のphase3処理（保護済みテキストで実行）
    // =================================================================

    let result = protectedInput.replace(
        /^(((.+[:?] *)+\n)(^\t+.*\n|^\t+.*$)*)/gm,
        m0 => m0
            .replace(/(\t*)( ?)([ \t\S]+?)([?:] *\n|\\\n|\n|$)/g,
                (m1, g1, g2, g3, g4) => {
                    switch (true) {
                        case /[?:] *\n/.test(g4):
                            return `${g1}[${g3}${g4.replace(/\n/g, '')} [ \n`
                        case !!g2.length && g4 === '\\\n':
                            return `${g2}${g3}${g4}`
                        case !g2.length && g4 === '\\\n':
                            return `${g1}[${g3}${g4}`
                        default: return `${g1}[${g2}${g3}]\n`
                    }
                }
            )
    )

    // 閉じカッコを追加
    result = phase3_addClosingBrackets(result);

    // =================================================================
    // タブと改行を削除（保護されたリテラルは影響を受けない）
    // =================================================================

    result = removeTabsAndNewlines(result);
    // console.log('タブ・改行削除後:', result);

    // =================================================================
    // 保護解除処理（phase4_5から流用）
    // =================================================================

    result = restoreLiterals(result, charMap, stringMap);
    // console.log('保護解除後:', result);

    // console.log(result);
    return result;
}
/**
 * Phase 3.5: インデントブロックに閉じカッコと要素区切りを追加
 * 
 * Sign言語のインデント構造を完全なカッコ構造に変換する後処理。
 * Phase 3で開きカッコ `[` を追加した後、インデントレベルの変化を検出して
 * 適切な数の閉じカッコ `]` を追加し、ブロック内要素を `,` で結合する。
 * 
 * 重要な処理：
 * - `[xxx : [ ` や `[xxx ? [ ` という行は2個の開きカッコを持つ
 * - インデント減少時、直近の親ブロックがブロック開始行なら追加で1個の ] が必要
 * 
 * @param {string} input - Phase 3で開きカッコを追加済みのテキスト
 * @returns {string} 閉じカッコと要素区切りを追加した完全なカッコ構造のテキスト
 */
function phase3_addClosingBrackets(input) {
    const lines = input.split('\n');

    // 各行がブロック開始行かどうかを事前に記録
    const isBlockStart = lines.map(line => line.includes('[ '));

    return lines.map((line, i) => {
        // 文字列連結行（\ で終わる行）はそのまま保持
        if (line.trimEnd().endsWith('\\')) {
            return line;
        }

        const currentIndent = line.match(/^\t*/)[0].length;
        const nextLine = lines[i + 1];
        const nextIndent = nextLine ? nextLine.match(/^\t*/)[0].length : 0;

        let result = line;

        // 閉じカッコの追加（インデントが浅くなる分）
        if (currentIndent > nextIndent) {
            // 基本のインデント差分
            let closingCount = currentIndent - nextIndent;

            // 直近の親ブロック（nextIndentレベル）がブロック開始行かチェック
            for (let j = i - 1; j >= 0; j--) {
                const prevIndent = lines[j].match(/^\t*/)[0].length;

                // nextIndentレベルの行を見つけた
                if (prevIndent === nextIndent) {
                    if (isBlockStart[j]) {
                        closingCount++;  // ブロック開始行なら+1
                    }
                    break;  // 見つけたら終了
                }

                // nextIndentより浅いレベルまで遡ったら終了
                if (prevIndent < nextIndent) {
                    break;
                }
            }

            result += ']'.repeat(closingCount);
        }

        // カンマの追加条件：
        // 1. currentIndent >= nextIndent（インデント減少または同じ）
        // 2. nextIndent > 0（ブロック内要素である）
        // 3. 次の行が存在する
        // 4. 現在の行がブロック開始行でない（'[ ' を含まない）
        if (currentIndent >= nextIndent &&
            nextIndent > 0 &&
            nextLine &&
            !line.includes('[ ')) {
            result += ' ,';
        }

        return result;
    }).join('\n');
}

/**
 * Phase 3.6: ブロック構文のタブと改行を削除
 * 
 * カッコ構造化されたブロックからインデント（タブ）と改行を削除し、
 * 一行のS式相当の構造に変換する。
 * 
 * 処理原理：
 * - 保護処理により、文字リテラル内の改行（\改行）は __CHAR_X__ に置換済み
 * - したがって、残っている改行とタブは全て構文上のものなので安全に削除可能
 * 
 * @param {string} input - タブと改行を含むカッコ構造化されたテキスト
 * @returns {string} タブと改行を削除した一行のテキスト
 */
function removeTabsAndNewlines(input) {
    return input
        // ブロック開始マーカー後の改行を削除: ": [ \n" → ": ["
        .replace(/([?:] \[) \n/g, '$1')
        // ブロック内の改行+タブを削除: "\n\t+" → ""
        .replace(/\n\t+/g, '\t')
        .replace(/\t+/g, ' ');
}

///////////////////////////////////////////////////////////////////////////////
// 以下、phase4_5から流用する保護処理関連の関数
// ※文字・文字列リテラルを正しく扱うために必要
///////////////////////////////////////////////////////////////////////////////

/**
 * 文字・文字列リテラルを一時的に置換して保護する
 * ※phase4_5から流用
 * @param {string} input - 保護対象の文字列
 * @returns {Object} 保護処理結果 {protectedText, charMap, stringMap}
 */
function protectLiterals(input) {
    let protectedInput = input;
    const charMap = [];
    const stringMap = [];
    let charIndex = 0;
    let stringIndex = 0;

    // 1. 文字リテラル（\+任意の1文字）を一時的に置換
    protectedInput = protectedInput.replace(/\\[\s\S]/g, (match) => {
        charMap[charIndex] = match;
        return `__CHAR_${charIndex++}__`;
    });

    // 2. 文字列リテラル（`...`）を一時的に置換
    protectedInput = protectedInput.replace(/`[^`\r\n]*`/g, (match) => {
        stringMap[stringIndex] = match;
        return `__STRING_${stringIndex++}__`;
    });

    return {
        protectedText: protectedInput,
        charMap: charMap,
        stringMap: stringMap
    };
}

/**
 * 保護されたリテラルを元に戻す
 * ※phase4_5から流用
 * @param {string} input - 復元対象の文字列
 * @param {Array} charMap - 文字リテラルのマップ
 * @param {Array} stringMap - 文字列リテラルのマップ
 * @returns {string} 復元後の文字列
 */
function restoreLiterals(input, charMap, stringMap) {
    let result = input;

    // 文字トークンを元に戻す
    result = result.replace(/__CHAR_(\d+)__/g, (match, index) => {
        return charMap[index] || match;
    });

    // 文字列トークンを元に戻す
    result = result.replace(/__STRING_(\d+)__/g, (match, index) => {
        return stringMap[index] || match;
    });

    return result;
}
//=========================デッドコード===========================
/*
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


function phase3ed(input) {

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
*/

module.exports = { phase3 };
