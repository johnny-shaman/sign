# Sign言語プリプロセッサの設計: 構文候補（最終版）

## 1. 変数名の標準化と位置ベース変換

　※通常は、mapやfoldについてはユーザーが記述しない方が良い

```
// 原始構文
increment : n ? n + 1
add : x y ? x + y

L : x ? x
R : _ ~x ? x

map : f x ~y ? @f x, map f y~

foldr : f i l ~r ?
	!l : i
	@f l foldr f i r~

// 変換後
increment : _0 ? _0 + 1
add : _0 _1 ? _0 + _1

L : _0 ? _0
R : _0 ~_1 ? _1

map : _0 _1 ~_2 ? @_0 _1, map _0 _2~

foldr : _0 _1 _2 ~_3 ?
	!_2 : _1
	@_0 _2 foldr _1 _3~
```

## 2. 部分適用と引数順序変換

```
// 原始構文
twice : f ? f f
flip : f x y ? f y x
f : x y z ? x * y + z
g : f 2 _ 3

// 変換後
twice : _0 ? _0 _0
flip : _0 ? _1 _2 ? _0 _2 _1
f : _0 _1 _2 ? _0 * _1 + _2
g : _0 ? f 2 _0 3
```

## 3. メタプログラミング構文は（最小実装では後回し！）

```
// 原始構文
define_accessor : field ? `get_${field} : obj ? obj'${field}`
generate_enum : name values ? `${name} : x ? ${join(values, (v, i) ? `x = ${i} ? ${v}`)}`

// 変換後 (define_accessor "name" が呼ばれると)
get_name : _0 ? _0 ' name
```
