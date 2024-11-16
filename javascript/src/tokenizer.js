const {
  remove,
  lift,
  normalizeCompares,
  hashmapStart,
  hashmapBlock,
  caseBlock,
  pattern
} = require('./tool.js')

module.exports = function processTokens(line) {
  return caseBlock(
    hashmapBlock(
      hashmapStart(
        normalizeCompares(
          lift( pattern.string )( remove( pattern.comment, line ) )
          .map(lift( pattern.letter ))
          .map(lift( pattern.number ))
          .map(lift( pattern.hex ))
          .map(lift( pattern.oct ))
          .map(lift( pattern.bit ))
          .map(lift( pattern.identifier ))
          .map(lift( pattern.unit ))
        )
      )
    )
  );
}
