# Sign言語 モードベースパーサー

## プロジェクト概要

このプロジェクトは、Sign言語のソースコードを解析するための簡易モードベースパーサーです。Sign言語の複雑な文脈依存構文を効率的に処理し、式木（Expression Tree）を生成することを目的としています。

### 主な機能

- 字句解析：入力テキストをトークン配列に変換
- 式木生成：モードベース処理によるトークンから式木への変換
- JSON出力：解析結果の簡易的な出力
- LISP出力：式木からLISPへの出力

## 必要環境

- Node.js v12.0.0以上

## インストール

1. リポジトリをクローンまたはダウンロード
2. 必要な依存関係はNode.js標準ライブラリのみを使用

## 使用方法

```bash
# 結果をJSON、LISPファイルに保存
node index.js <入力ファイル>
```

### 例

```bash
# sample.snファイルをJSON、LISPファイルに保存
node index.js sample.sn
```

## ファイル構成

- `index.js`: メインプログラム（ファイル入出力とエントリポイント）
- `preprocessor.js`: ソースコードからコメントと空行を削除し、空白を正規化するモジュール
- `block-extractor.js`: ソースコードからコードブロックを抽出するモジュール
- `tokenizer.js`: ソースコードをトークン化するモジュール
- `parenthesis-inserter.js`: トークン配列に適切なカッコを挿入するモジュール
- `expression-tree-builder.js`: 式木生成モジュール
- `lisp-translator.js`: LISPコードへの変換モジュール
- `operator-precedence.js`: Sign言語の演算子優先順位と関連情報を定義するモジュール
- `sample_test.sn`: テスト用サンプルコード
- `sample_test.sn.json`: トークン化～式木変換までの結果
- `sample_test.sn.lisp`: LISP変換後のコード

## 制限事項

- 現在は実験的な実装段階
- エラー処理は最小限
- 一部のSign言語仕様は未サポート

## 今後の開発予定

- エラー処理の強化
- AST変換機能の追加
- 多言語変換サポート

## 作者

et-key
CreateBy: Claude3.7Sonnet

## 注意

本プロジェクトは Sign言語のパーサー実装の研究・開発段階のツールです。