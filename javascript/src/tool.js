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

  normalizeCompares (tokens) {
    return tokens.reduce(
      (a, n, k, me) => (
        this.compares.includes(n)
        && me[k + 2]
        && this.compares.includes(me[k + 2])
          ? (a.push(n, me[k + 1], `&`), a)
          : (a.push(n), a)
      ),
      []
    );
  },

  dictionaryStart (tokens) {
    tokens[tokens.length - 1] === ':'
    && tokens.push([`_${(tokens[0].match(/\t/g) || []).length}`], `?`);
    return tokens;
  },

  dictionaryContent (tokens) {
    (tokens[0].match(/\t/g) || []).length > 0
    && tokens[2] === ':'
    && tokens[tokens.length - 1] !== ':'
    && tokens.unshift([`_${tokens[0].match(/\t/g).length - 1}`], `=`);
    return tokens;
  },

  matchCaseContent (tokens) {
    if(
      (tokens[0].match(/\t/g) || []).length > 0
      && tokens.reduce((a, n) => a || this.compares.includes(n), false)
      && tokens.includes(':')
    ) {
      let result = tokens.reduce(
        (a, n) => (
          n === ':'
          ? (a.push('&', '[', ['_'], '?',), a)
          : (a.push(n), a)
        )
        , []
      );
      result.push(']', ';');
      return result;
    }
    return tokens;
  },

  pattern: {
    comment:    /^[`\\].*$/gm,
    letter:     /\\[\s\S]/g,
    string:     /`[^\`.]*`/g,
    number:     /-?[0-9]+\.?[0-9]*e?[0-9]*/g,
    hex :       /0x[0-9a-fA-F]+/g,
    oct:        /0o[0-8]+/g,
    bit:        /0b[01]+/g,
    identifier: /([a-zA-Z]|[_a-zA-Z]{2})[0-9a-zA-Z_]*/g,
    unit:       /(_|(\[\]))/g,
  },
  compares : ['<', '=', '>', '<=', '>=', '!=', '==']
};