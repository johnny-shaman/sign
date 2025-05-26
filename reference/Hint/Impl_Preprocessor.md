# Sign言語プリプロセッサの設計: 構文候補（最終版）

## 1. 引数名の標準化と位置ベース変換

　※通常は、mapやfoldについてはユーザーが記述しない方が良い
　※ポイントフリー記法は、最も最適化された記述とするため、置換の必要はない。

```
`原始構文
increment : n ? n + 1
add : x y ? x + y

L : x ? x
R : _ ~x ? x

map : f x ~y ? @f x, map f y~

foldr : f i l ~r ?
	!l : i
	@f l foldr f i r~

`変換後
increment : _0 ? _0 + 1
add : _0 _1 ? _0 + _1

L : _0 ? _0
R : _0 ~_1 ? _1

map : _0 _1 ~_2 ? @_0 _1, map _0 _2~

foldr : _0 _1 _2 ~_3 ?
	!_2 : _1
	@_0 _2 foldr _0 _1 _3~
```

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
`原式
3 < x = y < 20

`変換後
[[[3 < x & x] = y & y] < 20] & y
```

```sign
`原式
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
