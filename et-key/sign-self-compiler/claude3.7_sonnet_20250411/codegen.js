# コード生成器（Code Generator）
# ASTからSign言語のコードを生成する

# コード生成の状態
code_gen_state :
	indentation : 0     # 現在のインデントレベル
	indent_char : `\t`  # インデント文字 (タブ)

# インデント文字列を生成
generate_indent : level char ?
	level <= 0 ? ``
	char, generate_indent level - 1 char

# コード生成のメインエントリポイント
generate_code : ast ?
	generate_node ast code_gen_state

# ASTノード別のコード生成
generate_node : node state ?
	node ' type = NodeType ' PROGRAM ?
		generate_program node state
	
	node ' type = NodeType ' BLOCK ?
		generate_block node state
	
	node ' type = NodeType ' BINARY_EXPR ?
		generate_binary_expr node state
	
	node ' type = NodeType ' UNARY_EXPR ?
		generate_unary_expr node state
	
	node ' type = NodeType ' POSTFIX_EXPR ?
		generate_postfix_expr node state
	
	node ' type = NodeType ' LAMBDA ?
		generate_lambda node state
	
	node ' type = NodeType ' FUNC_CALL ?
		generate_func_call node state
	
	node ' type = NodeType ' IDENTIFIER ?
		node ' value
	
	node ' type = NodeType ' NUMBER ?
		node ' value
	
	node ' type = NodeType ' STRING ?
		`\``, node ' value, `\``
	
	node ' type = NodeType ' CHAR ?
		`\\`, node ' value
	
	node ' type = NodeType ' UNIT ?
		`_`
	
	node ' type = NodeType ' LIST ?
		generate_list node state
	
	node ' type = NodeType ' CONDITION ?
		generate_condition node state
	
	node ' type = NodeType ' DEFINE ?
		generate_define node state
	
	# デフォルト (未知のノードタイプ)
	`/* Unknown node type: `, node ' type, ` */`

# プログラム（複数の文）のコード生成
generate_program : node state ?
	statements : node ' value
	
	statements = _ ? ``
	
	# 各文を生成して改行で結合
	generate_statements : stmts state result ?
		stmts = _ ? result
		
		stmt : stmts ' 0
		rest : stmts ' 1~
		
		stmt_code : generate_node stmt state
		
		result = _ ?
			generate_statements rest state stmt_code
		
		result, `\n`, generate_statements rest state _
	
	generate_statements statements state _

# ブロックのコード生成
generate_block : node state ?
	statements : node ' value
	
	statements = _ ? ``
	
	# インデントレベルを上げる
	new_state : state
	new_state ' indentation : state ' indentation + 1
	indent : generate_indent new_state ' indentation new_state ' indent_char
	
	# 各文を生成して改行+インデントで結合
	generate_block_statements : stmts state indent result ?
		stmts = _ ? result
		
		stmt : stmts ' 0
		rest : stmts ' 1~
		
		stmt_code : generate_node stmt state
		
		result = _ ?
			generate_block_statements rest state indent indent, stmt_code
		
		result, `\n`, indent, generate_block_statements rest state indent _
	
	generate_block_statements statements new_state indent _

# 二項演算式のコード生成
generate_binary_expr : node state ?
	left : generate_node node ' left state
	op : node ' operator
	right : generate_node node ' right state
	
	# 特別なケース: 関数適用（空白演算子）
	op = ` ` ?
		left, ` `, right
	
	# 標準的な二項演算
	left, ` `, op, ` `, right

# 単項演算式のコード生成
generate_unary_expr : node state ?
	op : node ' operator
	expr : generate_node node ' expr state
	
	# 前置演算子
	op, expr

# 後置演算式のコード生成
generate_postfix_expr : node state ?
	expr : generate_node node ' expr state
	op : node ' operator
	
	# 後置演算子
	expr, op

# ラムダ式のコード生成
generate_lambda : node state ?
	params : node ' params
	body : generate_node node ' body state
	
	# ラムダ構文: params ? body
	generate_params : params ?
		params = _ ? ``
		
		param : params ' 0
		rest : params ' 1~
		
		rest = _ ? param
		param, ` `, generate_params rest
	
	# パラメータリストと本体を結合
	generate_params params, ` ? `, body

# 関数呼び出しのコード生成
generate_func_call : node state ?
	func : generate_node node ' func state
	args : node ' args
	
	# 引数がない場合
	args ' items = _ ? func
	
	# 関数と引数リストを空白で結合
	func, ` `, generate_node args state

# リストのコード生成
generate_list : node state ?
	items : node ' items
	
	# 空のリスト
	items = _ ? `_`
	
	# リスト要素をカンマで結合
	generate_list_items : items state ?
		items = _ ? ``
		
		item : items ' 0
		rest : items ' 1~
		
		item_code : generate_node item state
		
		rest = _ ? item_code
		item_code, `, `, generate_list_items rest state
	
	generate_list_items items state

# 条件式のコード生成
generate_condition : node state ?
	condition : generate_node node ' condition state
	then_expr : generate_node node ' then_expr state
	else_expr : generate_node node ' else_expr state
	
	# インデントブロックを使用するかどうかを判断
	complex_then : is_complex_node node ' then_expr
	complex_else : is_complex_node node ' else_expr
	
	complex_then | complex_else ?
		# 複雑な式の場合はインデントブロックを使用
		condition, ` ?\n`
		indent : generate_indent state ' indentation + 1 state ' indent_char
		indent, then_expr, `\n`
		indent, `_ : `, else_expr
	
	# 単純な式の場合は1行で
	condition, ` ? `, then_expr, ` _ : `, else_expr

# 定義のコード生成
generate_define : node state ?
	name : node ' name
	value : generate_node node ' value state
	
	# 複雑な値の場合はインデントブロックを使用
	is_complex_node node ' value ?
		name, ` :\n`
		indent : generate_indent state ' indentation + 1 state ' indent_char
		indent, value
	
	# 単純な値の場合は1行で
	name, ` : `, value

# ヘルパー関数
is_complex_node : node ?
	node ' type = NodeType ' BLOCK |
	node ' type = NodeType ' CONDITION |
	node ' type = NodeType ' LAMBDA & is_complex_node node ' body