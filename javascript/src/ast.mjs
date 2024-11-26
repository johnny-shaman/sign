	// ast.js
const ASTNodeTypes = {
	// Program root
	PROGRAM: 'Program',

	// Expressions
	EXPRESSION: 'Expression',
	EXPORT: 'Export',
	DEFINE: 'Define',
	LAMBDA: 'Lambda',
	PRODUCT: 'Product',
	SPREAD: 'Spread',
	OR_XOR: 'OrXor',
	AND: 'And',
	NOT: 'Not',
	COMPARE: 'Compare',
	ADD: 'Add',
	MUL: 'Multiply',
	POWER: 'Power',
	FACTORIAL: 'Factorial',
	FLAT: 'Flat',
	COPRODUCT: 'Coproduct',
	GET: 'Get',
	IMPORT: 'Import',

	// Blocks and Closures
	BLOCK: 'Block',
	CLOSURE: 'Closure',
	POINT_FREE: 'PointFree',
	PARTIAL_APPLICATION: 'PartialApplication',

	// Literals
	LITERAL: 'Literal',
	NUMBER: 'Number',
	STRING: 'String',
	CHAR: 'Char',
	UNIT: 'Unit',
	IDENTIFIER: 'Identifier',

	// Operators
	OPERATOR: 'Operator'
};

class ASTNode {
	constructor(type, properties = {}) {
		this.type = type;
		Object.assign(this, properties);
	}

	static Program(body) {
		return new ASTNode(ASTNodeTypes.PROGRAM, { body });
	}

	static Export(expression) {
		return new ASTNode(ASTNodeTypes.EXPORT, { expression });
	}

	static Define(identifier, value) {
		return new ASTNode(ASTNodeTypes.DEFINE, { identifier, value });
	}

	static Lambda(parameters, body) {
		return new ASTNode(ASTNodeTypes.LAMBDA, { parameters, body });
	}

	static Block(expressions) {
		return new ASTNode(ASTNodeTypes.BLOCK, { expressions });
	}

	static Literal(value, literalType) {
		return new ASTNode(ASTNodeTypes.LITERAL, { value, literalType });
	}

	static BinaryOp(operator, left, right) {
		return new ASTNode(ASTNodeTypes.OPERATOR, { operator, left, right });
	}

	static UnaryOp(operator, operand) {
		return new ASTNode(ASTNodeTypes.OPERATOR, { operator, operand });
	}
}

export { ASTNodeTypes, ASTNode };
