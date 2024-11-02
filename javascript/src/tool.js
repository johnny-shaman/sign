module.exports = {
  remove (regex, line) {
    return line.replace(regex, '')
  },

  lift (regex, string) {
    const matches = string.matchAll(regex);
    if (!matches) return [string];
    
    const result = [];
    let lastIndex = 0;
    
    for (const match of matches) {
      const matchStart = match.index;
      // マッチ前の部分があれば追加
      if (matchStart > lastIndex) {
        result.push(string.slice(lastIndex, matchStart));
      }
      // マッチ部分を配列として追加
      result.push([match[0]]);
      lastIndex = matchStart + match[0].length;
    }
    
    // 残りの部分があれば追加
    if (lastIndex < string.length) {
      result.push(string.slice(lastIndex));
    }
    
    return result;
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
  },

  regex: {
    comment:    /^[`\\].*$/gm,
    letter:     /\\[\s\S]/g,
    string:     /`[^\`.]*`/g,
    number:     /-?[0-9]+\.?[0-9]*e?[0-9]*/g,
    hex :       /0x[0-9a-fA-F]+/g,
    oct:        /0o[0-8]+/g,
    bit:        /0b[01]+/g,
    identifier: /([a-zA-Z]|[_a-zA-Z]{2})[0-9a-zA-Z_]*/g,
    unit:       /(_|(\[\]))/g,
  }
}
