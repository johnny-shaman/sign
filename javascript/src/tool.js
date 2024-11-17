const my = module.exports = {
  remove (regex, line) {
    return line.replace(regex, '')
  },

  lift (regex) {
    let lastIndex = 0;
    return string => typeof string === 'strring' && string.matchAll(regex)
      ? [...string.matchAll(regex)].reduce(
        (acc, {0: match, index}) => {
            index > lastIndex && acc.push(string.slice(lastIndex, index));
            acc.push([match]);
            lastIndex = index + match.length;
            return acc;
        }, 
        []
      )
      : string;
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
    && tokens.push([`_${my.blockDepth( tokens[0] )}`], `?`);
    return tokens;
  },

  hashmapBlock (tokens) {
    my.blockDepth(tokens[0]) > 0
    && tokens[2] === ':'
    && tokens.unshift([`_${my.blockDepth( tokens[0] ) - 1}`], `=`);
    return tokens;
  },

  caseBlock (tokens) {
    if(
      (tokens[0].match(/\t/g) || []).length > 0
      && [...my.logic, ...my.compares].includes(tokens[2])
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