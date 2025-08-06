# コード生成器（Code Generator）
# ASTからSign言語のコードを直接JSON形式で生成する

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
	# 直接JSONテキストとして処理
	ast_json : parse_json_text ast
	
	# JSONからSign言語コードを生成
	result : generate_node ast_json code_gen_state
	
	# 結果をテキストとして出力
	`{"generated_code":"`, escape_json_string result, `"}`

# JSON文字列をパース
parse_json_text : json_text ?
	# 実際の実装ではJSON.parseのような関数を使用
	# ここでは簡易的にJSONテキストをそのまま返す
	json_text

# ASTノード別のコード生成
generate_node : node state ?
	# ノードタイプの取得（JSONオブジェクトから）
	node_type : get_json_property node `type`
	
	node_type = `program` ?
		generate_program node state
	
	node_type = `block` ?
		generate_block node state
	
	node_type = `binary_expr` ?
		generate_binary_expr node state
	
	node_type = `unary_expr` ?
		generate_unary_expr node state
	
	node_type = `postfix_expr` ?
		generate_postfix_expr node state
	
	node_type = `lambda` ?
		generate_lambda node state
	
	node_type = `func_call` ?
		generate_func_call node state
	
	node_type = `identifier` ?
		get_json_property node `name`
	
	node_type = `number` ?
		get_json_property node `value`
	
	node_type = `string` ?
		`\``, get_json_property node `value`, `\``
	
	node_type = `char` ?
		`\\`, get_json_property node `value`
	
	node_type = `unit` ?
		`_`
	
	node_type = `list` ?
		generate_list node state
	
	node_type = `condition` ?
		generate_condition node state
	
	node_type = `define` ?
		generate_define node state
	
	# デフォルト (未知のノードタイプ)
	`/* Unknown node type: `, node_type, ` */`

# プログラム（複数の文）のコード生成
generate_program : node state ?
	statements : get_json_property node `statements`
	
	statements = `[]` | statements = `null` ? ``
	
	# 各文を生成して改行で結合
	statements_arr : parse_json_array statements
	
	generate_statements : stmts state result ?
		stmts = _ ? result
		
		stmt : stmts ' 0
		rest : stmts ' 1~
		
		stmt_code : generate_node stmt state
		
		result = _ ?
			generate_statements rest state stmt_code
		
		result, `\n`, generate_statements rest state _
	
	generate_statements statements_arr state _

# ブロックのコード生成
generate_block : node state ?
	statements : get_json_property node `statements`
	
	statements = `[]` | statements = `null` ? ``
	
	# インデントレベルを上げる
	new_state : state
	new_state ' indentation : state ' indentation + 1
	indent : generate_indent new_state ' indentation new_state ' indent_char
	
	# 各文を生成して改行+インデントで結合
	statements_arr : parse_json_array statements
	
	generate_block_statements : stmts state indent result ?
		stmts = _ ? result
		
		stmt : stmts ' 0
		rest : stmts ' 1~
		
		stmt_code : generate_node stmt state
		
		result = _ ?
			generate_block_statements rest state indent indent, stmt_code
		
		result, `\n`, indent, generate_block_statements rest state indent _
	
	generate_block_statements statements_arr new_state indent _

# 二項演算式のコード生成
generate_binary_expr : node state ?
	left : generate_node get_json_property node `left` state
	op : get_json_property node `operator`
	right : generate_node get_json_property node `right` state
	
	# 特別なケース: 関数適用（空白演算子）
	op = ` ` ?
		left, ` `, right
	
	# 標準的な二項演算
	left, ` `, op, ` `, right

# 単項演算式のコード生成
generate_unary_expr : node state ?
	op : get_json_property node `operator`
	expr : generate_node get_json_property node `expr` state
	
	# 前置演算子
	op, expr

# 後置演算式のコード生成
generate_postfix_expr : node state ?
	expr : generate_node get_json_property node `expr` state
	op : get_json_property node `operator`
	
	# 後置演算子
	expr, op

# ラムダ式のコード生成
generate_lambda : node state ?
	params : get_json_property node `params`
	body : generate_node get_json_property node `body` state
	
	# ラムダ構文: params ? body
	params_arr : parse_json_array params
	
	generate_params : params ?
		params = _ ? ``
		
		param : params ' 0
		rest : params ' 1~
		
		rest = _ ? param
		param, ` `, generate_params rest
	
	# パラメータリストと本体を結合
	generate_params params_arr, ` ? `, body

# 関数呼び出しのコード生成
generate_func_call : node state ?
	func : generate_node get_json_property node `func` state
	args : get_json_property node `args`
	
	# 引数がない場合
	args = `[]` | args = `null` ? func
	
	args_node : parse_json_object args
	args_items : get_json_property args_node `items`
	
	args_items = `[]` | args_items = `null` ? func
	
	# 関数と引数リストを空白で結合
	func, ` `, generate_node args_node state

# リストのコード生成
generate_list : node state ?
	items : get_json_property node `items`
	
	# 空のリスト
	items = `[]` | items = `null` ? `_`
	
	# リスト要素をカンマで結合
	items_arr : parse_json_array items
	
	generate_list_items : items state ?
		items = _ ? ``
		
		item : items ' 0
		rest : items ' 1~
		
		item_code : generate_node item state
		
		rest = _ ? item_code
		item_code, `, `, generate_list_items rest state
	
	generate_list_items items_arr stateコード生成
generate_list : node state ?
	items : get_json_property node `items`
	
	# 空のリスト
	items = `[]` | items = `null` ? `_`
	
	# リスト要素をカンマで結合
	items_arr : parse_json_array items
	
	generate_list_items : items state ?
		items = _ ? ``
		
		item : items ' 0
		rest : items ' 1~
		
		item_code : generate_node item state
		
		rest = _ ? item_code
		item_code, `, `, generate_list_items rest state
	
	generate_list_items items_arr state

# 条件式のコード生成
generate_condition : node state ?
	condition : generate_node get_json_property node `condition` state
	then_expr : generate_node get_json_property node `then_expr` state
	else_expr : generate_node get_json_property node `else_expr` state
	
	# インデントブロックを使用するかどうかを判断
	complex_then : is_complex_node get_json_property node `then_expr`
	complex_else : is_complex_node get_json_property node `else_expr`
	
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
	name : get_json_property node `name`
	value_node : get_json_property node `value`
	value : generate_node value_node state
	
	# 複雑な値の場合はインデントブロックを使用
	is_complex_node value_node ?
		name, ` :\n`
		indent : generate_indent state ' indentation + 1 state ' indent_char
		indent, value
	
	# 単純な値の場合は1行で
	name, ` : `, value

# ヘルパー関数

# 複雑なノードかどうかの判定
is_complex_node : node ?
	node_type : get_json_property node `type`
	
	node_type = `block` |
	node_type = `condition` |
	(node_type = `lambda` & is_complex_node get_json_property node `body`)

# JSONオブジェクトからプロパティを取得
get_json_property : json_obj property ?
	# 実際の実装ではJSON.getPropertyのような関数を使用
	# ここでは簡易的に実装
	
	# JSONオブジェクトがない場合
	json_obj = _ | json_obj = `null` ? `null`
	
	# プロパティ名に応じて値を返す
	property = `type` ? get_json_type json_obj
	property = `name` ? get_json_name json_obj
	property = `value` ? get_json_value json_obj
	property = `operator` ? get_json_operator json_obj
	property = `left` ? get_json_left json_obj
	property = `right` ? get_json_right json_obj
	property = `expr` ? get_json_expr json_obj
	property = `params` ? get_json_params json_obj
	property = `body` ? get_json_body json_obj
	property = `func` ? get_json_func json_obj
	property = `args` ? get_json_args json_obj
	property = `items` ? get_json_items json_obj
	property = `statements` ? get_json_statements json_obj
	property = `condition` ? get_json_condition json_obj
	property = `then_expr` ? get_json_then_expr json_obj
	property = `else_expr` ? get_json_else_expr json_obj
	
	# 未知のプロパティ
	`null`

# 簡易JSONパース関数群
get_json_type : json ? `type`
get_json_name : json ? `name`
get_json_value : json ? `value`
get_json_operator : json ? `operator`
get_json_left : json ? `left`
get_json_right : json ? `right`
get_json_expr : json ? `expr`
get_json_params : json ? `params`
get_json_body : json ? `body`
get_json_func : json ? `func`
get_json_args : json ? `args`
get_json_items : json ? `items`
get_json_statements : json ? `statements`
get_json_condition : json ? `condition`
get_json_then_expr : json ? `then_expr`
get_json_else_expr : json ? `else_expr`

# JSON配列をパース
parse_json_array : json_array ?
	# 実際の実装ではJSON.parseのような関数を使用
	# ここでは簡易的に空配列を返す
	_

# JSONオブジェクトをパース
parse_json_object : json_obj ?
	# 実際の実装ではJSON.parseのような関数を使用
	# ここでは簡易的に入力をそのまま返す
	json_obj

# JSON文字列のエスケープ
escape_json_string : str ?
	# 実装省略（文字列中の特殊文字をエスケープ処理）
	strコード生成
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