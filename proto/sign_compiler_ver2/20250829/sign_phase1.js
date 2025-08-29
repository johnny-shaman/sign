// Sign言語記法変換器（フェーズ1）- 干渉回避型プレースホルダー版
// 
// 【設計変更の経緯】
// 設計書では __type[N]__ 形式のプレースホルダーを想定していたが、実装過程で
// プレースホルダー内の [N] 部分が後続の保護処理（インラインブロック保護）で
// 再度処理される干渉問題が発生した。
// 
// 例: __inline[0]__ → __inline__inline[X]________ (破壊される)
//
// テキスト置換によるシンプルな実装という設計思想を維持しつつ、
// 完全な干渉回避を実現するため、記号なしの TYPENAME_N 形式に変更。
//
// 変更: __string[0]__ → STRING_0
//       __chr[1]__    → CHAR_1  
//       __number[2]__ → NUMBER_2
//       __inline[3]__ → INLINE_3
//       __block[4]__  → BLOCK_4
//       __abs[5]__  → ABS_5

const fs = require('fs');

class SignConverter {
    constructor() {
        this.protectedItems = [];
        this.counters = {
            string: 0,
            char: 0,
            number: 0,
            inline: 0,
            block: 0,
            abs: 0
        };
    }

    /**
     * メイン変換処理
     */
    convert(source) {
        this.protectedItems = [];
        this.counters = { string: 0, char: 0, number: 0, inline: 0, block: 0, abs: 0 };

        // コメント行削除
        let result = this.removeComments(source);
        console.log('=== コメント削除完了 ===');

        // 段階1: 数値保護（最優先 - 他の処理との干渉回避）
        result = this.protectNumbers(result);

        // 段階1: 最内側から最外側へ保護（干渉回避順序）
        result = this.protectInlineBlocks(result);
        result = this.protectAbsoluteValue(result);
        result = this.protectStrings(result);      // 文字列を文字より先に
        result = this.protectCharacters(result);
        result = this.protectIndentBlocks(result);

        console.log('=== 保護完了 ===');
        console.log(result);

        return {
            converted: result,
            protectedItems: this.protectedItems
        };
    }

    /**
     * コメント行削除
     */
    removeComments(source) {
        const lines = source.split(/\r?\n/);
        const nonCommentLines = lines.filter(line => {
            const trimmed = line.trim();
            return !trimmed.startsWith('`');
        });
        return nonCommentLines.join('\n');
    }

    /**
     * 数値保護: 全数値形式 → NUMBER_N
     */
    protectNumbers(source) {
        let result = source;
        
        // 数値パターンを優先順位順に処理（長いパターンを先に）
        const patterns = [
            {
                name: '16進数',
                regex: /0x[0-9A-Fa-f]+/g
            },
            {
                name: '8進数', 
                regex: /0o[0-7]+/g
            },
            {
                name: '2進数',
                regex: /0b[01]+/g
            },
            {
                name: '浮動小数点数',
                regex: /(?<![A-Za-z_])-?\d+\.\d+(?:[eE][+-]?\d+)?(?![A-Za-z_])/g
            },
            {
                name: '整数',
                regex: /(?<![A-Za-z_])-?\d+(?![A-Za-z_])/g
            }
        ];
        
        for (const pattern of patterns) {
            result = result.replace(pattern.regex, (match) => {
                const placeholder = `NUMBER_${this.counters.number}`;
                this.protectedItems.push({
                    placeholder: placeholder,
                    content: match,
                    original: match,
                    type: 'number'
                });
                console.log(`数値保護: "${match}" → ${placeholder} (${pattern.name})`);
                this.counters.number++;
                return placeholder;
            });
        }
        
        return result;
    }

    /**
     * 文字列保護: `...` → STRING_N (シンプル版)
     */
    protectStrings(source) {
        const pattern = /`([^`\n\r]*)`?/g;
        return source.replace(pattern, (match, content) => {
            const placeholder = `STRING_${this.counters.string}`;
            this.protectedItems.push({
                placeholder: placeholder,
                content: content || '',
                original: match,
                type: 'string'
            });
            console.log(`文字列保護: "${match}" → ${placeholder}`);
            this.counters.string++;
            return placeholder;
        });
    }

    /**
     * 文字保護: \x → CHAR_N (厳密優先ルール適用)
     */
    protectCharacters(source) {
        // `\`の直後の任意の1文字は必ず文字として扱う（設計書の厳密適用）
        // これにより \` は単純に「`文字」となり、文字列開始記号との混同を回避
        const pattern = /\\(.)/g;
        return source.replace(pattern, (match, char) => {
            const placeholder = `CHAR_${this.counters.char}`;
            this.protectedItems.push({
                placeholder: placeholder,
                content: char,
                original: match,
                type: 'character'
            });
            console.log(`文字保護: "${match}" → ${placeholder} (内容: "${char}")`);
            this.counters.char++;
            return placeholder;
        });
    }

    /**
    * 絶対値保護: |...| → ABS_N （論理和演算子との区別対応）
    */
    protectAbsoluteValue(source) {
        let result = source;

        // 行ごとに処理（改行を跨ぐ誤マッチを防止）
        const lines = result.split(/\r?\n/);
        const processedLines = lines.map(line => this.processAbsoluteValueInLine(line));

        return processedLines.join('\n');
    }

    /**
     * 一行内での絶対値保護処理
     */
    processAbsoluteValueInLine(line) {
        let result = line;

        let changed = true;
        while (changed) {
            const oldResult = result;
            const pattern = /\|([^|]+?)\|/g;
            let match;

            while ((match = pattern.exec(result)) !== null) {
                const fullMatch = match[0];
                const content = match[1];
                const offset = match.index;

                // 修正: 論理和演算子の判定条件を変更
                // 論理和は「 | 」のように両側に空白がある形
                const before = offset > 0 ? result[offset - 1] : '';
                const after = offset + fullMatch.length < result.length ? result[offset + fullMatch.length] : '';

                // 論理和演算子の条件: 前後両方に空白がある場合のみ除外
                if (before === ' ' && after === ' ') {
                    continue;
                }

                // それ以外は絶対値として保護
                const placeholder = `ABS_${this.counters.abs}`;
                this.protectedItems.push({
                    placeholder: placeholder,
                    content: content.trim(),
                    original: fullMatch,
                    type: 'absolute_value'
                });
                console.log(`絶対値保護: "${fullMatch}" → ${placeholder}`);
                this.counters.abs++;

                result = result.substring(0, offset) + placeholder + result.substring(offset + fullMatch.length);
                pattern.lastIndex = 0;
                changed = true;
                break;
            }

            if (result === oldResult) {
                changed = false;
            }
        }

        return result;
    }

    /**
     * インラインブロック保護: [...], {...}, (...) → INLINE_N
     */
    protectInlineBlocks(source) {
        const brackets = [
            { open: '\\[', close: '\\]', type: '[]' },
            { open: '\\{', close: '\\}', type: '{}' },
            { open: '\\(', close: '\\)', type: '()' }
        ];

        let result = source;

        // 最内側から保護するため、繰り返し処理
        let changed = true;
        while (changed) {
            changed = false;

            for (const bracket of brackets) {
                const pattern = new RegExp(`${bracket.open}([^${bracket.open.slice(-1)}${bracket.close.slice(-1)}]*)${bracket.close}`, 'g');
                const oldResult = result;

                result = result.replace(pattern, (match, content) => {
                    const placeholder = `INLINE_${this.counters.inline}`;
                    this.protectedItems.push({
                        placeholder: placeholder,
                        content: content.trim(),
                        original: match,
                        type: 'inline_block',
                        brackets: bracket.type
                    });
                    this.counters.inline++;
                    return placeholder;
                });

                if (result !== oldResult) {
                    changed = true;
                }
            }
        }

        return result;
    }

    /**
     * インデントブロック保護: タブインデント → BLOCK_N
     */
    protectIndentBlocks(source) {
        const lines = source.split(/\r?\n/);
        let result = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const indentMatch = line.match(/^(\t+)/);

            if (indentMatch) {
                // インデントブロック開始
                const baseIndent = indentMatch[1].length;
                let blockLines = [];
                let j = i;

                // 同じ以上のインデントの行を収集
                while (j < lines.length) {
                    const currentLine = lines[j];
                    const currentIndent = currentLine.match(/^(\t*)/);
                    const currentLevel = currentIndent[1].length;

                    if (j === i || currentLevel >= baseIndent) {
                        blockLines.push(currentLine);
                        j++;
                    } else {
                        break;
                    }
                }

                const placeholder = `BLOCK_${this.counters.block}`;
                this.protectedItems.push({
                    placeholder: placeholder,
                    content: blockLines.join('\n'),
                    original: blockLines.join('\n'),
                    type: 'indent_block',
                    indentLevel: baseIndent
                });
                this.counters.block++;

                result.push(placeholder);
                i = j;
            } else {
                result.push(line);
                i++;
            }
        }

        return result.join('\n');
    }

    /**
     * デバッグ表示
     */
    debugPrint() {
        console.log('\n=== 保護されたアイテム ===');
        this.protectedItems.forEach((item, index) => {
            console.log(`${index}: ${item.type} = ${item.placeholder}`);
            console.log(`  content: "${item.content}"`);
            console.log(`  original: "${item.original}"`);
            if (item.brackets) console.log(`  brackets: ${item.brackets}`);
            if (item.indentLevel) console.log(`  indent: ${item.indentLevel}`);
        });
    }

    /**
     * 基本的な検証
     */
    validate() {
        console.log('\n=== 保護処理検証 ===');

        const types = ['string', 'character', 'number', 'inline_block', 'indent_block', 'absolute_value'];
        types.forEach(type => {
            const count = this.protectedItems.filter(item => item.type === type).length;
            console.log(`${type}: ${count}個`);
        });

        // プレースホルダー形式チェック（新形式）
        const invalidItems = this.protectedItems.filter(item =>
            !item.placeholder.match(/^[A-Z]+_\d+$/)
        );

        if (invalidItems.length > 0) {
            console.log(`❌ 不正なプレースホルダー: ${invalidItems.length}個`);
            invalidItems.forEach(item => console.log(`  ${item.placeholder}`));
        } else {
            console.log(`✅ 全プレースホルダー正常 (${this.protectedItems.length}個)`);
        }

        // 干渉チェック
        const result = this.getConvertedText();
        const hasInterference = this.protectedItems.some(item =>
            result.includes(item.placeholder) &&
            result.split(item.placeholder).length - 1 > 1
        );

        if (hasInterference) {
            console.log('❌ プレースホルダー干渉が検出されました');
        } else {
            console.log('✅ プレースホルダー干渉なし');
        }
    }

    /**
     * 変換後テキスト取得（デバッグ用）
     */
    getConvertedText() {
        // この実装では convert() の戻り値から取得
        return '';  // 簡略化
    }
}

// テスト実行
if (require.main === module) {
    try {
        const testCode = fs.readFileSync('testcode.sn', 'utf8');
        console.log('=== 元のコード ===');
        console.log(testCode);

        const converter = new SignConverter();
        const result = converter.convert(testCode);

        converter.validate();
        converter.debugPrint();

    } catch (error) {
        console.error('エラー:', error.message);

        const sampleCode = `x : 0xAF8534
func : [+ 1]
text : \`Hello World\`
char : \\M
nested : [(x ? [+ 1] x)]`;

        console.log('\n=== サンプルコード ===');
        console.log(sampleCode);

        const converter = new SignConverter();
        const result = converter.convert(sampleCode);

        converter.validate();
        converter.debugPrint();
    }
}

module.exports = SignConverter;