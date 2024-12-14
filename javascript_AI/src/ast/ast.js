// src/ast/ast.js
class ASTNode {
    constructor(type) {
        this.type = type;
    }

    toString() {
        return `ASTNode(${this.type})`;
    }

    accept(visitor) {
        const methodName = `visit${this.type}`;
        if (visitor[methodName]) {
            return visitor[methodName](this);
        }
        return visitor.visitNode(this);
    }
}

class ASTVisitor {
    visitNode(node) {
        // デフォルトの訪問メソッド
        return node;
    }
}

module.exports = {
    ASTNode,
    ASTVisitor
};
