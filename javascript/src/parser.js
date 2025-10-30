// parser.js
class SignParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.precedenceTable = {
      '#': { level: 1, type: 'export' },
      ':': { level: 2, type: 'define', assoc: 'right' },
      '?': { level: 7, type: 'lambda', assoc: 'right' },
      '~': { level: 8, type: 'range' },
      ';': { level: 10, type: 'xor' },
      '|': { level: 10, type: 'or' },
      '&': { level: 11, type: 'and' },
      '!': { level: 12, type: 'not' },
      '<': { level: 13, type: 'comparison' },
      '<=': { level: 13, type: 'comparison' },
      '=': { level: 13, type: 'comparison' },
      '>=': { level: 13, type: 'comparison' },
      '>': { level: 13, type: 'comparison' },
      '!=': { level: 13, type: 'comparison' },
      '+': { level: 14, type: 'arithmetic' },
      '-': { level: 14, type: 'arithmetic' },
      '*': { level: 15, type: 'arithmetic' },
      '/': { level: 15, type: 'arithmetic' },
      '%': { level: 15, type: 'arithmetic' },
      '^': { level: 16, type: 'power', assoc: 'right' },
    };
  }

  parse() {
    return this.parseExpression(this.tokens, 0);
  }

  parseExpression(tokens, minPrecedence) {
    // 前置演算子の処理
    let left = this.parsePrimary(tokens);

    // 中置演算子の処理（優先順位順）
    while (tokens.length > 0) {
      const op = tokens[0];
      
      if (op.type !== 'operator') break;
      
      const opInfo = this.precedenceTable[op.value];
      if (!opInfo || opInfo.level < minPrecedence) break;

      tokens.shift(); // 演算子を消費
      
      const nextPrec = opInfo.assoc === 'right' 
        ? opInfo.level 
        : opInfo.level + 1;
      
      const right = this.parseExpression(tokens, nextPrec);
      
      // S式の構築
      left = ['op', op.value, left, right];
    }

    return left;
  }

  parsePrimary(tokens) {
    if (tokens.length === 0) return null;

    const token = tokens.shift();

    // リテラル
    if (['integer', 'float', 'string', 'char', 'unit'].includes(token.type)) {
      return ['literal', token.type, token.value];
    }

    // 識別子
    if (token.type === 'identifier') {
      return ['identifier', token.value];
    }

    // ブロック
    if (token.type === 'block') {
      return this.parseExpression(token.content, 0);
    }

    // 前置演算子
    if (token.type === 'operator' && this.isPrefixOperator(token.value)) {
      const operand = this.parsePrimary(tokens);
      return ['prefix', token.value, operand];
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  isPrefixOperator(op) {
    return ['#', '!', '~', '$', '@'].includes(op);
  }
}

module.exports = SignParser;