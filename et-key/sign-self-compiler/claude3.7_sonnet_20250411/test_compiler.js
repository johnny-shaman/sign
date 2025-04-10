# Sign言語セルフコンパイラ - テストコード

# テストケースの定義
test_cases :
	# 基本的な式と演算
	simple_expr : `1 + 2 * 3`
	arithmetic : `(5 + 3) * 2 - 4 / 2`
	comparison : `5 < 10 & 3 >= 2`
	logical : `!_ | 5 > 3 & 2 <= 1`
	
	# 定義とスコープ
	define : `x : 5\ny : 10\nz : x + y`
	scope : `outer : 10\nfunc : ?\n\tinner : 20\n\touter + inner`
	
	# 関数定義と呼び出し
	func_def : `add : x y ? x + y`
	func_call : `add 3 5`
	lambda : `[x y ? x * y] 4 5`
	
	# リスト操作
	list_def : `nums : 1, 2, 3, 4, 5`
	list_op : `[+ 2,] 1 2 3 4 5`
	list_fold : `[+] 1 2 3 4 5`
	list_range : `1 ~ 5`
	
	# 条件分岐
	condition : `x : 5\nx > 3 ? \`bigger\` \`smaller\``
	multi_condition : `check : x ?\n\tx < 0 : \`negative\`\n\tx = 0 : \`zero\`\n\t\`positive\``
	
	# 再帰
	factorial : `fact : n ?\n\tn <= 1 : 1\n\tn * fact n - 1`
	fibonacci : `fib : n ?\n\tn <= 1 : n\n\tfib n - 1 + fib n - 2`
	
	# 高度なパターン
	list_rev : `reverse : x ~y ?\n\ty = _ : x\n\treverse y~, x`
	collatz : `collatz : x ?\n\tx = 1 : 1\n\tx % 2 = 0 : collatz x / 2\n\tcollatz 3 * x + 1`

# テスト実行
run_tests : ?
	# すべてのテストケースを実行
	run_test_cases test_cases

# テストケースの実行
run_test_cases : cases ?
	# 各テストケースでコンパイラを実行
	test_compiler : case name ?
		print `\n====== Testing: `, name, ` ======`
		print `Source code:`
		print case
		
		# コンパイル
		compile_result : compile case
		
		compile_result ' error != _ ?
			print `Compilation Error:`, compile_result ' error
			`Failed`
		
		print `\nTokens:`, tokens_to_string compile_result ' tokens
		print `\nAST:`, ast_to_string compile_result ' ast
		print `\nGenerated code:`, compile_result ' code
		
		# 実行
		exec_result : execute_code compile_result ' ast init_environment
		
		exec_result ' 0 = `Error` ?
			print `\nExecution Error:`, exec_result ' 1
			`Failed`
		
		print `\nResult:`, value_to_string exec_result ' 1
		`Passed`
	
	# テスト結果を集約
	test_case : name cases ?
		cases ' name = _ ? _
		
		result : test_compiler cases ' name name
		print `\nTest result: `, result
		print `\n----------------------------------`
		
		test_case

# サンプルプログラム - 階乗計算
factorial_program : `
# 階乗を計算する関数
fact : n ?
	n <= 1 : 1
	n * fact n - 1

# 1から5までの階乗を計算
[fact,] 1 2 3 4 5
`

# サンプルプログラム - クイックソート
quicksort_program : `
# クイックソートの実装
quicksort : xs ?
	xs = _ : _
	pivot : xs ' 0
	rest : xs ' 1~
	
	# 小さい要素と大きい要素に分ける
	partition : xs pivot ?
		xs = _ : _, _
		
		x : xs ' 0
		xs_rest : xs ' 1~
		
		lesser : partition xs_rest pivot ' 0
		greater : partition xs_rest pivot ' 1
		
		x < pivot ?
			lesser, x, greater
			lesser, greater, x
	
	parts : partition rest pivot
	lesser : parts ' 0
	greater : parts ' 1
	
	# 再帰的に並べ替えて結合
	sorted_lesser : quicksort lesser
	sorted_greater : quicksort greater
	
	sorted_lesser, pivot, sorted_greater

# テストデータ
test_data : 9, 3, 7, 1, 8, 2, 5, 6, 4
sorted : quicksort test_data
`

# サンプルプログラム - フィボナッチ数列
fibonacci_program : `
# フィボナッチ数列を計算する関数
fib : n ?
	n <= 1 : n
	fib n - 1 + fib n - 2

# 最初の10個のフィボナッチ数を計算
[fib,] 0 1 2 3 4 5 6 7 8 9
`

# サンプルプログラム - 高階関数
higher_order_program : `
# 高階関数の例

# マップ関数
map : f xs ?
	xs = _ : _
	
	x : xs ' 0
	rest : xs ' 1~
	
	f x, map f rest

# フィルター関数
filter : pred xs ?
	xs = _ : _
	
	x : xs ' 0
	rest : xs ' 1~
	
	pred x ?
		x, filter pred rest
		filter pred rest

# 合成関数
compose : f g x ? f g x

# テスト
double : x ? x * 2
is_even : x ? x % 2 = 0

numbers : 1 2 3 4 5 6 7 8 9 10

# 偶数だけを倍にする
filter is_even numbers ' map double
`

# メインテスト関数
test_main : ?
	print `=== Sign Language Self-Compiler Tests ===\n`
	
	# 基本テストの実行
	print `Running basic tests...`
	run_tests
	
	# サンプルプログラムのテスト
	print `\n\n=== Testing Sample Programs ===\n`
	
	print `\n== Factorial Program ==`
	test_compiler factorial_program `Factorial`
	
	print `\n== Quicksort Program ==`
	test_compiler quicksort_program `Quicksort`
	
	print `\n== Fibonacci Program ==`
	test_compiler fibonacci_program `Fibonacci`
	
	print `\n== Higher Order Functions Program ==`
	test_compiler higher_order_program `Higher Order Functions`
	
	print `\n=== All tests completed ===`

# 実行
test_main