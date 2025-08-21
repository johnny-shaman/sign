// Sign言語段階的トークナイザ (Node.js版)

class SignStageTokenizer {
    tokenize(code) {
        const tokens = [];
        let i = 0;
        
        while (i < code.length) {
            const char = code[i];
            
            // 文字列処理（`で囲まれた部分）
            if (char === '`') {
                const stringResult = this.readString(code, i);
                tokens.push(stringResult.value);
                i = stringResult.nextPos;
                continue;
            }
            
            // 文字処理（\で始まる）
            if (char === '\\') {
                const charResult = this.readCharacter(code, i);
                tokens.push(charResult.value);
                i = charResult.nextPos;
                continue;
            }
            
            // 絶対値囲み処理（|で囲まれた部分）
            if (char === '|') {
                // 前後の空白をチェック
                const prevChar = i > 0 ? code[i - 1] : '';
                const nextChar = i + 1 < code.length ? code[i + 1] : '';
                
                // 空白|空白 → 論理OR（通常トークン）
                if (this.isWhitespace(prevChar) && this.isWhitespace(nextChar)) {
                    const tokenResult = this.readToken(code, i);
                    tokens.push(tokenResult.value);
                    i = tokenResult.nextPos;
                    continue;
                }
                
                // それ以外 → 絶対値囲み
                const absResult = this.readAbsoluteValue(code, i);
                tokens.push(absResult.value);
                i = absResult.nextPos;
                continue;
            }
            
            // カッコ処理（一塊として取り出す）
            if (this.isOpenBracket(char)) {
                const bracketResult = this.readBracketBlock(code, i);
                tokens.push(bracketResult.value);
                i = bracketResult.nextPos;
                continue;
            }
            
            // 空白（スペース・タブ・改行）で区切る
            if (this.isWhitespace(char)) {
                i++;
                continue;
            }
            
            // その他の文字（空白まで読み続ける）
            const tokenResult = this.readToken(code, i);
            if (tokenResult.value.trim()) {
                tokens.push(tokenResult.value);
            }
            i = tokenResult.nextPos;
        }
        
        return tokens;
    }

    readString(code, start) {
        let i = start + 1; // 最初の`をスキップ
        let value = '`';
        
        while (i < code.length) {
            value += code[i];
            if (code[i] === '`') {
                i++;
                break;
            }
            i++;
        }
        
        return { value, nextPos: i };
    }

    readCharacter(code, start) {
        let value = code[start]; // \
        if (start + 1 < code.length) {
            value += code[start + 1]; // 次の1文字
            return { value, nextPos: start + 2 };
        }
        return { value, nextPos: start + 1 };
    }

    readAbsoluteValue(code, start) {
        let value = '|'; // 最初の|
        let i = start + 1;
        
        while (i < code.length) {
            const char = code[i];
            value += char;
            
            // 閉じる|を見つけた
            if (char === '|') {
                i++;
                break;
            }
            
            // 文字列内はそのまま追加
            if (char === '`') {
                i++;
                while (i < code.length && code[i] !== '`') {
                    value += code[i];
                    i++;
                }
                if (i < code.length) {
                    value += code[i]; // 閉じる`
                }
            }
            // 文字内はそのまま追加
            else if (char === '\\' && i + 1 < code.length) {
                i++;
                value += code[i]; // エスケープされた文字
            }
            // カッコ内はそのまま追加
            else if (this.isOpenBracket(char)) {
                const closeChar = this.getCloseBracket(char);
                let depth = 1;
                i++;
                value += code[i - 1]; // 開きカッコを追加
                
                while (i < code.length && depth > 0) {
                    value += code[i];
                    if (this.isOpenBracket(code[i])) {
                        depth++;
                    } else if (code[i] === closeChar) {
                        depth--;
                    }
                    i++;
                }
                continue; // iは既に進んでいるので
            }
            
            i++;
        }
        
        return { value, nextPos: i };
    }

    readBracketBlock(code, start) {
        const openChar = code[start];
        const closeChar = this.getCloseBracket(openChar);
        let value = openChar;
        let i = start + 1;
        let depth = 1;
        
        while (i < code.length && depth > 0) {
            const char = code[i];
            value += char;
            
            // ネストしたカッコの処理
            if (this.isOpenBracket(char)) {
                depth++;
            } else if (char === closeChar) {
                depth--;
            }
            // 文字列内はカッコをカウントしない
            else if (char === '`') {
                i++;
                while (i < code.length && code[i] !== '`') {
                    value += code[i];
                    i++;
                }
                if (i < code.length) {
                    value += code[i]; // 閉じる`
                }
            }
            // 文字内はカッコをカウントしない
            else if (char === '\\' && i + 1 < code.length) {
                i++;
                value += code[i]; // エスケープされた文字
            }
            
            i++;
        }
        
        return { value, nextPos: i };
    }

    readToken(code, start) {
        let i = start;
        let value = '';
        
        while (i < code.length && 
               !this.isWhitespace(code[i]) && 
               !this.isOpenBracket(code[i]) &&
               code[i] !== '`' &&
               code[i] !== '\\' &&
               code[i] !== '|') {  // |も特別文字として扱う
            value += code[i];
            i++;
        }
        
        return { value, nextPos: i };
    }

    isWhitespace(char) {
        return char === ' ';
    }

    isOpenBracket(char) {
        return char === '[' || char === '(' || char === '{';
    }

    getCloseBracket(openChar) {
        const bracketMap = {
            '[': ']',
            '(': ')',
            '{': '}'
        };
        return bracketMap[openChar];
    }
}

// テスト用の関数
function testStageTokenizer() {
    const tokenizer = new SignStageTokenizer();
    
    const testCases = [
        'x + y * 2',
        '[+ 2] 5',
        'x + [* 2] y',
        '5 + |-3 - 4| * 2',  // 絶対値囲み
        'a | b',             // 論理OR
        '|x + y|',           // 絶対値囲み
        'flag | !flag',      // 論理OR
        '|-1| + |2 - 3|',    // 複数の絶対値
        'result | error',    // 論理OR
        '`hello` [+ [* 2] 3] world',
        'map [+ 1] [1, 2, 3]',
        '[[+] [*] 2] 3'
    ];
    
    testCases.forEach((code, index) => {
        console.log(`\n=== テスト ${index + 1} ===`);
        console.log('入力:', code);
        console.log('トークン:', tokenizer.tokenize(code));
        console.log('解説: カッコ内・絶対値囲みは一塊、論理ORは空白区切りで判定');
    });
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignStageTokenizer;
    
    // 直接実行時のテスト
    if (require.main === module) {
        testStageTokenizer();
    }
} else {
    // ブラウザ環境での実行
    window.SignStageTokenizer = SignStageTokenizer;
    testStageTokenizer();
}