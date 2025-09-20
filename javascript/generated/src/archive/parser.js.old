// Sign言語パーザー - 段階2: 演算子優先順位による構文解析

const SignTokenizer = require('./lexer.js'); // 段階1のトークナイザを使用

class SignParser {
    constructor() {
        // 演算子優先順位表（優先順位の低い順 = 後から評価される順）
        this.operatorPrecedence = {
            // 優先順位1: export
            '#': { precedence: 1, type: 'prefix' },
            
            // 優先順位2: define, output
            ':': { precedence: 2, type: 'infix', associativity: 'right' },
            
            // 優先順位3: 構築域（空白は特別扱い）
            '?': { precedence: 3, type: 'infix', associativity: 'right' },
            ',': { precedence: 3, type: 'infix', associativity: 'right' },
            '~': { precedence: 3, type: 'infix' },
            
            // 優先順位4-6: 論理域
            ';': { precedence: 4, type: 'infix' },  // xor
            '|': { precedence: 5, type: 'infix' },  // or
            '&': { precedence: 6, type: 'infix' },  // and
            '!': { precedence: 7, type: 'prefix' }, // not
            
            // 優先順位7: 比較演算域
            '<': { precedence: 8, type: 'infix' },
            '<=': { precedence: 8, type: 'infix' },
            '=': { precedence: 8, type: 'infix' },
            '>=': { precedence: 8, type: 'infix' },
            '>': { precedence: 8, type: 'infix' },
            '!=': { precedence: 8, type: 'infix' },
            
            // 優先順位8-10: 算術演算域
            '+': { precedence: 9, type: 'infix' },
            '-': { precedence: 9, type: 'infix' },
            '*': { precedence: 10, type: 'infix' },
            '/': { precedence: 10, type: 'infix' },
            '%': { precedence: 10, type: 'infix' },
            '^': { precedence: 11, type: 'infix', associativity: 'right' },
            
            // 優先順位11-13: 解決評価域
            '$': { precedence: 12, type: 'prefix' },
            "'": { precedence: 13, type: 'infix' },
            '@': { precedence: 14, type: 'prefix' }
        };
        
        this.tokenizer = new SignTokenizer();
    }

    parse(code) {
        // まずトークナイズ
        const tokens = this.tokenizer.tokenize(code);
        console.log('トークン:', tokens);
        
        // 演算子優先順位による構文解析
        const ast = this.parseExpression(tokens);
        
        return ast;
    }

    parseExpression(tokens) {
        return this.parseLevel(tokens, 1); // 最低優先順位から開始
    }

    parseLevel(tokens, minPrecedence) {
        let left = this.parsePrimary(tokens);
        
        while (tokens.length > 0) {
            const operator = tokens[0];
            const opInfo = this.operatorPrecedence[operator];
            
            // 演算子でない、または優先順位が低い場合は終了
            if (!opInfo || opInfo.precedence < minPrecedence) {
                break;
            }
            
            tokens.shift(); // 演算子を消費
            
            if (opInfo.type === 'infix') {
                // 右結合の場合は同じ優先順位、左結合は次の優先順位
                const nextPrecedence = opInfo.associativity === 'right' 
                    ? opInfo.precedence 
                    : opInfo.precedence + 1;
                
                const right = this.parseLevel(tokens, nextPrecedence);
                
                // 中置記法を前置記法に変換
                left = this.createFunctionCall(operator, [left, right]);
            }
        }
        
        return left;
    }

    parsePrimary(tokens) {
        if (tokens.length === 0) {
            throw new Error('予期しない式の終端');
        }
        
        const token = tokens.shift();
        
        // 前置演算子
        const opInfo = this.operatorPrecedence[token];
        if (opInfo && opInfo.type === 'prefix') {
            const operand = this.parsePrimary(tokens);
            return this.createFunctionCall(token + '_', [operand]); // 前置演算子は_サフィックス
        }
        
        // カッコ処理
        if (this.isBracket(token)) {
            return token; // 現段階ではカッコ内容はそのまま保持
        }
        
        // 絶対値処理
        if (token.startsWith('|') && token.endsWith('|')) {
            return token; // 現段階では絶対値内容はそのまま保持
        }
        
        // リテラル（数値、文字列、識別子など）
        return token;
    }

    createFunctionCall(operator, args) {
        // 演算子を関数化: + → [+]
        return {
            type: 'function_call',
            function: `[${operator}]`,
            arguments: args
        };
    }

    isBracket(token) {
        return token.startsWith('[') || token.startsWith('(') || token.startsWith('{');
    }

    // AST（抽象構文木）を文字列表現に変換
    astToString(ast) {
        if (typeof ast === 'string') {
            return ast;
        }
        
        if (ast.type === 'function_call') {
            const args = ast.arguments.map(arg => this.astToString(arg)).join(' ');
            return `${ast.function} ${args}`;
        }
        
        return JSON.stringify(ast);
    }
}

// テスト用関数
function testParser() {
    const parser = new SignParser();
    
    const testCases = [
        'x + y',
        'x + y * 2',
        'x * y + z',
        'a + b * c + d',
        'x = y = z',
        'a & b | c',
        'x : y + z',
        '!x & y',
        'a ^ b ^ c',  // 右結合
        'x + [* 2] y'
    ];
    
    testCases.forEach((code, index) => {
        console.log(`\n=== テスト ${index + 1} ===`);
        console.log('入力:', code);
        
        try {
            const ast = parser.parse(code);
            console.log('AST:', JSON.stringify(ast, null, 2));
            console.log('前置記法:', parser.astToString(ast));
        } catch (error) {
            console.log('エラー:', error.message);
        }
    });
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignParser;
    
    // 直接実行時のテスト
    if (require.main === module) {
        testParser();
    }
}
