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
          (
            tokens = [
              pattern.string,
              pattern.letter,
              pattern.hex,
              pattern.oct,
              pattern.bit,
              pattern.number,
              pattern.identifier,
              pattern.unit,
            ].reduce(
              (t, p) => lift(p)(t),
              remove( pattern.comment, line )
            ),

            typeof tokens === 'string' ? [tokens] : tokens
          )
        )
      )
    )
  );
}
