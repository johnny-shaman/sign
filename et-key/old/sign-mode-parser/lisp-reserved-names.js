// lisp-reserved-names.js
/**
 * Common Lispの予約語および標準関数名を管理するモジュール
 * 
 * 機能:
 * - Common Lispで使用できない名前の一覧を提供
 * - 識別子が予約語かどうかをチェック
 * - 安全な識別子への変換機能を提供
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250503_0
 */

/**
 * Common Lispの特殊形式（予約語相当）
 */
const SPECIAL_FORMS = [
    'block', 'catch', 'declare', 'eval-when', 'flet', 'function',
    'go', 'if', 'labels', 'let', 'let*', 'load-time-value',
    'locally', 'macrolet', 'multiple-value-call', 'multiple-value-prog1',
    'progn', 'progv', 'quote', 'return-from', 'setq', 'symbol-macrolet',
    'tagbody', 'the', 'throw', 'unwind-protect'
  ];
  
  /**
   * Common Lispの標準マクロ
   */
  const STANDARD_MACROS = [
    'and', 'assert', 'case', 'ccase', 'check-type', 'cond',
    'ctypecase', 'decf', 'declaim', 'defclass', 'defconstant',
    'defgeneric', 'define-compiler-macro', 'define-condition',
    'define-method-combination', 'define-modify-macro', 'define-setf-expander',
    'define-symbol-macro', 'defmacro', 'defmethod', 'defpackage',
    'defparameter', 'defsetf', 'defstruct', 'deftype', 'defun',
    'defvar', 'destructuring-bind', 'do', 'do*', 'do-all-symbols',
    'do-external-symbols', 'do-symbols', 'dolist', 'dotimes',
    'ecase', 'etypecase', 'handler-bind', 'handler-case',
    'ignore-errors', 'in-package', 'incf', 'lambda', 'loop',
    'multiple-value-bind', 'multiple-value-list', 'multiple-value-setq',
    'nth-value', 'or', 'pop', 'pprint-exit-if-list-exhausted',
    'pprint-logical-block', 'pprint-pop', 'print-unreadable-object',
    'prog', 'prog*', 'prog1', 'prog2', 'psetf', 'psetq', 'push',
    'pushnew', 'remf', 'restart-bind', 'restart-case',
    'return', 'rotatef', 'setf', 'shiftf', 'step', 'time', 'trace',
    'typecase', 'unless', 'untrace', 'when', 'with-accessors',
    'with-compilation-unit', 'with-condition-restarts', 'with-hash-table-iterator',
    'with-input-from-string', 'with-open-file', 'with-open-stream',
    'with-output-to-string', 'with-package-iterator', 'with-simple-restart',
    'with-slots', 'with-standard-io-syntax'
  ];
  
  /**
   * Common Lispの頻出標準関数
   */
  const STANDARD_FUNCTIONS = [
    // 数値関数
    'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh',
    'ceiling', 'cos', 'cosh', 'exp', 'expt', 'floor', 'log',
    'max', 'min', 'mod', 'random', 'round', 'sin', 'sinh',
    'sqrt', 'tan', 'tanh', 'truncate',
    
    // リスト操作関数
    'append', 'apply', 'assoc', 'car', 'cdr', 'cons', 'copy-list',
    'copy-tree', 'delete', 'elt', 'endp', 'every', 'find', 'first',
    'last', 'length', 'list', 'list*', 'listp', 'mapc', 'mapcar',
    'mapcan', 'mapcon', 'mapl', 'maplist', 'member', 'nconc',
    'nreverse', 'nth', 'nthcdr', 'null', 'position', 'reduce',
    'remove', 'reverse', 'search', 'some', 'sort', 'stable-sort',
    'subseq', 'substitute',
    
    // 文字列関数
    'char', 'char-code', 'char=', 'code-char', 'string', 'string=',
    'string<', 'string>', 'string<=', 'string>=', 'string/=',
    'string-capitalize', 'string-downcase', 'string-upcase',
    'stringp', 'schar',
    
    // シンボル操作
    'boundp', 'fboundp', 'gensym', 'get', 'intern', 'make-symbol',
    'remprop', 'set', 'symbol-function', 'symbol-name', 'symbol-package',
    'symbol-plist', 'symbol-value', 'symbolp',
    
    // 制御構造
    'error', 'funcall', 'values', 'warn',
    
    // 型チェック
    'atom', 'characterp', 'complexp', 'consp', 'floatp', 'functionp',
    'integerp', 'keywordp', 'numberp', 'packagep', 'rationalp',
    'realp', 'simple-string-p', 'simple-vector-p', 'stringp',
    'symbolp', 'vectorp',
    
    // I/O関数
    'close', 'format', 'fresh-line', 'open', 'peek-char', 'prin1',
    'princ', 'print', 'read', 'read-char', 'read-line', 'terpri',
    'write', 'write-char', 'write-line', 'write-string',
    
    // 比較関数
    'eq', 'eql', 'equal', 'equalp',
    
    // 論理関数
    'not',
    
    // その他の重要な関数
    'coerce', 'compile', 'eval', 'identity', 'make-array',
    'make-hash-table', 'make-list', 'make-string', 'sleep',
    'type-of'
  ];
  
  /**
   * 定数名
   */
  const CONSTANTS = [
    't', 'nil', 'pi',
    'most-positive-fixnum', 'most-negative-fixnum',
    'most-positive-short-float', 'most-negative-short-float',
    'most-positive-single-float', 'most-negative-single-float',
    'most-positive-double-float', 'most-negative-double-float',
    'most-positive-long-float', 'most-negative-long-float'
  ];
  
  /**
   * 全ての予約名を結合した配列
   */
  const ALL_RESERVED_NAMES = [
    ...SPECIAL_FORMS,
    ...STANDARD_MACROS,
    ...STANDARD_FUNCTIONS,
    ...CONSTANTS
  ];
  
  /**
   * 識別子がCommon Lispの予約語かどうかをチェックする
   * 
   * @param {string} identifier - チェックする識別子
   * @returns {boolean} 予約語の場合はtrue
   */
  function isReservedName(identifier) {
    if (!identifier) return false;
    
    // 小文字に統一して比較（Common Lispは大文字小文字を区別しない）
    const lowerIdentifier = identifier.toLowerCase();
    
    return ALL_RESERVED_NAMES.some(reserved => 
      reserved.toLowerCase() === lowerIdentifier
    );
  }
  
  /**
   * 予約語と競合する場合に安全な識別子に変換する
   * 
   * @param {string} identifier - 変換する識別子
   * @param {string} suffix - 追加する接尾辞（デフォルト: '_sign'）
   * @returns {string} 安全な識別子
   */
  function makeSafeIdentifier(identifier, suffix = '_sign') {
    if (!identifier) return identifier;
    
    if (isReservedName(identifier)) {
      return identifier + suffix;
    }
    
    return identifier;
  }
  
  /**
   * 識別子のカテゴリを取得する
   * 
   * @param {string} identifier - チェックする識別子
   * @returns {string|null} カテゴリ名（'special-form', 'macro', 'function', 'constant'）またはnull
   */
  function getIdentifierCategory(identifier) {
    if (!identifier) return null;
    
    const lowerIdentifier = identifier.toLowerCase();
    
    if (SPECIAL_FORMS.some(form => form.toLowerCase() === lowerIdentifier)) {
      return 'special-form';
    }
    if (STANDARD_MACROS.some(macro => macro.toLowerCase() === lowerIdentifier)) {
      return 'macro';
    }
    if (STANDARD_FUNCTIONS.some(func => func.toLowerCase() === lowerIdentifier)) {
      return 'function';
    }
    if (CONSTANTS.some(constant => constant.toLowerCase() === lowerIdentifier)) {
      return 'constant';
    }
    
    return null;
  }
  
  module.exports = {
    SPECIAL_FORMS,
    STANDARD_MACROS,
    STANDARD_FUNCTIONS,
    CONSTANTS,
    ALL_RESERVED_NAMES,
    isReservedName,
    makeSafeIdentifier,
    getIdentifierCategory
  };