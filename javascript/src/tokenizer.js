const {remove, lift, compareChain, regex} = requier('./tool.js')

module.exports = async function processTokens(reader) {
  const tokens = compareChain(
    lift(
      remove(
        regex.comment,
        await reader.readLine()
      )
    )
  );

  // トークン列の性質に応じて適切な構造を返す
  // childrenを持つべきかどうかも、この関数の中で判断する
  return tokens[tokens.length - 1] === ':' || tokens[tokens.length - 1] === '?' 
    ? { tokens, children: processTokens(reader) }
    : { tokens };
}
