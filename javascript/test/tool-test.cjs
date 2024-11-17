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
		'\\comment' : true,
		'\\\\comment' : true,
		'\\\\\\comment' : true,
		'`comment' : true,
		'\\ comment' : true,
		'\\\\ comment' : true,
		'\\\\\ comment' : true,
		'` comment' : true,
		'1 not comment' : false,
		'not comment' : false,
		'  \\ not comment' : false,
		'  \\\\ not comment' : false,
		'  \\\\\\ not comment' : false,
		'  ` not comment' : false,
		'  1 not comment' : false,
		'  not comment' : false,
		'	\\ not comment' : false,
		'	\\\\ not comment' : false,
		'	\\\\\\ not comment' : false,
		'	` not comment' : false,
		'	1 not comment' : false,
		'	not comment' : false,
		'	 not comment' : false
	});
}
function pattern_letter() {
	hardmatch('pattern.letter', pattern.letter, {
		'\\a' : true,
		'\\z' : true,
		'\\A' : true,
		'\\Z' : true,
		'\\0' : true,
		'\\9' : true,
		'\\\\' : true,
		'\\￿' : true,  // U+FFFF
		'\\𐀀' : false, // U+10000
	});
	matchAll('pattern.letter', pattern.letter, {
		'\\a' : [ { text: '\\a', index: 0 }],
		'\\A' : [ { text: '\\A', index: 0 }],
		'\\0' : [ { text: '\\0', index: 0 }],
		'\\\\' : [ { text: '\\\\', index: 0 }],
		'\\￿' : [{ text: '\\￿', index: 0 }],
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
		'``' : [ { text: '``', index: 0 }],
		'`abc`' : [ { text: '`abc`', index: 0 }],
		'test`abc`' : [ { text: '`abc`', index: 4 }],
		'test`abc`str`def`' : [ { text: '`abc`', index: 4 }, { text: '`def`', index: 12 }],
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
		'1' : false,
		'0' : false,
		'0x' : false,
		'0x1' : true,
		'0xF' : true,
		'0x1F' : true,
		'0xF1' : true,
		'0xFFFFFF' : true,
		'0x000000' : true,
	});
}
function pattern_oct() {
	hardmatch('pattern.oct', pattern.oct, {
		'0' : false,
		'0o' : false,
		'0o8' : false,
		'0o1' : true,
		'0o7' : true,
		'0o7' : true,
		'0o77' : true,
		'0o777' : true,
	});

}
function pattern_bit() {
	hardmatch('pattern.bit', pattern.bit, {
		'0' : false,
		'0b' : false,
		'0b2' : false,
		'0b1' : true,
		'0b11' : true,
		'0b111' : true,
		'0b1111' : true,
		'0b11111' : true,
	});
}
function pattern_identifier() {
	hardmatch('pattern.identifier', pattern.identifier, {
		'_' : false,
		'__' : false,
		'_a' : false,
		'_0' : false,
		'0' : false,
		'9_' : false,
		'9a' : false,
		'01' : false,
		'a' : true,
		'a_' : true,
		'aa' : true,
		'a9' : true,
		'あああ' : true,
		'試験' : true,
	});
}

function pattern_unit() {
	hardmatch('pattern.unit', pattern.unit, {
		'_' : true,
		'__' : false,
		'a' : false,
		'0' : false,
	});
}
//#endregion