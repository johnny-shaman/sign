module.exports = function (str, pattern) {
  const matches = str.match(pattern) || [];

  const parts = str.split(pattern);
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== '') {
      result.push(parts[i]);
    }
    if (i < matches.length) {
      result.push([matches[i]]);
    }
  }

  return result;
}
