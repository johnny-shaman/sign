module.exports = function (str, message, ...tests) {
  const result = tests.reduce((result, test) => result | test.test(str), false);
  if(result) {
    console.error(message);
  }
  return result
}
