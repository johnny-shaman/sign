module.exports = function (counter, str, tests) {
  if(tests.reduce((result, test) => result | test.test(str), false)) {
    throw new SyntaxError(`Sorry... "${str}" is Illegal Syntax on line ${counter}`);
  }
}
