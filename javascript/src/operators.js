module.exports = {
    // 基本演算子
    '+': 'add',
    '-': 'sub',
    '*': 'mul',
    '/': 'div',
    '%': 'mod',
    '^': 'pow',

    // 論理演算子
    '&': 'and',
    '|': 'or',
    ';': 'xor',
    '!': 'not',

    // 比較演算子
    '=': 'cmp_eq',
    '!=': 'cmp_ne',
    '<': 'cmp_lt',
    '>': 'cmp_gt',
    '<=': 'cmp_le',
    '>=': 'cmp_ge',

    // 特殊演算子
    ',': 'make_product',     // 直積
    '~': 'spread',           // スプレッド
    ':': 'store',           // 定義
    '?': 'make_lambda',     // ラムダ
    
    // タブ（ブロック）
    '\t': 'push_scope',

    // IO
    '#': 'store_global',
    '@': 'load_global'
};
