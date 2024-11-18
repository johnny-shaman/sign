const fs = require('fs');
const readline = require('readline');
const tokenize = require('./tokenizer.js');

module.exports = async function (inputFile, outputFile) {
  const reader = readline.createInterface({
    input: fs.createReadStream(inputFile),
    output: fs.createWriteStream(outputFile),
  });

  for await (let line of reader) {
    reader.write(tokenize(line))
  }

}

// 使用例
//analyzeStructure(process.argv[2], `${process.argv[2]}.json`);
