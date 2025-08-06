// tokenizer.js
/**
 * Sign言語のソースコードをトークン化するモジュール
 * シンプルな区切りルールに基づいて実装
 * 
 * 機能:
 * - ソースコードのトークン化
 * - 文字列リテラルの適切な処理
 * - インデントパターンの保持
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250405_2
 */

/**
 * ソースコードブロックをトークン化する（シンプル化版）
 * 
 * @param {string} block - トークン化するコードブロック
 * @returns {string[]} トークン配列
 */
function tokenizeBlock(block) {
    if (!block || typeof block !== 'string') {
        return [];
    }

    const tokens = [];
    let i = 0;
    let currentToken = '';
    let inString = false;       // 文字列リテラル内かどうか
    let inCharLiteral = false;  // 特殊文字リテラル内かどうか
    let inIndent = false;       // インデントパターン内かどうか

    // 区切り文字の定義
    const isBracket = (char) => /[\[\](){}]/.test(char);
    const isDelimiter = (char) => /[:?,]/.test(char);
    const isWhitespace = (char) => /\s/.test(char);

    // 現在のトークンを追加してリセットする関数
    const addCurrentToken = () => {
        if (currentToken) {
            tokens.push(currentToken);
            currentToken = '';
        }
    };

    // 文字ごとに処理
    while (i < block.length) {
        const char = block[i];

        // 文字列リテラル内の処理
        if (inString) {
            currentToken += char;
            if (char === '`') {
                addCurrentToken();
                inString = false;
            }
        }
        // 特殊文字リテラル内の処理
        else if (inCharLiteral) {
            currentToken += char;
            addCurrentToken();
            inCharLiteral = false;
        }
        // インデントパターン内の処理
        else if (inIndent) {
            if (char === '\t') {
                currentToken += char;
            } else {
                addCurrentToken();
                inIndent = false;
                i--; // 現在の文字を再処理
            }
        }
        // 新しいトークンの開始
        else {
            if (char === '`') {
                // 文字列リテラル開始
                addCurrentToken();
                currentToken = char;
                inString = true;
            }
            else if (char === '\\') {
                // 特殊文字リテラル
                addCurrentToken();
                currentToken = char;
                inCharLiteral = true;
            }
            else if (char === '\n') {
                // インデントパターン開始
                addCurrentToken();
                currentToken = char;
                inIndent = true;
            }
            else if (isWhitespace(char)) {
                // 空白はトークン区切り
                addCurrentToken();
            }
            else if (isBracket(char)) {
                // カッコは独立したトークン
                addCurrentToken();
                tokens.push(char);
            }
            else if (isDelimiter(char)) {
                // 特定の区切り文字も独立したトークン
                addCurrentToken();
                tokens.push(char);
            }
            else {
                // 通常の文字の場合
                currentToken += char;
            }
        }
        i++;
    }

    // 最後のトークンを追加
    addCurrentToken();

    return tokens;
}

// モジュールとしてエクスポート
module.exports = {
    tokenizeBlock
};