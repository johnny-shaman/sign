module.exports = {
  removeComments(line) {
    return sourceCode.replace(/^\t*`.*$/gm, '');
  },

  operator (line) {
    return line
      .replace(/[:?|;&<=>+\-*\/%^,']+/g, ' $& ')
      .replace(/ +/g, ' ')
      .replace(/^ /gm, '')
      .replace(/ $/gm, '')
  },

  compareChain (tokens) {
    let result = [];
    let i = 0;
    let hasChanges;
  
    do {
        hasChanges = false;
        i = 0;
        result = [];
        while (i < tokens.length) {
            if (
                !Array.isArray(tokens[i])
                && (
                    tokens[i] === '<'
                    || tokens[i] === '<='
                    || tokens[i] === '>'
                    || tokens[i] === '>='
                )
                && i > 0
                && i + 1 < tokens.length
                && i + 2 < tokens.length
                && !Array.isArray(tokens[i+2])
                && (
                    tokens[i + 2] === '<'
                    || tokens[i + 2] === '<='
                    || tokens[i + 2] === '>'
                    || tokens[i + 2] === '>='
                )
            ) {
                // 最初の比較
                result.push(tokens[i-1]);  // 左辺
                result.push(tokens[i]);    // 演算子
                result.push(tokens[i+1]);  // 中央値
                result.push('&');        // 論理積
                result.push(tokens[i+1]);  // 中央値（再度）
                i += 2;  // 次の比較のために進める
                hasChanges = true;
                continue;
            }
            result.push(tokens[i]);
            i++;
        }
        tokens = result;  // 次のイテレーションのために結果を更新
    } while (hasChanges);
  
    return result;
  }
}
