# Sign言語セルフコンパイラ - テストコード（モードベース実装版）

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
	list_op : `[* 2,] 1 2 3 4 5`
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

# モードベース・テスト実行
run_tests_mode_based : ?
	# すべてのテストケースを実行
	run_test_cases_mode_based test_cases

# モードベース・テストケースの実行
run_test_cases_mode_based : cases ?
	# 各テストケースでコンパイラを実行
	test_compiler_mode_based : case name ?
		print `\n====== Testing (Mode-based): `, name, ` ======`
		print `Source code:`
		print case
		
		# 字句解析
		lexer_result : lexer case
		
		lexer_result ' 0 = `Error` ?
			print `Lexical Error:`, lexer_result ' 1
			`Failed`
		
		print `\nTokens (JSON):`, lexer_result
		
		# 構文解析
		parse_result : parser lexer_result
		
		parse_result ' 0 = `Error` ?
			print `Parse Error:`, parse_result ' 1
			`Failed`
		
		print `\nAST (JSON):`, parse_result
		
		# コード生成
		codegen_result : generate_code parse_result
		
		codegen_result ' 0 = `Error` ?
			print `Code Generation Error:`, codegen_result ' 1
			`Failed`
		
		print `\nGenerated Code:`, codegen_result
		
		`Passed`
	
	# テスト結果を集約
	test_mode_based_case : name cases ?
		cases ' name = _ ? _
		
		result : test_compiler_mode_based cases ' name name
		print `\nTest result: `, result
		print `\n----------------------------------`
		
		test_mode_based_case

# JSONテキスト出力結果の整形して表示
pretty_print_json : json_text ?
	# 実際の実装ではJSON.pretty_printのような関数を使用
	# ここでは簡易的に入力をそのまま返す
	json_text

# サンプルプログラム - Sign言語のミニ構文解析器
mini_parser_program : `
# Sign言語ミニパーサー
parser : tokens ?
	state :
		tokens : tokens
		position : 0
		mode : \`normal\`
		result : _
	
	parse_tokens state

# トークン処理
parse_tokens : state ?
	# 終了条件
	state ' position >= length state ' tokens ?
		state ' result
	
	# 現在のトークン
	token : state ' tokens ' state ' position
	
	# トークンタイプ別の処理
	token ' type = \`number\` ?
		# 数値の場合
		new_state : state
		new_state ' position : state ' position + 1
		new_state ' result : token ' value
		parse_tokens new_state
	
	token ' type = \`operator\` ?
		# 演算子の場合
		operator : token ' value
		new_state : state
		new_state ' position : state ' position + 1
		left : state ' result
		
		# 右オペランドの処理
		right_state : parse_tokens new_state
		right : right_state ' result
		
		# 演算の実行
		operator = \`+\` ?
			result_state : right_state
			result_state ' result : left + right
			result_state
		
		operator = \`*\` ?
			result_state : right_state
			result_state ' result : left * right
			result_state
	
	# その他のトークン（エラー）
	\`Error: Unexpected token\`
`

# メインテスト関数
test_main : ?
	print `=== Sign Language Self-Compiler Tests (Mode-based) ===\n`
	
	# モードベース実装のテスト
	print `Running mode-based implementation tests...`
	run_tests_mode_based
	
	# サンプルプログラムのテスト
	print `\n\n=== Testing Mode-Based Sample Programs ===\n`
	
	print `\n== Mini Parser Program ==`
	test_compiler_mode_based mini_parser_program `Mini Parser`
	
	print `\n=== All mode-based tests completed ===`

# 実行
test_main