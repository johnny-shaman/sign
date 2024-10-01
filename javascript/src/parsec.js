// Basic parser type
const Parser = (parseFn) => ({
    run: parseFn,
    map: function(fn) {
      return Parser(input => {
        const result = this.run(input);
        if (result.success) {
          return { ...result, value: fn(result.value) };
        }
        return result;
      });
    },
    or: function(otherParser) {
      return Parser(input => {
        const result = this.run(input);
        if (result.success) {
          return result;
        }
        return otherParser.run(input);
      });
    }
  });
  
  // Basic parsers and combinators
  const regex = (re) => Parser(input => {
    const match = input.match(re);
    if (match && match.index === 0) {
      return { success: true, value: match[0], remaining: input.slice(match[0].length) };
    }
    return { success: false, remaining: input };
  });
  
  const many = (parser) => Parser(input => {
    const results = [];
    let remaining = input;
    while (true) {
      const result = parser.run(remaining);
      if (!result.success) break;
      results.push(result.value);
      remaining = result.remaining;
    }
    return { success: true, value: results, remaining };
  });
  
  // Specific parsers
  const comment = regex(/^`.*$/gm);
  const char = regex(/^\\(.)/).map(match => ({ char: match[1] }));
  const backTickString = regex(/`[^`\r\n]`/g).map(match => ({ string: match[1] }));
  const number = regex(/^-?\d+(\.\d+)?/).map(match => ({ number: parseFloat(match) }));
  const other = regex(/^[^`\\"]+/);
  
  // Main parser
  const tokenParser = many(
    comment.map(() => null)
      .or(char)
      .or(doubleQuoteString)
      .or(backTickString)
      .or(number)
      .or(other)
  );
  
  // Parse function
  function parse(input) {
    const result = tokenParser.run(input);
    if (result.success) {
      return result.value
        .filter(token => token !== null)
        .reduce((acc, token) => {
          if (typeof token === 'string' && typeof acc[acc.length - 1] === 'string') {
            acc[acc.length - 1] += token;
          } else {
            acc.push(token);
          }
          return acc;
        }, []);
    } else {
      throw new Error('Parsing failed');
    }
  }
  
  // Test
  const input = `
  x: -353.15134
  y: 4001.35364502
  Hello: "Hello"
  World: \`World\`
  \`This is a comment\`
  char: \\M
  1 <= x <= 9
  +: add
  `;
  
  const result = parse(input);
  console.log(JSON.stringify(result, null, 2));