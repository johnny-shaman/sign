import fs from 'node:fs';
import readline from 'node:readline';

const EXP = {
	IN : '.sn',
	OUT : '.snir',
};

const pattern = {
	comment:    /^[`\\].*$/gm,
	letter:     /\\[\s\S]/gvd,
	postfix:    /(\S+)([!~]){1}/gd, //replace用
	string:     /`[^\\`\r\n]*`/gd,
	number:     /-?\d+(\.\d+)?(e-?\d+)?/gd,
	hex :       /0x[0-9a-fA-F]+/gd,
	oct:        /0o[0-7]+/gd,
	bit:        /0b[01]+/gd,
	identifier: /[@#]?[^\x00-\x40\x5B-\x60\x7B-\x7F][^\x00-\x2F\x3A-\x40\x5B-\x5E\x60\x7B-\x7F]*/gd,
	unit:       /[\s](_)[\s]/gd,

	block:      /^( {4}|\t)+/,
	operator:   /(?![\s\r\n]+?)[\x20\x21\x23\x25\x26\x28-\x2D\x2F\x3A\x3B\x3F\x4A\x5B-\x5E\x7B-\x7E](?![\s\r\n]+?)/g,
	compair:    /\B(=|!=|<|>|<=|>=)\B/g,
};

const TOKENPTN = new RegExp(`(${Object.values(pattern).map(v => v.source).join(')|(')})`, 'g');

/**
 *
 * @param {String} inputfile
 */
export async function preprocess(inputfile) {
	let fileI = inputfile.endsWith(EXP.IN) ? inputfile : (inputfile + EXP.IN);
	let fileO = fileI.replace(/\.sn$/, '.snir');

	const inStream = fs.createReadStream(fileI);
	const outStream = fs.createWriteStream(fileO);
	const reader = readline.createInterface({
		input: inStream,
	});

	for await (let line of reader) {
		outStream.write(JSON.stringify(tokenize(line)) + '\n');
	}
};
function tokenize(line) {
	let tokens = remove(line, pattern.comment);
	let tks = tokens.match(TOKENPTN);
	return tks ? tks.map(token => [token]) : [tokens];
}

function remove(line, regex) {
	return line.replace(regex, '');
}