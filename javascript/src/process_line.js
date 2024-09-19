const rp = require("./replacer");

module.exports = function (line) {
  // 1. コメント削除
  line = rp.removeComments(line);

  // 2. リテラル退避
  const literals = [];
  line = line.replace(/(`[^`\n]+`|\\.|[-]?\d*\.?\d+)/g, (match) => {
    literals.push(match);
    return `__LITERAL_${literals.length - 1}__`;
  });

  line = rp.operator(line);
  line = rp.compareChain(line);
  line = rp.dictToCase.head(line);
  line = rp.dictToCase.content(line);

  //退避リテラルを戻す
  line = line.replace(/__LITERAL_(\d+)__/g, (_, index) => literals[index]);

  return line;
}
