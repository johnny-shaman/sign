
'use strict';

/**
 * Lexical analysis of code into tokens.
 *
 * @param {string} code The code to lex.
 * @returns {string[][]} The lexed code as an array of lines, each line being an array of tokens.
 */

module.exports = code => code
  .replace(/^`[\s\S]+`?$/gm, '')                                  // Remove Comments
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\xA0\xAD]/g, '')  // Remove Control Characters
  .replace(/\r\n|[\r\n]/g, '\r')                                  // Normalize line endings to \r
  .replace(/\r(\t+)/g, '\n$1')                                    // Next line starts with tabs, it is a code block, so convert \r to \n
  .replace(/\\\r/g, '\\\n')                                       // If \r is escaped, convert to \n
  .split('\r')                                                    // Split by \r
  .map(
    line => line.match(/\n/gm)                                    // If in block or \n code
      ? [line]                                                    // Then return single element array
      : line                                                      // Else Split by spaces except in strings and escaped characters
        .replace(/( )|(\\[\s\S])|(`[^`\n\r]+`)/g, '\x1F$2$3')     // And replace spaces with \x1F except in strings and escaped characters
        .replace(/^\x1F+/gm, '')                                  // And remove leading \x1F
        .replace(/[\x1F]{2,}/g, '\x1F')                           // And replace multiple \x1F with single \x1F
        .split('\x1F')                                            // And split by \x1F
  );
