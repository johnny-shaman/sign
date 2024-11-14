const {
  remove,
  lift,
  normalizeCompares,
  hashmapStart,
  hashmapBlock,
  caseBlock,
  pattern
} = requier('./tool.js')

module.exports = function processTokens(line) {
  return caseBlock(
    hashmapBlock(
      hashmapStart(
        normalizeCompares(
          lift(
            pattern.letter,
            remove(
              pattern.comment,
              line
            )
          )
          .map(
            o => typeof o === 'string' ? lift(pattern.string) : o
          )
          .map(
            o => typeof o === 'string' ? lift(pattern.number) : o
          )
          .map(
            o => typeof o === 'string' ? lift(pattern.hex) : o
          )
          .map(
            o => typeof o === 'string' ? lift(pattern.oct) : o
          )
          .map(
            o => typeof o === 'string' ? lift(pattern.bit) : o
          )
          .map(
            o => typeof o === 'string' ? lift(pattern.identifier) : o
          )
          .map(
            o => typeof o === 'string' ? lift(pattern.unit) : o
          )
        )
      )
    )
  );
}
