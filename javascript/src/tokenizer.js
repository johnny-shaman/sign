// tokenizer.js
class SignTokenizer {
  constructor(source) {
    this.source = source;
    this.tokens = [];
  }

  // 文字列保護
  protectStrings(source) {
    const stringPattern = /`([^`\n\r]*)`?/g;
    const protected = [];
    let index = 0;
    
    const replaced = source.replace(stringPattern, (match, content) => {
      const placeholder = `__STRING_${index}__`;
      protected.push({ placeholder, content, type: 'string' });
      index++;
      return placeholder;
    });
    
    return { replaced, protected };
  }

  // 文字保護
  protectChars(source) {
    const charPattern = /\\./g;
    const protected = [];
    let index = 0;
    
    const replaced = source.replace(charPattern, (match) => {
      const placeholder = `__CHAR_${index}__`;
      protected.push({ placeholder, content: match[1], type: 'char' });
      index++;
      return placeholder;
    });
    
    return { replaced, protected };
  }

  // トークン分割
  tokenize() {
    // 1. 文字列と文字を保護
    const { replaced: str1, protected: strings } = this.protectStrings(this.source);
    const { replaced: str2, protected: chars } = this.protectChars(str1);
    
    // 2. 空白と改行で分割
    const tokens = str2
      .split(/(\s+|\n+)/)
      .filter(t => t.trim().length > 0)
      .map(token => this.classifyToken(token, [...strings, ...chars]));
    
    return tokens;
  }

  classifyToken(token, protected) {
    // プレースホルダーの復元
    const protectedItem = protected.find(p => p.placeholder === token);
    if (protectedItem) {
      return { type: protectedItem.type, value: protectedItem.content };
    }

    // 数値判定
    if (/^-?\d+$/.test(token)) {
      return { type: 'integer', value: parseInt(token) };
    }
    if (/^-?\d+\.\d+$/.test(token)) {
      return { type: 'float', value: parseFloat(token) };
    }
    if (/^0x[0-9A-Fa-f]+$/.test(token)) {
      return { type: 'hex', value: token };
    }
    if (/^0o[0-7]+$/.test(token)) {
      return { type: 'oct', value: token };
    }
    if (/^0b[01]+$/.test(token)) {
      return { type: 'bin', value: token };
    }

    // 演算子判定
    const operators = ['#', ':', '?', ',', '~', ';', '|', '&', '!', 
                      '<', '<=', '=', '>=', '>', '!=', 
                      '+', '-', '*', '/', '%', '^', 
                      '$', "'", '@'];
    if (operators.includes(token)) {
      return { type: 'operator', value: token };
    }

    // Unit
    if (token === '_') {
      return { type: 'unit', value: '_' };
    }

    // 識別子
    return { type: 'identifier', value: token };
  }
}
module.exports = SignTokenizer;
