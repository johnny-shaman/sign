
'use strict';

const preprocess = code => code
  .replace(/^`[^\r\n]*$/gm, '')                                   // Remove comment lines (改行を含まない)
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\xA0\xAD]/g, ''); // Remove Control Characters


const tokenize = code => code
  .replace(/\r\n|[\r\n]/g, '\r')                                  // Normalize line endings to \r
  .replace(/\r(\t+)/g, '\n$1')                                    // Next line starts with tabs, it is a code block, so convert \r to \n
  .replace(/\\\r/g, '\\\n')                                       // Escaped \\\r to \\\n
  .split('\r')
  .map(
      line => 
        line.match(/^\t{1}/gm)                                      // If in Block
        ? tokenize( line.replace(/^\t{1}/gm, '') )                  // in Block recursive tokenize without leading tabs
        : line
          .replace(/(?<!\\)[\[\{\(]([^\r\n]+)(?<!\\)[\]\}\)]/, '[ $1 ]')
          .replace(/( )|(\\[\s\S])|(`[^`\n\r]+`)/g, '\x1F$2$3')     // And replace spaces with \x1F except in strings and escaped characters
          .replace(/[\x1F]{2,}/g, '\x1F')                           // And replace multiple \x1F with single \x1F
          .split('\x1F')                                            // And split by \x1F
  );

const bracketToBlock = tokens => 
  Array.isArray(tokens) 
    ? tokens.reduce(({ result, skip }, token, idx) => 
        skip > idx ? { result, skip }
        : Array.isArray(token) ? { result: [...result, bracketToBlock(token)], skip }
        : ['[', '{', '('].includes(token) 
          ? (() => {
              const close = { '[': ']', '{': '}', '(': ')' }[token];
              const findClose = (ts, depth = 1, pos = idx + 1) =>
                depth === 0 ? pos
                : pos >= ts.length ? pos
                : findClose(ts, 
                    depth + (ts[pos] === token ? 1 : ts[pos] === close ? -1 : 0), 
                    pos + 1);
              const end = findClose(tokens);
              return { 
                result: [...result, bracketToBlock(tokens.slice(idx + 1, end))], 
                skip: end + 1 
              };
            })()
        : [']', '}', ')'].includes(token) ? { result, skip }
        : { result: [...result, token], skip }
      , { result: [], skip: 0 }).result
    : tokens;

const clean = tokens => tokens
  .map( t => Array.isArray(t) ? clean(t) : t )                        // If token is array, clean recursively
  .filter( t => t.length > 0 || t !== '[');                           // Remove empty tokens

module.exports = code => clean( bracketToBlock( tokenize( preprocess( code ) ) ) );

