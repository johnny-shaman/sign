
'use strict';

const preprocess = code => code
  .replace(/^`[^\r\n]*$/gm, '')                                   // Remove comment lines (改行を含まない)
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\xA0\xAD]/g, ''); // Remove Control Characters


const tokenize = code => [
    code
    .replace(/\r\n|[\r\n]/g, '\r')                                  // Normalize line endings to \r
    .replace(/\r(\t+)/g, '\n$1')                                    // Next line starts with tabs, it is a code block, so convert \r to \n
    .replace(/\\\r/g, '\\\n')
    .replace(/[\[\{\(]([^\r\n]+)[\)\}\]]/g, '$1')
  ]
  .map(
    t => t.split('\r')
  )
  .map(
      block => block.map(
        line => line.match(/^\t/gm)                                 // If in block
          ? tokenize( line.replace(/^\t/gm, '') )                     // in block recursive tokenize without leading tabs
          : line                                                      // Else Split by spaces except in strings and escaped characters
            .replace(/( )|(\\[\s\S])|(`[^`\n\r]+`)/g, '\x1F$2$3')     // And replace spaces with \x1F except in strings and escaped characters
            .replace(/^\x1F+/gm, '')                                  // And remove leading \x1F
            .replace(/[\x1F]{2,}/g, '\x1F')                           // And replace multiple \x1F with single \x1F
            .split('\x1F')                                            // And split by \x1F
    )
  );

module.exports = code => tokenize(preprocess(code));

