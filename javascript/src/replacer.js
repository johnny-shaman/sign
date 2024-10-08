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

  compareChain (line) {
    return line.replace(
      /(\S+(?: ([<>]=?|=|!=) \S+)+)/g,
      match => {
      const parts = match.split(/ ([<>]=?|=|!=) /g);
      switch (parts.length > 2) {
        case true : {
          let result = '';
          for (let i = 1; i < parts.length; i += 2) {
            result && (result += ' & ');
            result += `${parts[i-1]} ${parts[i]} ${parts[i+1]}`;
          }
          return result;
        }
        default : return match;
      }
    });
  }

}
