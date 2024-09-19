const fs = require('fs');
const readline = require('readline');

function analyzeStructure(inputFile, outputFile) {
  const readInterface = readline.createInterface({
    input: fs.createReadStream(inputFile),
    output: process.stdout,
    console: false
  });

  const writeStream = fs.createWriteStream(outputFile);
  
  let literals = [];
  let literalIndex = 0;
  let blockStack = [{ indent: -1, content: [], children: [] }];
  let currentBlock = blockStack[0];

  function replaceLiteral(match) {
    literals.push(match);
    return `LITERAL_${literalIndex++}`;
  }

  function restoreLiterals(content) {
    return content.replace(/LITERAL_(\d+)/g, (_, index) => literals[index]);
  }

  readInterface.on('line', function(line) {
    // コメントの削除
    if (line.trimLeft().startsWith('`')) return;

    // リテラルの退避
    let processedLine = line.replace(/\\./g, replaceLiteral)  // 文字リテラル
                            .replace(/`[^`]*`/g, replaceLiteral)  // 文字列リテラル
                            .replace(/-?\d+(\.\d+)?/g, replaceLiteral);  // 数値リテラル

    const trimmedLine = processedLine.trimRight();
    if (trimmedLine === '') return;  // 空行をスキップ

    const indent = line.search(/\S|$/);
    const content = trimmedLine.trim();

    while (indent <= currentBlock.indent) {
      blockStack.pop();
      currentBlock = blockStack[blockStack.length - 1];
    }

    const newBlock = { indent, content: [content], children: [] };
    currentBlock.children.push(newBlock);
    blockStack.push(newBlock);
    currentBlock = newBlock;
  });

  readInterface.on('close', function() {
    // リテラルを復元する
    function restoreBlockLiterals(block) {
      block.content = block.content.map(restoreLiterals);
      block.children = block.children.map(restoreBlockLiterals);
      return block;
    }

    const restoredStructure = restoreBlockLiterals(blockStack[0]).children;

    writeStream.write(JSON.stringify({ structure: restoredStructure }, null, 2));
    writeStream.end();
    console.log('Analysis complete. Results written to output file.');
  });
}

// 使用例
analyzeStructure(process.argv[2], `${process.argv[2]}.json`);
