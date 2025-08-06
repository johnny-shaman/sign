// js_transpiler/utils/codeGenHelpers.js
/**
 * Sign言語からJavaScriptへの変換用ヘルパー関数群
 * 
 * 機能:
 * - 識別子の変換・検証
 * - 文字列のエスケープ処理
 * - コード生成の共通ユーティリティ
 * - AST操作の補助関数
 * 
 * 使用方法:
 * const { sanitizeIdentifier, stringifyValue } = require('../utils/codeGenHelpers');
 * const jsIdentifier = sanitizeIdentifier(signIdentifier);
 * 
 * CreateBy Claude3.7Sonnet
 * ver_20250312_0
*/

const { logger } = require('../../utils/logger');

// JavaScript予約語のリスト
const JS_RESERVED_WORDS = new Set([
  // キーワード
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
  'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  // 将来予約語
  'enum', 'implements', 'interface', 'package', 'private', 'protected', 'public',
  // 値として使用される識別子
  'true', 'false', 'null', 'undefined'
]);

/**
 * 識別子をJavaScriptの有効な識別子に変換
 * @param {string} identifier - Sign言語の識別子
 * @param {Object} options - オプション
 * @returns {string} JavaScript用に変換された識別子
 */
function sanitizeIdentifier(identifier, options = {}) {
  if (!identifier) return '_empty';
  
  // 文字列をトリムして処理
  let cleaned = String(identifier).trim();
  
  // 特殊ケース: 単位元 (_) は特別な名前に変換
  if (cleaned === '_') return 'UNIT';
  
  // 特殊文字を置換
  cleaned = cleaned.replace(/[^\w$]/g, match => {
    if (match === '_') return '_';
    // スペースとその他の特殊文字はアンダースコアに変換
    return '_';
  });
  
  // 数字で始まる場合、先頭に 'n' を追加
  if (/^\d/.test(cleaned)) {
    cleaned = 'n' + cleaned;
  }
  
  // 予約語かどうかチェック
  if (JS_RESERVED_WORDS.has(cleaned)) {
    cleaned = '_' + cleaned;
    logger.debug(`識別子 '${identifier}' は予約語なので '${cleaned}' に変換されました`);
  }
  
  // Signの特殊プレフィックスの処理
  if (cleaned.startsWith('f_') || cleaned.startsWith('p_')) {
    cleaned = '_' + cleaned;
  }
  
  return cleaned;
}

/**
 * 値をJavaScript表現に変換
 * @param {*} value - 変換する値
 * @param {Object} options - オプション
 * @returns {string} JavaScript形式の文字列表現
 */
function stringifyValue(value, options = {}) {
  // nullまたはundefinedの場合
  if (value === null || value === undefined) {
    return 'null';
  }
  
  // 数値の場合
  if (typeof value === 'number') {
    // NaNやInfinityなどの特殊ケース
    if (!Number.isFinite(value)) {
      if (Number.isNaN(value)) return 'NaN';
      return value > 0 ? 'Infinity' : '-Infinity';
    }
    return String(value);
  }
  
  // 文字列の場合
  if (typeof value === 'string') {
    // 特殊文字のエスケープ
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\b/g, '\\b')
      .replace(/\f/g, '\\f');
    
    return `'${escaped}'`;
  }
  
  // 真偽値の場合
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  // 配列の場合
  if (Array.isArray(value)) {
    const elements = value.map(item => stringifyValue(item, options));
    return `[${elements.join(', ')}]`;
  }
  
  // オブジェクトの場合
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([key, val]) => {
      const keyStr = /^[a-zA-Z_$][\w$]*$/.test(key) ? key : `'${key}'`;
      return `${keyStr}: ${stringifyValue(val, options)}`;
    });
    return `{${entries.join(', ')}}`;
  }
  
  // その他のケース
  return String(value);
}

/**
 * JavaScript文字列リテラルを生成
 * @param {string} str - 元の文字列
 * @param {boolean} useTemplateLiteral - テンプレートリテラルを使用するか
 * @returns {string} JavaScript文字列リテラル
 */
function createStringLiteral(str, useTemplateLiteral = false) {
  if (useTemplateLiteral) {
    return `\`${str.replace(/`/g, '\\`')}\``;
  } else {
    return `'${str.replace(/'/g, "\\'")}'`;
  }
}

/**
 * インデントを適用したコード行を生成
 * @param {string} code - コード行
 * @param {number} level - インデントレベル
 * @param {string} indentStr - インデント文字列（デフォルトは2つのスペース）
 * @returns {string} インデント適用済みのコード行
 */
function indentCode(code, level = 1, indentStr = '  ') {
  if (!code) return '';
  const indent = indentStr.repeat(level);
  return code.split('\n').map(line => line.length > 0 ? indent + line : line).join('\n');
}

/**
 * ノードの位置情報を取得
 * @param {Object} node - ASTノード
 * @returns {string} 位置情報の文字列表現
 */
function getNodeLocation(node) {
  if (!node || !node.location) return 'unknown';
  const { line, column } = node.location;
  return `${line}:${column}`;
}

/**
 * 関数呼び出しのコードを生成
 * @param {string} fnName - 関数名
 * @param {Array<string>} args - 引数リスト
 * @returns {string} 関数呼び出しコード
 */
function generateFunctionCall(fnName, args) {
  const argsStr = args.join(', ');
  return `${fnName}(${argsStr})`;
}

/**
 * プロパティアクセスコードを生成
 * @param {string} obj - オブジェクト式
 * @param {string} prop - プロパティ名/式
 * @param {string} notation - 表記法 ('dot', 'bracket', 'auto')
 * @returns {string} プロパティアクセスコード
 */
function generatePropertyAccess(obj, prop, notation = 'auto') {
  const validIdentifier = /^[a-zA-Z_$][\w$]*$/.test(prop);
  
  if (notation === 'dot' && validIdentifier) {
    return `${obj}.${prop}`;
  } else if (notation === 'bracket' || !validIdentifier) {
    // 数値の場合はそのまま、それ以外は文字列としてクォートする
    const propKey = /^\d+$/.test(prop) ? prop : `'${prop}'`;
    return `${obj}[${propKey}]`;
  } else {
    // auto: 有効な識別子ならドット記法、それ以外はブラケット記法
    return validIdentifier ? `${obj}.${prop}` : `${obj}['${prop}']`;
  }
}

/**
 * 複数のステートメントを結合してブロックを生成
 * @param {Array<string>} statements - ステートメント配列
 * @param {Object} options - オプション
 * @returns {string} ブロックコード
 */
function generateBlock(statements, options = {}) {
  const {
    indent = '  ',
    lineEnd = '\n',
    braceStyle = 'same-line'
  } = options;
  
  if (statements.length === 0) {
    return '{}';
  }
  
  const openBrace = braceStyle === 'same-line' ? ' {' : '{';
  const blockContents = statements
    .filter(stmt => stmt.trim().length > 0)
    .map(stmt => indent + stmt + (stmt.endsWith(';') ? '' : ';'))
    .join(lineEnd);
  
  return `${openBrace}${lineEnd}${blockContents}${lineEnd}}`;
}

// モジュールのエクスポート
module.exports = {
  sanitizeIdentifier,
  stringifyValue,
  createStringLiteral,
  indentCode,
  getNodeLocation,
  generateFunctionCall,
  generatePropertyAccess,
  generateBlock,
  JS_RESERVED_WORDS
};