# Sign言語セルフコンパイラ - モードベース実装のメインモジュール

# コンパイラの状態
compiler_state :
	source : _           # ソースコード
	tokens_json : _      # 字句解析結果（JSONテキスト）
	ast_json : _         # 構文解析結果（JSONテキスト）
	code_json : _        # 生成コード（JSONテキスト）
	error : _            # エラーメッセージ

# ソースコードのコンパイル（メイン処理）
compile_mode_based : source ?
	state : compiler_state
	state ' source : source
	
	# 1. 字句解析
	lexer_result : lexer source
	
	is_error lexer_result ?
		state ' error : `Lexical Error: `, get_error_message lexer_result
		state
	
	state ' tokens_json : lexer_result
	
	# 2. 構文解析
	parse_result : parser lexer_result
	
	is_error parse_result ?
		state ' error : `Parse Error: `, get_error_message parse_result
		state
	
	state ' ast_json : parse_result
	
	# 3. 最適化（省略可能）
	optimize_result : optimize state ' ast_json
	
	is_error optimize_result ?
		state ' error : `Optimization Error: `, get_error_message optimize_result
		state
	
	state ' ast_json : optimize_result
	
	# 4. コード生成
	code_result : generate_code state ' ast_json
	
	is_error code_result ?
		state ' error : `Code Generation Error: `, get_error_message code_result
		state
	
	state ' code_json : code_result
	state

# 最適化処理
optimize : ast_json ?
	# ここでは最適化を行わず、ASTをそのまま返す
	ast_json

# ファイルからのコンパイル
compile_file_mode_based : filename ?
	source : read_file filename
	source = _ ?
		state : compiler_state
		state ' error : `Error: Cannot read file `, filename
		state
	
	compile_mode_based source

# ファイル読み込み
read_file : filename ?
	# 実際の実装ではファイルシステムAPIを使用
	# 簡略化のため、ここではダミー実装
	`# このコードはファイルから読み込まれたと仮定\n` 
	`fact : n ?\n`
	`\tn <= 1 : 1\n`
	`\tn * fact n - 1`

# REPLの実装（モードベース版）
repl_mode_based : ?
	print `Sign Language Self-Compiler REPL (Mode-based implementation)`
	print `Type :help for available commands or :exit to quit`
	
	repl_loop_mode_based compiler_state

# REPLのメインループ
repl_loop_mode_based : state ?
	# 入力プロンプト
	print `sign> `
	
	# ユーザー入力を取得
	input : read_line
	
	input = `exit` | input = `quit` ?
		print `Goodbye!`
		_
	
	# 特殊コマンドのチェック
	input ' 0 = \: ?
		# コマンド処理
		result : eval_command_mode_based input ' 1~ state
		print result ' 0
		
		# エラーがあれば表示
		result ' 1 != _ ?
			print `Error: `, result ' 1
		
		# ループを継続
		repl_loop_mode_based result ' 2
	
	# 入力をコンパイル
	compile_result : compile_mode_based input
	
	compile_result ' error != _ ?
		print `Compilation error: `, compile_result ' error
		repl_loop_mode_based state
	
	# 成功時は結果を表示
	print `=== Tokens (JSON) ===`
	print pretty_print_json compile_result ' tokens_json
	
	print `\n=== AST (JSON) ===`
	print pretty_print_json compile_result ' ast_json
	
	print `\n=== Generated Code ===`
	print get_generated_code compile_result ' code_json
	
	# ループを継続
	repl_loop_mode_based compile_result

# 特殊コマンドの評価
eval_command_mode_based : cmd state ?
	cmd = `help` ?
		# ヘルプメッセージを表示
		help_str : 
			`Available commands:\n`
			`:help   - Show this help message\n`
			`:exit   - Exit the REPL\n`
			`:tokens - Show last generated tokens\n`
			`:ast    - Show last generated AST\n`
			`:code   - Show last generated code`
		help_str, _, state
	
	cmd = `tokens` ?
		# 最後に生成されたトークンを表示
		state ' tokens_json = _ ?
			`No tokens available`, _, state
		
		pretty_print_json state ' tokens_json, _, state
	
	cmd = `ast` ?
		# 最後に生成されたASTを表示
		state ' ast_json = _ ?
			`No AST available`, _, state
		
		pretty_print_json state ' ast_json, _, state
	
	cmd = `code` ?
		# 最後に生成されたコードを表示
		state ' code_json = _ ?
			`No generated code available`, _, state
		
		get_generated_code state ' code_json, _, state
	
	# 未知のコマンド
	`Unknown command: `, cmd, state

# JSONテキストから生成されたコードを抽出
get_generated_code : code_json ?
	# 実装省略（JSONからcodeフィールドを抽出）
	# ここでは簡易的にJSONテキスト全体を返す
	code_json

# エラーチェック関数
is_error : result ?
	# 簡易的なエラーチェック
	result ' 0 = `Error`

# エラーメッセージ取得関数
get_error_message : result ?
	# エラーメッセージの抽出
	result ' 1

# JSONテキスト出力結果の整形表示
pretty_print_json : json_text ?
	# 実際の実装ではJSON.pretty_printのような関数を使用
	# ここでは簡易的に入力をそのまま返す
	json_text

# ラインを読み込む（実際の実装ではI/O APIを使用）
read_line : ? `fact 5`

# 文字列を出力（実際の実装ではI/O APIを使用）
print : message ? message

# メイン関数
main_mode_based : args ?
	args = _ ?
		# 引数がない場合はREPLを起動
		repl_mode_based
	
	# ファイル引数がある場合はコンパイル
	filename : args ' 0
	
	compile_result : compile_file_mode_based filename
	
	compile_result ' error != _ ?
		print `Compilation error: `, compile_result ' error
		`Error`
	
	# 成功時は結果を表示
	print `=== Compilation successful ===`
	print `\n=== Generated Code ===`
	print get_generated_code compile_result ' code_json
	
	`Success`

# 実行
main_mode_based