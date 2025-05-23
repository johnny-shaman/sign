# Sign言語セルフコンパイラ - 最小実装

# メインコンパイラ構造
compiler : source ?
	tokens : tokenize source
	ast : parse tokens
	code : generate ast
	code

# 1. 字句解析器（Tokenizer）
# ソースを文字ごとに解析しトークンのリストを生成
tokenize : source ?
	tokenize_impl source _ _

# 字句解析の実装部分
# accはトークンのリスト、currentは現在処理中の文字の蓄積
tokenize_impl : source acc current ?
	source = _ : 
		current != _ ? acc, current
		acc
	
	c : source ' 0
	rest : source ' 1~
	
	# 空白文字の処理
	c = \  ? 
		current = _ ? tokenize_impl rest acc current
		tokenize_impl rest acc, current, c
	
	# タブ文字の処理
	c = \	 ?
		current = _ ? tokenize_impl rest acc, `TAB`
		tokenize_impl rest acc, current, `TAB`
	
	# 改行の処理
	c = \
 ?
		current = _ ? tokenize_impl rest acc, `NL`
		tokenize_impl rest acc, current, `NL`
	
	# 数字の処理
	digit c ?
		digit current ? tokenize_impl rest acc current, c
		tokenize_impl rest acc, current, c
	
	# 演算子の処理
	operator c ?
		current = _ ? tokenize_impl rest acc c
		tokenize_impl rest acc, current, c
	
	# 識別子の処理
	letter c ?
		letter current | digit current ? tokenize_impl rest acc current, c
		tokenize_impl rest acc, current, c
	
	# その他の文字
	current = _ ? tokenize_impl rest acc c
	tokenize_impl rest acc, current, c

# ヘルパー関数
digit : c ? c >= \0 & c <= \9
letter : c ? c >= \a & c <= \z | c >= \A & c <= \Z | c = \_
operator : c ? c = \+ | c = \- | c = \* | c = \/ | c = \% | c = \^ | c = \! | c = \? | c = \: | c = \, | c = \~ | c = \' | c = \@ | c = \# | c = \& | c = \| | c = \; | c = \< | c = \> | c = \= | c = \$

# 2. 構文解析器（Parser）
# トークンをASTに変換
parse : tokens ?
	# トークンリストの先頭から式を解析
	result : parse_expr tokens
	result ' 0  # ASTを返す（parse_exprは[AST, 残りのトークン]を返す）

# 式の解析
parse_expr : tokens ?
	tokens = _ ? _, tokens
	
	# トークンリストの先頭から項を解析
	term_result : parse_term tokens
	term : term_result ' 0
	rest : term_result ' 1
	
	# 二項演算子がある場合は処理
	rest != _ & binary_op rest ' 0 ?
		op : rest ' 0
		next_rest : rest ' 1~
		right_result : parse_expr next_rest
		right : right_result ' 0
		final_rest : right_result ' 1
		
		ast : 
			op : op
			left : term
			right : right
		
		ast, final_rest
	
	# 二項演算子がない場合は項を返す
	term, rest

# 項の解析
parse_term : tokens ?
	tokens = _ ? _, tokens
	
	token : tokens ' 0
	rest : tokens ' 1~
	
	# 数値リテラル
	digit token ' 0 ?
		number : token
		number, rest
	
	# 識別子
	letter token ' 0 ?
		id : token
		id, rest
	
	# かっこ式
	token = \( | token = \[ | token = \{ ?
		content_result : parse_expr rest
		content : content_result ' 0
		after_content : content_result ' 1
		
		# 閉じかっこを確認
		after_content ' 0 = \) | after_content ' 0 = \] | after_content ' 0 = \} ?
			content, after_content ' 1~
		
		# エラー処理
		`ERROR: Missing closing bracket`, _
	
	# ラムダ式
	token = \? ?
		params_result : parse_params rest
		params : params_result ' 0
		body_rest : params_result ' 1
		
		body_result : parse_expr body_rest
		body : body_result ' 0
		after_body : body_result ' 1
		
		lambda_ast :
			type : `lambda`
			params : params
			body : body
		
		lambda_ast, after_body
	
	# エラー処理
	`ERROR: Unexpected token`, _

# パラメータリストの解析
parse_params : tokens ?
	params : _
	
	loop_parse_params : tokens params ?
		tokens = _ ? params, tokens
		
		token : tokens ' 0
		rest : tokens ' 1~
		
		# 識別子の場合はパラメータとして追加
		letter token ' 0 ?
			loop_parse_params rest params, token
		
		# それ以外は終了
		params, tokens

# 3. コード生成器
# ASTからコードを生成
generate : ast ?
	ast_type : ast ' type
	
	# 数値リテラル
	ast_type = `number` ? ast ' value
	
	# 識別子
	ast_type = `identifier` ? ast ' name
	
	# ラムダ式
	ast_type = `lambda` ?
		params : ast ' params
		body : ast ' body
		
		params_str : generate_params params
		body_str : generate body
		
		params_str, ` ? `, body_str
	
	# 二項演算
	ast_type = `binary` ?
		left : generate ast ' left
		op : ast ' op
		right : generate ast ' right
		
		left, ` `, op, ` `, right
	
	# エラー処理
	ast_type = _ ? `ERROR: Unknown AST node type`
	`ERROR: Unhandled AST node type: `, ast_type

# パラメータリストの生成
generate_params : params ?
	params = _ ? ``
	
	param : params ' 0
	rest : params ' 1~
	
	rest = _ ? param
	param, ` `, generate_params rest
