# Sign言語純粋関数型設計指針

## 1. はじめに

Sign言語は純粋関数型言語として設計されており、副作用の排除と関数合成による表現力の向上を重視しています。本ドキュメントでは、Sign言語の純粋関数型設計思想に基づく実践的なコーディング指針を示します。

## 2. 関数内定義付けの禁止

### 2.1 基本原則

Sign言語では、**関数内で定義付けが発生しない書き方が仕様**です。関数内で変数を宣言する必要性があるということは、それは本来副作用の記述であり、純粋関数型設計に反します。

### 2.2 禁止パターンと推奨パターン

```sign
` 禁止パターン：関数内での変数宣言
bad_function : input ?
	temp : process_step1 input		` ← これは副作用
	result : process_step2 temp		` ← これも副作用
	result

` 推奨パターン：直接的な関数合成
good_function : input ?
	process_step2 process_step1 input
```

### 2.3 理論的根拠

- **数学的関数の定義**: 真の関数は入力から出力への写像であり、内部状態を持ちません
- **参照透明性の維持**: 同じ入力に対して常に同じ出力を保証するため
- **型推論の単純化**: 中間変数がないため、入力から出力への直接的な型変換のみを追跡

## 3. ブロック構文における混在パターンの回避

### 3.1 同一階層での混在禁止

Sign言語では、ブロック構文において**条件式（`:` 演算子）と一般処理が同一階層で混在することを禁止**しています。これは論理的一貫性とプリプロセッサによる自動変換を保証するためです。

### 3.2 問題のあるパターン

```sign
` ❌ 問題：条件式と一般処理が同一階層で混在
problematic_function : x ?
	preProcess x			` 一般処理
	x < 0 : `negative`		` 条件式
	transform x				` 一般処理
	x > 100 : `large`		` 条件式
	finalize x				` 一般処理
```

このパターンの問題点：
- **処理順序の曖昧性**: 条件分岐と順次処理の実行順序が不明確
- **プリプロセッサ変換の困難**: 自動的なリスト化や条件分岐変換が不可能
- **論理構造の不整合**: 何が条件で何が処理かが判別困難

### 3.3 許可されるパターン

#### パターンA: 純粋な条件分岐のみ
```sign
` ✅ 正常：条件分岐のみのブロック
classify : x ?
	x < 0 : `negative`
	x = 0 : `zero`
	x > 0 : `positive`
```

#### パターンB: 純粋な一般処理のみ
```sign
` ✅ 正常：一般処理のみ
process_steps : data ? step1 step2 step3 data
```

#### パターンC: 適切な階層化による混在（参考例）
```sign
` ✅ 参考：条件式と一般処理の適切な階層化
process_data : x ?
	preProcess x
	x < 0 :
		`negative`
		transform_negative x
	x > 100 :
		`large`
		transform_large x
	finalize x
```

### 3.4 推奨パターン：「一つの関数は一つの動詞」原則

**Sign言語の「関数が一般動詞を表現する」哲学**に基づく推奨パターン：

```sign
` ✅ 推奨：動詞的で明確な表現
process_data : x ?
	preProcess x
	classify x
	finalize x

classify : x ?
	x < 0 & `negative` | x > 100 & `large` | `normal`
```

**推奨パターンの利点**：
- **視覚的シンプルさ**: インデントとカッコの混在なし
- **動作の明確性**: 各関数が一つの明確な動詞的動作を表現
- **自然言語的読みやすさ**: 処理の流れが英語として読める
- **保守性の向上**: 各関数の責任が明確で、変更の影響範囲が限定的

### 3.5 階層化の原則

混在が必要な場合は、以下の原則に従って階層化してください：

1. **条件の結果処理を1階層下げる**: 条件にぶら下がる処理は適切にインデント
2. **論理的グループ化**: 関連する条件と処理をブロックでグループ化
3. **明確な分離**: 条件分岐ブロックと一般処理を明確に分離

### 3.6 プリプロセッサとの関係

この規則は、Sign言語のプリプロセッサによる自動変換と密接に関連しています：

```sign
` 元のコード（適切な階層化）
example : data ?
	validate_data data
	data ' type = `special` : 
		special_process data
	finalize_data data

` プリプロセッサによる変換後
example : _0 ?
	[validate_data _0],
	[_0 ' type = `special` & special_process _0],
	[finalize_data _0]
```

## 4. 引数設計の重要性

### 4.1 大きなオブジェクトの問題

**引数で大きなオブジェクトを渡すようなコードは、プログラムを混沌にしてしまいます。**

内部で引数を操作した一時的なメモのような挙動は、**全て引数を渡す時に行うべき**です。

### 4.2 設計パターンの比較

```sign
` 問題のあるパターン：関数内でオブジェクト操作
problematic : large_object ?
	field1 : large_object ' field1
	field2 : large_object ' field2  
	combine field1 field2

` 推奨パターン：引数渡し時に必要な値を抽出
better : field1 field2 ?
	combine field1 field2

` 使用時
result : better (large_object ' field1) (large_object ' field2)
```

### 4.3 引数設計の利点

1. **関数の責任の明確化**: 何が必要かが引数から明確
2. **テストの容易さ**: 必要な値だけを用意すればテスト可能
3. **再利用性の向上**: 特定のオブジェクト構造に依存しない
4. **並列化の促進**: 引数間の依存関係が明確

## 5. ファイルスコープの活用と注意点

### 5.1 代替手段としてのファイルスコープ

**ファイル単位でスコープが切れる**ため、以下の方法で関数内定義を回避できます：

```sign
` ファイルスコープでの識別子定義
config_value : complex_initialization_process
helper_data : precomputed_expensive_operation

` 関数内でファイルスコープ識別子を使用
process_function : input ?
	transform input config_value helper_data
```

## 6. get演算子依存の回避

### 6.1 基本方針

**毎回get演算子に頼るような実装が存在するなら、そうした記述は必ず簡略化可能です。**

### 6.2 問題のあるパターンと改善例

```sign
` 問題：get演算子への過度な依存
inefficient : data ?
	data ' field1 ' subfield + data ' field2 ' subfield

` 改善案1：構造の再設計
efficient : field1_sub field2_sub ?
	field1_sub + field2_sub

` 改善案2：前処理による値抽出
with_preprocessing : data ?
	add (data ' field1 ' subfield) (data ' field2 ' subfield)

` 改善案3：専用アクセス関数の活用
extract_subfields : data ?
	data ' field1 ' subfield
	data ' field2 ' subfield

calculate : data ?
	add_subfields data

add_subfields : data ?
	data ' field1 ' subfield + data ' field2 ' subfield
```

### 6.3 設計指針

1. **データ構造の見直し**: 頻繁にアクセスするデータは引数として直接渡す
2. **アクセスパターンの抽象化**: 共通のアクセスパターンは専用関数に分離
3. **前処理の活用**: 関数呼び出し前に必要な値を抽出

## 7. 最終手段：値の上書き

### 7.1 例外的な状況での対処

例外的な状況では、**@と#で値を上書きするという方法**もあります：

```sign
` 最終手段：メモリ直接操作
emergency_update : address new_value ?
` 値の上書き
	address # new_value
` 更新された値の取得
	@address

` システムレベルでの状態更新例
system_state_update : state_address new_state ?
	state_address # new_state
	notify_state_change @state_address
```

### 7.2 使用上の注意

- **純粋関数型設計からの逸脱**: これは副作用を伴う操作です
- **限定的な使用**: システムレベルやハードウェア制御でのみ使用
- **文書化の徹底**: 副作用があることを明確に文書化
- **テストの困難さ**: 状態変更により再現性のあるテストが困難

## 8. 実践的なリファクタリング手法

### 8.1 段階的な改善プロセス

関数内定義を排除する具体的な手法を段階的に適用します：

#### ステップ1：関数分割

```sign
` Before: 複雑な内部処理
complex_old : data ?
	validated : validate data
	normalized : normalize validated  
	processed : heavy_process normalized
	format processed

` After: 中間関数の作成
validate_and_normalize : data ?
	normalize validate data

complex_new : data ?
	format heavy_process validate_and_normalize data
```

#### ステップ2：関数合成の活用

```sign
` さらなる改善：直接的な関数合成
complex_optimized : data ?
	format heavy_process normalize validate data

` または関数合成演算子を使用
pipeline_version : ?
	[format,] [heavy_process,] [normalize,] [validate,]
```

#### ステップ3：動詞的分離の適用

```sign
` Before: 複雑な条件処理
conditional_old : input ?
	type : input ' type
	type = `numeric` : process_numeric input
	type = `text` : process_text input
	default_process input

` After: 動詞的な明確化
conditional_new : input ?
	validate input
	classify input
	process_by_type input

classify : input ?
	input ' type = `numeric` : `numeric`
	input ' type = `text` : `text`
	`default`

process_by_type : input ?
	input ' type = `numeric` : process_numeric input
	input ' type = `text` : process_text input
	default_process input
```

### 8.2 リファクタリングの指針

1. **一時変数の特定**: `:` 演算子で定義される中間値を洗い出し
2. **依存関係の分析**: どの中間値が他の中間値に依存するかを把握
3. **動詞的分割の検討**: 論理的に独立した動作を別関数に分離
4. **引数設計の見直し**: 必要な値を直接引数として受け取る設計に変更
5. **テストの追加**: リファクタリング後の動作確認

## 9. 設計指針の統合効果

### 9.1 型システムとの相乗効果

この純粋関数型設計指針は、Sign言語の「見えない強い型付け」と以下のように統合されます：

1. **型推論の効率化**: 中間変数がないため、入力から出力への直接的な型変換のみを追跡
2. **ハードウェア最適化**: 関数合成は自然にパイプライン処理やSIMD命令に対応
3. **メモリ効率**: 中間値の保存が不要で、領域ベースメモリ管理と相性が良い
4. **並列実行**: 関数間の依存関係が明確で、自動並列化が容易

### 9.2 言語哲学との一貫性

この設計は、Sign言語の核となる哲学と一貫しています：

- **「見えない強さ」**: プログラマは副作用を意識せず、言語が自動的に純粋性を保証
- **「ゼロコスト抽象化」**: 関数合成は理論的に美しく、実行時にも効率的
- **「統一データモデル」**: リスト基盤の処理と関数合成が自然に調和
- **「関数が一般動詞を表現する」**: 各関数が明確で単純な動作を表現

## 10. 結論

Sign言語における純粋関数型設計は、単なる制約ではなく、より表現力豊かで効率的なプログラミングを可能にする設計哲学です。関数内定義の禁止、ブロック構文における混在パターンの回避、適切な引数設計、get演算子依存の回避、そして「一つの関数は一つの動詞」という原則に従うことで、保守性が高く、最適化しやすく、理解しやすいコードが実現できます。

特に重要なのは、**Sign言語の「関数が一般動詞を表現する」哲学**です。この原則に従い、視覚的にシンプルで、動作が明確で、自然言語的に読みやすいコードを書くことで、Sign言語らしい美しいプログラムが実現できます。

これらの指針は、Sign言語の「見えない強い型付け」「ゼロコスト抽象化」「統一データモデル」といった特性と相まって、従来の命令型言語では実現困難な、理論と実装の完全な統合を可能にしています。