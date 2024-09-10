const fs = require('fs');
const readline = require('readline');

function tokenizeLine(line) {
  const tokens = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if ((char === '`' || char === '"') && !inQuote) {
      if (current) tokens.push(current);
      current = char;
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      current += char;
      tokens.push(current);
      current = '';
      inQuote = false;
    } else if (inQuote) {
      current += char;
    } else if (char === '\\' && i + 1 < line.length) {
      tokens.push(char + line[i + 1]);
      i++;
    } else if (char === '[' && line[i+1] === ']') {
      if (current) tokens.push(current);
      tokens.push('[]');
      i++;
      current = '';
    } else if (/[(){}[\]:?]/.test(char)) {
      if (current) tokens.push(current);
      tokens.push(char);
      current = '';
    } else if (char === ',') {
      if (current) tokens.push(current);
      tokens.push(',');
      current = '';
    } else if (/\s/.test(char)) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current) tokens.push(current);
  return tokens;
}

function buildStructure(lines) {
  const result = [];
  const stack = [result];
  let indentLevels = [0];

  for (const line of lines) {
    const indent = line.match(/^\t*/)[0].length;
    const tokens = tokenizeLine(line.trimLeft());

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

async function processFile(inputFile, outputFile) {
  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const lines = [];
  for await (const line of rl) {
    const cleanLine = line.replace(/^`.*`$/, '');  // コメント行を完全に削除
    if (cleanLine.trim()) {
      lines.push(cleanLine);
    }
  }

  const structure = buildStructure(lines);
  
  await fs.promises.writeFile(outputFile, JSON.stringify(structure, null, 2));
  console.log("Preprocessing completed.");
}

// Usage
const inputFile = process.argv[2];
const outputFile = `${inputFile}.sexp`;

if (!inputFile) {
  console.error('Please specify an input file.');
  process.exit(1);
}

processFile(inputFile, outputFile).catch(console.error);
