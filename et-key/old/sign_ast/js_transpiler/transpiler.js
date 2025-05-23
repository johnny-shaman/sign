// js_transpiler/transpiler.js
/**
 * Sign言語からJavaScriptへのトランスパイラ統合モジュール
 * 
 * 機能:
 * - パーサーとジェネレーターの連携
 * - Sign言語ファイルの処理
 * - JavaScript出力の生成と保存
 * - エラー処理とレポート
 * 
 * 使用方法:
 * const { transpileFile, transpileCode } = require('./js_transpiler/transpiler');
 * const jsCode = transpileCode(signCode, options);
 * transpileFile('input.sn', 'output.js', options);
 * 
 * CreateBy Claude3.7Sonnet
 * ver_20250312_0
*/

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const { Lexer } = require('../compiler/lexer');
const { Parser } = require('../compiler/parser');
const { Generator } = require('./generator');
const { getConfig, validateConfig } = require('./config');

/**
 * Sign言語コードをJavaScriptに変換
 * @param {string} signCode - Sign言語のソースコード
 * @param {Object} options - トランスパイルオプション
 * @returns {Object} 変換結果とメタデータ
 */
function transpileCode(signCode, options = {}) {
  try {
    // オプションの準備と検証
    const config = getConfig(options);
    const validation = validateConfig(config);
    
    if (!validation.valid) {
      logger.error('設定検証エラー:', validation.errors.join(', '));
      throw new Error('無効なトランスパイラ設定');
    }
    
    // 処理開始
    logger.info('Sign言語のJavaScriptへのトランスパイル開始');
    const startTime = Date.now();
    
    // 字句解析
    logger.debug('字句解析開始');
    const lexer = new Lexer(signCode);
    const tokens = lexer.tokenize();
    logger.debug(`字句解析完了: ${tokens.length}トークン`);
    
    // 構文解析
    logger.debug('構文解析開始');
    const parser = new Parser(tokens);
    const ast = parser.parse();
    logger.debug('構文解析完了');
    
    // エラーチェック
    if (ast.errors && ast.errors.length > 0) {
      logger.warn(`構文解析中に${ast.errors.length}件のエラーが発生しました`);
      ast.errors.forEach(error => logger.warn(`- ${error}`));
    }
    
    if (config.debug.dumpIntermediateAst) {
      logger.debug('中間AST:', JSON.stringify(ast, null, 2));
    }
    
    // コード生成
    logger.debug('JavaScript生成開始');
    const generator = new Generator(config);
    const jsCode = generator.generate(ast);
    logger.debug('JavaScript生成完了');
    
    // 処理終了
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(`トランスパイル完了 (${duration}ms)`);
    
    return {
      code: jsCode,
      ast: ast,
      errors: ast.errors || [],
      warnings: ast.warnings || [],
      stats: {
        duration,
        tokenCount: tokens.length,
        astNodeCount: countAstNodes(ast)
      }
    };
  } catch (error) {
    logger.error('トランスパイルエラー:', error.message);
    throw error;
  }
}

/**
 * Sign言語ファイルをJavaScriptファイルに変換
 * @param {string} inputFile - 入力Sign言語ファイルパス
 * @param {string} outputFile - 出力JavaScriptファイルパス
 * @param {Object} options - トランスパイルオプション
 * @returns {Object} 変換結果とメタデータ
 */
function transpileFile(inputFile, outputFile, options = {}) {
  try {
    // ファイル存在チェック
    if (!fs.existsSync(inputFile)) {
      throw new Error(`入力ファイルが見つかりません: ${inputFile}`);
    }
    
    // ファイル読み込み
    const signCode = fs.readFileSync(inputFile, 'utf8');
    logger.info(`ファイル読み込み: ${inputFile} (${signCode.length} バイト)`);
    
    // トランスパイル実行
    const result = transpileCode(signCode, options);
    
    // 出力ディレクトリの確認・作成
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      logger.debug(`出力ディレクトリを作成: ${outputDir}`);
    }
    
    // ファイル出力
    fs.writeFileSync(outputFile, result.code, 'utf8');
    logger.info(`JavaScript出力: ${outputFile} (${result.code.length} バイト)`);
    
    return {
      ...result,
      inputFile,
      outputFile
    };
  } catch (error) {
    logger.error(`ファイルトランスパイルエラー: ${error.message}`);
    throw error;
  }
}

/**
 * ASTノード数をカウント
 * @param {Object} ast - ASTオブジェクト
 * @returns {number} ノード数
 */
function countAstNodes(ast) {
  let count = 0;
  
  function traverse(node) {
    if (!node || typeof node !== 'object') return;
    
    count++;
    
    // オブジェクトプロパティの再帰的探索
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          // 配列の各要素を処理
          node[key].forEach(item => traverse(item));
        } else {
          // 単一オブジェクトの処理
          traverse(node[key]);
        }
      }
    }
  }
  
  traverse(ast);
  return count;
}

// コマンドライン引数の処理
function processCommandLineArgs() {
  const args = process.argv.slice(2);
  
  // ヘルプの表示
  if (args.includes('-h') || args.includes('--help')) {
    console.log('Sign言語からJavaScriptへのトランスパイラ');
    console.log('使用方法:');
    console.log('  node transpiler.js <入力ファイル> [<出力ファイル>] [オプション]');
    console.log('オプション:');
    console.log('  -h, --help     : このヘルプを表示');
    console.log('  -o, --out FILE : 出力ファイルを指定');
    console.log('  -m, --module   : ES Module形式で出力');
    console.log('  -c, --commonjs : CommonJS形式で出力');
    console.log('  -d, --debug    : デバッグモード有効化');
    console.log('  --optimize     : 最適化有効化');
    console.log('  --no-runtime   : ランタイムのインライン化');
    process.exit(0);
  }
  
  // 入力/出力ファイルとオプションの処理
  let inputFile = null;
  let outputFile = null;
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('-')) {
      // オプション処理
      switch (arg) {
        case '-o':
        case '--out':
          outputFile = args[++i];
          break;
        case '-m':
        case '--module':
          options.output = options.output || {};
          options.output.format = 'module';
          break;
        case '-c':
        case '--commonjs':
          options.output = options.output || {};
          options.output.format = 'commonjs';
          break;
        case '-d':
        case '--debug':
          options.debug = options.debug || {};
          options.debug.logLevel = 'debug';
          options.debug.traceGeneration = true;
          break;
        case '--optimize':
          options.optimize = options.optimize || {};
          options.optimize.enabled = true;
          break;
        case '--no-runtime':
          options.codeGen = options.codeGen || {};
          options.codeGen.inlineRuntime = true;
          break;
      }
    } else if (!inputFile) {
      // 入力ファイル
      inputFile = arg;
    } else if (!outputFile) {
      // 出力ファイル
      outputFile = arg;
    }
  }
  
  // 入力ファイルが必須
  if (!inputFile) {
    console.error('エラー: 入力ファイルが指定されていません');
    process.exit(1);
  }
  
  // 出力ファイルのデフォルト値
  if (!outputFile) {
    const inputBaseName = path.basename(inputFile, path.extname(inputFile));
    outputFile = `${inputBaseName}.js`;
  }
  
  // トランスパイル実行
  try {
    transpileFile(inputFile, outputFile, options);
    console.log(`トランスパイル成功: ${inputFile} -> ${outputFile}`);
    process.exit(0);
  } catch (error) {
    console.error('トランスパイルエラー:', error.message);
    process.exit(1);
  }
}

// コマンドライン実行時
if (require.main === module) {
  processCommandLineArgs();
}

// モジュールのエクスポート
module.exports = {
  transpileCode,
  transpileFile
};