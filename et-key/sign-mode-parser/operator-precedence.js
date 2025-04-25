// operator-precedence.js
/**
 * Sign言語の演算子優先順位と関連情報を定義するモジュール
 * 
 * 機能:
 * - 演算子の優先順位テーブル定義
 * - 演算子の結合性（左結合/右結合）
 * - 演算子タイプ（前置/中置/後置）の識別
 * - 各種演算子リストの提供
 * 
 * このモジュールはSign言語の式を構文解析し、
 * 適切なカッコ付けを行うための基礎情報を提供します。
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250425_0
 */

/**
 * 演算子の優先順位テーブル（数値が大きいほど優先度が高い）
 */
const OPERATOR_PRECEDENCE = {
  // 定義域 - 最も低い優先度
  ':': 10,       // 定義

  // 出力・入力域
  '#': 20,       // 出力
  '@': 20,       // 入力

  // 構築域
  ' ': 30,       // 余積（coproduct）
  '?': 30,       // ラムダ構築
  ',': 30,       // 積（product）
  '~': 35,       // 範囲リスト（中置）

  // 論理域
  '|': 40,       // 論理OR
  ';': 41,       // XOR
  '&': 50,       // 論理AND

  // 比較域 - すべて同じ優先度
  '<': 70,       // 小なり
  '<=': 70,      // 以下
  '=': 70,       // 等しい
  '>=': 70,      // 以上
  '>': 70,       // 大なり
  '!=': 70,      // 等しくない
  '<>': 70,      // 等しくない（別表記）
  '><': 70,      // 等しくない（別表記）

  // 算術域
  '+': 80,       // 加算
  '-': 80,       // 減算
  '*': 90,       // 乗算
  '/': 90,       // 除算
  '%': 90,       // 剰余
  '^': 100,      // 冪乗（右結合）

  // 単項演算子 - 高い優先度
  '!prefix': 105, // 否定（前置）
  '~prefix': 105, // 展開/残余（前置）
  '!postfix': 110, // 階乗（後置）
  '~postfix': 110, // 展開（後置）

  // 解決評価域
  "'": 120        // ゲット（最も高い優先度）
};

/**
 * 右結合性を持つ演算子のリスト
 * 右から左に評価される演算子
 */
const RIGHT_ASSOCIATIVE = [':', '?', ',', '^'];

/**
 * 前置演算子のリスト
 */
const PREFIX_OPERATORS = ['!', '~', '@', '#'];

/**
 * 後置演算子のリスト
 */
const POSTFIX_OPERATORS = ['!', '~'];

/**
 * 中置演算子のリスト
 */
const INFIX_OPERATORS = [
  ':',    // 定義域
  '#',    // 出力・入力域
  ' ', '?', ',', '~',     // 構築域
  '|', ';', '&',          // 論理域
  '<', '<=', '=', '>=', '>', '!=', '<>', '><',    // 比較域
  '+', '-', '*', '/', '%', '^',    // 算術域
  "'"    // 解決評価域
];

/**
 * ブロック開始トークン
 */
const BLOCK_START = ['[', '{', '('];

/**
 * ブロック終了トークン
 */
const BLOCK_END = [']', '}', ')'];

/**
 * 対応するブロック開始/終了トークンのマッピング
 */
const BLOCK_PAIRS = {
  '[': ']',
  '{': '}',
  '(': ')',
  ']': '[',
  '}': '{',
  ')': '('
};

/**
 * 演算子の優先順位を取得する
 * @param {string} operator - 演算子
 * @param {string} type - 演算子タイプ（'prefix', 'infix', 'postfix'）
 * @returns {number} 優先順位（存在しない場合は-1）
 */
function getPrecedence(operator, type = 'infix') {
  if (type === 'prefix' && PREFIX_OPERATORS.includes(operator)) {
    return OPERATOR_PRECEDENCE[`${operator}prefix`] || OPERATOR_PRECEDENCE[operator] || -1;
  } else if (type === 'postfix' && POSTFIX_OPERATORS.includes(operator)) {
    return OPERATOR_PRECEDENCE[`${operator}postfix`] || OPERATOR_PRECEDENCE[operator] || -1;
  } else {
    return OPERATOR_PRECEDENCE[operator] || -1;
  }
}

/**
 * 演算子が右結合性を持つかチェックする
 * @param {string} operator - 演算子
 * @returns {boolean} 右結合性を持つ場合はtrue
 */
function isRightAssociative(operator) {
  return RIGHT_ASSOCIATIVE.includes(operator);
}

/**
 * トークンが演算子かどうかをチェックする
 * @param {string} token - チェックするトークン
 * @returns {boolean} 演算子の場合はtrue
 */
function isOperator(token) {
  return INFIX_OPERATORS.includes(token) ||
    PREFIX_OPERATORS.includes(token) ||
    POSTFIX_OPERATORS.includes(token);
}

/**
 * トークンが前置演算子かどうかをチェックする
 * @param {string} token - チェックするトークン
 * @returns {boolean} 前置演算子の場合はtrue
 */
function isPrefixOperator(token) {
  return PREFIX_OPERATORS.includes(token);
}

/**
 * トークンが後置演算子かどうかをチェックする
 * @param {string} token - チェックするトークン
 * @returns {boolean} 後置演算子の場合はtrue
 */
function isPostfixOperator(token) {
  return POSTFIX_OPERATORS.includes(token);
}

/**
 * トークンが中置演算子かどうかをチェックする
 * @param {string} token - チェックするトークン
 * @returns {boolean} 中置演算子の場合はtrue
 */
function isInfixOperator(token) {
  return INFIX_OPERATORS.includes(token);
}

/**
 * トークンがブロック開始トークンかどうかをチェックする
 * @param {string} token - チェックするトークン
 * @returns {boolean} ブロック開始トークンの場合はtrue
 */
function isBlockStart(token) {
  return BLOCK_START.includes(token);
}

/**
 * トークンがブロック終了トークンかどうかをチェックする
 * @param {string} token - チェックするトークン
 * @returns {boolean} ブロック終了トークンの場合はtrue
 */
function isBlockEnd(token) {
  return BLOCK_END.includes(token);
}

/**
 * 対応するブロック終了トークンを取得する
 * @param {string} startToken - ブロック開始トークン
 * @returns {string} 対応するブロック終了トークン
 */
function getMatchingBlockEnd(startToken) {
  return BLOCK_PAIRS[startToken] || null;
}

/**
 * 対応するブロック開始トークンを取得する
 * @param {string} endToken - ブロック終了トークン
 * @returns {string} 対応するブロック開始トークン
 */
function getMatchingBlockStart(endToken) {
  return BLOCK_PAIRS[endToken] || null;
}

// モジュールのエクスポート
module.exports = {
  OPERATOR_PRECEDENCE,
  RIGHT_ASSOCIATIVE,
  PREFIX_OPERATORS,
  POSTFIX_OPERATORS,
  INFIX_OPERATORS,
  BLOCK_START,
  BLOCK_END,
  BLOCK_PAIRS,
  getPrecedence,
  isRightAssociative,
  isOperator,
  isPrefixOperator,
  isPostfixOperator,
  isInfixOperator,
  isBlockStart,
  isBlockEnd,
  getMatchingBlockEnd,
  getMatchingBlockStart
};