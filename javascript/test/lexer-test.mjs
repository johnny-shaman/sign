import fs from 'node:fs';
import readline from 'node:readline';
import { fileURLToPath } from "node:url";
import path from "node:path";

import { Lexer, TokenTypes, LexerError } from '../src/lexer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テストヘルパー関数
function tokenize(input) {
	const lexer = new Lexer(input);
	return lexer.tokenize();
}

async function readfile(file) {
	var filePath = path.join(__dirname, file);
	const inStream = fs.createReadStream(filePath);
	const reader = readline.createInterface({
		input: inStream,
	});
	const tokens = [];
	for await (let line of reader) {
		tokens.push(line);
	}
	return tokens.flat().join('\n');
}

function assertTokens(input, expectedTokens, debug = false) {
	console.group();
	const tokens = tokenize(input);
	if (debug) console.log('tokens: ', tokens);
	const actualTypes = tokens.map(t => t.type);
	const expectedTypes = expectedTokens.map(t => t.type);

	const res = JSON.stringify(actualTypes) === JSON.stringify(expectedTypes);
	console.assert(
		res,
		`Expected: ${JSON.stringify(expectedTypes)}\nGot     : ${JSON.stringify(actualTypes)}\n`
	);
	if (!res) {
		console.debug(`Expected: ${JSON.stringify(expectedTypes)}\nGot     : ${JSON.stringify(actualTypes)}\n`)
	}

	tokens.forEach((token, i) => {
		if (expectedTokens[i]?.value !== undefined) {
			console.assert(
				token.value === expectedTokens[i].value,
				`Token value mismatch at position ${i}\nExpected: ${expectedTokens[i].value} , Got     : ${token.value}\n`
			);
		}
	});
	console.groupEnd();
}

const VAL = (type, value) => ({type: type, value: value});
const NUMBER = v => VAL(TokenTypes.NUMBER, v),
	STRING =  v => VAL(TokenTypes.STRING, v),
	CHAR = v => VAL(TokenTypes.CHAR, v),
	IDENTIFIER = v => VAL(TokenTypes.IDENTIFIER, v),
	INDENT = { type: TokenTypes.INDENT },
	DEDENT = { type: TokenTypes.DEDENT },
	NEWLINE = { type: TokenTypes.NEWLINE },
	DEFINE = { type: TokenTypes.DEFINE },
	LAMBDA = { type: TokenTypes.LAMBDA },
	POWER = { type: TokenTypes.POWER },
	PLUS = { type: TokenTypes.PLUS },
	MINUS = { type: TokenTypes.MINUS },
	MULTIPLY = { type: TokenTypes.MULTIPLY },
	DIVIDE = {type: TokenTypes.DIVIDE},
	MOD = {type: TokenTypes.MOD},
	AND = {type: TokenTypes.AND},
	OR = {type: TokenTypes.OR},
	XOR = {type: TokenTypes.XOR},
	NOT = {type: TokenTypes.NOT},
	EQUAL = {type: TokenTypes.EQUAL},
	NOT_EQUAL = {type: TokenTypes.NOT_EQUAL},
	LESS = {type: TokenTypes.LESS},
	GREATER = {type: TokenTypes.GREATER},
	LESS_EQ = {type: TokenTypes.LESS_EQ},
	GREATER_EQ = {type: TokenTypes.GREATER_EQ},
	PRODUCT = { type: TokenTypes.PRODUCT },
	UNIT = { type: TokenTypes.UNIT },
	GET = { type: TokenTypes.GET },
	LPAREN = {type: TokenTypes.LPAREN},
	RPAREN = {type: TokenTypes.RPAREN},
	LBRACE = {type: TokenTypes.LBRACE},
	RBRACE = {type: TokenTypes.RBRACE},
	LBRACKET = {type: TokenTypes.LBRACKET},
	RBRACKET = {type: TokenTypes.RBRACKET},
	SPREAD = { type: TokenTypes.SPREAD },
	IMPORT = { type: TokenTypes.IMPORT },
	EXPORT = { type: TokenTypes.EXPORT },
	WS = { type: TokenTypes.WS },
	EOF = { type: TokenTypes.EOF }
	;


// Basic Tokens Tests
console.log('\nRunning Basic Tokens Tests...');

// 1. Basic Operators
assertTokens(
	'+ - * / ^ %',
	[
		PLUS,WS,
		MINUS,WS,
		MULTIPLY,WS,
		DIVIDE,WS,
		POWER,WS,
		MOD,
		EOF
	]
);

// 2. Special Operators
assertTokens(
	'# @ : ? ~',
	[
		EXPORT,WS,
		IMPORT,WS,
		DEFINE,WS,
		LAMBDA,WS,
		SPREAD,
		EOF
	]
);

// 3. Logical Operators
assertTokens(
	'& | ; !',
	[
		AND,WS,
		OR,WS,
		XOR,WS,
		NOT,
		EOF
	]
);

// 4. Comparison Operators
assertTokens(
	'< > <= >= = == != ><',
	[
		LESS, WS,
		GREATER, WS,
		LESS_EQ, WS,
		GREATER_EQ, WS,
		EQUAL, WS,
		EQUAL, WS,
		NOT_EQUAL,WS,
		NOT_EQUAL,
		EOF
	]
);

// 5. Numbers
console.log('\nRunning Number Tests...');
assertTokens(
	`42 3.14 -17 0xFF 0b1010 0o777`,
	[
		NUMBER('42'), WS,
		NUMBER('3.14'),WS,
		NUMBER('-17'),WS,
		NUMBER('0xFF'),WS,
		NUMBER('0b1010'),WS,
		NUMBER('0o777'),
		EOF
	]
);

// 6. Strings and Characters
console.log('\nRunning String and Character Tests...');
assertTokens(
	'x : `hello world \\n \\t`',
	[
		IDENTIFIER('x'),WS,
		DEFINE,WS,
		STRING('hello world \\n \\t'),
		EOF
	]
);

// 7. Identifiers
console.log('\nRunning Identifier Tests...');
assertTokens(
	'foo bar_baz',
	[
		IDENTIFIER('foo'),WS,
		IDENTIFIER('bar_baz'),
		EOF
	]
);

// 8. Indentation Tests
console.log('\nRunning Indentation Tests...');
assertTokens(
	`foo
	bar
		baz
	qux

quux`,
	[
		IDENTIFIER('foo'),
		NEWLINE,
		INDENT,
		IDENTIFIER('bar'),
		NEWLINE,
		INDENT,
		IDENTIFIER('baz'),
		NEWLINE,
		DEDENT,
		IDENTIFIER('qux'),
		NEWLINE,
		DEDENT,
		NEWLINE,
		IDENTIFIER('quux'),
		EOF
	]
);

// 9. Complex Expression Tests
console.log('\nRunning Complex Expression Tests...');
assertTokens(
	'add : x y ? x + y',
	[
		IDENTIFIER('add'), WS,
		DEFINE, WS,
		IDENTIFIER('x'), WS,
		IDENTIFIER('y'), WS,
		LAMBDA, WS,
		IDENTIFIER('x'), WS,
		PLUS, WS,
		IDENTIFIER('y'),
		EOF
	]
);

// 10. Error Tests
console.log('\nRunning Error Tests...');
function assertLexerError(input, expectedErrorMessage) {
	console.group();
	try {
		tokenize(input);
		console.assert(false, `Expected error for input: ${input}`);
	} catch (error) {
		console.assert(
			error instanceof LexerError && error.message.includes(expectedErrorMessage),
			`Expected error message containing "${expectedErrorMessage}", got: ${error.message}`
		);
	}
	console.groupEnd();
}

// Invalid number format
assertLexerError('123.456.789', 'Invalid number format');

// Unterminated string
assertLexerError('x : `hello', 'Unterminated string');

// Invalid String
assertLexerError('x : `hello \n world`', 'Unterminated string');

// 11. Comment Tests
console.log('\nRunning Comment Tests...');
assertTokens(
	'foo \n`this is a comment \nbar',
	[
		IDENTIFIER('foo'), WS,
		NEWLINE,
		NEWLINE,
		IDENTIFIER('bar'),
		EOF
	],
);

// 12. Files Tests
console.log('\nRunning Files Tests... lamda.sn');
await readfile('../../ex.snir/lambda.sn')
	.then(source => {
		assertTokens(
			source,
			[
				// [x ? x * 2]
				NEWLINE,
				LBRACKET,
				IDENTIFIER('x'), WS,
				LAMBDA, WS,
				IDENTIFIER('x'), WS,
				MULTIPLY, WS,
				NUMBER('2'),
				RBRACKET,
				NEWLINE,
				NEWLINE,
				NEWLINE,

				// [x y ? (x + y) ^ 2]
				LBRACKET,
				IDENTIFIER('x'), WS,
				IDENTIFIER('y'), WS,
				LAMBDA, WS,
				LPAREN,
				IDENTIFIER('x'), WS,
				PLUS, WS,
				IDENTIFIER('y'),
				RPAREN, WS,
				POWER, WS,
				NUMBER('2'),
				RBRACKET,
				NEWLINE,
				NEWLINE,
				NEWLINE,

				// [x ~y ? y~]
				LBRACKET,
				IDENTIFIER('x'), WS,
				SPREAD,
				IDENTIFIER('y'), WS,
				LAMBDA, WS,
				IDENTIFIER('y'),
				SPREAD,
				RBRACKET,
				NEWLINE,
				NEWLINE,
				NEWLINE,

				// match_case
				LBRACKET, NEWLINE,
				INDENT, IDENTIFIER('x'), WS, LAMBDA, NEWLINE,
				INDENT, IDENTIFIER('x'), WS, GREATER, WS, NUMBER('0'), WS, DEFINE, WS, IDENTIFIER('x'), NEWLINE,
				IDENTIFIER('x'), WS, LESS, WS, NUMBER('0'), WS, DEFINE, WS, NUMBER('-1'), WS, MULTIPLY, WS, IDENTIFIER('x'), NEWLINE,
				IDENTIFIER('x'), WS, EQUAL, WS, NUMBER('0'), WS, DEFINE, WS, IDENTIFIER('y'), WS, LAMBDA, NEWLINE,
				INDENT, IDENTIFIER('y'), WS, NOT_EQUAL, WS, UNIT, WS, DEFINE, WS, IDENTIFIER('y'), NEWLINE,
				STRING('What do you want to do?'), NEWLINE,
				DEDENT, UNIT, NEWLINE,
				DEDENT, DEDENT, RBRACKET,
				NEWLINE,
				NEWLINE,
				NEWLINE,
				NEWLINE,

				// KeyMap
				IDENTIFIER('a'), DEFINE, NEWLINE,
				INDENT, IDENTIFIER('a1'), DEFINE, NUMBER('0'), NEWLINE,
				IDENTIFIER('b1'), DEFINE, NEWLINE,
				INDENT, IDENTIFIER('a2'), DEFINE, NUMBER('2'), NEWLINE,
				DEDENT, IDENTIFIER('c1'), DEFINE,  WS, NUMBER('3'),
				DEDENT,
				EOF,
			]
		);
	});

console.log('\nRunning Files Tests... low_level_example.sn');
await readfile('../../low_level_example.sn')
	.then(source => {
		assertTokens(
			source,
			[
				NEWLINE,NEWLINE,NEWLINE,
				INDENT, IDENTIFIER('r0'), WS, DEFINE, WS, NUMBER('0x0000'), NEWLINE,
				EXPORT, IDENTIFIER('r0'), WS, DEFINE, WS, NUMBER('3'), NEWLINE,
				IDENTIFIER('r1'), WS, WS, DEFINE, WS, IMPORT, IDENTIFIER('r0'), WS, MULTIPLY, WS, NUMBER('2'), NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE,

				INDENT, IDENTIFIER('r0'), WS, DEFINE, WS, CHAR('+'), NEWLINE,
				EXPORT, IDENTIFIER('r0'), WS, DEFINE, WS, PLUS, NEWLINE,
				IDENTIFIER('r1'), WS, DEFINE, WS, IMPORT, IDENTIFIER('r0'), WS, NUMBER('3'), WS, NUMBER('2'), NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				EXPORT, CHAR('+'), WS, DEFINE, WS, PLUS, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				EXPORT, IDENTIFIER('IO'), DEFINE, WS, IDENTIFIER('d'), WS, IDENTIFIER('a'), WS, LAMBDA, NEWLINE,
				INDENT, IMPORT, LBRACKET,IDENTIFIER('a'), WS, PLUS, WS, NUMBER('1'), RBRACKET, WS, EQUAL, WS,NUMBER('0'), WS, DEFINE, NEWLINE,
				INDENT, IDENTIFIER('s'), WS, NOT_EQUAL, WS, UNIT, WS, DEFINE, WS, LBRACKET, EXPORT,IDENTIFIER('a'), WS, DEFINE,WS, IDENTIFIER('d'), RBRACKET, NEWLINE,
				IMPORT, IDENTIFIER('a'), NEWLINE,
				DEDENT, IMPORT, IDENTIFIER('IO'), WS, IDENTIFIER('d'), WS, IDENTIFIER('a'),NEWLINE,
				DEDENT,
				EOF
			]
		);
	});

console.log('\nRunning Files Tests... example.sn');
await readfile('../../example.sn')
	.then(source => {
		assertTokens(
			source,
			[
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				// L15
				IDENTIFIER('x'), DEFINE, WS, NUMBER('-353.15134'), NEWLINE,
				IDENTIFIER('y'), DEFINE, WS, NUMBER('4001.35364502'), NEWLINE,
				NEWLINE,
				// L18
				IDENTIFIER('Hello'), DEFINE, WS, STRING('Hello'), NEWLINE,
				IDENTIFIER('World'), DEFINE, WS, STRING('World'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L23
				IDENTIFIER('yep'), DEFINE, WS, NUMBER('1'), NEWLINE,
				IDENTIFIER('nop'), DEFINE, WS, NUMBER('0'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L28
				IDENTIFIER('unit'), DEFINE, WS, IDENTIFIER('none'), DEFINE, WS, LBRACKET, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L32
				IDENTIFIER('none'), DEFINE, WS, LBRACKET, RBRACKET, NEWLINE,
				IDENTIFIER('unit'), DEFINE, WS, LBRACKET, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				//L47
				LBRACKET, NEWLINE,
				INDENT, STRING('y'), DEFINE, WS, NUMBER('1'), NEWLINE,
				STRING('n'), DEFINE, WS, NUMBER('0'), NEWLINE,
				DEDENT, RBRACKET, WS, STRING('y'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L56
				// [x y ? x ^ 2 + 2 * x * y + y ^ 2]
				LBRACKET,
				IDENTIFIER('x'), WS, IDENTIFIER('y'), WS, LAMBDA, WS, IDENTIFIER('x'), WS, POWER, WS, NUMBER('2'), WS,
				PLUS, WS, NUMBER('2'), WS, MULTIPLY, WS, IDENTIFIER('x'), WS, MULTIPLY, WS, IDENTIFIER('y'), WS,
				PLUS, WS, IDENTIFIER('y'), WS, POWER, WS, NUMBER('2'),
				RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L61
				// [x y ? (x + y) ^ 2]
				LBRACKET,
				IDENTIFIER('x'), WS, IDENTIFIER('y'), WS, LAMBDA, WS,
				LPAREN, IDENTIFIER('x'), WS, PLUS, WS, IDENTIFIER('y'), RPAREN, WS, POWER, WS, NUMBER('2'),
				RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L67
				LBRACKET, PLUS, RBRACKET, WS, LBRACKET, POWER, WS, NUMBER('2'), RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L71
				LBRACKET, POWER, WS, NUMBER('2'), RBRACKET, WS, LBRACKET, PLUS, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				//L79
				IDENTIFIER('x'), WS, EQUAL, WS, IDENTIFIER('y'), WS, EQUAL, WS, IDENTIFIER('z'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L83
				NUMBER('1'), WS, LESS_EQ, WS, IDENTIFIER('x'), WS, LESS_EQ, WS, NUMBER('9'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L87
				LBRACKET, PLUS, WS, NUMBER('2'), RBRACKET, WS, NUMBER('2'), WS, EQUAL, WS, NUMBER('4'), NEWLINE,

				// L88
				LBRACKET, PLUS, WS, NUMBER('2'), RBRACKET,
				PRODUCT, WS, NUMBER('2'), WS, EQUAL, WS, LBRACKET, PLUS, WS, NUMBER('2'), RBRACKET,
				PRODUCT, WS, NUMBER('2'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L92
				IDENTIFIER('iterate3'), WS, DEFINE, WS, NUMBER('1'), WS, LAMBDA, WS, NUMBER('2'), WS, LAMBDA, WS, NUMBER('3'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L96
				IDENTIFIER('iterate3'), WS, EQUAL, WS, NUMBER('1'), NEWLINE,
				IDENTIFIER('iterate3'), WS, EQUAL, WS, NUMBER('2'), NEWLINE,
				IDENTIFIER('iterate3'), WS, EQUAL, WS, NUMBER('3'), NEWLINE,
				IDENTIFIER('iterate3'), WS, EQUAL, WS, LBRACKET, RBRACKET, NEWLINE,
				IDENTIFIER('iterate3'), WS, EQUAL, WS, LBRACKET, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L106
				IDENTIFIER('result2'), WS, DEFINE, WS, MINUS, WS, NUMBER('1'), WS, NUMBER('3'), NEWLINE,
				IDENTIFIER('add'), WS, DEFINE, WS, PLUS, NEWLINE,
				IDENTIFIER('exp'), WS, DEFINE, WS, POWER, NEWLINE,
				IDENTIFIER('id'), WS, DEFINE, WS, IDENTIFIER('x'), WS, LAMBDA, WS, IDENTIFIER('x'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L117
				LBRACKET, IDENTIFIER('x'), WS, LAMBDA, WS, IDENTIFIER('x'), RBRACKET,WS,
				NUMBER('1'), WS, NUMBER('2'), WS, NUMBER('3'), WS, EQUAL, WS, NUMBER('1'), NEWLINE,

				LBRACKET, IDENTIFIER('x'), WS, LAMBDA, WS, IDENTIFIER('x'), RBRACKET,WS,
				NUMBER('1'), PRODUCT, WS, NUMBER('2'), PRODUCT, WS, NUMBER('3'), WS, EQUAL, WS, NUMBER('1'), NEWLINE,
				NEWLINE,

				// L120
				LBRACKET, NUMBER('1'), WS, NUMBER('2'), WS, NUMBER('3'), RBRACKET,WS,
				GET, NUMBER('0'), WS, EQUAL, WS, NUMBER('1'), NEWLINE,

				LBRACKET, NUMBER('1'), PRODUCT, WS, NUMBER('2'), PRODUCT, WS, NUMBER('3'), RBRACKET,WS,
				GET, NUMBER('0'), WS, EQUAL, WS, NUMBER('1'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L125
				LBRACKET, UNIT, WS, SPREAD, IDENTIFIER('y'), WS, LAMBDA, WS, IDENTIFIER('y'), SPREAD, RBRACKET, WS,
				NUMBER('1'), WS, NUMBER('2'), WS, NUMBER('3'), WS, EQUAL,WS, NUMBER('2'), WS, NUMBER('3'), NEWLINE,


				LBRACKET, UNIT, WS, SPREAD, IDENTIFIER('y'), WS, LAMBDA, WS, IDENTIFIER('y'), SPREAD, RBRACKET, WS,
				NUMBER('1'), PRODUCT, WS, NUMBER('2'), PRODUCT, WS, NUMBER('3'), WS, EQUAL, WS, NUMBER('2'), WS, NUMBER('3'), NEWLINE,
				NEWLINE,

				// L128
				LBRACKET, NUMBER('1'), WS, NUMBER('2'), WS, NUMBER('3'), RBRACKET, WS, GET, NUMBER('1'), SPREAD, WS, EQUAL, WS, NUMBER('2'),WS, NUMBER('3'), NEWLINE,
				LBRACKET, NUMBER('1'), PRODUCT,WS, NUMBER('2'), PRODUCT,WS, NUMBER('3'), RBRACKET, WS, GET, NUMBER('1'), SPREAD, WS, EQUAL, WS, NUMBER('2'), WS, NUMBER('3'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,


				// L145
				LBRACKET, IDENTIFIER('x'), WS, LAMBDA, NEWLINE,
				INDENT, IDENTIFIER('x'), WS, EQUAL, WS, NUMBER('0'), WS, DEFINE, WS, NUMBER('0'), NEWLINE,
				IDENTIFIER('x'), WS, GREATER, WS, NUMBER('0'), WS, DEFINE, WS, STRING('more'), NEWLINE,
				IDENTIFIER('x'), WS, LESS, WS, NUMBER('0'), WS, DEFINE, WS, STRING('less'), NEWLINE,
				STRING('other_wise'), NEWLINE,
				DEDENT, RBRACKET, WS, NUMBER('3'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L154
				LBRACKET, NEWLINE,
				INDENT, IDENTIFIER('x'), WS, LAMBDA, WS, NEWLINE,
				INDENT, IDENTIFIER('x'), WS, EQUAL, WS, NUMBER('0'), WS, AND, WS, LBRACKET, UNIT, WS, LAMBDA, WS, NUMBER('0'), RBRACKET, WS, XOR, NEWLINE,
				IDENTIFIER('x'), WS, GREATER, WS, NUMBER('0'), WS, AND, WS, LBRACKET, UNIT, WS, LAMBDA, WS, STRING('more'), RBRACKET, WS, XOR, NEWLINE,
				IDENTIFIER('x'), WS, LESS, WS, NUMBER('0'), WS, AND, WS, LBRACKET, UNIT, WS, LAMBDA, WS, STRING('less'), RBRACKET, WS, XOR, NEWLINE,
				LBRACKET, UNIT, WS, LAMBDA, WS, STRING('other_wise'), RBRACKET, NEWLINE,
				DEDENT, DEDENT, RBRACKET, WS, NUMBER('3'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L165
				IDENTIFIER('Person'), WS, DEFINE, WS, IDENTIFIER('name'), WS, IDENTIFIER('age'), WS, IDENTIFIER('etc'), WS, IDENTIFIER('x'), WS, LAMBDA, NEWLINE,
				INDENT, IDENTIFIER('name'), NEWLINE,
				IDENTIFIER('age'), NEWLINE,
				SPREAD, IDENTIFIER('etc'), WS, DEFINE, WS, IDENTIFIER('x'), NEWLINE,
				DEDENT, NEWLINE,

				// L170
				IDENTIFIER('john'), WS, DEFINE, WS, IDENTIFIER('Person'), WS, STRING('john'), WS, NUMBER('18'), WS, STRING('Like'), WS, STRING('Sushi'), NEWLINE,
				NEWLINE,

				IDENTIFIER('john'), WS, STRING('name'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L176
				IDENTIFIER('john'), WS, GET, IDENTIFIER('name'), WS, EQUAL, WS, IDENTIFIER('john'), WS, STRING('name'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L180
				IDENTIFIER('person'), WS, DEFINE, WS, IDENTIFIER('Person'), WS,
				LBRACKET, RBRACKET, WS,
				LBRACKET, RBRACKET, WS,
				LBRACKET, RBRACKET, WS,
				LBRACKET, RBRACKET, NEWLINE,
				NEWLINE,

				// L182
				IDENTIFIER('mary'), WS, DEFINE, WS, NEWLINE,
				INDENT, SPREAD, IDENTIFIER('person'), NEWLINE,
				INDENT, GET, IDENTIFIER('name'), WS, DEFINE, WS, STRING('mary'), NEWLINE,
				GET, IDENTIFIER('age'), WS, WS, DEFINE, WS, NUMBER('16'), NEWLINE,
				DEDENT, DEDENT, NEWLINE,


				// L187
				IDENTIFIER('charie'), WS, DEFINE, WS, NEWLINE,
				INDENT, SPREAD, IDENTIFIER('person'), NEWLINE,
				INDENT, GET, IDENTIFIER('name'), WS, DEFINE, WS, STRING('charie'), NEWLINE,
				GET, IDENTIFIER('age'), WS, WS, DEFINE, WS, NUMBER('24'), NEWLINE,
				DEDENT, DEDENT, NEWLINE,
				NEWLINE, NEWLINE,


				// L194
				LBRACKET, NEWLINE,
				INDENT, NUMBER('0'), WS, WS, WS, DEFINE, WS, STRING('zero'), NEWLINE,
				GREATER, WS, NUMBER('0'), WS, DEFINE, WS, STRING('more'), NEWLINE,
				LESS, WS, NUMBER('0'), WS, DEFINE, WS, STRING('less'), NEWLINE,
				STRING('other'), NEWLINE,
				DEDENT, RBRACKET, WS, NUMBER('3'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,


				// L203
				LBRACKET, NEWLINE,
				INDENT, NUMBER('1'), WS, DEFINE, WS, STRING('yep'), NEWLINE,
				NUMBER('0'), WS, DEFINE, WS, STRING('nop'), NEWLINE,
				DEDENT, RBRACKET, WS, NUMBER('1'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L211
				LBRACKET, GREATER, WS, NUMBER('3'), WS, DEFINE, WS, LBRACKET, PLUS, WS, NUMBER('3'), RBRACKET, RBRACKET, WS, NUMBER('3'), WS, NUMBER('4'), WS, EQUAL, WS, NUMBER('4'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,


				// L215
				IDENTIFIER('Item'), WS, DEFINE, NEWLINE,
				INDENT, IDENTIFIER('name'), NEWLINE,
				IDENTIFIER('equip'), NEWLINE,
				IDENTIFIER('use'), NEWLINE,
				IDENTIFIER('effect'), NEWLINE,
				DEDENT, NEWLINE,

				// L221
				IDENTIFIER('medicalWeed'), WS, DEFINE, NEWLINE,
				INDENT, IDENTIFIER('Item'), NEWLINE,
				INDENT, STRING('medicalWeed'), NEWLINE,
				LBRACKET, RBRACKET, NEWLINE,
				LBRACKET, GET, IDENTIFIER('medicalWeed'), RBRACKET, PRODUCT, WS, LBRACKET, MINUS, WS, NUMBER('1'), RBRACKET, NEWLINE,
				LBRACKET, GET, IDENTIFIER('HP'), RBRACKET, PRODUCT, WS, LBRACKET, PLUS, WS, NUMBER('20'), RBRACKET, NEWLINE,
				DEDENT, DEDENT, NEWLINE,

				// L228
				IDENTIFIER('lightningStaff'), WS, DEFINE, NEWLINE,
				INDENT, IDENTIFIER('Item'), NEWLINE,
				INDENT, STRING('lightningStaff'), NEWLINE,
				LBRACKET, GET, IDENTIFIER('Atk'), RBRACKET, PRODUCT, WS, LBRACKET, PLUS, WS, NUMBER('8'), RBRACKET, NEWLINE,
				LBRACKET, GET, IDENTIFIER('ThunderBolt'), RBRACKET, NEWLINE,
				LBRACKET, GET, IDENTIFIER('HP'), RBRACKET, PRODUCT, WS, LBRACKET, MINUS, WS, NUMBER('40'), RBRACKET, NEWLINE,
				DEDENT, DEDENT, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,


				// L238
				IDENTIFIER('myValue'), WS, DEFINE, NEWLINE,
				INDENT, NUMBER('3'), NEWLINE,
				LBRACKET, PLUS, WS, NUMBER('4'), RBRACKET, NEWLINE,
				LBRACKET, MULTIPLY, WS, NUMBER('2'), RBRACKET, NEWLINE,
				DEDENT, NEWLINE,

				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE,

				// L254
				// myPairs: 1 2 3 4 5
				IDENTIFIER('myPairs'), DEFINE, WS, NUMBER('1'), WS, NUMBER('2'), WS, NUMBER('3'), WS, NUMBER('4'), WS, NUMBER('5'), NEWLINE,

				//myPairs0: [,] 1 2 3 4 5
				IDENTIFIER('myPairs0'), DEFINE, WS, LBRACKET, PRODUCT, RBRACKET, WS, NUMBER('1'), WS, NUMBER('2'), WS, NUMBER('3'), WS, NUMBER('4'), WS, NUMBER('5'), NEWLINE,

				//myPairs1: 1, 2, 3, 4, 5
				IDENTIFIER('myPairs1'), DEFINE, WS, NUMBER('1'), PRODUCT, WS, NUMBER('2'), PRODUCT, WS, NUMBER('3'), PRODUCT, WS, NUMBER('4'), PRODUCT, WS, NUMBER('5'), NEWLINE,

				//myPairs2: 1 ? 2 ? 3 ? 4 ? 5
				IDENTIFIER('myPairs2'), DEFINE, WS, NUMBER('1'), WS, LAMBDA, WS, NUMBER('2'), WS, LAMBDA, WS, NUMBER('3'), WS, LAMBDA, WS, NUMBER('4'), WS, LAMBDA, WS, NUMBER('5'), NEWLINE,
				NEWLINE,

				// L259
				// myPairs0 = myPairs = myPairs1 = [,] myPairs2~
				IDENTIFIER('myPairs0'), WS, EQUAL, WS, IDENTIFIER('myPairs'), WS, EQUAL, WS, IDENTIFIER('myPairs1'), WS, EQUAL, WS, LBRACKET, PRODUCT, RBRACKET, WS, IDENTIFIER('myPairs2'), SPREAD, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L265
				// [[,],] myPairs = [1], [2], [3], [4], [5]
				LBRACKET, LBRACKET, PRODUCT, RBRACKET, PRODUCT, RBRACKET, WS, IDENTIFIER('myPairs'), WS, EQUAL, WS, LBRACKET, NUMBER('1'), RBRACKET, PRODUCT, WS, LBRACKET, NUMBER('2'), RBRACKET, PRODUCT, WS, LBRACKET, NUMBER('3'), RBRACKET, PRODUCT, WS, LBRACKET, NUMBER('4'), RBRACKET, PRODUCT, WS, LBRACKET, NUMBER('5'), RBRACKET, NEWLINE,
				// [?] myPairs = 1 ? 2 ? 3 ? 4 ? 5
				LBRACKET, LAMBDA, RBRACKET, WS, IDENTIFIER('myPairs'), WS, EQUAL, WS, NUMBER('1'), WS, LAMBDA, WS, NUMBER('2'), WS, LAMBDA, WS, NUMBER('3'), WS, LAMBDA, WS, NUMBER('4'), WS, LAMBDA, WS, NUMBER('5'), NEWLINE,
				// [+] myPairs = 15
				LBRACKET, PLUS, RBRACKET, WS, IDENTIFIER('myPairs'), WS, EQUAL, WS, NUMBER('15'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L271
				// [* 2,] myPairs = 2 4 6 8 10
				LBRACKET, MULTIPLY, WS, NUMBER('2'), PRODUCT, RBRACKET, WS,
				IDENTIFIER('myPairs'), WS, EQUAL, WS, NUMBER('2'), WS, NUMBER('4'), WS, NUMBER('6'), WS, NUMBER('8'), WS, NUMBER('10'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L275
				// r: [1 2] [3 4]
				IDENTIFIER('r'), DEFINE, WS,
				LBRACKET, NUMBER('1'), WS, NUMBER('2'), RBRACKET, WS,
				LBRACKET, NUMBER('3'), WS, NUMBER('4'), RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// s: [1 2],[3 4]
				IDENTIFIER('s'), DEFINE, WS,
				LBRACKET, NUMBER('1'), WS, NUMBER('2'), RBRACKET, PRODUCT,
				LBRACKET, NUMBER('3'), WS, NUMBER('4'), RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L284
				IDENTIFIER('myGreet'), DEFINE, NEWLINE,
				INDENT, IDENTIFIER('greet'), DEFINE, WS, NEWLINE,
				INDENT, IDENTIFIER('hello'), DEFINE, WS, STRING('hello,'), NEWLINE,
				IDENTIFIER('welcome'), DEFINE, WS, STRING('welcome,'), NEWLINE,
				DEDENT, IDENTIFIER('world'), DEFINE, WS, STRING(' world'), NEWLINE,
				DEDENT, NEWLINE, NEWLINE, NEWLINE,

				// L292
				IDENTIFIER('myGreet'), DEFINE, WS, SPREAD, IDENTIFIER('a'), WS, LAMBDA, NEWLINE,
				INDENT, IDENTIFIER('a'), WS, GET, NUMBER('0'), WS, EQUAL, WS, STRING('greet'), WS, AND, WS, NEWLINE,
				INDENT, IDENTIFIER('a'), WS, GET, NUMBER('1'), WS, EQUAL, WS, STRING('hello'), WS, AND, WS, STRING('hello,'), WS, XOR, NEWLINE,
				IDENTIFIER('a'), WS, GET, NUMBER('1'), WS, EQUAL, WS, STRING('welcome'), WS, AND, WS, STRING('welcome,'), WS, XOR, NEWLINE,
				DEDENT, IDENTIFIER('a'), WS, GET, NUMBER('0'), WS, EQUAL, WS, STRING('world'), WS, AND, WS, STRING(' world'), XOR, NEWLINE,
				LBRACKET, RBRACKET, NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE,

				// L301
				IDENTIFIER('myGreet'), WS, GET, IDENTIFIER('greet'), WS, GET, IDENTIFIER('hello'), WS, EQUAL, WS, STRING('hello,'), NEWLINE,
				NEWLINE,

				IDENTIFIER('myPairs'), WS, GET, NUMBER('0'), WS, EQUAL, WS, NUMBER('1'), NEWLINE,
				NEWLINE,

				IDENTIFIER('myPairs'), WS, GET, LBRACKET, NUMBER('1'), WS, SPREAD, WS, NUMBER('3'), RBRACKET, WS, EQUAL, WS, NUMBER('2'), WS, NUMBER('3'), WS, NUMBER('4'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L311
				IDENTIFIER('myGreet'), NEWLINE,
				INDENT, GET, IDENTIFIER('greet'), NEWLINE,
				INDENT, GET, IDENTIFIER('welcome'), NEWLINE,
				DEDENT, GET, IDENTIFIER('world'), NEWLINE,
				DEDENT, EQUAL, WS, STRING('welcome, world'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L319
				IDENTIFIER('myGreet'), NEWLINE,
				INDENT, GET, IDENTIFIER('greet'), NEWLINE,
				INDENT, GET, IDENTIFIER('welcome'), WS, DEFINE, WS, STRING('welcome to our '), NEWLINE,
				DEDENT, GET, IDENTIFIER('world'), WS, DEFINE, WS, STRING('metaverse!'), NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L330
				SPREAD, LBRACKET, NEWLINE,
				INDENT, IDENTIFIER('y'), DEFINE, WS, NUMBER('1'), NEWLINE,
				IDENTIFIER('n'), DEFINE, WS, NUMBER('0'), NEWLINE,
				DEDENT, RBRACKET, NEWLINE,
				NEWLINE,

				// L335
				IDENTIFIER('y'), WS, EQUAL, WS, NUMBER('1'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L340
				IMPORT, IDENTIFIER('io'), NEWLINE,
				INDENT, IDENTIFIER('say'), WS, IDENTIFIER('Hello'), WS, IDENTIFIER('World'), NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE,

				IDENTIFIER('say'), WS, IDENTIFIER('Hello'), WS, IDENTIFIER('World'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L349
				IMPORT, IDENTIFIER('Funnctor'), SPREAD, NEWLINE,
				IMPORT, IDENTIFIER('Monoid'), SPREAD, NEWLINE,
				IMPORT, IDENTIFIER('io'), SPREAD, NEWLINE,
				NEWLINE,

				IDENTIFIER('say'),
				LBRACKET, NUMBER('1'), WS, NUMBER('2'), WS, NUMBER('3'), WS, NUMBER('4'), WS, NUMBER('5'), WS,
				LBRACKET, MULTIPLY, WS, NUMBER('4'), PRODUCT, RBRACKET, WS, LBRACKET, PLUS, RBRACKET, RBRACKET, NEWLINE,
				NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L362
				IDENTIFIER('M'), DEFINE, WS, CHAR('M'), NEWLINE,
				NEWLINE,
				// L364
				IDENTIFIER('My'), DEFINE, WS, IDENTIFIER('M'), WS, CHAR('y'), CHAR(' '), CHAR('D'), CHAR('o'), CHAR('m'), CHAR('e'), CHAR('s'), CHAR('t'), CHAR('i'), CHAR('c'), NEWLINE,
				IDENTIFIER('My'), WS, EQUAL, WS, IDENTIFIER('M'), WS, CHAR('y'), WS, CHAR(' '), WS, CHAR('D'), WS, CHAR('o'), WS, CHAR('m'), WS, CHAR('e'), WS, CHAR('s'), WS, CHAR('t'), WS, CHAR('i'), WS, CHAR('c'), WS, EQUAL, WS, STRING('My Domestic'), NEWLINE,
				NEWLINE,
				// L367
				INDENT, STRING('Hello '), WS, STRING('World!'), WS, EQUAL, WS, STRING('Hello World!'), NEWLINE,
				// L368
				STRING('Hello'), WS, CHAR(' '), STRING('World!'), WS, EQUAL, WS, STRING('Hello World!'), NEWLINE,
				// L369
				CHAR('H'), WS, STRING('ello'), WS, CHAR(' '), STRING('World'), WS, CHAR('!'), WS, EQUAL, WS, STRING('Hello World!'), NEWLINE,
				// L370
				STRING('Hello '), WS, IDENTIFIER('My'), WS, STRING('World!'), WS, EQUAL, WS, STRING('Hello My Domestic World!'), NEWLINE,
				// L371
				IDENTIFIER('Hello'), WS, CHAR(' '), IDENTIFIER('My'), WS, CHAR(' '), STRING('World'), WS, CHAR('!'), WS, EQUAL, WS, STRING('Hello My Domestic World!'), NEWLINE,
				// L372
				STRING('Hello'), WS, CHAR('!'), CHAR(' '), IDENTIFIER('My'), WS, IDENTIFIER('World'), WS, CHAR('!'), WS, EQUAL, WS, STRING('Hello! My Domestic World!'), NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L384
				IDENTIFIER('HWinEnter'), WS, DEFINE, NEWLINE,
				WS, STRING('Hello'), WS, CHAR('\n'),
				WS, STRING('World!'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// L392
				EXPORT, IDENTIFIER('myDict'), WS, DEFINE, WS, IDENTIFIER('name'), WS, IDENTIFIER('value'), WS, LAMBDA, WS, SPREAD, IDENTIFIER('name'), WS, DEFINE, WS, IDENTIFIER('value'), NEWLINE,
				// L393
				EXPORT, IDENTIFIER('gets'), WS, DEFINE, WS, IDENTIFIER('name'), WS, LAMBDA, WS, IDENTIFIER('myDict'), WS, GET, SPREAD, IDENTIFIER('name'), NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// L397
				NUMBER('0'), WS, AND, WS, STRING('me'), WS, EQUAL, WS, NUMBER('0'), NEWLINE,
				NUMBER('1'), WS, AND, WS, STRING('me'), WS, EQUAL, WS, STRING('me'), NEWLINE,
				NEWLINE,

				// L400
				NUMBER('0'), WS, OR, WS, STRING('me'), WS, EQUAL, WS, STRING('me'), NEWLINE,
				NUMBER('1'), WS, OR, WS, STRING('me'), WS, EQUAL, WS, NUMBER('1'), NEWLINE,
				NEWLINE,

				// L403
				NUMBER('0'), WS, XOR, WS, STRING('me'), WS, EQUAL, WS, STRING('me'), NEWLINE,
				NUMBER('1'), WS, XOR, WS, STRING('me'), WS, EQUAL, WS, NUMBER('0'), NEWLINE,
				NEWLINE,
				NEWLINE,

				// L407
				EXPORT, STRING('It:'), CHAR('\t'), STRING('365'), WS, STRING('is number of date at 1 year'), NEWLINE,
				CHAR('\t'), NUMBER('4'), WS, PLUS, WS, NUMBER('5'),
				EOF
			]
		);
	});

console.log('All tests completed!');
