const fs = require('fs');
const readline = require('readline');
const tokenize = require('./tokenizer.js');

module.exports = async function (inputFile, outputFile) {

  const inStream = fs.createReadStream(inputFile);
  const outStream = fs.createWriteStream(outputFile);
  const reader = readline.createInterface({
    input: inStream,
    // output: outStream,
  });

  for await (let line of reader) {
    let tokens = tokenize(line);
    tokens.length === 1 && tokens[0] == ''
        ? undefined
        : outStream.write(JSON.stringify(tokens) + '\n');
  }
}

// 使用例
//analyzeStructure(process.argv[2], `${process.argv[2]}.json`);
