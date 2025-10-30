
'use strict';

/*
  tokenizPrefix:
    - Add space after and tokenize prefix operators
  tokenizePostfix:
    - Add space before and tokenize postfix operators

  preprocess:
    - Remove control characters
    - Remove comments
    - Add spaces around binary operators
    - Handle prefix operators
    - Handle postfix operators
  
  tokenize:
    - Split by line
    - Handle indented blocks
    - Handle brackets as blocks
    - Split by spaces
  
  bracketToBlock:
    - Convert bracketed tokens to nested arrays
  
  clean:
    - Remove empty tokens
*/


const tokenize = code => code
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\xA0\xAD]/g, '')
  .replace(/^`[^\r\n]*(\r\n|[\r\n])/gm, '')
  .replace(
    /(\\[\s\S]{1})|(`[^\r\n`]*`)|([#~!$@]+)([^\r\t#~!$@]+)([!~@]+)/g,
    (_, $1, $2, $3, $4, $5) => ($1 || $2) || (
      $3 && $5
        ? `${$3}_ ${$4} _${$5}`
        : $3 ? `${$3}_ ${$4}` : `${$4} _${$5}`
    )
  )
  .replace(
    /(`[^`\r\n]*`)|(?<!\\)([\{\(])|(?<!\\)([\}\)])/g,
    (_, $1, $2, $3) => $1 || ($2 && '[') || ($3 && ']')
  )
  .replace(
    /(`[^`\r\n]*`)|(?<!\\)(\[)|(?<!\\)(\])/g,
    (_, $1, $2, $3) => $1 || ($2 && '\x1D[') || ($3 && ']\x1D')
  )
  .replace(/(\r\n|[\r\n])/g, '\r')                                  // Normalize line endings to \r
  .replace(/\r(\t+)/g, '\n$1')                                    // Next line starts with tabs, it is a code block, so convert \r to \n
  .replace(/\\\r/g, '\\\n')                                       // Escaped \\\r to \\\n
  .split('\r')
  .map(
      line => 
        line.match(/^\t+/gm)                                      // If in Block
        ? tokenize( line.replace(/^\t{1}/gm, '') )                  // in Block recursive tokenize without leading tabs
        : line
          .split('\x1D')
          .map(
            inline => inline.match(/^\[([\s\S+])\]$/gm)
              ? tokenize( inline.replace(/^\[([\s\S]+)\]$/gm, '$1') )
              : inline
                .replace(/( )|(\\[\s\S])|(`[^`\n\r]+`)/g, '\x1F$2$3')     // And replace spaces with \x1F except in strings and escaped characters
                .replace(/[\x1F]{2,}/g, '\x1F')                           // And replace multiple \x1F with single \x1F
                .split('\x1F')                                            // And split by \x1F
          )
  )

const clean = tokens => tokens
  .map( t => Array.isArray(t) ? clean(t) : t )
  .filter( t => t.length > 0);

module.exports = code => clean( tokenize( code ));
