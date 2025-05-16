# Sign言語プリプロセッサの設計: 構文候補（最終版）

## 1. 変数名の標準化と位置ベース変換

```
// 原始構文
increment : n ? n + 1
add : x y ? x + y

// 変換後
increment : _0 ? _0 + 1
add : _0 _1 ? _0 + _1
```

## 2. 部分適用と引数順序変換

```
// 原始構文
twice : f x ? f (f x)
flip : f ? x y ? f y x
f : x y z ? x * y + z
g : f 2 _ 3

// 変換後
twice : _0 _1 ? _0 (_0 _1)
flip : _0 ? _1 _2 ? _0 _2 _1
f : _0 _1 _2 ? _0 * _1 + _2
g : _0 ? f 2 _0 3
```

## 3. 階層化辞書型と入れ子パターンマッチング

```
// 原始構文
response :
	success : 
		data : `Process data`
	error :
		not_found : `Resource missing`
		server : `Internal error`
	_ : `Unknown scenario`

// 変換後
response : _0 ?
	_0 = `success` & _1 ?
		_1 = `data` & `Process data`
	| _0 = `error` & _1 ?
		_1 = `not_found` & `Resource missing`
	  | _1 = `server` & `Internal error`
	| `Unknown scenario`
```

## 4. 高階関数の変換

```
// 原始構文
sum : fold (+) 0 [1,2,3,4,5]
evens : filter (x ? x % 2 = 0) [1,2,3,4,5]

// 変換後 - 静的リスト
sum : 0 + 1 + 2 + 3 + 4 + 5
evens : [2, 4]

// 変換後 - 動的リスト
sum : fold ([_0 _1 ? _0 + _1]) 0 _0
evens : filter ([_0 ? _0 % 2 = 0]) _0
```

## 5. 再帰パターンの最適化

```
// 原始構文
factorial : n ?
	n = 0 ? 1
	n * factorial (n - 1)

// 変換後 - 末尾再帰形式
factorial : _0 ?
	_0 = 0 ? 1 |
	factorial_tail _0 1

factorial_tail : _0 _1 ?
	_0 = 0 ? _1 |
	factorial_tail (_0 - 1) (_0 * _1)
```

## 6. メタプログラミング構文

```
// 原始構文
define_accessor : field ? `get_${field} : obj ? obj'${field}`
generate_enum : name values ? `${name} : x ? ${join(values, (v, i) ? `x = ${i} ? ${v}`)}`

// 変換後 (define_accessor "name" が呼ばれると)
get_name : _0 ? _0'name
```
