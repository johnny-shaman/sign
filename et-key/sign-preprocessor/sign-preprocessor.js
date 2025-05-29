// Sign言語プリプロセッサ + 構文解析器
// プリプロセッシング → 構文解析 → JSON出力

const fs = require('fs');
const path = require('path');
const peg = require('pegjs');

class SignPreprocessor {
  constructor(options = {}) {
    this.options = {
      debugMode: false,
      ...options
    };

    this.parsers = {};
    this.loadParsers();
  }

  // PEGパーサーモジュールの読み込み
  loadParsers() {
    const moduleDir = path.join(__dirname, 'modules');

    try {
      // フォーマッター
      const formatterGrammar = fs.readFileSync(
        path.join(moduleDir, 'formatter.pegjs'), 'utf8'
      );
      this.parsers.formatter = peg.generate(formatterGrammar);

      // 引数書き換え
      const argRewriterGrammar = fs.readFileSync(
        path.join(moduleDir, 'arg-rewriter.pegjs'), 'utf8'
      );
      this.parsers.argRewriter = peg.generate(argRewriterGrammar);

      // matchcase書き換え
      const matchRewriterGrammar = fs.readFileSync(
        path.join(moduleDir, 'matchcase-rewriter.pegjs'), 'utf8'
      );
      this.parsers.matchRewriter = peg.generate(matchRewriterGrammar);

      // 構文解析器
      const parserGrammar = fs.readFileSync(
        path.join(moduleDir, 'sign-parser.pegjs'), 'utf8'
      );
      this.parsers.signParser = peg.generate(parserGrammar);

      if (this.options.debugMode) {
        console.log('全モジュール読み込み完了');
      }

    } catch (error) {
      throw new Error(`モジュール読み込みエラー: ${error.message}`);
    }
  }

  // プリプロセッシング（既存の3段階処理）
  preprocess(code) {
    try {
      let result = code;

      // 段階1: フォーマット
      result = this.parsers.formatter.parse(result);

      // 段階2: 引数書き換え
      result = this.parsers.argRewriter.parse(result);

      // 段階3: matchcase書き換え
      result = this.parsers.matchRewriter.parse(result);

      return result;

    } catch (error) {
      throw new Error(`プリプロセッシングエラー: ${error.message}`);
    }
  }

  // 構文解析
  parse(code) {
    try {
      return this.parsers.signParser.parse(code);
    } catch (error) {
      throw new Error(`構文解析エラー: ${error.message}`);
    }
  }

  // 完全処理：プリプロセッシング → 構文解析
  processComplete(code) {
    try {
      // プリプロセッシング実行
      const preprocessedCode = this.preprocess(code);

      if (this.options.debugMode) {
        console.log('=== プリプロセッサ出力 ===');
        console.log(preprocessedCode);
        console.log('========================');
      }

      // 構文解析実行
      const ast = this.parse(preprocessedCode);

      return {
        success: true,
        originalCode: code,
        preprocessedCode: preprocessedCode,
        ast: ast,
        error: null
      };

    } catch (error) {
      return {
        success: false,
        originalCode: code,
        preprocessedCode: null,
        ast: null,
        error: {
          message: error.message,
          type: 'ProcessingError'
        }
      };
    }
  }

  // テキスト処理（プリプロセッサのみ）
  processText(code, options = {}) {
    try {
      return this.preprocess(code);
    } catch (error) {
      if (options.debug) {
        console.error(`プリプロセッシング失敗: ${error.message}`);
      }
      throw error;
    }
  }
}

// 便利関数
function processSignFile(inputFile, outputFile = null, preprocessedFile = null, options = {}) {
  try {
    const sourceCode = fs.readFileSync(inputFile, 'utf8');
    const preprocessor = new SignPreprocessor(options);

    // プリプロセッサのみ実行する場合（JSON出力が不要でプリプロセッサ出力のみ）
    if (!outputFile && preprocessedFile) {
      try {
        const preprocessedCode = preprocessor.preprocess(sourceCode);
        fs.writeFileSync(preprocessedFile, preprocessedCode);
        console.log(`📝 プリプロセッサ出力: ${preprocessedFile}`);
        return preprocessedCode;
      } catch (error) {
        console.error(`❌ プリプロセッシング失敗: ${error.message}`);
        return null;
      }
    }

    // 完全処理実行（プリプロセッシング + 構文解析）
    const result = preprocessor.processComplete(sourceCode);

    if (result.success) {
      // プリプロセッサ後のファイル出力
      if (preprocessedFile) {
        fs.writeFileSync(preprocessedFile, result.preprocessedCode);
        console.log(`📝 プリプロセッサ出力: ${preprocessedFile}`);
      }

      // 最終JSON出力
      const output = JSON.stringify(result, null, 2);

      if (outputFile) {
        fs.writeFileSync(outputFile, output);
        console.log(`✅ JSON出力: ${outputFile}`);
      } else {
        console.log(output);
      }

      return result.ast;
    } else {
      console.error(`❌ 処理失敗: ${result.error.message}`);
      return null;
    }

  } catch (error) {
    console.error(`💥 ファイル処理エラー: ${error.message}`);
    return null;
  }
}

function processSignCode(code, options = {}) {
  const preprocessor = new SignPreprocessor(options);
  return preprocessor.processComplete(code);
}

// CLIサポート
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node sign-preprocessor.js <入力ファイル> [JSONファイル] [プリプロセッサファイル] [--debug]');
    console.log('');
    console.log('例:');
    console.log('  node sign-preprocessor.js sample.sn');
    console.log('  node sign-preprocessor.js sample.sn result.json');
    console.log('  node sign-preprocessor.js sample.sn result.json preprocessed.sn');
    console.log('  node sign-preprocessor.js sample.sn null preprocessed.sn  # プリプロセッサのみ');
    console.log('  node sign-preprocessor.js sample.sn result.json preprocessed.sn --debug');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] && !args[1].startsWith('--') && args[1] !== 'null' ? args[1] : null;
  const preprocessedFile = args[2] && !args[2].startsWith('--') && args[2] !== 'null' ? args[2] : null;
  const debugMode = args.includes('--debug');

  processSignFile(inputFile, outputFile, preprocessedFile, { debugMode });
}

module.exports = {
  SignPreprocessor,
  processSignFile,
  processSignCode
};