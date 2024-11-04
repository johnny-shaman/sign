const {remove, lift, compareChain, regex} = requier('./tool.js')

module.exports = async function processTokens(reader, root) {
  const tokens = compareChain(
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
  );

  return tokens[tokens.length - 1] === ':' || tokens[tokens.length - 1] === '?' 
    ? { tokens, children: processTokens(reader, root) }
    : { tokens };
}
