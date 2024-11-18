const {
  remove,
  lift,
  normalizeCompares,
  keymapStart,
  keymapBlock,
  caseBlock,
  pattern
} = require('./tool.js')

module.exports = function processTokens(line) {
  return caseBlock(
    keymapBlock(
      keymapStart(
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
