function buildStructure(tokenizedLines) {
    const result = [];
    const stack = [result];
    let indentLevels = [0];
  
    for (const { indent, tokens } of tokenizedLines) {
      while (indent < indentLevels[indentLevels.length - 1]) {
        stack.pop();
        indentLevels.pop();
      }
  
      if (indent > indentLevels[indentLevels.length - 1]) {
        const newBlock = [];
        stack[stack.length - 1].push(newBlock);
        stack.push(newBlock);
        indentLevels.push(indent);
      }
  
      if (tokens.length > 0) {
        stack[stack.length - 1].push(tokens);
      }
    }
  
    return result;
  }
  
  module.exports = { buildStructure };
  