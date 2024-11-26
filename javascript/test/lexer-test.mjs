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
	console.assert(
		JSON.stringify(actualTypes) === JSON.stringify(expectedTypes),
		`Expected: ${JSON.stringify(expectedTypes)}\nGot     : ${JSON.stringify(actualTypes)}\n`
	);

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

const INDENT = { type: TokenTypes.INDENT },
	DEDENT = { type: TokenTypes.DEDENT },
	NEWLINE = { type: TokenTypes.NEWLINE },
	DEFINE = { type: TokenTypes.DEFINE },
	LAMBDA = { type: TokenTypes.LAMBDA },
	POWER = { type: TokenTypes.POWER },
	PLUS = { type: TokenTypes.PLUS },
	MINUS = { type: TokenTypes.MINUS },
	MULTIPLY = { type: TokenTypes.MULTIPLY },
	AND = { type: TokenTypes.AND },
	OR = { type: TokenTypes.OR },
	XOR = { type: TokenTypes.XOR },
	EQUAL = { type: TokenTypes.EQUAL },
	SPREAD = { type: TokenTypes.SPREAD },
	IMPORT = { type: TokenTypes.IMPORT },
	EXPORT = { type: TokenTypes.EXPORT },
	GREATER = { type: TokenTypes.GREATER },
	LESS = { type: TokenTypes.LESS },
	PRODUCT = { type: TokenTypes.PRODUCT },
	UNIT = { type: TokenTypes.UNIT },
	GET = { type: TokenTypes.GET },
	LBRACKET = { type: TokenTypes.LBRACKET },
	RBRACKET = { type: TokenTypes.RBRACKET },
	EOF = { type: TokenTypes.EOF };


// Basic Tokens Tests
console.log('\nRunning Basic Tokens Tests...');

// 1. Basic Operators
assertTokens(
	'+ - * / ^ %',
	[
		PLUS,
		MINUS,
		MULTIPLY,
		{ type: TokenTypes.DIVIDE },
		POWER,
		{ type: TokenTypes.MOD },
		EOF
	]
);

// 2. Special Operators
assertTokens(
	'# @ : ? ~',
	[
		EXPORT,
		IMPORT,
		DEFINE,
		LAMBDA,
		SPREAD,
		EOF
	]
);

// 3. Logical Operators
assertTokens(
	'& | ; !',
	[
		AND,
		{ type: TokenTypes.OR },
		XOR,
		{ type: TokenTypes.NOT },
		EOF
	]
);

// 4. Comparison Operators
assertTokens(
	'< > <= >= = == != ><',
	[
		LESS,
		GREATER,
		{ type: TokenTypes.LESS_EQ },
		{ type: TokenTypes.GREATER_EQ },
		EQUAL,
		EQUAL,
		{ type: TokenTypes.NOT_EQUAL },
		{ type: TokenTypes.NOT_EQUAL },
		EOF
	]
);

// 5. Numbers
console.log('\nRunning Number Tests...');
assertTokens(
	`42 3.14 -17 0xFF 0b1010 0o777`,
	[
		{ type: TokenTypes.NUMBER, value: '42' },
		{ type: TokenTypes.NUMBER, value: '3.14' },
		{ type: TokenTypes.NUMBER, value: '-17' },
		{ type: TokenTypes.NUMBER, value: '0xFF' },
		{ type: TokenTypes.NUMBER, value: '0b1010' },
		{ type: TokenTypes.NUMBER, value: '0o777' },
		EOF
	]
);

// 6. Strings and Characters
console.log('\nRunning String and Character Tests...');
assertTokens(
	'x : `hello world \\n \\t`',
	[
		{ type: TokenTypes.IDENTIFIER, value: 'x' },
		DEFINE,
		{ type: TokenTypes.STRING, value: 'hello world \\n \\t' },
		EOF
	]
);

// 7. Identifiers
console.log('\nRunning Identifier Tests...');
assertTokens(
	'foo bar_baz',
	[
		{ type: TokenTypes.IDENTIFIER, value: 'foo' },
		{ type: TokenTypes.IDENTIFIER, value: 'bar_baz' },
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
		{ type: TokenTypes.IDENTIFIER, value: 'foo' },
		NEWLINE,
		INDENT,
		{ type: TokenTypes.IDENTIFIER, value: 'bar' },
		NEWLINE,
		INDENT,
		{ type: TokenTypes.IDENTIFIER, value: 'baz' },
		NEWLINE,
		DEDENT,
		{ type: TokenTypes.IDENTIFIER, value: 'qux' },
		NEWLINE,
		DEDENT,
		NEWLINE,
		{ type: TokenTypes.IDENTIFIER, value: 'quux' },
		EOF
	]
);

// 9. Complex Expression Tests
console.log('\nRunning Complex Expression Tests...');
assertTokens(
	'add : x y ? x + y',
	[
		{ type: TokenTypes.IDENTIFIER, value: 'add' },
		DEFINE,
		{ type: TokenTypes.IDENTIFIER, value: 'x' },
		{ type: TokenTypes.IDENTIFIER, value: 'y' },
		LAMBDA,
		{ type: TokenTypes.IDENTIFIER, value: 'x' },
		PLUS,
		{ type: TokenTypes.IDENTIFIER, value: 'y' },
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

// Invalid indentation
assertLexerError(`    foo\n  bar\n   baz`, 'Invalid dedentation',);

// Invalid String
assertLexerError('x : `hello \n world`', 'Unterminated string',);

// 11. Comment Tests
console.log('\nRunning Comment Tests...');
assertTokens(
	'foo \n`this is a comment \nbar',
	[
		{ type: TokenTypes.IDENTIFIER, value: 'foo' },
		NEWLINE,
		NEWLINE,
		{ type: TokenTypes.IDENTIFIER, value: 'bar' },
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
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				LAMBDA,
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				MULTIPLY,
				{ type: TokenTypes.NUMBER, value: '2' },
				RBRACKET,
				NEWLINE,
				NEWLINE,
				NEWLINE,

				// [x y ? (x + y) ^ 2]
				LBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				{ type: TokenTypes.IDENTIFIER, value: 'y' },
				LAMBDA,
				{ type: TokenTypes.LPAREN },
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				PLUS,
				{ type: TokenTypes.IDENTIFIER, value: 'y' },
				{ type: TokenTypes.RPAREN },
				POWER,
				{ type: TokenTypes.NUMBER, value: '2' },
				RBRACKET,
				NEWLINE,
				NEWLINE,
				NEWLINE,

				// [x ~y ? y~]
				LBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				SPREAD,
				{ type: TokenTypes.IDENTIFIER, value: 'y' },
				LAMBDA,
				{ type: TokenTypes.IDENTIFIER, value: 'y' },
				SPREAD,
				RBRACKET,
				NEWLINE,
				NEWLINE,
				NEWLINE,

				// match_case
				LBRACKET, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'x' }, LAMBDA, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'x' }, GREATER, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'x' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'x' }, LESS, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.NUMBER, value: '-1' }, MULTIPLY, { type: TokenTypes.IDENTIFIER, value: 'x' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'x' }, EQUAL, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'y' }, LAMBDA, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'y' }, { type: TokenTypes.NOT_EQUAL }, UNIT, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'y' }, NEWLINE,
				{ type: TokenTypes.STRING, value: 'What do you want to do?' }, NEWLINE,
				DEDENT, UNIT, NEWLINE,
				DEDENT, DEDENT,
				RBRACKET,
				NEWLINE,
				NEWLINE,
				NEWLINE,
				NEWLINE,

				// KeyMap
				{ type: TokenTypes.IDENTIFIER, value: 'a' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'a1' }, DEFINE, { type: TokenTypes.NUMBER, value: '0' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'b1' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'a2' }, DEFINE, { type: TokenTypes.NUMBER, value: '2' }, NEWLINE,
				DEDENT, { type: TokenTypes.IDENTIFIER, value: 'c1' }, DEFINE, { type: TokenTypes.NUMBER, value: '3' },
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
				NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'r0' }, DEFINE, { type: TokenTypes.NUMBER, value: '0x0000' }, NEWLINE,
				EXPORT, { type: TokenTypes.IDENTIFIER, value: 'r0' }, DEFINE, { type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'r1' }, DEFINE, IMPORT, { type: TokenTypes.IDENTIFIER, value: 'r0' }, MULTIPLY, { type: TokenTypes.NUMBER, value: '2' }, NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE,

				INDENT, { type: TokenTypes.IDENTIFIER, value: 'r0' }, DEFINE, { type: TokenTypes.CHAR, value: '+' }, NEWLINE,
				EXPORT, { type: TokenTypes.IDENTIFIER, value: 'r0' }, DEFINE, PLUS, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'r1' }, DEFINE, IMPORT, { type: TokenTypes.IDENTIFIER, value: 'r0' }, { type: TokenTypes.NUMBER, value: '3' }, { type: TokenTypes.NUMBER, value: '2' }, NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				EXPORT, { type: TokenTypes.CHAR, value: '+' }, DEFINE, PLUS,
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
				{ type: TokenTypes.IDENTIFIER, value: 'x' }, DEFINE, { type: TokenTypes.NUMBER, value: '-353.15134' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'y' }, DEFINE, { type: TokenTypes.NUMBER, value: '4001.35364502' }, NEWLINE,
				NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'Hello' }, DEFINE, { type: TokenTypes.STRING, value: 'Hello' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'World' }, DEFINE, { type: TokenTypes.STRING, value: 'World' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'yep' }, DEFINE, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'nop' }, DEFINE, { type: TokenTypes.NUMBER, value: '0' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'unit' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'none' }, DEFINE, LBRACKET, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'none' }, DEFINE, LBRACKET, RBRACKET, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'unit' }, DEFINE, LBRACKET, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				LBRACKET, NEWLINE,
				INDENT, { type: TokenTypes.STRING, value: 'y' }, DEFINE, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				{ type: TokenTypes.STRING, value: 'n' }, DEFINE, { type: TokenTypes.NUMBER, value: '0' }, NEWLINE,
				DEDENT, RBRACKET, { type: TokenTypes.STRING, value: 'y' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// [x y ? x ^ 2 + 2 * x * y + y ^ 2]
				LBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				{ type: TokenTypes.IDENTIFIER, value: 'y' },
				LAMBDA, { type: TokenTypes.IDENTIFIER, value: 'x' },
				POWER, { type: TokenTypes.NUMBER, value: '2' },
				PLUS, { type: TokenTypes.NUMBER, value: '2' },
				MULTIPLY, { type: TokenTypes.IDENTIFIER, value: 'x' },
				MULTIPLY, { type: TokenTypes.IDENTIFIER, value: 'y' },
				PLUS, { type: TokenTypes.IDENTIFIER, value: 'y' },
				POWER, { type: TokenTypes.NUMBER, value: '2' },
				RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// [x y ? (x + y) ^ 2]
				LBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				{ type: TokenTypes.IDENTIFIER, value: 'y' },
				LAMBDA,
				{ type: TokenTypes.LPAREN },
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				PLUS,
				{ type: TokenTypes.IDENTIFIER, value: 'y' },
				{ type: TokenTypes.RPAREN },
				POWER, { type: TokenTypes.NUMBER, value: '2' },
				RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				LBRACKET, PLUS, RBRACKET,
				LBRACKET, POWER, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				LBRACKET, POWER, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET,
				LBRACKET, PLUS, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'x' }, EQUAL, { type: TokenTypes.IDENTIFIER, value: 'y' }, EQUAL, { type: TokenTypes.IDENTIFIER, value: 'z' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.NUMBER, value: '1' },
				{ type: TokenTypes.LESS_EQ },
				{ type: TokenTypes.IDENTIFIER, value: 'x' },
				{ type: TokenTypes.LESS_EQ },
				{ type: TokenTypes.NUMBER, value: '9' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				LBRACKET, PLUS, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET,
				{ type: TokenTypes.NUMBER, value: '2' }, EQUAL, { type: TokenTypes.NUMBER, value: '4' }, NEWLINE,


				LBRACKET, PLUS, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET,
				{ type: TokenTypes.PRODUCT },
				{ type: TokenTypes.NUMBER, value: '2' }, EQUAL, LBRACKET, PLUS, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET,
				{ type: TokenTypes.PRODUCT },
				{ type: TokenTypes.NUMBER, value: '2' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'iterate3' }, DEFINE,
				{ type: TokenTypes.NUMBER, value: '1' }, LAMBDA, { type: TokenTypes.NUMBER, value: '2' }, LAMBDA, { type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'iterate3' }, EQUAL, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'iterate3' }, EQUAL, { type: TokenTypes.NUMBER, value: '2' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'iterate3' }, EQUAL, { type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'iterate3' }, EQUAL, LBRACKET, RBRACKET, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'iterate3' }, EQUAL, LBRACKET, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'result2' }, DEFINE, MINUS, { type: TokenTypes.NUMBER, value: '1' }, { type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'add' }, DEFINE, PLUS, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'exp' }, DEFINE, POWER, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'id' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'x' }, LAMBDA, { type: TokenTypes.IDENTIFIER, value: 'x' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,


				LBRACKET, { type: TokenTypes.IDENTIFIER, value: 'x' }, LAMBDA, { type: TokenTypes.IDENTIFIER, value: 'x' }, RBRACKET,
				{ type: TokenTypes.NUMBER, value: '1' }, { type: TokenTypes.NUMBER, value: '2' }, { type: TokenTypes.NUMBER, value: '3' }, EQUAL, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,

				LBRACKET, { type: TokenTypes.IDENTIFIER, value: 'x' }, LAMBDA, { type: TokenTypes.IDENTIFIER, value: 'x' }, RBRACKET,
				{ type: TokenTypes.NUMBER, value: '1' }, PRODUCT, { type: TokenTypes.NUMBER, value: '2' }, PRODUCT, { type: TokenTypes.NUMBER, value: '3' }, EQUAL, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				NEWLINE,

				LBRACKET, { type: TokenTypes.NUMBER, value: '1' }, { type: TokenTypes.NUMBER, value: '2' }, { type: TokenTypes.NUMBER, value: '3' }, RBRACKET,
				GET, { type: TokenTypes.NUMBER, value: '0' }, EQUAL, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,

				LBRACKET, { type: TokenTypes.NUMBER, value: '1' }, PRODUCT, { type: TokenTypes.NUMBER, value: '2' }, PRODUCT, { type: TokenTypes.NUMBER, value: '3' }, RBRACKET,
				GET, { type: TokenTypes.NUMBER, value: '0' }, EQUAL, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				LBRACKET, UNIT, SPREAD, { type: TokenTypes.IDENTIFIER, value: 'y' }, LAMBDA, { type: TokenTypes.IDENTIFIER, value: 'y' }, SPREAD, RBRACKET,
				{ type: TokenTypes.NUMBER, value: '1' },
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' },
				EQUAL,
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' }, NEWLINE,


				LBRACKET, UNIT, SPREAD, { type: TokenTypes.IDENTIFIER, value: 'y' }, LAMBDA, { type: TokenTypes.IDENTIFIER, value: 'y' }, SPREAD, RBRACKET,
				{ type: TokenTypes.NUMBER, value: '1' }, PRODUCT,
				{ type: TokenTypes.NUMBER, value: '2' }, PRODUCT,
				{ type: TokenTypes.NUMBER, value: '3' },
				EQUAL,
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				NEWLINE,


				LBRACKET,
				{ type: TokenTypes.NUMBER, value: '1' },
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' },
				RBRACKET,
				GET,
				{ type: TokenTypes.NUMBER, value: '1' },
				SPREAD, EQUAL,
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' }, NEWLINE,


				LBRACKET,
				{ type: TokenTypes.NUMBER, value: '1' }, PRODUCT,
				{ type: TokenTypes.NUMBER, value: '2' }, PRODUCT,
				{ type: TokenTypes.NUMBER, value: '3' },
				RBRACKET,
				GET,
				{ type: TokenTypes.NUMBER, value: '1' },
				SPREAD, EQUAL,
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,



				LBRACKET, { type: TokenTypes.IDENTIFIER, value: 'x' }, LAMBDA, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'x' }, EQUAL, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.NUMBER, value: '0' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'x' }, GREATER, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.STRING, value: 'more' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'x' }, LESS, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.STRING, value: 'less' }, NEWLINE,
				{ type: TokenTypes.STRING, value: 'other_wise' }, NEWLINE,
				DEDENT,
				RBRACKET, { type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				LBRACKET, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'x' }, LAMBDA, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'x' }, EQUAL, { type: TokenTypes.NUMBER, value: '0' }, AND, LBRACKET, UNIT, LAMBDA, { type: TokenTypes.NUMBER, value: '0' }, RBRACKET, XOR, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'x' }, GREATER, { type: TokenTypes.NUMBER, value: '0' }, AND, LBRACKET, UNIT, LAMBDA, { type: TokenTypes.STRING, value: 'more' }, RBRACKET, XOR, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'x' }, LESS, { type: TokenTypes.NUMBER, value: '0' }, AND, LBRACKET, UNIT, LAMBDA, { type: TokenTypes.STRING, value: 'less' }, RBRACKET, XOR, NEWLINE,

				LBRACKET, UNIT, LAMBDA, { type: TokenTypes.STRING, value: 'other_wise' }, RBRACKET, NEWLINE,
				DEDENT, DEDENT, RBRACKET, { type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,


				{ type: TokenTypes.IDENTIFIER, value: 'Person' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'name' }, { type: TokenTypes.IDENTIFIER, value: 'age' }, { type: TokenTypes.IDENTIFIER, value: 'etc' }, { type: TokenTypes.IDENTIFIER, value: 'x' }, LAMBDA, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'name' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'age' }, NEWLINE,
				SPREAD, { type: TokenTypes.IDENTIFIER, value: 'etc' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'x' }, NEWLINE,
				DEDENT, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'john' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'Person' },
				{ type: TokenTypes.STRING, value: 'john' },
				{ type: TokenTypes.NUMBER, value: '18' },
				{ type: TokenTypes.STRING, value: 'Like' },
				{ type: TokenTypes.STRING, value: 'Sushi' }, NEWLINE,
				NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'john' }, { type: TokenTypes.STRING, value: 'name' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'john' }, GET, { type: TokenTypes.IDENTIFIER, value: 'name' }, EQUAL,
				{ type: TokenTypes.IDENTIFIER, value: 'john' }, { type: TokenTypes.STRING, value: 'name' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'person' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'Person' },
				LBRACKET, RBRACKET,
				LBRACKET, RBRACKET,
				LBRACKET, RBRACKET,
				LBRACKET, RBRACKET, NEWLINE,
				NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'mary' }, DEFINE, NEWLINE,
				INDENT, SPREAD, { type: TokenTypes.IDENTIFIER, value: 'person' }, NEWLINE,
				INDENT, GET, { type: TokenTypes.IDENTIFIER, value: 'name' }, DEFINE, { type: TokenTypes.STRING, value: 'mary' }, NEWLINE,
				GET, { type: TokenTypes.IDENTIFIER, value: 'age' }, DEFINE, { type: TokenTypes.NUMBER, value: '16' }, NEWLINE,
				DEDENT, DEDENT, NEWLINE,


				{ type: TokenTypes.IDENTIFIER, value: 'charie' }, DEFINE, NEWLINE,
				INDENT, SPREAD, { type: TokenTypes.IDENTIFIER, value: 'person' }, NEWLINE,
				INDENT, GET, { type: TokenTypes.IDENTIFIER, value: 'name' }, DEFINE, { type: TokenTypes.STRING, value: 'charie' }, NEWLINE,
				GET, { type: TokenTypes.IDENTIFIER, value: 'age' }, DEFINE, { type: TokenTypes.NUMBER, value: '24' }, NEWLINE,
				DEDENT, DEDENT, NEWLINE,
				NEWLINE, NEWLINE,


				LBRACKET, NEWLINE,
				INDENT, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.STRING, value: 'zero' }, NEWLINE,
				GREATER, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.STRING, value: 'more' }, NEWLINE,
				LESS, { type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.STRING, value: 'less' }, NEWLINE,
				{ type: TokenTypes.STRING, value: 'other' }, NEWLINE,
				DEDENT, RBRACKET, { type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,



				LBRACKET, NEWLINE,
				INDENT, { type: TokenTypes.NUMBER, value: '1' }, DEFINE, { type: TokenTypes.STRING, value: 'yep' }, NEWLINE,
				{ type: TokenTypes.NUMBER, value: '0' }, DEFINE, { type: TokenTypes.STRING, value: 'nop' }, NEWLINE,
				DEDENT, RBRACKET, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,


				LBRACKET, GREATER, { type: TokenTypes.NUMBER, value: '3' }, DEFINE, LBRACKET, PLUS, { type: TokenTypes.NUMBER, value: '3' }, RBRACKET, RBRACKET, { type: TokenTypes.NUMBER, value: '3' }, { type: TokenTypes.NUMBER, value: '4' }, EQUAL, { type: TokenTypes.NUMBER, value: '4' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,



				{ type: TokenTypes.IDENTIFIER, value: 'Item' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'name' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'equip' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'use' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'effect' }, NEWLINE,
				DEDENT, NEWLINE,


				{ type: TokenTypes.IDENTIFIER, value: 'medicalWeed' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'Item' }, NEWLINE,
				INDENT,
				{ type: TokenTypes.STRING, value: 'medicalWeed' }, NEWLINE,
				LBRACKET, RBRACKET, NEWLINE,
				LBRACKET, GET, { type: TokenTypes.IDENTIFIER, value: 'medicalWeed' }, RBRACKET,
				PRODUCT, LBRACKET, MINUS, { type: TokenTypes.NUMBER, value: '1' }, RBRACKET, NEWLINE,
				LBRACKET, GET, { type: TokenTypes.IDENTIFIER, value: 'HP' }, RBRACKET,
				PRODUCT, LBRACKET, PLUS, { type: TokenTypes.NUMBER, value: '20' }, RBRACKET, NEWLINE,
				DEDENT, DEDENT, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'lightningStaff' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'Item' }, NEWLINE,
				INDENT,
				{ type: TokenTypes.STRING, value: 'lightningStaff' }, NEWLINE,
				LBRACKET, GET, { type: TokenTypes.IDENTIFIER, value: 'Atk' }, RBRACKET,
				PRODUCT, LBRACKET, PLUS, { type: TokenTypes.NUMBER, value: '8' }, RBRACKET, NEWLINE,
				LBRACKET, GET, { type: TokenTypes.IDENTIFIER, value: 'ThunderBolt' }, RBRACKET, NEWLINE,
				LBRACKET, GET, { type: TokenTypes.IDENTIFIER, value: 'HP' }, RBRACKET,
				PRODUCT, LBRACKET, MINUS, { type: TokenTypes.NUMBER, value: '40' }, RBRACKET, NEWLINE,
				DEDENT, DEDENT, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,



				{ type: TokenTypes.IDENTIFIER, value: 'myValue' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.NUMBER, value: '3' }, NEWLINE,
				LBRACKET, PLUS, { type: TokenTypes.NUMBER, value: '4' }, RBRACKET, NEWLINE,
				LBRACKET, MULTIPLY, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET, NEWLINE,
				DEDENT, NEWLINE,

				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE,

				// myPairs: 1 2 3 4 5
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs' }, DEFINE,
				{ type: TokenTypes.NUMBER, value: '1' },
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' },
				{ type: TokenTypes.NUMBER, value: '4' },
				{ type: TokenTypes.NUMBER, value: '5' }, NEWLINE,

				//myPairs0: [,] 1 2 3 4 5
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs0' }, DEFINE,
				LBRACKET, PRODUCT, RBRACKET,
				{ type: TokenTypes.NUMBER, value: '1' },
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' },
				{ type: TokenTypes.NUMBER, value: '4' },
				{ type: TokenTypes.NUMBER, value: '5' }, NEWLINE,

				//myPairs1: 1, 2, 3, 4, 5
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs1' }, DEFINE,
				{ type: TokenTypes.NUMBER, value: '1' }, PRODUCT,
				{ type: TokenTypes.NUMBER, value: '2' }, PRODUCT,
				{ type: TokenTypes.NUMBER, value: '3' }, PRODUCT,
				{ type: TokenTypes.NUMBER, value: '4' }, PRODUCT,
				{ type: TokenTypes.NUMBER, value: '5' }, NEWLINE,

				//myPairs2: 1 ? 2 ? 3 ? 4 ? 5
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs2' }, DEFINE,
				{ type: TokenTypes.NUMBER, value: '1' }, LAMBDA,
				{ type: TokenTypes.NUMBER, value: '2' }, LAMBDA,
				{ type: TokenTypes.NUMBER, value: '3' }, LAMBDA,
				{ type: TokenTypes.NUMBER, value: '4' }, LAMBDA,
				{ type: TokenTypes.NUMBER, value: '5' }, NEWLINE,
				NEWLINE,

				// myPairs0 = myPairs = myPairs1 = [,] myPairs2~
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs0' }, EQUAL,
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs' }, EQUAL,
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs1' }, EQUAL,
				LBRACKET, PRODUCT, RBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs2' }, SPREAD, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// [[,],] myPairs = [1], [2], [3], [4], [5]
				LBRACKET, LBRACKET, PRODUCT, RBRACKET, PRODUCT, RBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs' }, EQUAL,
				LBRACKET, { type: TokenTypes.NUMBER, value: '1' }, RBRACKET, PRODUCT,
				LBRACKET, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET, PRODUCT,
				LBRACKET, { type: TokenTypes.NUMBER, value: '3' }, RBRACKET, PRODUCT,
				LBRACKET, { type: TokenTypes.NUMBER, value: '4' }, RBRACKET, PRODUCT,
				LBRACKET, { type: TokenTypes.NUMBER, value: '5' }, RBRACKET, NEWLINE,

				// [?] myPairs = 1 ? 2 ? 3 ? 4 ? 5
				LBRACKET, LAMBDA, RBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs' }, EQUAL,
				{ type: TokenTypes.NUMBER, value: '1' }, LAMBDA,
				{ type: TokenTypes.NUMBER, value: '2' }, LAMBDA,
				{ type: TokenTypes.NUMBER, value: '3' }, LAMBDA,
				{ type: TokenTypes.NUMBER, value: '4' }, LAMBDA,
				{ type: TokenTypes.NUMBER, value: '5' }, NEWLINE,

				// [+] myPairs = 15
				LBRACKET, PLUS, RBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs' }, EQUAL, { type: TokenTypes.NUMBER, value: '15' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// [* 2,] myPairs = 2 4 6 8 10
				LBRACKET, MULTIPLY, { type: TokenTypes.NUMBER, value: '2' }, PRODUCT, RBRACKET,
				{ type: TokenTypes.IDENTIFIER, value: 'myPairs' }, EQUAL,
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '4' },
				{ type: TokenTypes.NUMBER, value: '6' },
				{ type: TokenTypes.NUMBER, value: '8' },
				{ type: TokenTypes.NUMBER, value: '10' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// r: [1 2] [3 4]
				{ type: TokenTypes.IDENTIFIER, value: 'r' }, DEFINE,
				LBRACKET, { type: TokenTypes.NUMBER, value: '1' }, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET,
				LBRACKET, { type: TokenTypes.NUMBER, value: '3' }, { type: TokenTypes.NUMBER, value: '4' }, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				// s: [1 2],[3 4]
				{ type: TokenTypes.IDENTIFIER, value: 's' }, DEFINE,
				LBRACKET, { type: TokenTypes.NUMBER, value: '1' }, { type: TokenTypes.NUMBER, value: '2' }, RBRACKET, PRODUCT,
				LBRACKET, { type: TokenTypes.NUMBER, value: '3' }, { type: TokenTypes.NUMBER, value: '4' }, RBRACKET, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,


				{ type: TokenTypes.IDENTIFIER, value: 'myGreet' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'greet' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'hello' }, DEFINE, { type: TokenTypes.STRING, value: 'hello,' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'welcome' }, DEFINE, { type: TokenTypes.STRING, value: 'welcome,' }, NEWLINE,
				DEDENT, { type: TokenTypes.IDENTIFIER, value: 'world' }, DEFINE, { type: TokenTypes.STRING, value: ' world' }, NEWLINE,
				DEDENT, NEWLINE, NEWLINE, NEWLINE,


				{ type: TokenTypes.IDENTIFIER, value: 'myGreet' }, DEFINE, SPREAD, { type: TokenTypes.IDENTIFIER, value: 'a' }, LAMBDA, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'a' }, GET, { type: TokenTypes.NUMBER, value: '0' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'greet' }, AND, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'a' }, GET, { type: TokenTypes.NUMBER, value: '1' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'hello' }, AND, { type: TokenTypes.STRING, value: 'hello,' }, XOR, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'a' }, GET, { type: TokenTypes.NUMBER, value: '1' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'welcome' }, AND, { type: TokenTypes.STRING, value: 'welcome,' }, XOR, NEWLINE,
				DEDENT, { type: TokenTypes.IDENTIFIER, value: 'a' }, GET, { type: TokenTypes.NUMBER, value: '0' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'world' }, AND, { type: TokenTypes.STRING, value: ' world' }, XOR, NEWLINE,
				LBRACKET, RBRACKET, NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'myGreet' }, GET, { type: TokenTypes.IDENTIFIER, value: 'greet' },
				GET, { type: TokenTypes.IDENTIFIER, value: 'hello' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'hello,' }, NEWLINE,
				NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'myPairs' }, GET, { type: TokenTypes.NUMBER, value: '0' }, EQUAL, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				NEWLINE,


				{ type: TokenTypes.IDENTIFIER, value: 'myPairs' }, GET, LBRACKET, { type: TokenTypes.NUMBER, value: '1' }, SPREAD, { type: TokenTypes.NUMBER, value: '3' }, RBRACKET, EQUAL, { type: TokenTypes.NUMBER, value: '2' }, { type: TokenTypes.NUMBER, value: '3' }, { type: TokenTypes.NUMBER, value: '4' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,


				{ type: TokenTypes.IDENTIFIER, value: 'myGreet' }, NEWLINE,
				INDENT, GET, { type: TokenTypes.IDENTIFIER, value: 'greet' }, NEWLINE,
				INDENT, GET, { type: TokenTypes.IDENTIFIER, value: 'welcome' }, NEWLINE,
				DEDENT, GET, { type: TokenTypes.IDENTIFIER, value: 'world' }, NEWLINE,
				DEDENT, EQUAL, { type: TokenTypes.STRING, value: 'welcome, world' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'myGreet' }, NEWLINE,
				INDENT, GET, { type: TokenTypes.IDENTIFIER, value: 'greet' }, NEWLINE,
				INDENT, GET, { type: TokenTypes.IDENTIFIER, value: 'welcome' }, DEFINE, { type: TokenTypes.STRING, value: 'welcome to our ' }, NEWLINE,
				DEDENT, GET, { type: TokenTypes.IDENTIFIER, value: 'world' }, DEFINE, { type: TokenTypes.STRING, value: 'metaverse!' }, NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				SPREAD, LBRACKET, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'y' }, DEFINE, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				{ type: TokenTypes.IDENTIFIER, value: 'n' }, DEFINE, { type: TokenTypes.NUMBER, value: '0' }, NEWLINE,
				DEDENT, RBRACKET, NEWLINE,
				NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'y' }, EQUAL, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE,


				IMPORT, { type: TokenTypes.IDENTIFIER, value: 'io' }, NEWLINE,
				INDENT, { type: TokenTypes.IDENTIFIER, value: 'say' }, { type: TokenTypes.IDENTIFIER, value: 'Hello' }, { type: TokenTypes.IDENTIFIER, value: 'World' }, NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'say' }, { type: TokenTypes.IDENTIFIER, value: 'Hello' }, { type: TokenTypes.IDENTIFIER, value: 'World' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,


				IMPORT, { type: TokenTypes.IDENTIFIER, value: 'Funnctor' }, SPREAD, NEWLINE,
				IMPORT, { type: TokenTypes.IDENTIFIER, value: 'Monoid' }, SPREAD, NEWLINE,
				IMPORT, { type: TokenTypes.IDENTIFIER, value: 'io' }, SPREAD, NEWLINE,
				NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'say' },
				LBRACKET,
				{ type: TokenTypes.NUMBER, value: '1' },
				{ type: TokenTypes.NUMBER, value: '2' },
				{ type: TokenTypes.NUMBER, value: '3' },
				{ type: TokenTypes.NUMBER, value: '4' },
				{ type: TokenTypes.NUMBER, value: '5' },
				LBRACKET, MULTIPLY, { type: TokenTypes.NUMBER, value: '4' }, PRODUCT, RBRACKET, LBRACKET, PLUS, RBRACKET, RBRACKET, NEWLINE,
				NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'M' }, DEFINE, { type: TokenTypes.CHAR, value: 'M' }, NEWLINE,
				NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'My' }, DEFINE, { type: TokenTypes.IDENTIFIER, value: 'M' },
				{ type: TokenTypes.CHAR, value: 'y' },
				{ type: TokenTypes.CHAR, value: ' ' },
				{ type: TokenTypes.CHAR, value: 'D' },
				{ type: TokenTypes.CHAR, value: 'o' },
				{ type: TokenTypes.CHAR, value: 'm' },
				{ type: TokenTypes.CHAR, value: 'e' },
				{ type: TokenTypes.CHAR, value: 's' },
				{ type: TokenTypes.CHAR, value: 't' },
				{ type: TokenTypes.CHAR, value: 'i' },
				{ type: TokenTypes.CHAR, value: 'c' }, NEWLINE,

				{ type: TokenTypes.IDENTIFIER, value: 'My' }, EQUAL,
				{ type: TokenTypes.IDENTIFIER, value: 'M' },
				{ type: TokenTypes.CHAR, value: 'y' },
				{ type: TokenTypes.CHAR, value: ' ' },
				{ type: TokenTypes.CHAR, value: 'D' },
				{ type: TokenTypes.CHAR, value: 'o' },
				{ type: TokenTypes.CHAR, value: 'm' },
				{ type: TokenTypes.CHAR, value: 'e' },
				{ type: TokenTypes.CHAR, value: 's' },
				{ type: TokenTypes.CHAR, value: 't' },
				{ type: TokenTypes.CHAR, value: 'i' },
				{ type: TokenTypes.CHAR, value: 'c' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'My Domestic' }, NEWLINE,
				NEWLINE,
				INDENT, { type: TokenTypes.STRING, value: 'Hello ' },
				{ type: TokenTypes.STRING, value: 'World!' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'Hello World!' }, NEWLINE,

				{ type: TokenTypes.STRING, value: 'Hello' },
				{ type: TokenTypes.CHAR, value: ' ' },
				{ type: TokenTypes.STRING, value: 'World!' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'Hello World!' }, NEWLINE,


				{ type: TokenTypes.CHAR, value: 'H' },
				{ type: TokenTypes.STRING, value: 'ello' },
				{ type: TokenTypes.CHAR, value: ' ' },
				{ type: TokenTypes.STRING, value: 'World' },
				{ type: TokenTypes.CHAR, value: '!' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'Hello World!' }, NEWLINE,



				{ type: TokenTypes.STRING, value: 'Hello ' },
				{ type: TokenTypes.IDENTIFIER, value: 'My' },
				{ type: TokenTypes.STRING, value: 'World!' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'Hello My Domestic World!' }, NEWLINE,



				{ type: TokenTypes.IDENTIFIER, value: 'Hello' },
				{ type: TokenTypes.CHAR, value: ' ' },
				{ type: TokenTypes.IDENTIFIER, value: 'My' },
				{ type: TokenTypes.CHAR, value: ' ' },
				{ type: TokenTypes.STRING, value: 'World' },
				{ type: TokenTypes.CHAR, value: '!' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'Hello My Domestic World!' }, NEWLINE,


				{ type: TokenTypes.STRING, value: 'Hello' },
				{ type: TokenTypes.CHAR, value: '!' },
				{ type: TokenTypes.CHAR, value: ' ' },
				{ type: TokenTypes.IDENTIFIER, value: 'My' },
				{ type: TokenTypes.IDENTIFIER, value: 'World' },
				{ type: TokenTypes.CHAR, value: '!' }, EQUAL,
				{ type: TokenTypes.STRING, value: 'Hello! My Domestic World!' }, NEWLINE,
				DEDENT, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				// XXX; single space indent?????
				{ type: TokenTypes.IDENTIFIER, value: 'HWinEnter' }, DEFINE, NEWLINE,
				INDENT, { type: TokenTypes.STRING, value: 'Hello' }, { type: TokenTypes.CHAR, value: '\n' },
				{ type: TokenTypes.STRING, value: 'World!' }, NEWLINE,
				DEDENT, NEWLINE, NEWLINE, NEWLINE, NEWLINE, NEWLINE,

				EXPORT, { type: TokenTypes.IDENTIFIER, value: 'myDict' }, DEFINE,
				{ type: TokenTypes.IDENTIFIER, value: 'name' },
				{ type: TokenTypes.IDENTIFIER, value: 'value' },
				LAMBDA, SPREAD, { type: TokenTypes.IDENTIFIER, value: 'name' }, DEFINE,
				{ type: TokenTypes.IDENTIFIER, value: 'value' }, NEWLINE,


				EXPORT, { type: TokenTypes.IDENTIFIER, value: 'gets' }, DEFINE,
				{ type: TokenTypes.IDENTIFIER, value: 'name' }, LAMBDA, { type: TokenTypes.IDENTIFIER, value: 'myDict' }, GET, SPREAD, { type: TokenTypes.IDENTIFIER, value: 'name' }, NEWLINE,
				NEWLINE, NEWLINE, NEWLINE,

				{ type: TokenTypes.NUMBER, value: '0' }, AND, { type: TokenTypes.STRING, value: 'me' }, EQUAL, { type: TokenTypes.NUMBER, value: '0' }, NEWLINE,
				{ type: TokenTypes.NUMBER, value: '1' }, AND, { type: TokenTypes.STRING, value: 'me' }, EQUAL, { type: TokenTypes.STRING, value: 'me' }, NEWLINE,
				NEWLINE,

				{ type: TokenTypes.NUMBER, value: '0' }, OR, { type: TokenTypes.STRING, value: 'me' }, EQUAL, { type: TokenTypes.STRING, value: 'me' }, NEWLINE,
				{ type: TokenTypes.NUMBER, value: '1' }, OR, { type: TokenTypes.STRING, value: 'me' }, EQUAL, { type: TokenTypes.NUMBER, value: '1' }, NEWLINE,
				NEWLINE,

				{ type: TokenTypes.NUMBER, value: '0' }, XOR, { type: TokenTypes.STRING, value: 'me' }, EQUAL, { type: TokenTypes.STRING, value: 'me' }, NEWLINE,
				{ type: TokenTypes.NUMBER, value: '1' }, XOR, { type: TokenTypes.STRING, value: 'me' }, EQUAL, { type: TokenTypes.NUMBER, value: '0' }, NEWLINE,
				NEWLINE,
				NEWLINE,

				EXPORT, { type: TokenTypes.STRING, value: 'It:' },
				{ type: TokenTypes.CHAR, value: '\t' },
				{ type: TokenTypes.STRING, value: '365' },
				{ type: TokenTypes.STRING, value: 'is number of date at 1 year' }, NEWLINE,

				{ type: TokenTypes.CHAR, value: '\t' },
				{ type: TokenTypes.NUMBER, value: '4' }, PLUS,
				{ type: TokenTypes.NUMBER, value: '5' }, EOF
			]
		);
	});

console.log('All tests completed!');
