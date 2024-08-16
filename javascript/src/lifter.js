module.exports = function (str, pattern, replacer, replacee) {
  const matches = (
    replacer
    ? str.match(pattern)?.map(s => s.replace(replacer, replacee))
    : str.match(pattern)
  ) || [];

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
