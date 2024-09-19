const OPERATORS = {
    COMPARISON: /<=|>=|!=|[<=>]/,
    LOGICAL: /[&|;]/,
    ASSIGNMENT: /:/,
    ARITHMETIC: /[+\-*\/%^]/,
    GET: /'/,
    LAMBDA: /\?/,
    SPREAD: /~/,
    COMMA: /,/
  };
  
  function tokenizeLine(line) {
    const indent = getIndent(line);
    const tokens = [];
    let current = '';
    let inQuote = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '`') {
        if (inQuote) {
          tokens.push(current + char);
          current = '';
        } else {
          if (current) tokens.push(current);
          current = char;
        }
        inQuote = !inQuote;
      } else if (inQuote) {
        current += char;
      } else if (char === '\\' && i + 1 < line.length) {
        if (current) tokens.push(current);
        tokens.push(char + line[++i]);
        current = '';
      } else if (char === '[' || char === ']') {
        if (current) tokens.push(current);
        tokens.push(char);
        current = '';
      } else if (isOperator(char, line[i + 1])) {
        if (current) tokens.push(current);
        const op = getOperator(char, line[i + 1]);
        tokens.push(op);
        if (op.length > 1) i++;
        current = '';
      } else if (char === ' ' && !current) {
        // Ignore leading spaces
      } else {
        current += char;
      }
    }
    
    if (current) tokens.push(current);
    return { indent, tokens };
  }
  
  function getIndent(line) {
    return line.match(/^\t*/)[0].length;
  }
  
  function isOperator(char, nextChar) {
    const combinedChar = char + (nextChar || '');
    return Object.values(OPERATORS).some(regex => regex.test(combinedChar));
  }
  
  function getOperator(char, nextChar) {
    const combinedChar = char + (nextChar || '');
    for (const [type, regex] of Object.entries(OPERATORS)) {
      if (regex.test(combinedChar)) {
        return combinedChar.match(regex)[0];
      }
    }
    return char;
  }
  
  module.exports = { tokenizeLine };
  