module.exports = my = {
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
        my.compares.includes(n)
        && me[k + 2]
        && my.compares.includes(me[k + 2])
          ? (a.push(n, me[k + 1], `&`), a)
          : (a.push(n), a)
      ),
      []
    );
  },

  hashmapStart (tokens) {
    tokens[tokens.length - 1] === ':'
    && tokens.push([`_${me.blockDepth( tokens[0] )}`], `?`);
    return tokens;
  },

  hashmapBlock (tokens) {
    me.blockDepth(tokens[0]) > 0
    && tokens[2] === ':'
    && tokens.unshift([`_${me.blockDepth( tokens[0] ) - 1}`], `=`);
    return tokens;
  },

  caseBlock (tokens) {
    if(
      (tokens[0].match(/\t/g) || []).length > 0
      && [...me.logic, ...me.compares].includes(tokens[2])
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

  blockDepth (s) {
    return (s.match(/\t/g) || []).length
  },

  pattern: {
    comment:    /^[`\\].*$/gm,
    letter:     /\\[\s\S]/g,
    string:     /`[^\\`\r\n]*`/g,
    number:     /-?[0-9]+\.?[0-9]*e?[0-9]*/g,
    hex :       /0x[0-9a-fA-F]+/g,
    oct:        /0o[0-8]+/g,
    bit:        /0b[01]+/g,
    identifier: /([^\x00-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]|[^\x00-\x2F\x3A-\x40\x5B-\x5E\x60\x7B-\x7F]{2})[^\x00-\x2F\x3A-\x40\x5B-\x5E\x60\x7B-\x7F]*/g,
    unit:       /(_|(\[\]))/g,
  },
  compares : ['<', '=', '>', '<=', '>=', '!=', '=='],
  logic : ['|', ';', '&', '!']
};