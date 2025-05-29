# Sign言語プリプロセッサ

Sign言語コードの段階的変換を行うモジュール化されたプリプロセッサです。

## 特徴

- **モジュール化設計**: 各処理段階が独立したPEGモジュール
- **段階的変換**: メモリ効率を重視したテキスト→テキスト変換
- **デバッグ支援**: 各段階の中間結果を保存・確認可能
- **パフォーマンス監視**: 実行時間とメモリ使用量の追跡

## インストール

```bash
npm install
npm run build
```

## ディレクトリ構造

```
sign-preprocessor/
├── modules/                    # PEGモジュール群
│   ├── formatter.pegjs         # フォーマット整形
│   ├── sign-parser.pegjs       # 構文解析
│   ├── arg-rewriter.pegjs      # 引数書き換え
│   └── matchcase-rewriter.pegjs # matchcase変換
├── test/                       # テストファイル
│   ├── test-formatter.js
│   └── test-integration.js
├── sign-preprocessor.js        # メイン統合処理
└── README.md
```

## 使用方法

### 1. プログラムから使用

```javascript
const { SignPreprocessor } = require('./sign-preprocessor');

// プリプロセッサのインスタンス作成
const preprocessor = new SignPreprocessor({
  debugMode: true,
  enablePerformanceMonitoring: true
});

// Sign言語コード
const signCode = `
add:x y?x+y
multiply|factor:n?[*n,]
`;

// フォーマット処理
const formatted = preprocessor.format(signCode);
console.log('フォーマット後:');
console.log(formatted);
// 出力: add : x y ? x + y
//      multiply | factor : n ? [* n,]

// 構文解析
const ast = preprocessor.parse(formatted);
console.log('AST:');
console.log(JSON.stringify(ast, null, 2));

// 完全なプリプロセッシング
const processed = preprocessor.preprocess(signCode);
console.log('最終結果:');
console.log(processed);
```

### 2. コマンドラインから使用

```bash
# 基本的な使用
node sign-preprocessor.js input.sign output.sign

# フォーマットのみ
node sign-preprocessor.js input.sign output.sign --format-only

# 構文解析のみ（JSON出力）
node sign-preprocessor.js input.sign output.json --parse-only

# デバッグモード + パフォーマンス監視
node sign-preprocessor.js input.sign output.sign --debug --performance
```

### 3. 便利関数を使用

```javascript
const { formatSignCode, parseSignCode } = require('./sign-preprocessor');

// 簡単なフォーマット
const formatted = formatSignCode('add:x y?x+y');

// フォーマット + 構文解析
const { formatted, parsed } = parseSignCode('add:x y?x+y');
```

## 各モジュールの詳細

### フォーマッターモジュール

**役割**: 演算子の前後に適切な空白を自動挿入

```javascript
// 入力
const input = 'add:x y?x+y*z';

// 出力  
const output = 'add : x y ? x + y * z';
```

**特徴**:
- 文字列リテラル内の演算子は保護
- インデントブロックの構造を保持
- コメントの内容を変更しない

### 構文解析モジュール

**役割**: フォーマット済みコードをAST（抽象構文木）に変換

```javascript
// 入力
const input = 'add : x y ? x + y';

// 出力（AST）
const output = {
  "type": "Program",
  "statements": [
    {
      "type": "Definition",
      "identifier": { "type": "Identifier", "name": "add" },
      "value": {
        "type": "LambdaExpression",
        "parameters": [
          { "type": "Parameter", "name": "x", "continuous": false },
          { "type": "Parameter", "name": "y", "continuous": false }
        ],
        "body": {
          "type": "BinaryOperation",
          "operator": "add",
          "left": { "type": "Identifier", "name": "x" },
          "right": { "type": "Identifier", "name": "y" }
        }
      }
    }
  ]
};
```

## テスト

```bash
# 全テスト実行
npm test

# フォーマッターテストのみ
npm run test:formatter

# 構文解析テストのみ  
npm run test:parser

# 統合テスト
npm run test:integration
```

## 今後の拡張予定

### 1. 引数書き換えモジュール

```javascript
// 入力
const input = `
increment : n ? n + 1
add : x y ? x + y
`;

// 出力
const output = `
increment : _0 ? _0 + 1
add : _0 _1 ? _0 + _1
`;
```

### 2. matchcase書き換えモジュール

```javascript
// 入力
const input = `
classify : x ?
    x = 0 : 'zero'
    x > 0 : 'positive'  
    x < 0 : 'negative'
`;

// 出力
const output = `
classify : x ?
    x = 0 & 'zero' |
    x > 0 & 'positive' |
    x < 0 & 'negative'
`;
```

## デバッグ機能

### 中間結果の確認

```javascript
const preprocessor = new SignPreprocessor({
  preserveIntermediateResults: true
});

const result = preprocessor.preprocess(code);

// 各段階の結果を確認
const intermediates = preprocessor.getIntermediateResults();
intermediates.forEach(stage => {
  console.log(`=== ${stage.stage} ===`);
  console.log('入力:', stage.input);
  console.log('出力:', stage.output);
});
```

### パフォーマンス監視

```javascript
const preprocessor = new SignPreprocessor({
  enablePerformanceMonitoring: true
});

const result = preprocessor.preprocess(largeCode);

// パフォーマンスデータを確認
const perfData = preprocessor.getPerformanceData();
console.log('実行時間:', perfData.format.duration, 'ms');
console.log('メモリ使用量:', perfData.format.memoryDelta, 'bytes');
```

## エラーハンドリング

```javascript
try {
  const result = preprocessor.preprocess(code);
} catch (error) {
  if (error.message.includes('フォーマット処理エラー')) {
    console.log('フォーマット段階でエラーが発生しました');
  } else if (error.message.includes('構文解析エラー')) {
    console.log('構文解析段階でエラーが発生しました');
    console.log('エラー位置:', error.location);
  }
}
```
## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 関連リンク

- [Sign言語仕様書](./docs/sign-language-spec.md)
- [PEG.js公式ドキュメント](https://pegjs.org/documentation)
- [プリプロセッサ設計資料](./docs/preprocessor-design.md)