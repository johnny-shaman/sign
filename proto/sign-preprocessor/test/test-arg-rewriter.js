// Sign言語 引数書き換えモジュールのテスト
const fs = require('fs');
const path = require('path');
const peg = require('pegjs');

console.log('=== Sign言語 引数書き換えモジュール テスト ===\n');

// 引数書き換えパーサーを生成
let argRewriter;
try {
  const argRewriterGrammar = fs.readFileSync(
    path.join(__dirname, '../modules/arg-rewriter.pegjs'), 
    'utf8'
  );
  argRewriter = peg.generate(argRewriterGrammar);
  console.log('✅ 引数書き換えパーサー生成成功\n');
} catch (error) {
  console.log('❌ 引数書き換えパーサー生成失敗:', error.message);
  process.exit(1);
}

// テストケース
const testCases = [
  {
    name: '基本的な関数定義',
    input: 'increment : n ? n + 1',
    expected: 'increment : _0 ? _0 + 1'
  },
  {
    name: '複数引数の関数',
    input: 'add : x y ? x + y',
    expected: 'add : _0 _1 ? _0 + _1'
  },
  {
    name: '3つの引数',
    input: 'calc : a b c ? a * b + c',
    expected: 'calc : _0 _1 _2 ? _0 * _1 + _2'
  },
  {
    name: '連続引数を含む関数',
    input: 'map : f x ~y ? @f x, map f y~',
    expected: 'map : _0 _1 ~_2 ? @_0 _1, map _0 _2~'
  },
  {
    name: 'エクスポートされた関数',
    input: '#multiply : x y ? x * y',
    expected: '#multiply : _0 _1 ? _0 * _1'
  },
  {
    name: '複雑な式の関数',
    input: 'complex : x y z ? (x + y) * z - x / y',
    expected: 'complex : _0 _1 _2 ? (_0 + _1) * _2 - _0 / _1'
  },
  {
    name: '引数名の重複使用',
    input: 'duplicate : x ? x * x + x',
    expected: 'duplicate : _0 ? _0 * _0 + _0'
  },
  {
    name: '関数定義以外は変更なし',
    input: 'result : 42\n`これはコメント`',
    expected: 'result : 42\n`これはコメント`'
  }
];

let passedTests = 0;
let totalTests = testCases.length;

// テスト実行
testCases.forEach((testCase, index) => {
  console.log(`テスト ${index + 1}: ${testCase.name}`);
  console.log(`入力: ${JSON.stringify(testCase.input)}`);
  
  try {
    const result = argRewriter.parse(testCase.input);
    console.log(`出力: ${JSON.stringify(result)}`);
    console.log(`期待: ${JSON.stringify(testCase.expected)}`);
    
    if (result.trim() === testCase.expected.trim()) {
      console.log('✅ 成功\n');
      passedTests++;
    } else {
      console.log('❌ 失敗 - 出力が期待値と異なります\n');
    }
  } catch (error) {
    console.log(`❌ 失敗 - パースエラー: ${error.message}\n`);
  }
});

// 複合テスト（複数の関数定義）
console.log('=== 複合テスト ===');
const complexInput = `increment : n ? n + 1
add : x y ? x + y
#multiply : a b ? a * b
map : f x ~y ? @f x, map f y~`;

const expectedComplex = `increment : _0 ? _0 + 1
add : _0 _1 ? _0 + _1
#multiply : _0 _1 ? _0 * _1
map : _0 _1 ~_2 ? @_0 _1, map _0 _2~`;

try {
  const complexResult = argRewriter.parse(complexInput);
  console.log('複合入力:');
  console.log(complexInput);
  console.log('\n複合出力:');
  console.log(complexResult);
  console.log('\n複合期待:');
  console.log(expectedComplex);
  
  if (complexResult.trim() === expectedComplex.trim()) {
    console.log('\n✅ 複合テスト成功');
    passedTests++;
    totalTests++;
  } else {
    console.log('\n❌ 複合テスト失敗');
    totalTests++;
  }
} catch (error) {
  console.log(`\n❌ 複合テスト失敗 - パースエラー: ${error.message}`);
  totalTests++;
}

// 結果報告
console.log('\n=== テスト結果 ===');
console.log(`成功: ${passedTests}/${totalTests}`);
console.log(`成功率: ${(passedTests / totalTests * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 すべてのテストが成功しました！');
  
  // 成功時に実例ファイルを作成
  const exampleInput = `# Sign言語サンプル関数
increment : n ? n + 1
add : x y ? x + y  
multiply : a b ? a * b
power : base exp ? base ^ exp
factorial : n ? n <= 1 : 1 | n * factorial (n - 1)
map : f list ~rest ? @f list, map f rest~`;

  try {
    const exampleOutput = argRewriter.parse(exampleInput);
    
    if (!fs.existsSync('./test-output')) {
      fs.mkdirSync('./test-output');
    }
    
    fs.writeFileSync('./test-output/original.sign', exampleInput);
    fs.writeFileSync('./test-output/rewritten.sign', exampleOutput);
    
    console.log('\n📄 実例ファイルを作成しました:');
    console.log('  - test-output/original.sign (元のコード)');
    console.log('  - test-output/rewritten.sign (変換後のコード)');
    
  } catch (error) {
    console.log('実例ファイル作成エラー:', error.message);
  }
  
  process.exit(0);
} else {
  console.log('⚠️  一部のテストが失敗しました。');
  process.exit(1);
}

// パフォーマンステスト
console.log('\n=== パフォーマンステスト ===');
const largeInput = 'func : x y ? x + y\n'.repeat(100);
const startTime = Date.now();

try {
  argRewriter.parse(largeInput);
  const endTime = Date.now();
  console.log(`大量関数定義 (${largeInput.split('\n').length} 行) の処理時間: ${endTime - startTime}ms`);
} catch (error) {
  console.log(`大量処理テスト失敗: ${error.message}`);
}