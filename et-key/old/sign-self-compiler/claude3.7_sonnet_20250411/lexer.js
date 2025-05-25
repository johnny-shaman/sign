# 字句解析器（Lexer）
# Sign言語のモードベース字句解析器の詳細実装

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
	COMMENT : `COMMENT`

# レキサーのモード定義
LexerMode :
	NORMAL : `normal`       # 通常トークン処理
	STRING_MODE : `string`  # 文字列リテラル内
	CHAR_MODE : `char`      # 文字リテラル内
	COMMENT_MODE : `comment` # コメント内
	INDENT_MODE : `indent`  # インデント計算中

# トークン生成関数
create_token : type value line col ?
	# 直接JSONオブジェクトとして構築
	`{"type":"`, type, `","value":"`, escape_json_string value, `","line":`, line, `,"col":`, col, `}`

# 字句解析器
lexer : source ?
	state :
		source : source
		position : 0
		line : 1
		column : 1
		mode : LexerMode ' NORMAL
		mode_stack : _
		indent_stack : 0
		tokens : _
		pending_indents : _
		pending_dedents : 0
	
	# 字句解析を実行
	analyze_result : lexer_impl state
	
	# 結果を返す（トークン配列のJSON文字列）
	tokens_to_json_array analyze_result ' tokens

# 字句解析の実装
lexer_impl : state ?
	# ソースの終了チェック
	state ' position >= length state ' source ?
		# 終了処理（インデント解除などを挿入）
		finalize_lexer state
	
	# 現在の文字を取得
	current_char : peek_char state
	
	# 現在のモードに基づいて処理
	current_mode : state ' mode
	
	current_mode = LexerMode ' NORMAL ?
		process_normal_mode current_char state
	
	current_mode = LexerMode ' STRING_MODE ?
		process_string_mode current_char state
	
	current_mode = LexerMode ' CHAR_MODE ?
		process_char_mode current_char state
	
	current_mode = LexerMode ' COMMENT_MODE ?
		process_comment_mode current_char state
	
	current_mode = LexerMode ' INDENT_MODE ?
		process_indent_mode current_char state
	
	# 未知のモード
	`Error: Unknown lexer mode:`
	state

# 通常モードの処理
process_normal_mode : char state ?
	# 文字なし（EOF）
	char = _ ?
		# EOFトークンを追加して終了
		add_token state TokenType ' EOF `` state ' line state ' column
	
	# 空白
	char = \  ?
		# 行頭の場合はインデントモードへ
		state ' column = 1 ?
			new_state : change_lexer_mode state LexerMode ' INDENT_MODE
			process_indent_mode char new_state
		
		# それ以外は空白をスキップ
		advance state
	
	# タブ
	char = \	 ?
		# 行頭の場合はインデントモードへ
		state ' column = 1 ?
			new_state : change_lexer_mode state LexerMode ' INDENT_MODE
			process_indent_mode char new_state
		
		# タブが演算子として使用される場合
		handle_tab_operator state
	
	# 改行
	char = \
 ?
		# 改行トークンを追加
		new_state : add_token state TokenType ' NEWLINE `\n` state ' line state ' column
		
		# 次の行へ
		new_state : advance new_state
		new_state ' line : state ' line + 1
		new_state ' column : 1
		
		# インデントモードへ
		change_lexer_mode new_state LexerMode ' INDENT_MODE
	
	# バッククォート（文字列開始またはコメント）
	char = \` ?
		# 行頭ならコメント、それ以外は文字列
		state ' column = 1 ?
			new_state : change_lexer_mode state LexerMode ' COMMENT_MODE
			process_comment_mode char new_state
		
		# 文字列モードへ
		new_state : change_lexer_mode state LexerMode ' STRING_MODE
		advance new_state
	
	# バックスラッシュ（文字リテラル）
	char = \\ ?
		new_state : change_lexer_mode state LexerMode ' CHAR_MODE
		advance new_state
	
	# アンダースコア（Unit）
	char = \_ ?
		# 次の文字がidentifier_partでなければUnit
		next_char : peek_char advance state
		next_char != _ & is_identifier_part next_char ?
			# '_'で始まる識別子として処理
			handle_identifier state
		
		# Unitトークンを追加
		new_state : add_token state TokenType ' UNIT `_` state ' line state ' column
		advance new_state
	
	# 数字（数値リテラル）
	is_digit char ?
		handle_number state
	
	# 識別子の開始文字
	is_identifier_start char ?
		handle_identifier state
	
	# 演算子
	is_operator char ?
		handle_operator state
	
	# 括弧類
	char = \( ?
		new_state : add_token state TokenType ' LPAREN char state ' line state ' column
		advance new_state
	
	char = \) ?
		new_state : add_token state TokenType ' RPAREN char state ' line state ' column
		advance new_state
	
	char = \[ ?
		new_state : add_token state TokenType ' LBRACKET char state ' line state ' column
		advance new_state
	
	char = \] ?
		new_state : add_token state TokenType ' RBRACKET char state ' line state ' column
		advance new_state
	
	char = \{ ?
		new_state : add_token state TokenType ' LBRACE char state ' line state ' column
		advance new_state
	
	char = \} ?
		new_state : add_token state TokenType ' RBRACE char state ' line state ' column
		advance new_state
	
	# その他の文字（エラー）
	`Error: Unexpected character:`, char
	advance state

# 文字列モードの処理
process_string_mode : char state ?
	# 文字なし（EOF）- 文字列が閉じられていない
	char = _ ?
		`Error: Unterminated string literal`
		# 緊急回避としてモードを戻す
		change_lexer_mode state LexerMode ' NORMAL
	
	# 文字列終了（バッククォート）
	char = \` ?
		# 文字列の値を取得
		string_value : extract_string state
		
		# 文字列トークンを追加
		new_state : add_token state TokenType ' STRING string_value state ' line state ' column
		
		# 通常モードに戻る
		new_state : advance new_state
		change_lexer_mode new_state LexerMode ' NORMAL
	
	# 文字列内の文字を処理
	advance state

# 文字モードの処理
process_char_mode : char state ?
	# 文字なし（EOF）- 文字リテラルが不完全
	char = _ ?
		`Error: Incomplete character literal`
		# 緊急回避としてモードを戻す
		change_lexer_mode state LexerMode ' NORMAL
	
	# 文字リテラルを追加
	new_state : add_token state TokenType ' CHAR char state ' line state ' column
	
	# 通常モードに戻る
	new_state : advance new_state
	change_lexer_mode new_state LexerMode ' NORMAL

# コメントモードの処理
process_comment_mode : char state ?
	# 文字なし（EOF）または改行 - コメント終了
	char = _ | char = \
 ?
		# コメントの値を取得
		comment_value : extract_comment state
		
		# コメントトークンを追加
		new_state : add_token state TokenType ' COMMENT comment_value state ' line state ' column
		
		# 改行処理
		char = \
 ?
			new_state : add_token new_state TokenType ' NEWLINE `\n` state ' line state ' column
			new_state : advance new_state
			new_state ' line : state ' line + 1
			new_state ' column : 1
			
			# インデントモードへ
			change_lexer_mode new_state LexerMode ' INDENT_MODE
		
		# 通常モードに戻る
		change_lexer_mode new_state LexerMode ' NORMAL
	
	# コメント内の文字を処理
	advance state

# インデントモードの処理
process_indent_mode : char state ?
	# 文字なし（EOF）- インデント処理終了
	char = _ ?
		# インデント解除を処理
		handle_dedents 0 state
	
	# 空白、タブ - インデントレベルを計算
	char = \  | char = \	 ?
		# インデントを蓄積
		new_state : state
		new_state ' pending_indents : state ' pending_indents, char
		advance new_state
	
	# 改行 - 空行
	char = \
 ?
		# 改行トークンを追加して次の行へ
		new_state : add_token state TokenType ' NEWLINE `\n` state ' line state ' column
		new_state : advance new_state
		new_state ' line : state ' line + 1
		new_state ' column : 1
		
		# インデントモードを維持
		new_state
	
	# コメント
	char = \` ?
		# コメントモードへ
		new_state : change_lexer_mode state LexerMode ' COMMENT_MODE
		process_comment_mode char new_state
	
	# それ以外 - インデント計算完了
	# 現在のインデントレベルを計算
	current_indent : calculate_indent state ' pending_indents
	
	# インデントスタックのトップと比較
	top_indent : state ' indent_stack ' 0
	
	# インデント増加
	current_indent > top_indent ?
		new_state : add_token state TokenType ' INDENT `` state ' line state ' column
		new_state ' indent_stack : current_indent, state ' indent_stack
		new_state ' pending_indents : _
		
		# 通常モードに戻る
		new_state : change_lexer_mode new_state LexerMode ' NORMAL
		process_normal_mode char new_state
	
	# インデント減少
	current_indent < top_indent ?
		# インデント解除を処理
		dedent_state : handle_dedents current_indent state
		dedent_state ' pending_indents : _
		
		# 通常モードに戻る
		new_state : change_lexer_mode dedent_state LexerMode ' NORMAL
		process_normal_mode char new_state
	
	# インデント変化なし
	new_state : state
	new_state ' pending_indents : _
	
	# 通常モードに戻る
	new_state : change_lexer_mode new_state LexerMode ' NORMAL
	process_normal_mode char new_state

# インデント解除処理
handle_dedents : current_indent state ?
	# インデントスタックが空または現在のインデントに到達
	state ' indent_stack = _ | state ' indent_stack ' 0 <= current_indent ?
		state
	
	# インデント解除トークンを追加
	new_state : add_token state TokenType ' DEDENT `` state ' line state ' column
	
	# インデントスタックからトップを削除
	new_state ' indent_stack : state ' indent_stack ' 1~
	
	# 再帰的に処理
	handle_dedents current_indent new_state

# インデントレベルの計算
calculate_indent : indents ?
	# スペースとタブのカウント
	count_indent : chars count ?
		chars = _ ? count
		
		char : chars ' 0
		rest : chars ' 1~
		
		# タブは8スペース分とカウント
		char = \	 ?
			count_indent rest count + 8
		
		# スペースは1としてカウント
		count_indent rest count + 1
	
	count_indent indents 0

# タブ演算子の処理
handle_tab_operator : state ?
	# タブ演算子トークンを追加
	new_state : add_token state TokenType ' OPERATOR `\t` state ' line state ' column
	advance new_state

# 数値リテラルの処理
handle_number : state ?
	start_pos : state ' position
	
	# 数値の種類を判断
	char : peek_char state
	next_char : peek_char advance state
	
	# 16進数
	char = \0 & next_char = \x ?
		handle_hex_number state
	
	# 8進数
	char = \0 & next_char = \o ?
		handle_octal_number state
	
	# 2進数
	char = \0 & next_char = \b ?
		handle_binary_number state
	
	# 10進数
	handle_decimal_number state

# 16進数の処理
handle_hex_number : state ?
	# '0x'をスキップ
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
	
	# 16進数値を取得
	hex_value : substring new_state ' source start_pos hex_state ' position
	
	# 16進数トークンを追加
	value : `0x`, hex_value
	add_token hex_state TokenType ' NUMBER value hex_state ' line hex_state ' column

# 8進数の処理
handle_octal_number : state ?
	# '0o'をスキップ
	new_state : advance advance state
	start_pos : new_state ' position
	
	# 8進数を消費
	consume_octal_digits : curr_state ?
		next_char : peek_char curr_state
		next_char = _ | !is_octal_digit next_char ?
			# 8進数でなければ終了
			curr_state
		
		# 8進数を消費して続行
		consume_octal_digits advance curr_state
	
	octal_state : consume_octal_digits new_state
	
	# 8進数値を取得
	octal_value : substring new_state ' source start_pos octal_state ' position
	
	# 8進数トークンを追加
	value : `0o`, octal_value
	add_token octal_state TokenType ' NUMBER value octal_state ' line octal_state ' column

# 2進数の処理
handle_binary_number : state ?
	# '0b'をスキップ
	new_state : advance advance state
	start_pos : new_state ' position
	
	# 2進数を消費
	consume_binary_digits : curr_state ?
		next_char : peek_char curr_state
		next_char = _ | !is_binary_digit next_char ?
			# 2進数でなければ終了
			curr_state
		
		# 2進数を消費して続行
		consume_binary_digits advance curr_state
	
	binary_state : consume_binary_digits new_state
	
	# 2進数値を取得
	binary_value : substring new_state ' source start_pos binary_state ' position
	
	# 2進数トークンを追加
	value : `0b`, binary_value
	add_token binary_state TokenType ' NUMBER value binary_state ' line binary_state ' column

# 10進数の処理
handle_decimal_number : state ?
	start_pos : state ' position
	
	# 整数部分を消費
	consume_digits : curr_state ?
		next_char : peek_char curr_state
		next_char = _ | !is_digit next_char ?
			# 数字でなければ終了
			curr_state
		
		# 数字を消費して続行
		consume_digits advance curr_state
	
	int_state : consume_digits state
	
	# 小数点があるか確認
	decimal_char : peek_char int_state
	
	decimal_char = \. ?
		# 小数点を消費
		decimal_state : advance int_state
		
		# 小数部分を消費
		float_state : consume_digits decimal_state
		
		# 浮動小数点値を取得
		float_value : substring state ' source start_pos float_state ' position
		
		# 浮動小数点トークンを追加
		add_token float_state TokenType ' NUMBER float_value float_state ' line float_state ' column
	
	# 整数値を取得
	int_value : substring state ' source start_pos int_state ' position
	
	# 整数トークンを追加
	add_token int_state TokenType ' NUMBER int_value int_state ' line int_state ' column

# 識別子の処理
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
	
	# 識別子の値を取得
	id_value : substring state ' source start_pos id_state ' position
	
	# 識別子トークンを追加
	add_token id_state TokenType ' ID id_value id_state ' line id_state ' column

# 演算子の処理
handle_operator : state ?
	char : peek_char state
	new_state : advance state
	
	# 複合演算子の判定
	next_char : peek_char new_state
	
	# '<=' 演算子
	char = \< & next_char = \= ?
		new_state : advance new_state
		add_token new_state TokenType ' OPERATOR `<=` new_state ' line new_state ' column
	
	# '>=' 演算子
	char = \> & next_char = \= ?
		new_state : advance new_state
		add_token new_state TokenType ' OPERATOR `>=` new_state ' line new_state ' column
	
	# '!=' 演算子
	char = \! & next_char = \= ?
		new_state : advance new_state
		add_token new_state TokenType ' OPERATOR `!=` new_state ' line new_state ' column
	
	# 単一演算子
	add_token new_state TokenType ' OPERATOR char new_state ' line new_state ' column

# 文字列の抽出
extract_string : state ?
	start_pos : state ' position
	
	# 文字列の終わりを見つける
	find_string_end : curr_state ?
		char : peek_char curr_state
		
		char = _ | char = \` ?
			# 文字列の終了または未終了
			curr_state
		
		# 文字を消費して続行
		find_string_end advance curr_state
	
	end_state : find_string_end state
	
	# 文字列値を取得
	substring state ' source start_pos end_state ' position

# コメントの抽出
extract_comment : state ?
	start_pos : state ' position
	
	# コメントの終わりを見つける
	find_comment_end : curr_state ?
		char : peek_char curr_state
		
		char = _ | char = \
 ?
			# コメントの終了または未終了
			curr_state
		
		# 文字を消費して続行
		find_comment_end advance curr_state
	
	end_state : find_comment_end state
	
	# コメント値を取得
	substring state ' source start_pos end_state ' position

# レキサーのモード変更
change_lexer_mode : state new_mode ?
	new_state : state
	new_state ' mode_stack : state ' mode, state ' mode_stack
	new_state ' mode : new_mode
	new_state

# レキサーのモードを元に戻す
pop_lexer_mode : state ?
	state ' mode_stack = _ ?
		# モードスタックが空の場合はNORMALモードに戻す
		new_state : state
		new_state ' mode : LexerMode ' NORMAL
		new_state
	
	# スタックからモードを取り出す
	new_state : state
	new_state ' mode : state ' mode_stack ' 0
	new_state ' mode_stack : state ' mode_stack ' 1~
	new_state

# レキサーの終了処理
finalize_lexer : state ?
	# 未処理のインデント解除を処理
	new_state : handle_dedents 0 state
	
	# EOFトークンを追加
	add_token new_state TokenType ' EOF `` new_state ' line new_state ' column

# トークンの追加
add_token : state type value line col ?
	# トークンを作成
	token : create_token type value line col
	
	# トークンリストに追加
	new_state : state
	new_state ' tokens : state ' tokens, token
	new_state

# 文字を取得
peek_char : state ?
	state ' position >= length state ' source ? _
	state ' source ' state ' position

# 位置を進める
advance : state ?
	new_state : state
	new_state ' position : state ' position + 1
	new_state ' column : state ' column + 1
	new_state

# 文字判定関数
is_digit : c ? c >= \0 & c <= \9
is_hex_digit : c ? is_digit c | (c >= \a & c <= \f) | (c >= \A & c <= \F)
is_octal_digit : c ? c >= \0 & c <= \7
is_binary_digit : c ? c = \0 | c = \1
is_identifier_start : c ? (c >= \a & c <= \z) | (c >= \A & c <= \Z) | c = \_
is_identifier_part : c ? is_identifier_start c | is_digit c
is_operator : c ? c = \+ | c = \- | c = \* | c = \/ | c = \% | c = \^ | c = \! | c = \? | c = \: | c = \, | c = \~ | c = \' | c = \@ | c = \# | c = \& | c = \| | c = \; | c = \< | c = \> | c = \=

# 文字列操作関数
substring : str start end ?
	# 部分文字列を抽出する関数
	result : _
	
	extract : i result ?
		i >= end ? result
		result, str ' i
		extract i + 1 result
	
	extract start _

# 文字列の長さを取得
length : str ?
	# 文字列の長さを取得する関数
	count : 0
	
	count_chars : i count ?
		str ' i = _ ? count
		count_chars i + 1 count + 1
	
	count_chars 0 0

# JSON文字列のエスケープ
escape_json_string : str ?
	# 文字列内の特殊文字をエスケープする関数
	# 簡易実装（実際にはさらに多くのエスケープが必要）
	escaped : _
	
	escape_char : i escaped ?
		i >= length str ? escaped
		
		char : str ' i
		
		char = `"` ?
			escape_char i + 1 escaped, `\"`
		
		char = `\\` ?
			escape_char i + 1 escaped, `\\`
		
		char = `\n` ?
			escape_char i + 1 escaped, `\\n`
		
		char = `\r` ?
			escape_char i + 1 escaped, `\\r`
		
		char = `\t` ?
			escape_char i + 1 escaped, `\\t`
		
		escape_char i + 1 escaped, char
	
	escape_char 0 _

# トークン配列をJSON配列に変換
tokens_to_json_array : tokens ?
	tokens = _ ? `[]`
	
	# 直接JSON配列として結合
	`[`, join_tokens tokens, `]`

# トークンをJSONとして結合
join_tokens : tokens ?
	tokens = _ ? ``
	
	token : tokens ' 0
	rest : tokens ' 1~
	
	rest = _ ? token
	token, `,`, join_tokens rest# 字句解析器（Lexer）
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
