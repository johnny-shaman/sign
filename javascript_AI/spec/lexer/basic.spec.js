// spec/lexer/lexer.spec.js
const assert = require('assert');
const { Lexer } = require('../../src/lexer/lexer');
const { TokenType } = require('../../src/lexer/token');

describe('Lexer', () => {
    describe('リテラル', () => {
        it('数値リテラルをトークン化できる', () => {
            const cases = [
                ['42', 42],
                ['3.14', 3.14],
                ['-353.15134', -353.15134],
            ];

            cases.forEach(([input, expected]) => {
                const lexer = new Lexer(input);
                const token = lexer.next_token();
                assert.strictEqual(token.type, TokenType.NUMBER);
                assert.strictEqual(token.value, expected);
            });
        });

        it('文字リテラルをトークン化できる', () => {
            const cases = [
                ['\\n', 'n'],
                ['\\ ', ' '],
                ['\\!', '!'],
                ['\\\\', '\\'],
            ];

            cases.forEach(([input, expected]) => {
                const lexer = new Lexer(input);
                const token = lexer.next_token();
                assert.strictEqual(token.type, TokenType.CHAR);
                assert.strictEqual(token.value, expected);
            });
        });

        it('文字列リテラルをトークン化できる', () => {
            const cases = [
                ['`hello`', ['h', 'e', 'l', 'l', 'o']],
                ['`\\n`', ['\\', 'n']],
                ['`test\\test`', ['t', 'e', 's', 't', '\\', 't', 'e', 's', 't']],
            ];

            cases.forEach(([input, expected]) => {
                const lexer = new Lexer(input);
                const token = lexer.next_token();
                assert.strictEqual(token.type, TokenType.STRING_CHARS);
                assert.deepStrictEqual(token.value, expected);
            });
        });

        it('文字列内の改行でエラーを投げる', () => {
            const lexer = new Lexer('`line1\nline2`');
            assert.throws(() => lexer.next_token());
        });
    });

    describe('識別子とキーワード', () => {
        it('識別子をトークン化できる', () => {
            const cases = [
                'x',
                'foo',
                'bar123',
                '_test',
                'hello_world'
            ];

            cases.forEach(input => {
                const lexer = new Lexer(input);
                const token = lexer.next_token();
                assert.strictEqual(token.type, TokenType.IDENTIFIER);
                assert.strictEqual(token.value, input);
            });
        });
    });

    describe('インデント', () => {
        it('インデントレベルを追跡できる', () => {
            const input = '  test\n    nested\n  back';
            const lexer = new Lexer(input);
            
            let token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.INDENT);
            assert.strictEqual(token.value, 2);
            
            token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.IDENTIFIER);
            assert.strictEqual(token.value, 'test');

            token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.NEWLINE);
            
            token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.INDENT);
            assert.strictEqual(token.value, 4);
        });
    });

    describe('空白文字とコメント', () => {
        it('空白文字を適切にスキップする', () => {
            const input = '   42   ';
            const lexer = new Lexer(input);
            const token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.NUMBER);
            assert.strictEqual(token.value, 42);
        });
    });
});
