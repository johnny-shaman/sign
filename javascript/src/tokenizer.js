const {
  remove,
  lift,
  normalizeCompares,
  dictionaryStart,
  dictionaryContent,
  matchCaseContent,
  regex
} = requier('./tool.js')

module.exports = async function processTokens(reader) {
  return await matchCaseContent(
    dictionaryContent(
      dictionaryStart(
        normalizeCompares(
          lift(
            regex.letter,
            remove(
              regex.comment,
              await reader.readLine()
            )
          )
          .map(
            o => typeof o === 'string' ? lift(regex.string) : o
          )
          .map(
            o => typeof o === 'string' ? lift(regex.number) : o
          )
          .map(
            o => typeof o === 'string' ? lift(regex.hex) : o
          )
          .map(
            o => typeof o === 'string' ? lift(regex.oct) : o
          )
          .map(
            o => typeof o === 'string' ? lift(regex.bit) : o
          )
          .map(
            o => typeof o === 'string' ? lift(regex.identifier) : o
          )
          .map(
            o => typeof o === 'string' ? lift(regex.unit) : o
          )
        )
      )
    )
  );
}
