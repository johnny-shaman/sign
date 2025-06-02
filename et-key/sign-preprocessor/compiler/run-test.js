// Sign言語コンパイラ テスト実行スクリプト
// 引き継ぎ用ファイル

const SignStackCompiler = require('./sign-stack-compiler.js');
const fs = require('fs');
const path = require('path');

// テストデータの読み込み
let testData;
try {
  const testFilePath = path.join(__dirname, 'test-input.json');
  const testFileContent = fs.readFileSync(testFilePath, 'utf8');
  testData = JSON.parse(testFileContent);
} catch (error) {
  console.error('❌ テストファイルの読み込みに失敗:', error.message);
  console.log('📝 test-input.json ファイルを作成してください');
  process.exit(1);
}

// コンパイラのインスタンス作成
const compiler = new SignStackCompiler();

console.log('🚀 Sign Language Compiler Test');
console.log('='.repeat(50));
console.log(`📊 入力データ: ${testData.statements.length}個の関数定義`);

try {
  // コンパイル実行
  console.log('\n🔧 コンパイル開始...');
  const assembly = compiler.compile(testData);
  
  console.log('\n✅ コンパイル成功！');
  console.log('\n📄 === 生成されたAArch64アセンブリ ===');
  console.log(assembly);
  
  // 統計情報
  const lines = assembly.split('\n');
  const codeLines = lines.filter(line => 
    line.trim().length > 0 && 
    !line.trim().startsWith('//') && 
    !line.trim().startsWith('.')
  );
  const commentLines = lines.filter(line => line.trim().startsWith('//'));
  
  console.log('\n📈 === 統計情報 ===');
  console.log(`総行数: ${lines.length}`);
  console.log(`コード行数: ${codeLines.length}`);
  console.log(`コメント行数: ${commentLines.length}`);
  
  // アセンブリファイルとして保存
  const outputPath = path.join(__dirname, 'output.s');
  fs.writeFileSync(outputPath, assembly);
  console.log(`\n💾 アセンブリファイル保存: ${outputPath}`);
  
} catch (error) {
  console.error('\n❌ コンパイルエラー:', error.message);
  console.error('📋 スタックトレース:');
  console.error(error.stack);
  process.exit(1);
}