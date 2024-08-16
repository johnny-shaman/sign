function tokenSplit(input) {
  // Step 1: Encapsulate string literals
  let encapsulated = encapsulateStringLiterals(input);

  // Step 2: Encapsulate lambda argument lists
  encapsulated = encapsulateLambdaArgs(encapsulated);

  // Step 3: Encapsulate spread operations
  encapsulated = encapsulateSpreadOperations(encapsulated);

  // Step 4: Remove whitespace from non-encapsulated parts
  encapsulated = removeWhitespace(encapsulated);

  // Step 5 & 6: Insert spaces around non-word characters
  encapsulated = insertSpacesAroundSymbols(encapsulated);

  // Step 7: Flatten the array
  let flattened = flattenArray(encapsulated);

  // Step 8: Remove duplicate whitespace
  let result = removeDuplicateWhitespace(flattened);

  return result;
}

function encapsulateStringLiterals(input) {
  return input.replace(/`[^`]*`/g, match => [match]);
}

function encapsulateLambdaArgs(input) {
  return input.replace(/(\w+(?:\s+\w+)*)\s*\?/g, (match, args) => [[args], '?']);
}

function encapsulateSpreadOperations(input) {
  return input.replace(/~\w+/g, match => [match]);
}

function removeWhitespace(input) {
  if (Array.isArray(input)) {
    return input.map(removeWhitespace);
  }
  return input.replace(/\s+/g, '');
}

function insertSpacesAroundSymbols(input) {
  if (Array.isArray(input)) {
    return input.map(insertSpacesAroundSymbols);
  }
  return input.replace(/^([^\w\s]+)/, ' $1 ')
              .replace(/([^\w\s]+)(?!$)/g, ' $1 ');
}

function flattenArray(arr) {
  return arr.reduce((flat, toFlatten) => 
    flat.concat(Array.isArray(toFlatten) ? flattenArray(toFlatten) : toFlatten), []);
}

function removeDuplicateWhitespace(input) {
  return input.replace(/\s+/g, ' ').trim();
}

// 使用例
const input = "f x ~y ? `a b c` | (g <= 10) & h'i";
console.log(tokenSplit(input));
