# 構文解析器（Parser）
# Sign言語の構文解析器の実装

# AST ノードの種類
NodeType :
	PROGRAM : `PROGRAM`
	BLOCK : `BLOCK`
	BINARY_EXPR : `BINARY_EXPR`
	UNARY_EXPR : `UNARY_EXPR`
	POSTFIX_EXPR : `POSTFIX_EXPR`
	LAMBDA : `LAMBDA`
	FUNC_CALL : `FUNC_CALL`
	IDENTIFIER : `IDENTIFIER`
	NUMBER : `NUMBER`
	STRING : `STRING`
	CHAR : `CHAR`
	UNIT : `UNIT`
	LIST : `LIST`
	CONDITION : `CONDITION`
	DEFINE : `DEFINE`

# 演算子の優先順位
# 数値が大きいほど優先順位が高い
op_precedence :
	`:` : 10    # 定義
	`#` : 10    # output
	` ` : 20    # 余積
	`?` : 20    # ラムダ構築
	`,` : 20    # 積
	`~` : 25    # 範囲リスト構築
	`;` : 30    # xor
	`|` : 30    # or
	`&` : 40    # and
	`<` : 50    # 比較演算子
	`<=` : 50
	`=` : 50
	`>=` : 50
	`>` : 50
	`!=` : 50
	`+` : 60    # 加減算
	`-` : 60
	`*` : 70    # 乗除算
	`/` : 70
	`%` : 70
	`^` : 80    # 冪乗
	`'` : 90    # get
	`@` : 90    # get/import

# AST ノード生成関数
create_node : type value ?
	node :
		type : type
		value : value
	node

# バイナリ式ノード生成
create_binary_node : left op right ?
	node :
		type : NodeType ' BINARY_EXPR
		operator : op
		left : left
		right : right
	node

# ユナリ式ノード生成
create_unary_node : op expr ?
	node :
		type : NodeType ' UNARY_EXPR
		operator : op
		expr : expr
	node

# ポストフィックス式ノード生成
create_postfix_node : expr op ?
	node :
		type : NodeType ' POSTFIX_EXPR
		operator : op
		expr : expr
	node

# ラムダノード生成
create_lambda_node : params body ?
	node :
		type : NodeType ' LAMBDA
		params : params
		body : body
	node

# 関数呼び出しノード生成
create_func_call_node : func args ?
	node :
		type : NodeType ' FUNC_CALL
		func : func
		args : args
	node

# リストノード生成
create_list_node : items ?
	node :
		type : NodeType ' LIST
		items : items
	node

# 条件ノード生成
create_condition_node : condition then_expr else_expr ?
	node :
		type : NodeType ' CONDITION
		condition : condition
		then_expr : then_expr
		else_expr : else_expr
	node

# 定義ノード生成
create_define_node : name value ?
	node :
		type : NodeType ' DEFINE
		name : name
		value : value
	node

# パーサー
parser : tokens ?
	state :
		tokens : tokens
		position : 0
	
	# プログラム全体を解析
	program : parse_program state
	program

# プログラム解析 (複数の文を含むブロック)
parse_program : state ?
	statements : _
	
	# 全てのトークンを処理するまで解析
	parse_statements : curr_state statements ?
		# トークンがなくなったら終了
		curr_state ' position >= length curr_state ' tokens ? statements
		
		# 現在のトークン
		token : curr_state ' tokens ' curr_state ' position
		
		token ' type = TokenType ' EOF ? statements
		
		# 文を解析
		stmt_result : parse_statement curr_state
		stmt : stmt_result ' 0
		new_state : stmt_result ' 1
		
		# 文を追加
		parse_statements new_state statements, stmt
	
	# 実行
	statements : parse_statements state _
	
	# プログラムノードを作成
	create_node NodeType ' PROGRAM statements

# 文の解析
parse_statement : state ?
	token : state ' tokens ' state ' position
	
	token ' type = TokenType ' NEWLINE ?
		# 改行をスキップ
		new_state : advance state
		parse_statement new_state
	
	token ' type = TokenType ' ID & peek_token state 1 ' value = `:` ?
		# 定義文 (name : value)
		parse_definition state
	
	token ' type = TokenType ' ID & peek_token state 1 ' value = `#` ?
		# 出力文 (name # value)
		parse_output state
	
	# その他の文は式として解析
	parse_expression state

# 定義文の解析
parse_definition : state ?
	# 識別子
	id_token : state ' tokens ' state ' position
	name : id_token ' value
	
	# ':'をスキップ
	new_state : advance advance state
	
	# 値を解析
	value_result : parse_expression new_state
	value : value_result ' 0
	final_state : value_result ' 1
	
	# 定義ノードを作成
	node : create_define_node name value
	node, final_state

# 出力文の解析 (parse_outputは実装省略)

# 式の解析
parse_expression : state ?
	# 最低優先度から式を解析
	parse_binary_expr state 10

# 二項演算式の解析 (優先順位考慮)
parse_binary_expr : state precedence ?
	# 左辺を解析
	left_result : parse_unary_expr state
	left : left_result ' 0
	curr_state : left_result ' 1
	
	# 二項演算子を処理
	parse_binary_op : left curr_state curr_precedence ?
		curr_state ' position >= length curr_state ' tokens ? left, curr_state
		
		# 現在のトークン
		op_token : curr_state ' tokens ' curr_state ' position
		
		# 演算子でなければ終了
		op_token ' type != TokenType ' OPERATOR ? left, curr_state
		
		# 演算子の優先順位を確認
		op : op_token ' value
		op_prec : op_precedence ' op
		
		op_prec = _ | op_prec < curr_precedence ? left, curr_state
		
		# 演算子をスキップ
		op_state : advance curr_state
		
		# 右辺を解析 (優先順位を1つ上げて)
		right_result : parse_binary_expr op_state op_prec + 1
		right : right_result ' 0
		new_state : right_result ' 1
		
		# 二項演算ノードを作成
		new_left : create_binary_node left op right
		
		# 次の演算子を処理
		parse_binary_op new_left new_state curr_precedence
	
	# 演算子の処理を開始
	parse_binary_op left curr_state precedence

# 単項演算式の解析
parse_unary_expr : state ?
	token : state ' tokens ' state ' position
	
	# 前置演算子チェック
	token ' type = TokenType ' OPERATOR & is_prefix_op token ' value ?
		# 演算子をスキップ
		op : token ' value
		new_state : advance state
		
		# 式を解析
		expr_result : parse_unary_expr new_state
		expr : expr_result ' 0
		final_state : expr_result ' 1
		
		# 単項演算ノードを作成
		node : create_unary_node op expr
		node, final_state
	
	# 単項演算子でなければポストフィックス式として解析
	parse_postfix_expr state

# ポストフィックス式の解析
parse_postfix_expr : state ?
	# 基本式を解析
	expr_result : parse_primary state
	expr : expr_result ' 0
	curr_state : expr_result ' 1
	
	token : curr_state ' tokens ' curr_state ' position
	
	# 後置演算子チェック
	token ' type = TokenType ' OPERATOR & is_postfix_op token ' value ?
		# 演算子をスキップ
		op : token ' value
		new_state : advance curr_state
		
		# ポストフィックス演算ノードを作成
		node : create_postfix_node expr op
		
		# 連続した後置演算子を処理するため再帰呼び出し
		postfix_result : parse_postfix_expr new_state
		postfix_expr : postfix_result ' 0
		final_state : postfix_result ' 1
		
		# 後置演算子がある場合は新しい式として扱う
		postfix_expr ' type = NodeType ' POSTFIX_EXPR ?
			create_postfix_node node postfix_expr ' operator, final_state
		
		node, final_state
	
	# 後置演算子がなければ基本式を返す
	expr, curr_state

# 基本式の解析
parse_primary : state ?
	token : state ' tokens ' state ' position
	
	token ' type = TokenType ' EOF ?
		# ファイル終端
		create_node NodeType ' UNIT `_`, state
	
	token ' type = TokenType ' UNIT ?
		# Unit (_)
		node : create_node NodeType ' UNIT token ' value
		new_state : advance state
		node, new_state
	
	token ' type = TokenType ' NUMBER ?
		# 数値リテラル
		node : create_node NodeType ' NUMBER token ' value
		new_state : advance state
		node, new_state
	
	token ' type = TokenType ' STRING ?
		# 文字列リテラル
		node : create_node NodeType ' STRING token ' value
		new_state : advance state
		node, new_state
	
	token ' type = TokenType ' CHAR ?
		# 文字リテラル
		node : create_node NodeType ' CHAR token ' value
		new_state : advance state
		node, new_state
	
	token ' type = TokenType ' ID ?
		# 識別子
		node : create_node NodeType ' IDENTIFIER token ' value
		new_state : advance state
		
		# 関数呼び出しかどうかをチェック
		new_state ' position < length new_state ' tokens &
		!is_special_token new_state ' tokens ' new_state ' position ?
			# 引数リストを解析
			args_result : parse_arg_list new_state
			args : args_result ' 0
			final_state : args_result ' 1
			
			# 関数呼び出しノードを作成
			call_node : create_func_call_node node args
			call_node, final_state
		
		node, new_state
	
	token ' type = TokenType ' LPAREN | token ' type = TokenType ' LBRACKET | token ' type = TokenType ' LBRACE ?
		# カッコで囲まれた式またはブロック
		open_token : token
		new_state : advance state
		
		# 式を解析
		expr_result : parse_expression new_state
		expr : expr_result ' 0
		after_expr : expr_result ' 1
		
		# 閉じカッコをチェック
		close_token : after_expr ' tokens ' after_expr ' position
		
		# 対応するカッコを確認
		is_matching_bracket open_token close_token ?
			final_state : advance after_expr
			expr, final_state
		
		# エラー: 閉じカッコがない
		`Error: Missing closing bracket for`, open_token ' value
		expr, after_expr
	
	token ' type = TokenType ' OPERATOR & token ' value = `?` ?
		# ラムダ式
		new_state : advance state
		
		# パラメータリストを解析
		params_result : parse_params new_state
		params : params_result ' 0
		after_params : params_result ' 1
		
		# 本体を解析
		body_result : parse_expression after_params
		body : body_result ' 0
		final_state : body_result ' 1
		
		# ラムダノードを作成
		lambda : create_lambda_node params body
		lambda, final_state
	
	# エラー: 不明なトークン
	`Error: Unexpected token:`, token ' value
	create_node NodeType ' UNIT `_`, advance state

# 引数リストの解析
parse_arg_list : state ?
	args : _
	
	# 引数がなくなるまで解析
	parse_args : curr_state args ?
		curr_state ' position >= length curr_state ' tokens ? args, curr_state
		
		# 引数を終了する特殊トークンをチェック
		token : curr_state ' tokens ' curr_state ' position
		
		is_special_token token ? args, curr_state
		
		# 引数を解析
		arg_result : parse_expression curr_state
		arg : arg_result ' 0
		new_state : arg_result ' 1
		
		# 引数リストに追加
		parse_args new_state args, arg
	
	# 実行
	args_result : parse_args state _
	
	# リストノードを作成
	args : create_list_node args_result ' 0
	final_state : args_result ' 1
	
	args, final_state

# パラメータリストの解析
parse_params : state ?
	params : _
	
	# パラメータがなくなるまで解析
	parse_params_impl : curr_state params ?
		curr_state ' position >= length curr_state ' tokens ? params, curr_state
		
		# パラメータを終了する特殊トークンをチェック
		token : curr_state ' tokens ' curr_state ' position
		
		token ' type != TokenType ' ID ? params, curr_state
		
		# パラメータ（識別子）をスキップ
		param : token ' value
		new_state : advance curr_state
		
		# パラメータリストに追加
		parse_params_impl new_state params, param
	
	# 実行
	params_result : parse_params_impl state _
	
	params_result

# ヘルパー関数
advance : state ?
	new_state : state
	new_state ' position : state ' position + 1
	new_state

peek_token : state offset ?
	pos : state ' position + offset
	pos >= length state ' tokens ? _
	state ' tokens ' pos

is_prefix_op : op ?
	op = `!` | op = `~` | op = `# 構文解析器（Parser）
# Sign言語の構文解析器の実装

# AST ノードの種類
NodeType :
	PROGRAM : `PROGRAM`
	BLOCK : `BLOCK`
	BINARY_EXPR : `BINARY_EXPR`
	UNARY_EXPR : `UNARY_EXPR`
	POSTFIX_EXPR : `POSTFIX_EXPR`
	LAMBDA : `LAMBDA`
	FUNC_CALL : `FUNC_CALL`
	IDENTIFIER : `IDENTIFIER`
	NUMBER : `NUMBER`
	STRING : `STRING`
	CHAR : `CHAR`
	UNIT : `UNIT`
	LIST : `LIST`
	CONDITION : `CONDITION`
	DEFINE : `DEFINE`

# 演算子の優先順位
# 数値が大きいほど優先順位が高い
op_precedence :
	`:` : 10    # 定義
	`#` : 10    # output
	` ` : 20    # 余積
	`?` : 20    # ラムダ構築
	`,` : 20    # 積
	`~` : 25    # 範囲リスト構築
	`;` : 30    # xor
	`|` : 30    # or
	`&` : 40    # and
	`<` : 50    # 比較演算子
	`<=` : 50
	`=` : 50
	`>=` : 50
	`>` : 50
	`!=` : 50
	`+` : 60    # 加減算
	`-` : 60
	`*` : 70    # 乗除算
	`/` : 70
	`%` : 70
	`^` : 80    # 冪乗
	`'` : 90    # get
	`@` : 90    # get/import

# AST ノード生成関数
create_node : type value ?
	node :
		type : type
		value : value
	node

# バイナリ式ノード生成
create_binary_node : left op right ?
	node :
		type : NodeType ' BINARY_EXPR
		operator : op
		left : left
		right : right
	node

# ユナリ式ノード生成
create_unary_node : op expr ?
	node :
		type : NodeType ' UNARY_EXPR
		operator : op
		expr : expr
	node

# ポストフィックス式ノード生成
create_postfix_node : expr op ?
	node :
		type : NodeType ' POSTFIX_EXPR
		operator : op
		expr : expr
	node

# ラムダノード生成
create_lambda_node : params body ?
	node :
		type : NodeType ' LAMBDA
		params : params
		body : body
	node

# 関数呼び出しノード生成
create_func_call_node : func args ?
	node :
		type : NodeType ' FUNC_CALL
		func : func
		args : args
	node

# リストノード生成
create_list_node : items ?
	node :
		type : NodeType ' LIST
		items : items
	node

# 条件ノード生成
create_condition_node : condition then_expr else_expr ?
	node :
		type : NodeType ' CONDITION
		condition : condition
		then_expr : then_expr
		else_expr : else_expr
	node

# 定義ノード生成
create_define_node : name value ?
	node :
		type : NodeType ' DEFINE
		name : name
		value : value
	node

# パーサー
parser : tokens ?
	state :
		tokens : tokens
		position : 0
	
	# プログラム全体を解析
	program : parse_program state
	program

# プログラム解析 (複数の文を含むブロック)
parse_program : state ?
	statements : _
	
	# 全てのトークンを処理するまで解析
	parse_statements : curr_state statements ?
		# トークンがなくなったら終了
		curr_state ' position >= length curr_state ' tokens ? statements
		
		# 現在のトークン
		token : curr_state ' tokens ' curr_state ' position
		
		token ' type = TokenType ' EOF ? statements
		
		# 文を解析
		stmt_result : parse_statement curr_state
		stmt : stmt_result ' 0
		new_state : stmt_result ' 1
		
		# 文を追加
		parse_statements new_state statements, stmt
	
	# 実行
	statements : parse_statements state _
	
	# プログラムノードを作成
	create_node NodeType ' PROGRAM statements

# 文の解析
parse_statement : state ?
	token : state ' tokens ' state ' position
	
	token ' type = TokenType ' NEWLINE ?
		# 改行をスキップ
		new_state : advance state
		parse_statement new_state
	
	token ' type = TokenType ' ID & peek_token state 1 ' value = `:` ?
		# 定義文 (name : value)
		parse_definition state
	
	token ' type = TokenType ' ID & peek_token state 1 ' value = `#` ?
		# 出力文 (name # value)
		parse_output state
	
	# その他の文は式として解析
	parse_expression state

# 定義文の解析
parse_definition : state ?
	# 識別子
	id_token : state ' tokens ' state ' position
	name : id_token ' value
	
	# ':'をスキップ
	new_state : advance advance state
	
	# 値を解析
	value_result : parse_expression new_state
	value : value_result ' 0
	final_state : value_result ' 1
	
	# 定義ノードを作成
	node : create_define_node name value
	node, final_state

# 出力文の解析 (parse_outputは実装省略)

# 式の解析
parse_expression : state ?
	# 最低優先度から式を解析
	parse_binary_expr state 10

 | op = `@` | op = `#`

is_postfix_op : op ?
	op = `!` | op = `~` | op = `@`

is_special_token : token ?
	token ' type = TokenType ' RPAREN | token ' type = TokenType ' RBRACKET |
	token ' type = TokenType ' RBRACE | token ' type = TokenType ' NEWLINE |
	token ' type = TokenType ' EOF

is_matching_bracket : open close ?
	open ' type = TokenType ' LPAREN & close ' type = TokenType ' RPAREN |
	open ' type = TokenType ' LBRACKET & close ' type = TokenType ' RBRACKET |
	open ' type = TokenType ' LBRACE & close ' type = TokenType ' RBRACE

# 文字列の長さを取得
length : array ?
	count : 0
	
	count_items : i count ?
		array ' i = _ ? count
		count_items i + 1 count + 1
	
	count_items 0 0