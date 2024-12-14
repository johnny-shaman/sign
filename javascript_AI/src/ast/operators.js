// src/ast/operators.js

// 単項演算子の定義
const UnaryOperator = {
    // 前置演算子
    NOT: 'NOT',           // !x (論理否定)
    EXPORT: 'EXPORT',     // #x (エクスポート)
    IMPORT: 'IMPORT',     // @x (インポート)
    REST_PARAM: 'REST',   // ~xs (残余パラメータ)
    NEGATIVE: 'NEGATIVE', // -x (数値の符号反転)
    
    // 後置演算子
    FACTORIAL: 'FACTORIAL', // x! (階乗)
    SPREAD: 'SPREAD',      // x~ (スプレッド)

    // 演算子の種類を判定するメソッド
    isPrefixOperator(op) {
        return [
            this.NOT,
            this.EXPORT,
            this.IMPORT,
            this.REST_PARAM,
            this.NEGATIVE
        ].includes(op);
    },

    isPostfixOperator(op) {
        return [
            this.FACTORIAL,
            this.SPREAD
        ].includes(op);
    },

    // 演算子の優先順位
    precedence(op) {
        const precedenceMap = {
            [this.EXPORT]: 1,
            [this.IMPORT]: 1,
            [this.REST_PARAM]: 1,
            [this.NOT]: 9,
            [this.NEGATIVE]: 9,
            [this.FACTORIAL]: 11,
            [this.SPREAD]: 11,
        };
        return precedenceMap[op] || 0;
    }
};

// 二項演算子の定義
const BinaryOperator = {
    // 定義と構造
    DEFINE: 'DEFINE',   // :
    LAMBDA: 'LAMBDA',   // ?
    PRODUCT: 'PRODUCT', // ,

    // 論理演算
    OR: 'OR',     // |
    XOR: 'XOR',   // ;
    AND: 'AND',   // &

    // 比較演算
    LESS: 'LESS',           // 
    LESS_EQ: 'LESS_EQ',     // <=
    EQUAL: 'EQUAL',         // = or ==
    NOT_EQUAL: 'NOT_EQUAL', // != or >< or <>
    GREATER_EQ: 'GREATER_EQ', // >=
    GREATER: 'GREATER',       // >

    // 算術演算
    ADD: 'ADD',     // +
    SUB: 'SUB',     // -
    MUL: 'MUL',     // *
    DIV: 'DIV',     // /
    MOD: 'MOD',     // %
    POWER: 'POWER', // ^

    // 特殊演算
    GET: 'GET',     // '
    RANGE: 'RANGE', // ~

    // 演算子の優先順位
    precedence(op) {
        const precedenceMap = {
            [this.DEFINE]: 1,
            [this.LAMBDA]: 2,
            [this.PRODUCT]: 3,
            [this.OR]: 4,
            [this.XOR]: 5,
            [this.AND]: 6,
            [this.LESS]: 7,
            [this.LESS_EQ]: 7,
            [this.EQUAL]: 7,
            [this.NOT_EQUAL]: 7,
            [this.GREATER_EQ]: 7,
            [this.GREATER]: 7,
            [this.ADD]: 8,
            [this.SUB]: 8,
            [this.MUL]: 9,
            [this.DIV]: 9,
            [this.MOD]: 9,
            [this.POWER]: 10,
            [this.GET]: 11,
            [this.RANGE]: 11,
        };
        return precedenceMap[op] || 0;
    },

    // 演算子の結合性（右結合ならtrue）
    isRightAssociative(op) {
        return [
            this.DEFINE,
            this.LAMBDA,
            this.POWER
        ].includes(op);
    },

    // 演算子が比較演算子かどうか
    isComparison(op) {
        return [
            this.LESS,
            this.LESS_EQ,
            this.EQUAL,
            this.NOT_EQUAL,
            this.GREATER_EQ,
            this.GREATER
        ].includes(op);
    },

    // 演算子の文字列表現
    toString(op) {
        const stringMap = {
            [this.DEFINE]: ':',
            [this.LAMBDA]: '?',
            [this.PRODUCT]: ',',
            [this.OR]: '|',
            [this.XOR]: ';',
            [this.AND]: '&',
            [this.LESS]: '<',
            [this.LESS_EQ]: '<=',
            [this.EQUAL]: '=',
            [this.NOT_EQUAL]: '!=',
            [this.GREATER_EQ]: '>=',
            [this.GREATER]: '>',
            [this.ADD]: '+',
            [this.SUB]: '-',
            [this.MUL]: '*',
            [this.DIV]: '/',
            [this.MOD]: '%',
            [this.POWER]: '^',
            [this.GET]: "'",
            [this.RANGE]: '~',
        };
        return stringMap[op] || op;
    }
};

module.exports = {
    UnaryOperator,
    BinaryOperator
};
