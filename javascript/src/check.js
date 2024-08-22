module.exports = function (str, message, ...tests) {
  const result = tests.reduce((result, regex) => result | regex.test(str), false);
  if(result) {
    console.error(message);
  }
  return result
}
