# Sign言語プリプロセッサの設計: 構文候補

## 1. 引数名の標準化と位置ベース変換

Sign言語のプリプロセッサは、ユーザーが記述した引数名を位置ベースの標準的な識別子（`_0`, `_1`, `_2`...）に自動変換します。これにより、コンパイラ内部での処理が統一され、最適化が容易になります。

```sign
`原始構文
increment : n ? n + 1
add : x y ? x + y

L : x ? x
R : _ ~x ? x

`変換後
increment : _0 ? _0 + 1
add : _0 _1 ? _0 + _1

L : _0 ? _0
R : _0 ~_1 ? _1
```

この変換により、引数名の衝突回避とコンパイラ内部処理の統一化が実現されます。

## 2. 部分適用と引数順序変換

```
`原始構文
twice : f ? f f
flip : f x y ? f y x
f : x y z ? x * y + z
g : f 2 _ 3

`変換後
twice : _0 ? _0 _0
flip : _0 ? _1 _2 ? _0 _2 _1
f : _0 _1 _2 ? _0 * _1 + _2
g : _0 ? f 2 _0 3
```

## 3. メモリサイズと使用回数に基づくプリプロセス可能な最適化戦略（最小実装では後回し！）

Sign言語のプリプロセッサは、定義されたリテラルのメモリサイズと使用回数に基づいて最適な変換戦略を適用します：

| 分類             | 使用回数 = 1         | 使用回数 > 1          |
|-----------------|---------------------|----------------------|
| 小リテラル (<32B) | 完全インライン展開     | 完全インライン展開      |
| 中・大リテラル (≥32B) | 完全インライン展開   | テーブル参照による共有   |
| 再帰関数 (全サイズ) | テーブル参照          | テーブル参照           |
| エクスポート定義   | テーブル参照          | テーブル参照           |

表の通り、識別子とその場所を示したテーブルは必要です。

インライン展開とは…

```
`原始構文
add : [+]
add 2 3

`変換後
[+] 2 3
```

## 4. 比較演算の多項式の最適変換（初期段階では必要だが、最適化フェーズでは不要？）

Sign言語の比較多項式は、単純な比較の連鎖ではなく、それぞれの比較結果を次の比較の入力として使用する特殊な構造を持ちます：

### 基本変換ルール

```sign
`原始構文
3 < x = y < 20

`変換後
[[[3 < x & x] = y & y] < 20] & y
```

```sign
`原始構文
1 <= x <= 100

`変換後
[[1 <= x & x] <= 100] & x
```

## 5. ブロック構文による条件分岐（match case対応）

Sign言語のブロック構文による条件分岐は、一時変数を使わない短絡評価チェーンに変換されます。

### 5.1 基本変換パターン

```
`原始構文
func : x ?
	condition1 : result1
	condition2 : result2
	condition3 : result3
	default_result

`変換後
func : _0 ?
	condition1 & result1 |
	condition2 & result2 |
	condition3 & result3 |
	default_result
```

### 5.2 Sign言語の短絡評価特性の活用

- 比較演算：true時に変数値、false時にUnit(`_`)を返す
- `condition & result`：条件がtrueなら`result`、falseなら`_`
- `_ | next_condition`：左辺が`_`なら右辺を評価

### 5.3 変換例

#### 数値分類
```
`原始構文
classify : n ?
	n = 0 : `zero`
	n > 0 : `positive`
	n < 0 : `negative`

`変換後
classify : _0 ?
	_0 = 0 & `zero` |
	_0 > 0 & `positive` |
	_0 < 0 & `negative`
```

#### 範囲チェック
```
`原始構文
grade : score ?
	score >= 90 : `A`
	score >= 80 : `B`
	score >= 70 : `C`
	score >= 60 : `D`
	`F`

`変換後
grade : _0 ?
	_0 >= 90 & `A` |
	_0 >= 80 & `B` |
	_0 >= 70 & `C` |
	_0 >= 60 & `D` |
	`F`
```

#### 複数引数での条件分岐
```
`原始構文
compare : x y ?
	x > y : `greater`
	x = y : `equal`
	x < y : `less`

`変換後
compare : _0 _1 ?
	_0 > _1 & `greater` |
	_0 = _1 & `equal` |
	_0 < _1 & `less`
```

#### 複雑な条件
```
`原始構文
access_check : user role ?
	user = `admin` : `full_access`
	role = `moderator` & user != `guest` : `moderate_access`
	user != _ : `basic_access`
	`no_access`

`変換後
access_check : _0 _1 ?
	_0 = `admin` & `full_access` |
	_1 = `moderator` & _0 != `guest` & `moderate_access` |
	_0 != _ & `basic_access` |
	`no_access`
```
## 6. 一般ブロック構文のリスト化変換（ブロック末尾の`,`自動挿入）

ブロック構文で純粋なリスト構築を行う場合、各行末に`,`積演算子の自動挿入を行います。

### 6.1 基本変換ルール

条件式（`:`演算子）を含まない純粋なリスト構築ブロックでは、各行末に`,`を自動挿入します。

```sign
`原始構文
buildData :
	readFile `data1.txt`
	processRaw input
	validateData processed
	saveResult final

`変換後
buildData :
	(readFile `data1.txt`),
	(processRaw input),
	(validateData processed),
	(saveResult final)
```

### 6.2 最終行の処理

リストの最後の要素には`,`を挿入しません。

```sign
`原始構文
simpleList :
	1 + 2
	3 * 4
	5 - 1

`変換後
simpleList :
	[1 + 2],
	[3 * 4],
	[5 - 1]
```

### 6.3 括弧の自動挿入

複雑な式は評価順序を保証するため括弧で自動的に囲みます。

```sign
`原始構文
calculations :
	x + y * z
	func a b c
	simpleValue

`変換後
calculations :
	[x + y * z],
	[func a b c],
	simpleValue
```

## 7. 問題のあるパターンと許可されるパターンの明確化

### 7.1 許可されるパターン

#### パターンA: 純粋な条件分岐
```sign
`✅ 正常：条件分岐のみのブロック
classify : x ?
	x < 0 : `negative`
	x = 0 : `zero`
	x > 0 : `positive`
```

#### パターンB: 純粋なリスト構築
```sign
`✅ 正常：一般処理のみのブロック
processSteps :
	step1 data
	step2 result
	step3 final
```

#### パターンC: 単一式の評価
```sign
`✅ 正常：単一の複雑な式
complexCalc : x ?
	calculateSomethingComplex x y z w
```

### 7.2 問題のあるパターン（アンチパターン）

#### 問題のある混在パターン
```sign
`❌ 問題：条件式と一般処理が同一階層で混在
processData : x ?
	preProcess x
	x < 0 : `negative`
	transform x
	x > 100 : `large`
	finalize x
```
#### 正しい混在パターン
```sign
`✅ 正常：条件式と一般処理の混在
`原始構文
processData : x ?
	preProcess x
	x < 0 : `negative`
		transform x
	x > 100 : `large`
		finalize x

`変換後
processData : x ?
	preProcess x,
	[x < 0 : `negative`
		transform x],
	[x > 100 : `large`
		finalize x]
```
条件にぶら下がってる返値部分のブロックをもう１階層下げる事で、正しい記述とします。


### 7.3 判定基準

- **許可**: ブロック内が条件式のみ、または一般処理のみ
- **問題**: ブロック内で条件式（`:`演算子）と一般処理が同一階層で混在
- **変換**: 一般処理のみの場合は自動的に`,`挿入によるリスト化

この仕様により、Sign言語の「見えない強さ」と設計純粋性が保たれます。
