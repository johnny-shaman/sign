// src/ast/nodes.js
const { ASTNode } = require('./ast');
const { UnaryOperator, BinaryOperator } = require('./operators');

// リテラル
class NumberLiteral extends ASTNode {
    constructor(value) {
        super('NumberLiteral');
        this.value = value;
    }

    toString() {
        return `${this.value}`;
    }
}

class StringLiteral extends ASTNode {
    constructor(chars) {
        super('StringLiteral');
        this.chars = chars;
    }

    toString() {
        return `\`${this.chars.join('')}\``;
    }
}

class CharLiteral extends ASTNode {
    constructor(value) {
        super('CharLiteral');
        this.value = value;
    }

    toString() {
        return `\\${this.value}`;
    }
}

class Identifier extends ASTNode {
    constructor(name) {
        super('Identifier');
        this.name = name;
    }

    toString() {
        return this.name;
    }
}

// 演算子
class UnaryOperation extends ASTNode {
    constructor(operator, expr, prefix = true) {
        super('UnaryOperation');
        this.operator = operator;
        this.expr = expr;
        this.prefix = prefix;
    }

    toString() {
        if (this.prefix) {
            return `${UnaryOperator.toString(this.operator)}${this.expr}`;
        }
        return `${this.expr}${UnaryOperator.toString(this.operator)}`;
    }
}

class BinaryOperation extends ASTNode {
    constructor(operator, left, right) {
        super('BinaryOperation');
        this.operator = operator;
        this.left = left;
        this.right = right;
    }

    toString() {
        return `(${this.left} ${BinaryOperator.toString(this.operator)} ${this.right})`;
    }
}

// 関数とブロック
class Lambda extends ASTNode {
    constructor(params, body) {
        super('Lambda');
        this.params = params;
        this.body = body;
    }

    toString() {
        const paramStr = this.params.map(p => p.toString()).join(' ');
        return `${paramStr} ? ${this.body}`;
    }
}

class Parameter extends ASTNode {
    constructor(name, isRest = false) {
        super('Parameter');
        this.name = name;
        this.isRest = isRest;
    }

    toString() {
        return this.isRest ? `~${this.name}` : this.name;
    }
}

class Block extends ASTNode {
    constructor(expressions) {
        super('Block');
        this.expressions = expressions;
    }

    toString() {
        return `[${this.expressions.join(' ')}]`;
    }
}

// パターンマッチ
class Pattern extends ASTNode {
    constructor(pattern, result) {
        super('Pattern');
        this.pattern = pattern;
        this.result = result;
    }

    toString() {
        return `${this.pattern} : ${this.result}`;
    }
}

// 特殊構造
class Range extends ASTNode {
    constructor(start, end) {
        super('Range');
        this.start = start;
        this.end = end;
    }

    toString() {
        return `${this.start} ~ ${this.end}`;
    }
}

class Definition extends ASTNode {
    constructor(name, value) {
        super('Definition');
        this.name = name;
        this.value = value;
    }

    toString() {
        return `${this.name} : ${this.value}`;
    }
}

// IO操作
class Import extends ASTNode {
    constructor(expr) {
        super('Import');
        this.expr = expr;
    }

    toString() {
        return `@${this.expr}`;
    }
}

class Export extends ASTNode {
    constructor(expr) {
        super('Export');
        this.expr = expr;
    }

    toString() {
        return `#${this.expr}`;
    }
}

// エラーハンドリング用
class ErrorNode extends ASTNode {
    constructor(message) {
        super('Error');
        this.message = message;
    }

    toString() {
        return `Error: ${this.message}`;
    }
}

module.exports = {
    NumberLiteral,
    StringLiteral,
    CharLiteral,
    Identifier,
    UnaryOperation,
    BinaryOperation,
    Lambda,
    Parameter,
    Block,
    Pattern,
    Range,
    Definition,
    Import,
    Export,
    ErrorNode
};
