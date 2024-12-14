// spec/lexer/operators.spec.js
const assert = require('assert');
const { Lexer } = require('../../src/lexer/lexer');
const { TokenType } = require('../../src/lexer/token');

describe('Lexer - Operators', () => {
    describe('前置演算子', () => {
        const cases = [
            ['#value', [
                [TokenType.EXPORT, null],
                [TokenType.IDENTIFIER, 'value']
            ]],
            ['@module', [
                [TokenType.IMPORT, null],
                [TokenType.IDENTIFIER, 'module']
            ]],
            ['!true', [
                [TokenType.NOT, null],
                [TokenType.IDENTIFIER, 'true']
            ]],
            ['-42', [
                [TokenType.MINUS, null],
                [TokenType.NUMBER, 42]
            ]]
        ];

        cases.forEach(([input, expected]) => {
            it(`${input} を正しくトークン化できる`, () => {
                const lexer = new Lexer(input);
                expected.forEach(([type, value]) => {
                    const token = lexer.next_token();
                    assert.strictEqual(token.type, type);
                    if (value !== null) {
                        assert.strictEqual(token.value, value);
                    }
                });
            });
        });
    });

    describe('後置演算子', () => {
        const cases = [
            ['array~', [
                [TokenType.IDENTIFIER, 'array'],
                [TokenType.SPREAD, null]
            ]],
            ['5!', [
                [TokenType.NUMBER, 5],
                [TokenType.NOT, null]  // 後置の!は階乗
            ]]
        ];

        cases.forEach(([input, expected]) => {
            it(`${input} を正しくトークン化できる`, () => {
                const lexer = new Lexer(input);
                expected.forEach(([type, value]) => {
                    const token = lexer.next_token();
                    assert.strictEqual(token.type, type);
                    if (value !== null) {
                        assert.strictEqual(token.value, value);
                    }
                });
            });
        });
    });

    describe('二項演算子', () => {
        describe('定義と関数', () => {
            const cases = [
                ['x: 42', [
                    [TokenType.IDENTIFIER, 'x'],
                    [TokenType.DEFINE, null],
                    [TokenType.NUMBER, 42]
                ]],
                ['f x ? x', [
                    [TokenType.IDENTIFIER, 'f'],
                    [TokenType.IDENTIFIER, 'x'],
                    [TokenType.LAMBDA, null],
                    [TokenType.IDENTIFIER, 'x']
                ]]
            ];

            cases.forEach(([input, expected]) => {
                it(`${input} を正しくトークン化できる`, () => {
                    const lexer = new Lexer(input);
                    expected.forEach(([type, value]) => {
                        const token = lexer.next_token();
                        assert.strictEqual(token.type, type);
                        if (value !== null) {
                            assert.strictEqual(token.value, value);
                        }
                    });
                });
            });
        });

        describe('算術演算子', () => {
            const cases = [
                '1 + 2',
                '3 - 4',
                '5 * 6',
                '8 / 2',
                '10 % 3',
                '2 ^ 3'
            ];

            const operators = {
                '+': TokenType.PLUS,
                '-': TokenType.MINUS,
                '*': TokenType.MULTIPLY,
                '/': TokenType.DIVIDE,
                '%': TokenType.MODULO,
                '^': TokenType.POWER
            };

            cases.forEach(input => {
                it(`${input} を正しくトークン化できる`, () => {
                    const lexer = new Lexer(input);
                    const [num1, op, num2] = input.split(' ');
                    
                    // 最初の数値
                    let token = lexer.next_token();
                    assert.strictEqual(token.type, TokenType.NUMBER);
                    assert.strictEqual(token.value, parseFloat(num1));
                    
                    // 演算子
                    token = lexer.next_token();
                    assert.strictEqual(token.type, operators[op]);
                    
                    // 二番目の数値
                    token = lexer.next_token();
                    assert.strictEqual(token.type, TokenType.NUMBER);
                    assert.strictEqual(token.value, parseFloat(num2));
                });
            });
        });

        describe('比較演算子', () => {
            const cases = [
                ['1 < 2', TokenType.LESS_THAN],
                ['2 <= 3', TokenType.LESS_EQUAL],
                ['3 = 3', TokenType.EQUAL],
                ['4 == 4', TokenType.EQUAL],
                ['5 != 6', TokenType.NOT_EQUAL],
                ['6 >< 7', TokenType.NOT_EQUAL],
                ['7 <> 8', TokenType.NOT_EQUAL],
                ['8 >= 9', TokenType.GREATER_EQUAL],
                ['9 > 10', TokenType.GREATER_THAN]
            ];

            cases.forEach(([input, opType]) => {
                it(`${input} を正しくトークン化できる`, () => {
                    const lexer = new Lexer(input);
                    const [num1, op, num2] = input.split(' ');
                    
                    let token = lexer.next_token();
                    assert.strictEqual(token.type, TokenType.NUMBER);
                    
                    token = lexer.next_token();
                    assert.strictEqual(token.type, opType);
                    
                    token = lexer.next_token();
                    assert.strictEqual(token.type, TokenType.NUMBER);
                });
            });
        });
    });

    describe('特殊演算子', () => {
        it('get演算子をトークン化できる', () => {
            const input = 'array\'0';
            const lexer = new Lexer(input);
            
            let token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.IDENTIFIER);
            assert.strictEqual(token.value, 'array');
            
            token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.GET);
            
            token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.NUMBER);
            assert.strictEqual(token.value, 0);
        });

        it('範囲演算子をトークン化できる', () => {
            const input = '1 ~ 5';
            const lexer = new Lexer(input);
            
            let token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.NUMBER);
            assert.strictEqual(token.value, 1);
            
            token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.SPREAD);
            
            token = lexer.next_token();
            assert.strictEqual(token.type, TokenType.NUMBER);
            assert.strictEqual(token.value, 5);
        });
    });
});
