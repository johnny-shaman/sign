// Sign言語プリプロセッサ - メイン統合処理
// 複数のPEGモジュールを組み合わせて段階的にコード変換を行う

const fs = require('fs');
const path = require('path');
const peg = require('pegjs');

class SignPreprocessor {
  constructor(options = {}) {
    this.options = {
      debugMode: false,
      preserveIntermediateResults: false,
      enablePerformanceMonitoring: false,
      ...options
    };
    
    this.parsers = {};
    this.intermediateResults = [];
    this.performanceData = {};
    
    this.loadParsers();
  }
  
  // PEGパーサーモジュールの読み込み
  loadParsers() {
    const moduleDir = path.join(__dirname, 'modules');
    
    try {
      // フォーマッターの読み込み
      const formatterGrammar = fs.readFileSync(
        path.join(moduleDir, 'formatter.pegjs'), 
        'utf8'
      );
      this.parsers.formatter = peg.generate(formatterGrammar);
      this.log('フォーマッターモジュール読み込み完了');
      
      // 構文解析器の読み込み（オプション）
      try {
        const parserGrammar = fs.readFileSync(
          path.join(moduleDir, 'sign-parser.pegjs'), 
          'utf8'
        );
        this.parsers.signParser = peg.generate(parserGrammar);
        this.log('構文解析モジュール読み込み完了');
      } catch (error) {
        this.log(`構文解析モジュール読み込み失敗: ${error.message}`);
        this.log('構文解析機能は無効になります');
        this.parsers.signParser = null;
      }
      
      // 引数書き換えモジュールの読み込み
      try {
        const argRewriterGrammar = fs.readFileSync(
          path.join(moduleDir, 'arg-rewriter.pegjs'), 
          'utf8'
        );
        this.parsers.argRewriter = peg.generate(argRewriterGrammar);
        this.log('引数書き換えモジュール読み込み完了');
      } catch (error) {
        this.log(`引数書き換えモジュール読み込み失敗: ${error.message}`);
        this.parsers.argRewriter = null;
      }
      
      // matchcase書き換えモジュールの読み込み
      try {
        const matchRewriterGrammar = fs.readFileSync(
          path.join(moduleDir, 'matchcase-rewriter.pegjs'), 
          'utf8'
        );
        this.parsers.matchRewriter = peg.generate(matchRewriterGrammar);
        this.log('matchcase書き換えモジュール読み込み完了');
      } catch (error) {
        this.log(`matchcase書き換えモジュール読み込み失敗: ${error.message}`);
        this.parsers.matchRewriter = null;
      }
      
    } catch (error) {
      throw new Error(`パーサーモジュールの読み込みに失敗: ${error.message}`);
    }
  }
  
  // ログ出力
  log(message) {
    if (this.options.debugMode) {
      console.log(`[SignPreprocessor] ${message}`);
    }
  }
  
  // パフォーマンス測定開始
  startPerformanceMonitoring(stageName) {
    if (this.options.enablePerformanceMonitoring) {
      this.performanceData[stageName] = {
        startTime: Date.now(),
        startMemory: process.memoryUsage().heapUsed
      };
    }
  }
  
  // パフォーマンス測定終了
  endPerformanceMonitoring(stageName) {
    if (this.options.enablePerformanceMonitoring && this.performanceData[stageName]) {
      const data = this.performanceData[stageName];
      data.endTime = Date.now();
      data.endMemory = process.memoryUsage().heapUsed;
      data.duration = data.endTime - data.startTime;
      data.memoryDelta = data.endMemory - data.startMemory;
      
      this.log(`${stageName} - 実行時間: ${data.duration}ms, メモリ使用量変化: ${(data.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }
  }
  
  // フォーマット処理
  format(code) {
    this.log('=== フォーマット処理開始 ===');
    this.startPerformanceMonitoring('format');
    
    try {
      const result = this.parsers.formatter.parse(code);
      
      if (this.options.preserveIntermediateResults) {
        this.intermediateResults.push({
          stage: 'format',
          input: code,
          output: result
        });
      }
      
      this.log('フォーマット処理完了');
      this.endPerformanceMonitoring('format');
      return result;
      
    } catch (error) {
      throw new Error(`フォーマット処理エラー: ${error.message}`);
    }
  }
  
  // 構文解析処理
  parse(code) {
    this.log('=== 構文解析処理開始 ===');
    
    if (!this.parsers.signParser) {
      this.log('構文解析モジュールが利用できません - 処理をスキップ');
      return { message: '構文解析機能は無効です', code: code };
    }
    
    this.startPerformanceMonitoring('parse');
    
    try {
      const result = this.parsers.signParser.parse(code);
      
      if (this.options.preserveIntermediateResults) {
        this.intermediateResults.push({
          stage: 'parse',
          input: code,
          output: result
        });
      }
      
      this.log('構文解析処理完了');
      this.endPerformanceMonitoring('parse');
      return result;
      
    } catch (error) {
      throw new Error(`構文解析エラー: ${error.message}\n位置: ${error.location ? JSON.stringify(error.location) : '不明'}`);
    }
  }
  
  // 引数書き換え処理
  rewriteArguments(code) {
    this.log('=== 引数書き換え処理開始 ===');
    
    if (!this.parsers.argRewriter) {
      this.log('引数書き換えモジュールが利用できません');
      return code;
    }
    
    this.startPerformanceMonitoring('rewriteArguments');
    
    try {
      const result = this.parsers.argRewriter.parse(code);
      
      if (this.options.preserveIntermediateResults) {
        this.intermediateResults.push({
          stage: 'rewriteArguments',
          input: code,
          output: result
        });
      }
      
      this.log('引数書き換え処理完了');
      this.endPerformanceMonitoring('rewriteArguments');
      return result;
      
    } catch (error) {
      throw new Error(`引数書き換えエラー: ${error.message}`);
    }
  }
  
  // matchcase書き換え処理
  rewriteMatchCase(code) {
    this.log('=== matchcase書き換え処理開始 ===');
    
    if (!this.parsers.matchRewriter) {
      this.log('matchcase書き換えモジュールが利用できません');
      return code;
    }
    
    this.startPerformanceMonitoring('rewriteMatchCase');
    
    try {
      const result = this.parsers.matchRewriter.parse(code);
      
      if (this.options.preserveIntermediateResults) {
        this.intermediateResults.push({
          stage: 'rewriteMatchCase',
          input: code,
          output: result
        });
      }
      
      this.log('matchcase書き換え処理完了');
      this.endPerformanceMonitoring('rewriteMatchCase');
      return result;
      
    } catch (error) {
      throw new Error(`matchcase書き換えエラー: ${error.message}`);
    }
  }
  
  // 完全なプリプロセッシング（全段階を実行）
  preprocess(code) {
    this.log('=== 完全プリプロセッシング開始 ===');
    
    try {
      let result = code;
      
      // 段階1: フォーマット
      result = this.format(result);
      
      // 段階2: 引数書き換え（実装済みの場合）
      result = this.rewriteArguments(result);
      
      // 段階3: matchcase書き換え（実装済みの場合）
      result = this.rewriteMatchCase(result);
      
      this.log('完全プリプロセッシング完了');
      return result;
      
    } catch (error) {
      this.log(`プリプロセッシング失敗: ${error.message}`);
      throw error;
    }
  }
  
  // フォーマット→パース（よく使う組み合わせ）
  formatAndParse(code) {
    this.log('=== フォーマット→パース処理開始 ===');
    
    try {
      const formatted = this.format(code);
      
      if (!this.parsers.signParser) {
        this.log('構文解析器が無効のため、フォーマットのみ実行');
        return {
          formatted,
          parsed: { message: '構文解析機能は無効です' }
        };
      }
      
      const parsed = this.parse(formatted);
      
      this.log('フォーマット→パース処理完了');
      return {
        formatted,
        parsed
      };
      
    } catch (error) {
      throw new Error(`フォーマット→パース処理エラー: ${error.message}`);
    }
  }
  
  // 中間結果の取得
  getIntermediateResults() {
    return this.intermediateResults;
  }
  
  // パフォーマンスデータの取得
  getPerformanceData() {
    return this.performanceData;
  }
  
  // 統計情報の取得
  getStatistics() {
    return {
      intermediateResultsCount: this.intermediateResults.length,
      performanceData: this.performanceData,
      loadedParsers: Object.keys(this.parsers).filter(key => this.parsers[key] !== null)
    };
  }
}

// 便利関数のエクスポート
function createPreprocessor(options = {}) {
  return new SignPreprocessor(options);
}

function formatSignCode(code, options = {}) {
  const preprocessor = new SignPreprocessor(options);
  return preprocessor.format(code);
}

function parseSignCode(code, options = {}) {
  const preprocessor = new SignPreprocessor(options);
  return preprocessor.formatAndParse(code);
}

// CLIからの使用をサポート
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node sign-preprocessor.js <入力ファイル> <出力ファイル> [オプション]');
    console.log('');
    console.log('オプション:');
    console.log('  --debug          デバッグモードを有効化');
    console.log('  --performance    パフォーマンス監視を有効化');
    console.log('  --parse-only     構文解析のみ実行（フォーマットスキップ）');
    console.log('  --format-only    フォーマットのみ実行');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1];
  const debugMode = args.includes('--debug');
  const performanceMode = args.includes('--performance');
  const parseOnly = args.includes('--parse-only');
  const formatOnly = args.includes('--format-only');
  
  try {
    const inputCode = fs.readFileSync(inputFile, 'utf8');
    const preprocessor = new SignPreprocessor({
      debugMode,
      enablePerformanceMonitoring: performanceMode,
      preserveIntermediateResults: debugMode
    });
    
    let result;
    if (parseOnly) {
      result = JSON.stringify(preprocessor.parse(inputCode), null, 2);
    } else if (formatOnly) {
      result = preprocessor.format(inputCode);
    } else {
      result = preprocessor.preprocess(inputCode);
    }
    
    if (outputFile) {
      fs.writeFileSync(outputFile, result);
      console.log(`処理完了: ${inputFile} → ${outputFile}`);
    } else {
      console.log(result);
    }
    
    if (performanceMode) {
      console.log('\n=== パフォーマンス統計 ===');
      console.log(JSON.stringify(preprocessor.getPerformanceData(), null, 2));
    }
    
  } catch (error) {
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  SignPreprocessor,
  createPreprocessor,
  formatSignCode,
  parseSignCode
};