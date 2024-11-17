module.exports = my = {
  remove (regex, line) {
    return line.replace(regex, '')
  },

  lift (regex) {
    return o => typeof o === "string"
    && [...o.matchAll(regex)].length
    ? o
    .matchAll(regex)
    .reduce(
      (a, n, k) => k === 0
        ? (
          a.push(str.slice(0, n.indices[0][0]), n),
          (a.next = n.indices[0][1]),
          a
        )
        : (
          a.push(str.slice(a.next, n.indices[0][0]), n),
          (a.next = n.indices[0][1]),
          a
        ),
      []
    )
    : o
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
    letter:     /\\[\s\S]/gd,
    string:     /`[^\\`\r\n]*`/gd,
    number:     /-?\d+(\.\d+)?(e-?\d+)?/gd,
    hex :       /0x[0-9a-fA-F]+/gd,
    oct:        /0o[0-7]+/gd,
    bit:        /0b[01]+/gd,
    identifier: /[^\x00-\x40\x5B-\x60\x7B-\x7F][^\x00-\x2F\x3A-\x40\x5B-\x5E\x60\x7B-\x7F]*/gd,
    unit:       /_/gd,
  },
  compares : ['<', '=', '>', '<=', '>=', '!=', '=='],
  logic : ['|', ';', '&', '!']
};