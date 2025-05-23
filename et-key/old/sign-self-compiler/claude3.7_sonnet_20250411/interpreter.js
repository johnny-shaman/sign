# Sign言語インタプリタ
# ASTノードを評価して結果を返す

# 評価環境
evaluation_env :
	bindings : _     # 変数の束縛
	parent : _       # 親環境 (スコープチェーン)

# 新しい環境を作成
create_env : parent ?
	env : evaluation_env
	env ' bindings : _
	env ' parent : parent
	env

# 環境から変数の値を取得
lookup : env name ?
	# 現在の環境でチェック
	env ' bindings ' name != _ ?
		env ' bindings ' name
	
	# 親環境がある場合は再帰的に検索
	env ' parent != _ ?
		lookup env ' parent name
	
	# 見つからない場合
	_

# 環境に変数を定義
define : env name value ?
	new_env : env
	new_env ' bindings ' name : value
	new_env

# インタプリタのメインエントリポイント
interpret : ast env ?
	# ASTがなければNull
	ast = _ ? _, env
	
	# ノードタイプに基づいて評価
	ast ' type = NodeType ' PROGRAM ?
		interpret_program ast env
	
	ast ' type = NodeType ' BLOCK ?
		interpret_block ast env
	
	ast ' type = NodeType ' BINARY_EXPR ?
		interpret_binary_expr ast env
	
	ast ' type = NodeType ' UNARY_EXPR ?
		interpret_unary_expr ast env
	
	ast ' type = NodeType ' POSTFIX_EXPR ?
		interpret_postfix_expr ast env
	
	ast ' type = NodeType ' LAMBDA ?
		interpret_lambda ast env
	
	ast ' type = NodeType ' FUNC_CALL ?
		interpret_func_call ast env
	
	ast ' type = NodeType ' IDENTIFIER ?
		interpret_identifier ast env
	
	ast ' type = NodeType ' NUMBER ?
		interpret_number ast env
	
	ast ' type = NodeType ' STRING ?
		interpret_string ast env
	
	ast ' type = NodeType ' CHAR ?
		interpret_char ast env
	
	ast ' type = NodeType ' UNIT ?
		interpret_unit ast env
	
	ast ' type = NodeType ' LIST ?
		interpret_list ast env
	
	ast ' type = NodeType ' CONDITION ?
		interpret_condition ast env
	
	ast ' type = NodeType ' DEFINE ?
		interpret_define ast env
	
	# 未知のノードタイプ
	`Error: Unknown node type: `, ast ' type, env

# プログラムの評価 (プログラムはいくつかの文から成る)
interpret_program : ast env ?
	statements : ast ' value
	
	statements = _ ? _, env
	
	# 各文を評価
	interpret_statements : stmts env ?
		stmts = _ ? _, env
		
		stmt : stmts ' 0
		rest : stmts ' 1~
		
		# 現在の文を評価
		result : interpret stmt env
		value : result ' 0
		new_env : result ' 1
		
		# 最後の文なら結果を返す
		rest = _ ? value, new_env
		
		# そうでなければ次の文を評価
		interpret_statements rest new_env
	
	interpret_statements statements env

# ブロックの評価 (ローカルスコープを作成)
interpret_block : ast env ?
	statements : ast ' value
	
	# 新しいスコープを作成
	local_env : create_env env
	
	statements = _ ? _, local_env
	
	# ブロック内の文を評価
	result : interpret_program create_node NodeType ' PROGRAM statements local_env
	value : result ' 0
	block_env : result ' 1
	
	# 元の環境に戻るが、結果値は保持
	value, env

# 二項演算式の評価
interpret_binary_expr : ast env ?
	# 演算子を取得
	op : ast ' operator
	
	# 特殊な演算子の処理
	
	# 定義演算子 (:)
	op = `:` ?
		interpret_define ast env
	
	# 論理演算子 - ショートサーキット評価
	op = `&` ?
		# 左辺を評価
		left_result : interpret ast ' left env
		left_value : left_result ' 0
		
		# 左辺がfalseならショートサーキット
		is_true left_value ?
			# 右辺を評価
			interpret ast ' right left_result ' 1
		
		# falseを返す
		_, left_result ' 1
	
	op = `|` ?
		# 左辺を評価
		left_result : interpret ast ' left env
		left_value : left_result ' 0
		
		# 左辺がtrueならショートサーキット
		is_true left_value ?
			left_value, left_result ' 1
		
		# 右辺を評価
		interpret ast ' right left_result ' 1
	
	# 通常の演算子 - 両方のオペランドを評価
	
	# 左辺を評価
	left_result : interpret ast ' left env
	left_value : left_result ' 0
	
	# 右辺を評価
	right_result : interpret ast ' right left_result ' 1
	right_value : right_result ' 0
	
	# 演算子に基づいて計算
	op = `+` ?
		left_value + right_value, right_result ' 1
	
	op = `-` ?
		left_value - right_value, right_result ' 1
	
	op = `*` ?
		left_value * right_value, right_result ' 1
	
	op = `/` ?
		left_value / right_value, right_result ' 1
	
	op = `%` ?
		left_value % right_value, right_result ' 1
	
	op = `^` ?
		power left_value right_value, right_result ' 1
	
	op = `<` ?
		left_value < right_value, right_result ' 1
	
	op = `<=` ?
		left_value <= right_value, right_result ' 1
	
	op = `=` ?
		is_equal left_value right_value, right_result ' 1
	
	op = `>=` ?
		left_value >= right_value, right_result ' 1
	
	op = `>` ?
		left_value > right_value, right_result ' 1
	
	op = `!=` ?
		!is_equal left_value right_value, right_result ' 1
	
	op = `;` ?  # XOR
		is_true left_value != is_true right_value, right_result ' 1
	
	op = `,` ?  # リスト構築 (cons)
		cons left_value right_value, right_result ' 1
	
	op = ` ` ?  # 余積 (適用)
		apply_op left_value right_value right_result ' 1
	
	# 未知の演算子
	`Error: Unknown binary operator: `, op, right_result ' 1

# 単項演算式の評価
interpret_unary_expr : ast env ?
	# 演算子を取得
	op : ast ' operator
	
	# 式を評価
	expr_result : interpret ast ' expr env
	expr_value : expr_result ' 0
	
	# 演算子に基づいて計算
	op = `!` ?
		!is_true expr_value, expr_result ' 1
	
	op = `~` ?  # 展開
		expand_list expr_value, expr_result ' 1
	
	op = `$` ?  # アドレス取得
		get_address expr_value, expr_result ' 1
	
	op = `@` ?  # 入力
		get_input expr_value, expr_result ' 1
	
	op = `#` ?  # エクスポート
		export_symbol expr_value, expr_result ' 1
	
	# 未知の演算子
	`Error: Unknown unary operator: `, op, expr_result ' 1

# 後置演算式の評価
interpret_postfix_expr : ast env ?
	# 式を評価
	expr_result : interpret ast ' expr env
	expr_value : expr_result ' 0
	
	# 演算子を取得
	op : ast ' operator
	
	# 演算子に基づいて計算
	op = `!` ?  # 階乗
		factorial expr_value, expr_result ' 1
	
	op = `~` ?  # 展開
		expand_list expr_value, expr_result ' 1
	
	op = `@` ?  # インポート
		import_file expr_value, expr_result ' 1
	
	# 未知の演算子
	`Error: Unknown postfix operator: `, op, expr_result ' 1

# ラムダ式の評価 (クロージャを作成)
interpret_lambda : ast env ?
	# パラメータと本体を取得
	params : ast ' params
	body : ast ' body
	
	# クロージャを作成
	closure :
		type : `closure`
		params : params
		body : body
		env : env  # 現在の環境をキャプチャ
	
	closure, env

# 関数呼び出しの評価
interpret_func_call : ast env ?
	# 関数式を評価
	func_result : interpret ast ' func env
	func_value : func_result ' 0
	
	# 組み込み関数の場合
	is_builtin_function func_value ?
		# 引数を評価
		args_result : interpret_list ast ' args func_result ' 1
		args_value : args_result ' 0
		
		# 組み込み関数を呼び出す
		result : call_builtin_function func_value args_value
		result, args_result ' 1
	
	# クロージャの場合
	func_value ' type = `closure` ?
		# 引数を評価
		args_result : interpret_list ast ' args func_result ' 1
		args_value : args_result ' 0
		
		# クロージャを呼び出す
		call_closure func_value args_value args_result ' 1
	
	# 呼び出し可能でない値
	`Error: Not a callable value: `, func_value, func_result ' 1

# 識別子の評価 (変数参照)
interpret_identifier : ast env ?
	name : ast ' value
	
	# 環境から値を取得
	value : lookup env name
	
	value = _ ?
		`Error: Undefined variable: `, name, env
	
	value, env

# 数値リテラルの評価
interpret_number : ast env ?
	# 文字列を数値に変換
	value : ast ' value
	number : parse_number value
	
	number, env

# 文字列リテラルの評価
interpret_string : ast env ?
	ast ' value, env

# 文字リテラルの評価
interpret_char : ast env ?
	ast ' value, env

# Unitリテラルの評価
interpret_unit : ast env ?
	_, env

# リストの評価
interpret_list : ast env ?
	items : ast ' items
	
	items = _ ? _, env
	
	# 各要素を評価
	eval_list_items : items env acc ?
		items = _ ? acc, env
		
		item : items ' 0
		rest : items ' 1~
		
		# 現在の要素を評価
		item_result : interpret item env
		item_value : item_result ' 0
		
		# 累積リストに追加
		new_acc : cons item_value acc
		
		# 残りの要素を評価
		eval_list_items rest item_result ' 1 new_acc
	
	# 空のリストから開始して逆順に構築
	result : eval_list_items items env _
	
	# 結果を反転
	reverse_list result ' 0, result ' 1

# 条件式の評価
interpret_condition : ast env ?
	# 条件を評価
	cond_result : interpret ast ' condition env
	cond_value : cond_result ' 0
	
	# 条件に基づいて分岐
	is_true cond_value ?
		# then節を評価
		interpret ast ' then_expr cond_result ' 1
	
	# else節を評価
	interpret ast ' else_expr cond_result ' 1

# 定義の評価
interpret_define : ast env ?
	# 名前を取得
	name : ast ' name
	
	# 値を評価
	value_result : interpret ast ' value env
	value : value_result ' 0
	
	# 環境に定義を追加
	new_env : define value_result ' 1 name value
	
	# 定義は値自体を返す
	value, new_env

# ヘルパー関数

# リスト操作
cons : head tail ?
	list : _
	list ' 0 : head
	list ' 1~ : tail
	list

# リストの逆転
reverse_list : lst env ?
	result : _
	
	reverse_impl : lst result ?
		lst = _ ? result
		
		head : lst ' 0
		tail : lst ' 1~
		
		new_result : cons head result
		reverse_impl tail new_result
	
	reversed : reverse_impl lst _
	reversed, env

# リストの展開 (flatten)
expand_list : lst env ?
	# 実装省略
	lst, env

# 階乗計算
factorial : n env ?
	n <= 1 ? 1, env
	
	n * factorial n - 1 env ' 0, env

# 累乗計算
power : base exponent env ?
	exponent = 0 ? 1, env
	
	base * power base exponent - 1 env ' 0, env

# 真偽判定
is_true : value ?
	value = _ ? _
	value = 0 ? _
	value ' type = `closure` ? _
	1

# 等価判定
is_equal : a b ?
	a = b ? 1
	_

# 文字列から数値へのパース
parse_number : str ?
	# 16進数
	str ' 0 = \0 & str ' 1 = \x ?
		parse_hex_number str ' 2~
	
	# 8進数
	str ' 0 = \0 & str ' 1 = \o ?
		parse_oct_number str ' 2~
	
	# 2進数
	str ' 0 = \0 & str ' 1 = \b ?
		parse_bin_number str ' 2~
	
	# 10進数
	parse_dec_number str

# 10進数のパース
parse_dec_number : str ?
	# 実装省略 (文字列を数値に変換)
	0

# 16進数のパース
parse_hex_number : str ?
	# 実装省略
	0

# 8進数のパース
parse_oct_number : str ?
	# 実装省略
	0

# 2進数のパース
parse_bin_number : str ?
	# 実装省略
	0

# クロージャの呼び出し
call_closure : closure args env ?
	# 新しいスコープを作成
	call_env : create_env closure ' env
	
	# パラメータを束縛
	bind_params : params args env ?
		params = _ ?
			args = _ ? env
			`Error: Too many arguments`, env
		
		args = _ ?
			`Error: Not enough arguments`, env
		
		param : params ' 0
		arg : args ' 0
		
		rest_params : params ' 1~
		rest_args : args ' 1~
		
		# 現在のパラメータを束縛
		new_env : define env param arg
		
		# 残りのパラメータを束縛
		bind_params rest_params rest_args new_env
	
	bind_result : bind_params closure ' params args call_env
	
	bind_result ' 0 = `Error` ?
		bind_result
	
	# 関数本体を評価
	interpret closure ' body bind_result

# 組み込み関数の呼び出し
call_builtin_function : func args ?
	# 実装省略 (組み込み関数を呼び出す)
	_, _

# 組み込み関数の判定
is_builtin_function : value ?
	# 実装省略
	_

# アドレス取得 (参照)
get_address : value env ?
	# 実装省略
	value, env

# 入力操作
get_input : address env ?
	# 実装省略
	`Input value`, env

# エクスポート操作
export_symbol : value env ?
	# 実装省略
	value, env

# ファイルのインポート
import_file : filename env ?
	# 実装省略
	`Imported module`, env

# 余積演算 (適用)
apply_op : left right env ?
	# 左辺が関数の場合は関数適用
	left ' type = `closure` ?
		call_closure left right env
	
	# そうでなければ結合
	concat left right, env

# リストや文字列の連結
concat : a b ?
	# 両方がリストの場合
	is_list a & is_list b ?
		concat_lists a b
	
	# 両方が文字列の場合
	is_string a & is_string b ?
		concat_strings a b
	
	# その他の場合はエラー
	`Error: Cannot concatenate non-list/string values`

# リストの連結
concat_lists : a b ?
	a = _ ? b
	
	head : a ' 0
	tail : a ' 1~
	
	cons head concat_lists tail b

# 文字列の連結
concat_strings : a b ?
	a, b

# リストの判定
is_list : value ?
	value = _ ? 1
	value ' 0 != _ ? 1
	_

# 文字列の判定
is_string : value ?
	# 文字列の判定ロジック
	_
