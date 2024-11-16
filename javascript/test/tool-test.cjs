const assert = require('node:assert/strict');
const {pattern} = require('../src/tool.js');

function main() {
	pattern_test();
}
main();


/**
 * Tests a regular expression pattern against a set of test cases.
 *
 * @param {string} name - The name of the test case for identification.
 * @param {RegExp} reg - The regular expression to be tested.
 * @param {Object} testcase - An object containing input strings as keys and expected boolean results as values.
 */
function hardmatch(name, reg, testcase) {
	const PATTERN = new RegExp(`^${reg.source}$`);
	Object.entries(testcase).forEach(([input, expected]) => {
		try {
			assert.equal(PATTERN.test(input), expected,`${name} : ${input}`);
		} catch(e) {
			console.error(e);
		}
	});
}

function match(name, reg, testcase) {
	const PATTERN = reg;
	Object.entries(testcase).forEach(([input, expected]) => {
		try {
			assert.equal(PATTERN.exec(input), expected,`${name} : ${input}`);
		} catch(e) {
			console.error(e);
		}
	});
}


function matchAll(name, reg, testcase) {
	const PATTERN = reg;
	Object.entries(testcase).forEach(([input, expected]) => {
		try {
			let matches = [...input.matchAll(PATTERN)];
			assert.equal(matches.length, expected?.length, `${name} length : ${input}`);
			matches.forEach((match, index) => {
				assert.equal(match[0], expected?.[index]?.text, `${name} text : ${input} : ${index}`);
				assert.equal(match.index, expected?.[index]?.index, `${name} index : ${input} : ${index}`);
			});
		} catch(e) {
			console.error(e);
		}
	});
}

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
	pattern_unit();
}

function pattern_comment() {
	hardmatch('pattern.comment', pattern.comment, {
		'\\comment' :  true,
		'\\\\comment' :  true,
		'\\\\\\comment' :  true,
		'`comment' :  true,
		'\\ comment' :  true,
		'\\\\ comment' :  true,
		'\\\\\ comment' :  true,
		'` comment' :  true,
		'1 not comment' :  false,
		'not comment' :  false,
		'  \\ not comment' :  false,
		'  \\\\ not comment' :  false,
		'  \\\\\\ not comment' :  false,
		'  ` not comment' :  false,
		'  1 not comment' :  false,
		'  not comment' :  false,
		'	\\ not comment' :  false,
		'	\\\\ not comment' :  false,
		'	\\\\\\ not comment' :  false,
		'	` not comment' :  false,
		'	1 not comment' :  false,
		'	not comment' :  false,
		'	 not comment' :  false
	});
}
function pattern_letter() {
	hardmatch('pattern.letter', pattern.letter, {
		'\\a' :  true,
		'\\z' :  true,
		'\\A' :  true,
		'\\Z' :  true,
		'\\0' :  true,
		'\\9' :  true,
		'\\\\' :  true,
		'\\￿' :  true,  // U+FFFF
		'\\𐀀' :  false, // U+10000
	});
	matchAll('pattern.letter', pattern.letter, {
		'\\a' :  [ { text: '\\a', index: 0 }],
		'\\A' :  [ { text: '\\A', index: 0 }],
		'\\0' :  [ { text: '\\0', index: 0 }],
		'\\\\' :  [ { text: '\\\\', index: 0 }],
		'\\￿' :  [{ text: '\\￿', index: 0 }],
		'\\a\\b' : [{ text: '\\a', index: 0 }, {text: '\\b', index: 2}],
		' \\a \\b' : [{ text: '\\a', index: 1 }, {text: '\\b', index: 4}],
	});
}
function pattern_string() {
	hardmatch('pattern.string', pattern.string, {
		'``' : true,
		'`abc`' : true,
		'`ab\nc`' : false,
		'`ab\r\nc`' : false,
		'`abc' : false,
		'abc`' : false,
	});
	matchAll('pattern.string', pattern.string, {
		'``' :  [ { text: '``', index: 0 }],
		'`abc`' :  [ { text: '`abc`', index: 0 }],
		'test`abc`' :  [ { text: '`abc`', index: 4 }],
		'test`abc`str`def`' :  [ { text: '`abc`', index: 4 }, { text: '`def`', index: 12 }],
	});
}
function pattern_number() {
	hardmatch('pattern.number', pattern.number, {
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
	});
}
function pattern_hex() {
	hardmatch('pattern.hex', pattern.hex, {

	});
}
function pattern_oct() {
	hardmatch('pattern.oct', pattern.oct, {

	});

}
function pattern_bit() {
	hardmatch('pattern.bit', pattern.bit, {

	});
}
function pattern_identifier() {
	hardmatch('pattern.identifier', pattern.identifier, {

	});
}

function pattern_unit() {
	hardmatch('pattern.unit', pattern.unit, {

	});
}
//#endregion