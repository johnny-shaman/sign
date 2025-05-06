# Sign言語トランスパイラ

## プロジェクト概要

Sign言語トランスパイラは、Sign言語のソースコードをC言語に変換するツールです。

## 特徴

- Sign言語の基本構文をC言語に変換
- 変数定義と基本的な算術演算のサポート
- シンプルな関数定義と呼び出しの実装
- デバッグ情報の出力によるトランスパイル過程の可視化
- 抽象構文木(AST)を用いた構造的な言語処理

## 必要環境

- C言語コンパイラ (gcc推奨)
- Flex (字句解析生成ツール)
- Bison (構文解析生成ツール)
- Make (ビルド自動化ツール)

## インストール方法

```bash
# リポジトリのクローン
git clone https://github.com/et-key/sign/tree/main/et-key/sign_c.git
cd sign_c

# コンパイル
make
```

## 使用方法

### 基本使用法

```bash
./sign_c examples/your_file.sn
```

これにより`examples/your_file.c`が生成されます。

### Cコードのコンパイル

生成されたCコードはgccでコンパイルして実行できます：

```bash
gcc examples/your_file.c -o your_program
./your_program
```

## サンプルコード

### 基本的な変数定義と演算

```
# examples/simple_math.sn
x : 10
y : 5
z : x + y * 2
```

これは以下のC言語コードに変換されます：

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef char* string;

void print(string s) {
    printf("%s\n", s);
}

int main() {
    double x = 10.000000;
    double y = 5.000000;
    double z = (x + (y * 2.000000));
    return 0;
}
```

## プロジェクト構造

```
sign_c/
├── src/               # ソースコード
│   ├── ast.h          # 抽象構文木定義
│   ├── ast.c          # 抽象構文木操作
│   ├── codegen.h      # コード生成ヘッダ
│   ├── codegen.c      # コード生成実装
│   ├── lexer.l        # Flex字句解析定義
│   ├── parser.y       # Bison構文解析定義
│   └── main.c         # メインプログラム
├── examples/          # サンプルコード
│   ├── simple_test.sn # 基本テスト
│   └── ...            # その他のサンプル
├── Makefile           # ビルド設定
└── README.md          # 本ドキュメント
```

## サポートされている構文

現時点では以下の構文要素がサポートされています：

- 変数定義 (`x : 10`)
- 数値リテラル（整数、浮動小数点）
- 文字列リテラル（文字列結合なし）
- 基本的な算術演算 (`+`, `-`, `*`, `/`, `%`)

## 制限事項

この実装は初期段階のため、以下の機能はまだ完全にサポートされていません：

- 数値リテラル（16進数、8進数、2進数）
- 文字列リテラル（文字列結合あり）
- シンプルな関数呼び出し
- 複雑な関数定義とラムダ式
- リスト操作
- 条件分岐の完全なサポート
- インポートとエクスポート機能
- 高度な演算子

---

これは開発中のプロジェクトであり、今後も機能拡張と改善が継続される予定です。