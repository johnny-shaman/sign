// lexer.js
const TABSIZE = 4;
const TokenTypes = {
	// Keywords/Special tokens
	EXPORT: 'EXPORT',        // #
	IMPORT: 'IMPORT',        // @
	DEFINE: 'DEFINE',        // :
	LAMBDA: 'LAMBDA',        // ?
	SPREAD: 'SPREAD',        // ~
	GET: 'GET',              // '
	PRODUCT: 'PRODUCT',      // ,

	// Operators
	PLUS: 'PLUS',           // +
	MINUS: 'MINUS',         // -
	MULTIPLY: 'MULTIPLY',   // *
	DIVIDE: 'DIVIDE',       // /
	POWER: 'POWER',         // ^
	MOD: 'MOD',            // %

	// Logical operators
	AND: 'AND',            // &
	OR: 'OR',             // |
	XOR: 'XOR',           // ;
	NOT: 'NOT',           // !

	// Comparison operators
	EQUAL: 'EQUAL',        // =
	NOT_EQUAL: 'NOT_EQUAL', // != or ><
	LESS: 'LESS',          // <
	GREATER: 'GREATER',    // >
	LESS_EQ: 'LESS_EQ',    // <=
	GREATER_EQ: 'GREATER_EQ', // >=

	// Delimiters
	LPAREN: 'LPAREN',      // (
	RPAREN: 'RPAREN',      // )
	LBRACE: 'LBRACE',      // {
	RBRACE: 'RBRACE',      // }
	LBRACKET: 'LBRACKET',  // [
	RBRACKET: 'RBRACKET',  // ]

	// Literals
	NUMBER: 'NUMBER',
	STRING: 'STRING',
	CHAR: 'CHAR',
	IDENTIFIER: 'IDENTIFIER',
	UNIT: 'UNIT',          // _

	// Special
	INDENT: 'INDENT',
	DEDENT: 'DEDENT',
	NEWLINE: 'NEWLINE',
	EOF: 'EOF'
};

class Token {
	constructor(type, value, line, column) {
		this.type = type;
		this.value = value;
		this.line = line;
		this.column = column;
	}

	toString() {
		return `Token(${this.type}, '${this.value}') at ${this.line}:${this.column}`;
	}
}

class LexerError extends Error {
	constructor(message, line, column) {
		super(`${message} at ${line}:${column}`);
		this.line = line;
		this.column = column;
	}
}

class Lexer {
	constructor(input) {
		this.input = input;
		this.position = 0;
		this.line = 1;
		this.column = 1;
		this.indentStack = [0];
		this.tokens = [];
	}

	tokenize() {
		while (this.position < this.input.length) {
			const char = this.peek();

			if (char === ' ' || char === '\t') {
				this.column === 1
					? this.handleIndentation()
					: this.advance();
				continue;
			}
			if (this.column === 1 && (char !== ' ' && char !== '\t')) {
				this.handleIndentation();
			}

			// Handle whitespace and indentation
			if (char === '\n') {
				this.handleNewline();
				continue;
			}

			// Skip comments
			if (this.column === 1 && char === '`') {
				this.skipComment();
				continue;
			}


			// Handle numbers
			if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek(1)))) {
				this.handleNumber();
				continue;
			}

			// Handle strings
			if (char === '`') {
				this.handleString();
				continue;
			}

			// Handle characters
			if (char === '\\') {
				this.handleChar();
				continue;
			}

			// Handle identifiers
			if (this.isIdentifierStart(char)) {
				this.handleIdentifier();
				continue;
			}

			// Handle operators and symbols
			if (this.isSymbol(char)) {
				this.handleSymbol();
				continue;
			}

			throw new LexerError(`Unexpected character: ${char}`, this.line, this.column);
		}

		// Handle any remaining indentation at EOF
		while (this.indentStack[this.indentStack.length - 1] > 0) {
			this.indentStack.pop();
			this.tokens.push(new Token(TokenTypes.DEDENT, '', this.line, this.column));
		}

		this.tokens.push(new Token(TokenTypes.EOF, '', this.line, this.column));
		return this.tokens;
	}

	// Helper methods
	peek(offset = 0) {
		return this.position + offset < this.input.length ? this.input[this.position + offset] : null;
	}

	advance(count = 1) {
		for (let i = 0; i < count; i++) {
			if (this.peek() === '\n') {
				this.line++;
				this.column = 1;
			} else {
				this.column++;
			}
			this.position++;
		}
	}

	handleNewline() {
		this.tokens.push(new Token(TokenTypes.NEWLINE, '\n', this.line, this.column));
		this.advance();
	}

	handleIndentation() {
		let indent = 0;
		while (this.peek() === ' ' || this.peek() === '\t') {
			indent += this.peek() === ' ' ? 1 : TABSIZE;
			this.advance();
		}

		const currentIndent = this.indentStack[this.indentStack.length - 1];

		if (indent > currentIndent) {
			this.indentStack.push(indent);
			this.tokens.push(new Token(TokenTypes.INDENT, indent, this.line, this.column));
		} else if (indent < currentIndent) {
			while (this.indentStack[this.indentStack.length - 1] > indent) {
				this.indentStack.pop();
				this.tokens.push(new Token(TokenTypes.DEDENT, indent, this.line, this.column));
			}
			if (this.indentStack[this.indentStack.length - 1] !== indent) {
				throw new LexerError('Invalid dedentation', this.line, this.column);
			}
		}

	}

	skipComment() {
		while (this.peek() && this.peek() !== '\n') {
			this.advance();
		}
	}

	handleSymbol() {
		const symbolMap = {
			'#': TokenTypes.EXPORT,
			'@': TokenTypes.IMPORT,
			':': TokenTypes.DEFINE,
			'?': TokenTypes.LAMBDA,
			'~': TokenTypes.SPREAD,
			'+': TokenTypes.PLUS,
			'-': TokenTypes.MINUS,
			'*': TokenTypes.MULTIPLY,
			'/': TokenTypes.DIVIDE,
			'^': TokenTypes.POWER,
			'%': TokenTypes.MOD,
			'&': TokenTypes.AND,
			'|': TokenTypes.OR,
			';': TokenTypes.XOR,
			'!': TokenTypes.NOT,
			'(': TokenTypes.LPAREN,
			')': TokenTypes.RPAREN,
			'{': TokenTypes.LBRACE,
			'}': TokenTypes.RBRACE,
			'[': TokenTypes.LBRACKET,
			']': TokenTypes.RBRACKET,
			',': TokenTypes.PRODUCT,
			"'": TokenTypes.GET,
			'_': TokenTypes.UNIT
		};
		const combinedMap = {
			'=': TokenTypes.EQUAL,
			'==': TokenTypes.EQUAL,
			'<': TokenTypes.LESS,
			'>': TokenTypes.GREATER,
			'!': TokenTypes.NOT_EQUAL,
			'<=': TokenTypes.LESS_EQ,
			'>=': TokenTypes.GREATER_EQ,
			'!=': TokenTypes.NOT_EQUAL,
			'><': TokenTypes.NOT_EQUAL
		}

		let symbol = this.peek();
		const nextChar = this.peek(1);

		// Handle two-character operators
		if (nextChar) {
			const combined = symbol + nextChar;
			if (['<=', '>=', '!=', '><', '=='].includes(combined)) {
				symbol = combined;
				this.advance(2);
			} else if (/\d/.test(nextChar)) {
				this.advance();

			} else {
				this.advance();
			}
		} else {
			this.advance();
		}
		const type = symbolMap[symbol] || combinedMap[symbol] || symbol;
		this.tokens.push(new Token(type, symbol, this.line, this.column));
	}

	handleNumber() {
		let number = '';
		let isFloat = false;
		let isNegative = false;

		// Handle negative numbers
		if (this.peek() === '-') {
			isNegative = true;
			number += '-';
			this.advance();
		}

		// Handle hex, octal, and binary numbers
		if (this.peek() === '0') {
			const next = this.peek(1);
			if (next === 'x' || next === 'X') {
				return this.handleHexNumber();
			} else if (next === 'o' || next === 'O') {
				return this.handleOctalNumber();
			} else if (next === 'b' || next === 'B') {
				return this.handleBinaryNumber();
			}
		}

		while (this.peek() && (this.isDigit(this.peek()) || this.peek() === '.' || this.peek().toLowerCase() === 'e')) {
			if (this.peek() === '.') {
				if (isFloat) throw new LexerError('Invalid number format', this.line, this.column);
				isFloat = true;
			}
			number += this.peek();
			this.advance();
		}

		this.tokens.push(new Token(TokenTypes.NUMBER, number, this.line, this.column));
	}

	handleString() {
		this.advance(); // Skip opening quote
		let string = '';

		while (this.peek() && this.peek() !== '`') {
			if (this.peek() === '\n') {
				throw new LexerError('Unterminated string', this.line, this.column);
			}
			string += this.peek();
			this.advance();
		}

		if (!this.peek()) {
			throw new LexerError('Unterminated string', this.line, this.column);
		}

		this.advance(); // Skip closing quote
		this.tokens.push(new Token(TokenTypes.STRING, string, this.line, this.column));
	}

	handleChar() {
		this.advance(); // Skip backslash
		if (!this.peek()) {
			throw new LexerError('Unterminated character literal', this.line, this.column);
		}
		const char = this.peek();
		this.advance();
		this.tokens.push(new Token(TokenTypes.CHAR, char, this.line, this.column));
	}

	handleIdentifier() {
		let identifier = '';
		while (this.peek() && this.isIdentifierPart(this.peek())) {
			identifier += this.peek();
			this.advance();
		}
		if (identifier.startsWith('_')) {

		}
		this.tokens.push(new Token(TokenTypes.IDENTIFIER, identifier, this.line, this.column));
	}

	// Utility methods
	isDigit(char) {
		return char >= '0' && char <= '9';
	}

	isHexDigit(char) {
		return this.isDigit(char) ||
			(char >= 'a' && char <= 'f') ||
			(char >= 'A' && char <= 'F');
	}

	isIdentifierStart(char) {
		return (char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z')
	}

	isIdentifierPart(char) {
		return this.isIdentifierStart(char) || this.isDigit(char) || char === '_';
	}

	isSymbol(char) {
		return '!@#$%^&\'*()+-=[]{}|;:,.<>?/~_'.includes(char);
	}

	handleHexNumber() {
		let number = '0x';
		this.advance(2); // Skip "0x"

		if (!this.peek() || !this.isHexDigit(this.peek())) {
			throw new LexerError('Invalid hex number', this.line, this.column);
		}

		while (this.peek() && this.isHexDigit(this.peek())) {
			number += this.peek();
			this.advance();
		}

		this.tokens.push(new Token(TokenTypes.NUMBER, number, this.line, this.column));
	}

	handleOctalNumber() {
		let number = '0o';
		this.advance(2); // Skip "0o"

		while (this.peek() && this.peek() >= '0' && this.peek() <= '7') {
			number += this.peek();
			this.advance();
		}

		this.tokens.push(new Token(TokenTypes.NUMBER, number, this.line, this.column));
	}

	handleBinaryNumber() {
		let number = '0b';
		this.advance(2); // Skip "0b"

		while (this.peek() && (this.peek() === '0' || this.peek() === '1')) {
			number += this.peek();
			this.advance();
		}

		this.tokens.push(new Token(TokenTypes.NUMBER, number, this.line, this.column));
	}
}

export { Lexer, Token, TokenTypes, LexerError };
