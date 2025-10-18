const processFile = require('./preprocessor.js');

const inputFile = process.argv[2];
const outputFile = `${process.argv[2]}.snir`

processFile(inputFile, outputFile).catch(console.error);
