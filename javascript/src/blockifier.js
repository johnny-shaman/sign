// blockifier.js
class SignBlockifier {
  constructor(tokens) {
    this.tokens = tokens;
  }

  blockify() {
    return this.processIndents(this.tokens);
  }

  processIndents(tokens) {
    const result = [];
    let i = 0;
    
    while (i < tokens.length) {
      const token = tokens[i];
      
      // 改行 + インデント検出
      if (token.type === 'newline') {
        const indentLevel = this.detectIndent(tokens, i + 1);
        
        if (indentLevel > 0) {
          // インデントブロックを作成
          const block = this.extractBlock(tokens, i + 1, indentLevel);
          result.push({ type: 'block', content: block });
          i += block.tokenCount;
        } else {
          i++;
        }
      } else if (['(', '[', '{'].includes(token.value)) {
        // インラインブロック
        const block = this.extractInlineBlock(tokens, i);
        result.push(block);
        i += block.tokenCount;
      } else {
        result.push(token);
        i++;
      }
    }
    
    return result;
  }

  detectIndent(tokens, startIndex) {
    let level = 0;
    for (let i = startIndex; i < tokens.length; i++) {
      if (tokens[i].type === 'indent') {
        level++;
      } else {
        break;
      }
    }
    return level;
  }

  extractBlock(tokens, startIndex, indentLevel) {
    const content = [];
    let i = startIndex + indentLevel; // インデントをスキップ
    let currentIndent = indentLevel;
    
    while (i < tokens.length && currentIndent >= indentLevel) {
      if (tokens[i].type === 'newline') {
        currentIndent = this.detectIndent(tokens, i + 1);
        if (currentIndent < indentLevel) break;
        i += currentIndent + 1;
      } else {
        content.push(tokens[i]);
        i++;
      }
    }
    
    return { content, tokenCount: i - startIndex };
  }
}

module.exports = SignBlockifier;
