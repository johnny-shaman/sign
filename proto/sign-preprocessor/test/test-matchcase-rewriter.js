// Sign言語 matchcase書き換えモジュールのテスト
const fs = require('fs');
const path = require('path');
const peg = require('pegjs');

console.log('=== Sign言語 matchcase書き換えモジュール テスト ===\n');

// matchcase書き換えパーサーを生成
let matchcaseRewriter;
try {
  const matchcaseGrammar = fs.readFileSync(
    path.join(__dirname, '../modules/matchcase-rewriter.pegjs'), 
    'utf8'
  );
  matchcaseRewriter = peg.generate(matchcaseGrammar);
  console.log('✅ matchcase書き換えパーサー生成成功\n');
} catch (error) {
  console.log('❌ matchcase書き換えパーサー生成失敗:', error.message);
  process.exit(1);
}

// テストケース
const testCases = [
  {
    name: '基本的な条件分岐',
    input: `classify : _0 ?
\t_0 = 0 : 'zero'
\t_0 > 0 : 'positive'
\t_0 < 0 : 'negative'`,
    expected: `classify : _0 ?
\t_0 = 0 & 'zero' |
\t_0 > 0 & 'positive' |
\t_0 < 0 & 'negative'`
  },
  {
    name: 'デフォルト値を含む条件分岐',
    input: `check : _0 ?
\t_0 > 100 : 'too big'
\t_0 < 0 : 'negative'
\t'normal'`,
    expected: `check : _0 ?
\t_0 > 100 & 'too big' |
\t_0 < 0 & 'negative' |
\t'normal'`
  },
  {
    name: '2つの条件のみ',
    input: `simple : _0 ?
\t_0 = 0 : 'zero'
\t'non-zero'`,
    expected: `simple : _0 ?
\t_0 = 0 & 'zero' |
\t'non-zero'`
  },
  {
    name: 'エクスポートされた関数',
    input: `#grade : _0 ?
\t_0 >= 90 : 'A'
\t_0 >= 80 : 'B'
\t_0 >= 70 : 'C'
\t'F'`,
    expected: `#grade : _0 ?
\t_0 >= 90 & 'A' |
\t_0 >= 80 & 'B' |
\t_0 >= 70 & 'C' |
\t'F'`
  },
  {
    name: '複数引数の関数',
    input: `compare : _0 _1 ?
\t_0 > _1 : 'greater'
\t_0 = _1 : 'equal'
\t_0 < _1 : 'less'`,
    expected: `compare : _0 _1 ?
\t_0 > _1 & 'greater' |
\t_0 = _1 & 'equal' |
\t_0 < _1 & 'less'`
  },
  {
    name: '複雑な条件式',
    input: `complex : _0 _1 ?
\t_0 > 0 & _1 > 0 : 'both positive'
\t_0 < 0 & _1 < 0 : 'both negative'
\t'mixed'`,
    expected: `complex : _0 _1 ?
\t_0 > 0 & _1 > 0 & 'both positive' |
\t_0 < 0 & _1 < 0 & 'both negative' |
\t'mixed'`
  },
  {
    name: '単一条件',
    input: `single : _0 ?
\t_0 > 0 : 'positive'`,
    expected: `single : _0 ?
\t_0 > 0 & 'positive'`
  },
  {
    name: '関数定義以外は変更なし',
    input: `result : 42
\` これはコメント`,
    expected: `result : 42
\` これはコメント`
  }
];

let passedTests = 0;
let totalTests = testCases.length;

// テスト実行
testCases.forEach((testCase, index) => {
  console.log(`テスト ${index + 1}: ${testCase.name}`);
  console.log(`入力:`);
  console.log(testCase.input);
  
  try {
    const result = matchcaseRewriter.parse(testCase.input + '\n');
    console.log(`出力:`);
    console.log(result.trimEnd());
    console.log(`期待:`);
    console.log(testCase.expected);
    
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
const complexInput = `classify : _0 ?
\t_0 = 0 : 'zero'
\t_0 > 0 : 'positive'
\t_0 < 0 : 'negative'

grade : _0 ?
\t_0 >= 90 : 'A'
\t_0 >= 80 : 'B'
\t'F'

#compare : _0 _1 ?
\t_0 > _1 : 'greater'
\t'not greater'`;

const expectedComplex = `classify : _0 ?
\t_0 = 0 & 'zero' |
\t_0 > 0 & 'positive' |
\t_0 < 0 & 'negative'

grade : _0 ?
\t_0 >= 90 & 'A' |
\t_0 >= 80 & 'B' |
\t'F'

#compare : _0 _1 ?
\t_0 > _1 & 'greater' |
\t'not greater'`;

try {
  const complexResult = matchcaseRewriter.parse(complexInput + '\n');
  console.log('複合入力:');
  console.log(complexInput);
  console.log('\n複合出力:');
  console.log(complexResult.trimEnd());
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
  const exampleInput = `# matchcase変換サンプル
classify : _0 ?
\t_0 = 0 : 'zero'
\t_0 > 0 : 'positive'
\t_0 < 0 : 'negative'

grade : _0 ?
\t_0 >= 90 : 'A'
\t_0 >= 80 : 'B'
\t_0 >= 70 : 'C'
\t_0 >= 60 : 'D'
\t'F'

#factorial : _0 ?
\t_0 <= 1 : 1
\t_0 * factorial (_0 - 1)`;

  try {
    const exampleOutput = matchcaseRewriter.parse(exampleInput + '\n');
    
    if (!fs.existsSync('./test-output')) {
      fs.mkdirSync('./test-output');
    }
    
    fs.writeFileSync('./test-output/matchcase-original.sign', exampleInput);
    fs.writeFileSync('./test-output/matchcase-converted.sign', exampleOutput);
    
    console.log('\n📄 実例ファイルを作成しました:');
    console.log('  - test-output/matchcase-original.sign (元のコード)');
    console.log('  - test-output/matchcase-converted.sign (変換後のコード)');
    
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
const largeInput = `func : _0 ?
\t_0 > 0 : 'positive'
\t'non-positive'
`.repeat(50);

const startTime = Date.now();

try {
  matchcaseRewriter.parse(largeInput);
  const endTime = Date.now();
  console.log(`大量関数定義 (${largeInput.split('\n').length} 行) の処理時間: ${endTime - startTime}ms`);
} catch (error) {
  console.log(`大量処理テスト失敗: ${error.message}`);
}
