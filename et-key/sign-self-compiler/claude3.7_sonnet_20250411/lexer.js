# 字句解析器（Lexer）
# Sign言語の字句解析器の詳細実装

# トークンの種類の定義
TokenType :
	EOF : `EOF`
	ID : `ID`
	NUMBER : `NUMBER`
	STRING : `STRING`
	CHAR : `CHAR`
	INDENT : `INDENT`
	DEDENT : `DEDENT`
	NEWLINE : `NEWLINE`
	OPERATOR : `OPERATOR`
	LPAREN : `LPAREN`
	RPAREN : `RPAREN`
	LBRACKET : `LBRACKET`
	RBRACKET : `RBRACKET`
	LBRACE : `LBRACE`
	RBRACE : `RBRACE`
	UNIT : `UNIT`

# トークン生成関数
create_token : type value line col ?
	token :
		type : type
		value : value
		line : line
		col : col
	token

# 字句解析器
lexer : source ?
	state :
		source : source
		position : 0
		line : 1
		column : 1
		indent_stack : 0
		tokens : _
	
	lexer_impl state

# 字句解析の実装
lexer_impl : state ?
	state ' source = _ | state ' position >= length state ' source ?
		# 終了処理（インデント解除を挿入）
		handle_dedents state, _
	
	current_char : peek_char state
	
	current_char = _ ?
		# ファイル終端
		add_token state TokenType ' EOF _ state ' line state ' column
	
	current_char = \  ?
		# スペース処理
		handle_whitespace state
	
	current_char = \	 ?
		# タブ処理
		handle_tab state
	
	current_char = \
 ?
		# 改行処理
		handle_newline state
	
	current_char = \` ?
		# 文字列処理
		handle_string state
	
	current_char = \\ ?
		# 文字リテラル処理
		handle_char_literal state
	
	current_char = \_ ?
		# Unitリテラル処理
		handle_unit state
	
	is_digit current_char ?
		# 数値処理
		handle_number state
	
	is_identifier_start current_char ?
		# 識別子処理
		handle_identifier state
	
	is_operator current_char ?
		# 演算子処理
		handle_operator state
	
	is_bracket current_char ?
		# カッコ処理
		handle_bracket state
	
	# その他の文字（エラー）
	error : `Unexpected character: `
	error, current_char
	advance state
	lexer_impl state

# 文字判定関数
is_digit : c ? c >= \0 & c <= \9
is_hex_digit : c ? is_digit c | (c >= \a & c <= \f) | (c >= \A & c <= \F)
is_identifier_start : c ? (c >= \a & c <= \z) | (c >= \A & c <= \Z) | c = \_
is_identifier_part : c ? is_identifier_start c | is_digit c
is_operator : c ? c = \+ | c = \- | c = \* | c = \/ | c = \% | c = \^ | c = \! | c = \? | c = \: | c = \, | c = \~ | c = \' | c = \@ | c = \# | c = \& | c = \| | c = \; | c = \< | c = \> | c = \= | c = \$
is_bracket : c ? c = \( | c = \) | c = \[ | c = \] | c = \{ | c = \}

# ヘルパー関数
peek_char : state ?
	state ' position >= length state ' source ? _
	state ' source ' state ' position

advance : state ?
	new_state : state
	new_state ' position : state ' position + 1
	new_state ' column : state ' column + 1
	new_state

add_token : state type value line col ?
	token : create_token type value line col
	new_state : state
	new_state ' tokens : state ' tokens, token
	new_state

# 空白処理
handle_whitespace : state ?
	# 空白をスキップ
	new_state : advance state
	lexer_impl new_state

# タブ処理
handle_tab : state ?
	new_state : advance state
	# インデントの計算はここで行う（実際の実装ではもっと複雑）
	lexer_impl new_state

# 改行処理
handle_newline : state ?
	new_state : advance state
	new_state ' line : state ' line + 1
	new_state ' column : 1
	
	# 改行トークンを追加
	new_state : add_token new_state TokenType ' NEWLINE `\n` state ' line state ' column
	
	# 次の行のインデントレベルを計算する処理を追加
	lexer_impl new_state

# 文字列処理
handle_string : state ?
	# 開始バッククォートを消費
	new_state : advance state
	start_pos : new_state ' position
	
	# 文字列の終了を探す
	find_string_end : curr_state ?
		peek_char curr_state = _ ?
			# 文字列が閉じられずに終了
			`Error: Unterminated string literal`
		
		peek_char curr_state = \` ?
			# 文字列の終了
			string_value : substring curr_state ' source start_pos curr_state ' position
			# バッククォートを消費
			new_curr_state : advance curr_state
			# 文字列トークンを追加
			add_token new_curr_state TokenType ' STRING string_value state ' line state ' column
		
		# 文字列内の文字を消費
		find_string_end advance curr_state
	
	string_state : find_string_end new_state
	lexer_impl string_state

# 文字リテラル処理
handle_char_literal : state ?
	# バックスラッシュを消費
	new_state : advance state
	
	peek_char new_state = _ ?
		# 文字リテラルが閉じられずに終了
		`Error: Incomplete character literal`
	
	# 文字を消費
	char_value : peek_char new_state
	new_state : advance new_state
	
	# 文字トークンを追加
	new_state : add_token new_state TokenType ' CHAR char_value state ' line state ' column
	
	lexer_impl new_state

# Unitリテラル処理
handle_unit : state ?
	# '_'を消費
	new_state : advance state
	
	# 次の文字がidentifier_partでなければUnit
	peek_char new_state != _ & is_identifier_part peek_char new_state ?
		# '_'で始まる識別子として処理
		handle_identifier state
	
	# Unitトークンを追加
	new_state : add_token new_state TokenType ' UNIT `_` state ' line state ' column
	
	lexer_impl new_state

# 数値処理
handle_number : state ?
	start_pos : state ' position
	
	# 数値の種類を判断
	peek_char state = \0 & peek_char advance state = \x ?
		# 16進数
		handle_hex_number state
	
	peek_char state = \0 & peek_char advance state = \o ?
		# 8進数
		handle_octal_number state
	
	peek_char state = \0 & peek_char advance state = \b ?
		# 2進数
		handle_binary_number state
	
	# 10進数（整数または小数）
	consume_digits : curr_state ?
		next_char : peek_char curr_state
		next_char = _ | !is_digit next_char ?
			# 数字でなければ終了
			curr_state
		
		# 数字を消費して続行
		consume_digits advance curr_state
	
	# 整数部分を消費
	int_state : consume_digits state
	
	# 小数点があるか確認
	peek_char int_state = \. ?
		# 小数点を消費
		decimal_state : advance int_state
		
		# 小数部分を消費
		float_state : consume_digits decimal_state
		
		# 数値トークン（浮動小数点）を追加
		number_value : substring state ' source start_pos float_state ' position
		new_state : add_token float_state TokenType ' NUMBER number_value state ' line state ' column
		lexer_impl new_state
	
	# 整数トークンを追加
	number_value : substring state ' source start_pos int_state ' position
	new_state : add_token int_state TokenType ' NUMBER number_value state ' line state ' column
	lexer_impl new_state

# 16進数処理
handle_hex_number : state ?
	# '0x'を消費
	new_state : advance advance state
	start_pos : new_state ' position
	
	# 16進数を消費
	consume_hex_digits : curr_state ?
		next_char : peek_char curr_state
		next_char = _ | !is_hex_digit next_char ?
			# 16進数でなければ終了
			curr_state
		
		# 16進数を消費して続行
		consume_hex_digits advance curr_state
	
	hex_state : consume_hex_digits new_state
	
	# 16進数トークンを追加
	hex_value : `0x`, substring state ' source start_pos hex_state ' position
	new_state : add_token hex_state TokenType ' NUMBER hex_value state ' line state ' column
	lexer_impl new_state

# 8進数処理 (handle_octal_number)と2進数処理 (handle_binary_number)も同様に実装

# 識別子処理
handle_identifier : state ?
	start_pos : state ' position
	
	# 識別子の残りを消費
	consume_identifier : curr_state ?
		next_char : peek_char curr_state
		next_char = _ | !is_identifier_part next_char ?
			# 識別子の一部でなければ終了
			curr_state
		
		# 識別子の一部を消費して続行
		consume_identifier advance curr_state
	
	id_state : consume_identifier state
	
	# 識別子トークンを追加
	id_value : substring state ' source start_pos id_state ' position
	new_state : add_token id_state TokenType ' ID id_value state ' line state ' column
	lexer_impl new_state

# 演算子処理
handle_operator : state ?
	char : peek_char state
	new_state : advance state
	
	# 複合演算子の判定
	char = \< & peek_char new_state = \= ?
		# '<=' 演算子
		new_state : advance new_state
		new_state : add_token new_state TokenType ' OPERATOR `<=` state ' line state ' column
		lexer_impl new_state
	
	char = \> & peek_char new_state = \= ?
		# '>=' 演算子
		new_state : advance new_state
		new_state : add_token new_state TokenType ' OPERATOR `>=` state ' line state ' column
		lexer_impl new_state
	
	char = \= & peek_char new_state = \= ?
		# '==' 演算子
		new_state : advance new_state
		new_state : add_token new_state TokenType ' OPERATOR `==` state ' line state ' column
		lexer_impl new_state
	
	char = \! & peek_char new_state = \= ?
		# '!=' 演算子
		new_state : advance new_state
		new_state : add_token new_state TokenType ' OPERATOR `!=` state ' line state ' column
		lexer_impl new_state
	
	# 単一演算子
	new_state : add_token new_state TokenType ' OPERATOR char state ' line state ' column
	lexer_impl new_state

# カッコ処理
handle_bracket : state ?
	char : peek_char state
	new_state : advance state
	
	# カッコの種類判定
	char = \( ?
		new_state : add_token new_state TokenType ' LPAREN char state ' line state ' column
	
	char = \) ?
		new_state : add_token new_state TokenType ' RPAREN char state ' line state ' column
	
	char = \[ ?
		new_state : add_token new_state TokenType ' LBRACKET char state ' line state ' column
	
	char = \] ?
		new_state : add_token new_state TokenType ' RBRACKET char state ' line state ' column
	
	char = \{ ?
		new_state : add_token new_state TokenType ' LBRACE char state ' line state ' column
	
	char = \} ?
		new_state : add_token new_state TokenType ' RBRACE char state ' line state ' column
	
	lexer_impl new_state

# インデント解除の処理
handle_dedents : state current_indent ?
	state ' indent_stack = _ ? state
	
	top_indent : state ' indent_stack ' 0
	
	current_indent < top_indent ?
		# インデント解除トークンを追加
		new_state : add_token state TokenType ' DEDENT _ state ' line state ' column
		
		# インデントスタックから取り除く
		new_state ' indent_stack : state ' indent_stack ' 1~
		
		# 次のインデントレベルをチェック
		handle_dedents new_state current_indent
	
	state

# 文字列操作関数
substring : str start end ?
	# 部分文字列を抽出する関数（実際の実装では言語の文字列操作APIを使用）
	result : _
	
	extract : i result ?
		i >= end ? result
		result, str ' i
		extract i + 1 result
	
	extract start _

# 文字列の長さを取得
length : str ?
	# 文字列の長さを取得する関数（実際の実装では言語の文字列操作APIを使用）
	count : 0
	
	count_chars : i count ?
		str ' i = _ ? count
		count_chars i + 1 count + 1
	
	count_chars 0 0
