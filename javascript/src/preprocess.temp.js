
function getTemporaryST(expression) {
  const regex = /[()\[\]{}]/g;
  let result = [];
  let currentString = '';
  const stack = [];

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    if (char.match(regex)) {
      if (currentString) {
        result.push(currentString);
        currentString = '';
      }
      if ('([{'.includes(char)) {
        stack.push([char, result]);
        result = [];
      } else if (')]}'.includes(char)) {
        if (stack.length === 0) {
          throw new Error('Mismatched closing bracket: ' + char);
        }
        const [openBracket, parentResult] = stack.pop();
        if (
          (openBracket === '(' && char !== ')') ||
          (openBracket === '[' && char !== ']') ||
          (openBracket === '{' && char !== '}')
        ) {
          throw new Error('Mismatched brackets: ' + openBracket + ' and ' + char);
        }
        parentResult.push(result);
        result = parentResult;
      }
    } else {
      currentString += char;
    }
  }

  if (currentString) {
    result.push(currentString);
  }

  if (stack.length > 0) {
    throw new Error('Unclosed brackets: ' + stack.map(([bracket]) => bracket).join(', '));
  }

  return result;
}

function processCompare(expression) {
  // 比較演算子を識別する正規表現
  const operators = /(<|=|>|!=|<=|>=)/;
  
  // 式をカッコで分割

  // 式を演算子で分割
  const parts = expression.split(operators).filter(part => part.trim());
  console.log(parts)

  // 結果を格納する配列
  const result = [];
  
  // 分割した部分を処理
  for (let i = 0; i < parts.length - 2; i += 2) {
    const left = parts[i].trim();
    const op = parts[i+1].trim();
    const right = parts[i+2].trim();
    
    // 二項比較式を作成
    const comparison = `${left} ${op} ${right}`;
    result.push(comparison);
  }
  
  // 論理積で結合
  return result.join(' & ');
}

function preprocess (expression) {
  return parseBracketsRecursive(expression).map(replaceCompareChainToLogicChain);
}

