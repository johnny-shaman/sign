const { processFile } = require('./preprocessor');

const inputFile = process.argv[2];
const outputFile = `${inputFile}.sexp`;

if (!inputFile) {
  console.error('Please specify an input file.');
  process.exit(1);
}

processFile(inputFile, outputFile).catch(console.error);
