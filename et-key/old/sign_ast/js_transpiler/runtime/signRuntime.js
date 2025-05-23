// js_transpiler/runtime/signRuntime.js
/**
 * Sign言語ランタイムライブラリ
 * 
 * 機能:
 * - Sign言語の特殊演算子の実装
 * - リスト操作のサポート
 * - 関数合成とポイントフリー記法のサポート
 * - 遅延評価とパターンマッチング機能
 * 
 * 使用方法:
 * JavaScriptトランスパイル結果から自動的に参照される
 * 
 * CreateBy Claude3.7Sonnet
 * ver_20250320_0
*/

/**
 * Sign言語ランタイム機能の実装
 */
const signRuntime = {
  /**
   * 演算子実装
   */
  operators: {
    /**
     * 論理XOR演算子
     * @param {*} a - 左オペランド
     * @param {*} b - 右オペランド
     * @returns {boolean} - XOR演算結果
     */
    logicalXor: (a, b) => Boolean(a) !== Boolean(b),

    /**
     * 階乗演算子の実装
     * @param {number} n - 階乗を計算する数値
     * @returns {number} - 階乗計算結果
     */
    factorial: (n) => {
      // 入力値のチェック
      const num = Number(n);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        throw new Error(`階乗の計算には非負整数が必要です: ${n}`);
      }

      // 0と1の階乗は1
      if (num <= 1) return 1;

      // 階乗計算
      let result = 1;
      for (let i = 2; i <= num; i++) {
        result *= i;
      }

      return result;
    },

    /**
     * 前置スプレッド演算子の実装
     * @param {*} value - 展開する値
     * @returns {Array} - 展開結果
     */
    expandPrefix: (value) => {
      if (Array.isArray(value)) {
        return [...value]; // 配列の展開
      } else if (typeof value === 'string') {
        return [...value]; // 文字列の展開
      } else if (value && typeof value === 'object') {
        return Object.values(value); // オブジェクトの値を展開
      }
      // その他の値は単一要素配列に
      return [value];
    },

    /**
     * 後置スプレッド演算子の実装
     * @param {*} value - 展開する値
     * @returns {Array} - 展開結果
     */
    expandPostfix: (value) => {
      if (Array.isArray(value)) {
        return [...value]; // 配列の展開
      } else if (typeof value === 'string') {
        return [...value]; // 文字列の展開
      } else if (value && typeof value === 'object') {
        return Object.entries(value); // オブジェクトのエントリを展開
      }
      // その他の値は単一要素配列に
      return [value];
    }
  },

  /**
   * リスト操作関数
   */
  list: {
    /**
     * 余積（スペースで区切られたリスト）の実装
     * @param {*} a - 左オペランド
     * @param {*} b - 右オペランド
     * @returns {*} - 余積結果
     */
    coproduct: (a, b) => {
      // 文字列同士の結合
      if (typeof a === 'string' && typeof b === 'string') {
        return a + b;
      }

      // 配列の結合
      if (Array.isArray(a) && Array.isArray(b)) {
        return [...a, ...b];
      }

      // 文字列と他の型の結合（文字列化）
      if (typeof a === 'string') {
        return a + String(b);
      }
      if (typeof b === 'string') {
        return String(a) + b;
      }

      // オブジェクトのマージ（両方がオブジェクト型の場合）
      if (a && typeof a === 'object' && !Array.isArray(a) &&
        b && typeof b === 'object' && !Array.isArray(b)) {
        return { ...a, ...b };
      }

      // 片方が配列の場合
      if (Array.isArray(a)) {
        return [...a, b];
      }
      if (Array.isArray(b)) {
        return [a, ...b];
      }

      // 数値同士の場合は特別な処理
      if (typeof a === 'number' && typeof b === 'number') {
        // Sign言語での数値の余積が具体的にどう定義されているかに応じて実装
        // デフォルトでは配列化
        return [a, b];
      }

      // デフォルト: 配列として扱う
      return [a, b];
    },

    /**
     * 範囲リスト生成
     * @param {number|string} start - 開始値
     * @param {number|string} end - 終了値
     * @returns {Array} - 範囲リスト
     */
    range: (start, end) => {
      // 数値範囲
      if (typeof start === 'number' && typeof end === 'number') {
        const result = [];
        if (start <= end) {
          // 昇順範囲
          for (let i = start; i <= end; i++) {
            result.push(i);
          }
        } else {
          // 降順範囲
          for (let i = start; i >= end; i--) {
            result.push(i);
          }
        }
        return result;
      }

      // 文字範囲
      if (typeof start === 'string' && start.length === 1 &&
        typeof end === 'string' && end.length === 1) {
        const startCode = start.charCodeAt(0);
        const endCode = end.charCodeAt(0);
        const result = [];

        if (startCode <= endCode) {
          // 昇順範囲
          for (let i = startCode; i <= endCode; i++) {
            result.push(String.fromCharCode(i));
          }
        } else {
          // 降順範囲
          for (let i = startCode; i >= endCode; i--) {
            result.push(String.fromCharCode(i));
          }
        }
        return result;
      }

      throw new Error(`サポートされていない範囲タイプ: ${typeof start} ~ ${typeof end}`);
    },

    /**
     * リストからの要素取得
     * @param {Array|Object|string} collection - 対象コレクション
     * @param {number|string} key - キーまたはインデックス
     * @returns {*} 取得した要素またはnull
     */
    get: (collection, key) => {
      // null/undefinedチェック
      if (collection == null) return null;

      // 配列・文字列インデックスアクセス
      if ((Array.isArray(collection) || typeof collection === 'string') &&
        typeof key === 'number') {
        return collection[key] !== undefined ? collection[key] : null;
      }

      // オブジェクトのプロパティアクセス
      if (typeof collection === 'object' && !Array.isArray(collection)) {
        return collection[key] !== undefined ? collection[key] : null;
      }

      return null;
    }
  },

  /**
   * 前置演算子関数
   */
  prefixOp: {
    '!': (x) => !x,     // 論理否定
    '-': (x) => -x,     // 数値否定
    '~': (x) => signRuntime.operators.expandPrefix(x)  // 前置スプレッド演算子
    // その他の前置演算子
  },

  /**
   * 中置演算子関数
   */
  infixOp: {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '%': (a, b) => a % b,
    '^': (a, b) => Math.pow(a, b),
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
    '=': (a, b) => a === b,
    '>=': (a, b) => a >= b,
    '>': (a, b) => a > b,
    '!=': (a, b) => a !== b,
    '&': (a, b) => a && b,
    '|': (a, b) => a || b,
    ';': (a, b) => signRuntime.operators.logicalXor(a, b),
    '~': (a, b) => signRuntime.list.range(a, b)
    // その他の中置演算子
  },

  /**
   * 後置演算子関数
   */
  postfixOp: {
    '!': (x) => signRuntime.operators.factorial(x),  // 階乗
    '~': (x) => signRuntime.operators.expandPostfix(x)  // 後置スプレッド演算子
    // その他の後置演算子
  },

  /**
   * 関数操作
   */
  fn: {
    /**
     * 関数合成
     * @param {Function} f - 外側の関数
     * @param {Function} g - 内側の関数
     * @returns {Function} - 合成関数
     */
    compose: (f, g) => (...args) => f(g(...args)),

    /**
     * 関数の部分適用
     * @param {Function} fn - 対象関数
     * @param {...*} presetArgs - 先行引数
     * @returns {Function} - 部分適用された関数
     */
    partial: (fn, ...presetArgs) => (...laterArgs) => fn(...presetArgs, ...laterArgs),

    /**
     * 左引数の部分適用
     * @param {Function} fn - 対象関数
     * @param {*} left - 左引数
     * @returns {Function} - 部分適用された関数
     */
    partialLeft: (fn, left) => (right) => fn(left, right),

    /**
     * 右引数の部分適用
     * @param {Function} fn - 対象関数
     * @param {*} right - 右引数
     * @returns {Function} - 部分適用された関数
     */
    partialRight: (fn, right) => (left) => fn(left, right),

    /**
     * 関数の引数リストを左畳み込み
     * @param {Function} fn - 2引数関数
     * @param {Array} args - 引数リスト
     * @param {*} [initial] - 初期値
     * @returns {*} - 畳み込み結果
     */
    foldl: (fn, args, initial) => {
      if (!Array.isArray(args) || args.length === 0) {
        return initial !== undefined ? initial : null;
      }

      if (initial !== undefined) {
        return args.reduce(fn, initial);
      } else {
        return args.slice(1).reduce(fn, args[0]);
      }
    }
  },

  /**
   * パターンマッチング
   */
  match: {
    /**
     * パターンマッチング実行
     * @param {*} value - マッチングする値
     * @param {Array|Object} patterns - パターン配列またはオブジェクト
     * @returns {*} - マッチング結果
     */
    exec: (value, patterns) => {
      // 配列パターン（条件 -> 結果）
      if (Array.isArray(patterns)) {
        for (const [condition, result] of patterns) {
          if (condition) {
            return typeof result === 'function' ? result() : result;
          }
        }
        // マッチしなければ元の値を返す
        return value;
      }

      // オブジェクトパターン（値 -> 結果）
      if (patterns && typeof patterns === 'object') {
        const key = String(value);
        if (patterns.hasOwnProperty(key)) {
          const result = patterns[key];
          return typeof result === 'function' ? result() : result;
        }

        // '_' をデフォルトとして扱う
        if (patterns.hasOwnProperty('_')) {
          const result = patterns['_'];
          return typeof result === 'function' ? result() : result;
        }

        // マッチしなければ元の値を返す
        return value;
      }

      throw new Error('無効なパターンマッチング式');
    }
  },

  /**
   * 遅延評価サポート
   */
  lazy: {
    /**
     * 式の遅延評価
     * @param {Function} fn - 評価する関数
     * @returns {Function} - サンク関数
     */
    delay: (fn) => {
      let evaluated = false;
      let result;

      return () => {
        if (!evaluated) {
          result = fn();
          evaluated = true;
        }
        return result;
      };
    },

    /**
     * サンク関数の強制評価
     * @param {Function|*} thunk - サンク関数または値
     * @returns {*} - 評価結果
     */
    force: (thunk) => {
      if (typeof thunk === 'function') {
        return thunk();
      }
      return thunk;
    }
  }
};

// Node.js環境とブラウザ環境の両方をサポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = signRuntime;
} else if (typeof window !== 'undefined') {
  window.signRuntime = signRuntime;
} else if (typeof self !== 'undefined') {
  self.signRuntime = signRuntime;
}