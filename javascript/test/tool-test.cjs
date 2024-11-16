const assert = require('node:assert/strict');
const {pattern} = require('../src/tool.js');

function main() {
	pattern_test();
}
main();

// #region"pattern test"
function pattern_test() {
	pattern_comment();
	pattern_letter();
	pattern_string();
	pattern_number();
	pattern_hex();
	pattern_oct();
	pattern_bit();
	pattern_identifier();
}

function pattern_comment() {

}
function pattern_letter() {

}
function pattern_string() {

}
function pattern_number() {
	const PATTERN = new RegExp(`^${pattern.number.source}$`)
	Object.entries({
		'1' : true,
		'1.' : false,
		'.1' : false,
		'1' : true,
		'1.000' : true,
		'3e1' : true,
		'3e-1' : true,
		'3.14e' : false,
		'3.14e1' : true,
		'3.14e-2' : true,
		'-' : false,
		'-1' : true,
		'-0' : true,
		'-1.0' : true,
		'-3e' : false,
		'-3e1' : true,
		'-3e-1' : true,
		'-3.14e' : false,
		'-3.14e1' : true,
		'-3.14e-2' : true,
	}).forEach(([input, expected]) => {
		assert.equal(PATTERN.test(input), expected,`pattern number : ${input}`);
	});
}
function pattern_hex() {

}
function pattern_oct() {

}
function pattern_bit() {

}
function pattern_identifier() {

}

//#endregion