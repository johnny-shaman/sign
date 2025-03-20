// js_transpiler/config.js
/**
 * Sign言語からJavaScriptへのトランスパイラ設定
 * 
 * 機能:
 * - コード生成のグローバル設定
 * - 出力形式やターゲットJavaScriptバージョンの指定
 * - ランタイムライブラリの参照方法の設定
 * 
 * 使用方法:
 * const { config } = require('../js_transpiler/config');
 * const options = {
 *   ...config.defaultOptions,
 *   optimize: true
 * };
 * 
 * CreateBy Claude3.7Sonnet
 * ver_20250320_0
*/

// デフォルト設定
const defaultOptions = {
  // 出力設定
  output: {
    format: 'module',  // 'module' または 'commonjs'
    indent: '  ',      // インデントに使用する文字列
    lineEnd: '\n',     // 行末の文字列
    minify: false,     // ミニファイの有効化
    sourceMap: false,  // ソースマップの生成
  },

  // コード生成設定
  codeGen: {
    target: 'es2020',         // ターゲットとするJavaScriptバージョン
    strictMode: true,         // strict modeの使用
    inlineRuntime: false,     // ランタイム関数をインライン化するか
    safeIdentifiers: true,    // 安全な識別子変換の有効化
    bracketNotation: 'auto',  // プロパティアクセスの表記法 ('dot', 'bracket', 'auto')
    useCurrying: false,       // false: 通常の複数引数関数、true: カリー化関数
  },

  // ランタイム設定
  runtime: {
    importPath: './runtime/signRuntime',  // ランタイムのインポートパス
    variableName: 'signRuntime',          // ランタイムの変数名
    moduleType: 'commonjs',               // ランタイムのモジュールタイプ ('commonjs', 'esm')
  },

  // 最適化設定
  optimize: {
    enabled: false,           // 最適化の有効化
    inlineConstants: true,    // 定数のインライン化
    recursionOptimization: true, // 再帰の最適化
    tailCallOptimization: true,  // 末尾呼び出し最適化
  },

  // デバッグ設定
  debug: {
    logLevel: 'info',         // ログレベル ('error', 'warn', 'info', 'debug')
    traceGeneration: false,   // コード生成の詳細なトレース
    dumpIntermediateAst: false, // 中間ASTのダンプ
  }
};

// 環境設定を反映
function getEnvironmentConfig() {
  const envConfig = {};

  // 環境変数によるオーバーライド
  if (process.env.SIGN_OUTPUT_FORMAT) {
    envConfig.output = envConfig.output || {};
    envConfig.output.format = process.env.SIGN_OUTPUT_FORMAT;
  }

  if (process.env.SIGN_TARGET) {
    envConfig.codeGen = envConfig.codeGen || {};
    envConfig.codeGen.target = process.env.SIGN_TARGET;
  }

  if (process.env.SIGN_OPTIMIZE === 'true') {
    envConfig.optimize = envConfig.optimize || {};
    envConfig.optimize.enabled = true;
  }

  if (process.env.SIGN_DEBUG === 'true') {
    envConfig.debug = envConfig.debug || {};
    envConfig.debug.logLevel = 'debug';
    envConfig.debug.traceGeneration = true;
  }

  return envConfig;
}

// 設定をマージする関数
function mergeConfig(baseConfig, overrides) {
  const result = JSON.parse(JSON.stringify(baseConfig)); // ディープコピー

  if (!overrides) return result;

  // 再帰的にオブジェクトをマージ
  Object.keys(overrides).forEach(key => {
    if (typeof overrides[key] === 'object' && overrides[key] !== null &&
      typeof result[key] === 'object' && result[key] !== null) {
      result[key] = mergeConfig(result[key], overrides[key]);
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  });

  return result;
}

// 最終設定の取得
function getConfig(userOptions = {}) {
  const envConfig = getEnvironmentConfig();
  return mergeConfig(mergeConfig(defaultOptions, envConfig), userOptions);
}

// JSバージョンに基づく機能サポートチェック
function isFeatureSupported(feature, targetVersion) {
  const supportMap = {
    'optionalChaining': { 'es2020': true, 'es2019': false, 'es2018': false },
    'nullishCoalescing': { 'es2020': true, 'es2019': false, 'es2018': false },
    'spreadOperator': { 'es2020': true, 'es2019': true, 'es2018': true },
    'asyncAwait': { 'es2020': true, 'es2019': true, 'es2018': true },
    'classPrivateFields': { 'es2020': true, 'es2019': false, 'es2018': false }
  };

  return supportMap[feature] && supportMap[feature][targetVersion];
}

// 設定検証
function validateConfig(config) {
  const errors = [];

  // 必須フィールドのチェック
  if (!config.output) errors.push('Missing output configuration');
  if (!config.codeGen) errors.push('Missing codeGen configuration');
  if (!config.runtime) errors.push('Missing runtime configuration');

  // サポートされていない値のチェック
  const validOutputFormats = ['module', 'commonjs'];
  if (config.output && !validOutputFormats.includes(config.output.format)) {
    errors.push(`Invalid output format: ${config.output.format}. Must be one of: ${validOutputFormats.join(', ')}`);
  }

  const validTargets = ['es2018', 'es2019', 'es2020', 'es2021', 'es2022'];
  if (config.codeGen && !validTargets.includes(config.codeGen.target)) {
    errors.push(`Invalid target: ${config.codeGen.target}. Must be one of: ${validTargets.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 設定を公開
module.exports = {
  defaultOptions,
  getConfig,
  validateConfig,
  isFeatureSupported
};