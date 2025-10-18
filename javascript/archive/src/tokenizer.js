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
  let tokens = remove( pattern.comment, line ).replace(pattern.postfix, `_$2 $1`);

  return caseBlock(
    keymapBlock(
      keymapStart(
        normalizeCompares(
          (
            tokens = [
              pattern.string,
              pattern.letter,
              pattern.identifier,
              pattern.unit,
              pattern.hex,
              pattern.oct,
              pattern.bit,
              pattern.number
            ].reduce(
              (t, p) => lift(p)(t),
              tokens
            ),

            typeof tokens === 'string' ? [tokens] : tokens
          )
        )
      )
    )
  );
}
