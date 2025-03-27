// lexer.js
/**
 * Sign言語の字句解析モジュール
 * 
 * 機能:
 * - ソースコードのトークン化
 * - トークンの種類の識別
 * - 行番号と列番号のトラッキング
 * - 基本的なエラー検出
 * 
 * sign_ast/compiler/lexer.js ver_20250227_0　より流用
 * 
 * CreateBy Claude3.7Sonet
 * ver_20250327_0
 */

// トークンの種類を定義
const TokenType = {
    // リテラル
    number: 'number',         // 数値リテラル
    string: 'string',         // 文字列リテラル
    letter: 'letter',        // 文字リテラル
    identifier: 'identifier', // 識別子
    unit: 'unit',            // 単位元 '_'

    // 演算子（PESTファイルのf_プレフィックスに合わせる）
    f_define: 'f_define',           // :
    f_export: 'f_export',           // #
    f_import: 'f_import',           // @
    f_lambda: 'f_lambda',           // ?
    f_product: 'f_product',         // ,
    f_spread: 'f_spread',           // ~ (前置/中置/後置で文脈依存)
    f_or: 'f_or',                   // |
    f_xor: 'f_xor',                 // ;
    f_and: 'f_and',                 // &
    f_not: 'f_not',                 // !
    f_less: 'f_less',               // <
    f_less_eq: 'f_less_eq',         // <=
    f_eq: 'f_eq',                   // =
    f_neq: 'f_neq',                 // !=
    f_more_eq: 'f_more_eq',         // >=
    f_more: 'f_more',               // >
    f_add: 'f_add',                 // +
    f_sub: 'f_sub',                 // -
    f_mul: 'f_mul',                 // *
    f_div: 'f_div',                 // /
    f_mod: 'f_mod',                 // %
    f_power: 'f_power',             // ^
    f_factorial: 'f_factorial',      // ! (後置)
    f_get: 'f_get',                 // '

    // ブロック関連
    f_block: 'f_block',             // タブ
    BLOCK_START: 'BLOCK_START',     // [, {, (
    BLOCK_END: 'BLOCK_END',         // ], }, )

    // その他
    EVAL: 'EVAL',                   // 改行（評価後置演算子）
    //WHITESPACE: 'WHITESPACE',       // 空白（字句解析では削除）
    //EOF: 'EOF'                      // 入力終端
};

class Lexer {

    /**
     * Lexerクラスのコンストラクタ
     * 
     * @param {string} input - 解析対象のソースコード文字列
     */
    constructor(input) {
        this.input = input;          // 解析対象のソースコード
        this.position = 0;           // 現在の解析位置（インデックス）
        this.currentChar = input[0]; // 現在の解析文字（初期値は最初の文字）
        this.line = 1;               // 現在の行番号（1から開始）
        this.column = 1;             // 現在の列番号（1から開始）
    }

    /**
     * トークンを生成するメインメソッド
     * ファイル全体を1文字ずつ処理し、トークンのリストを返す
     * 
     * @returns {Array} トークンの配列
     */
    tokenize() {
        //debug用
        let cnt = 0;

        // トークンを格納する配列を初期化
        const tokens = [];
        try {
            // ファイル終端に達するまで繰り返し処理
            while (this.currentChar !== null) {

                // 現在の文字に応じて適切な処理を行う
                if (this.currentChar === '\n' ||
                    this.currentChar === '\r') {
                    // 改行文字の処理
                    const token = this.handleNewline();
                    if (token) {
                        tokens.push(token);
                    }
                }
                else if (this.currentChar === '\t') {
                    // タブ文字の処理
                    const token = this.handleTab();
                    if (token) {
                        tokens.push(token);
                    }
                }
                else if (this.currentChar === ' ') {
                    // 空白文字の処理
                    const token = this.handleWhitespace();
                    if (token) {
                        tokens.push(token);
                    }
                }
                else if (this.currentChar === '`') {
                    // バッククォートの処理
                    if (this.column === 1 || this.input[this.position - 1] === '\n') {
                        // 行頭ならコメントとしてスキップ
                        this.skipCommentLine();
                    } else {
                        // それ以外なら文字列として処理
                        const token = this.readString();
                        tokens.push(token);
                    }
                }
                else if (this.currentChar === '\\') {
                    // バックスラッシュの処理（文字リテラル）※js仕様上、条件分岐の\は2回で記載する必要あり
                    const token = this.readCharacter();
                    tokens.push(token);
                }
                else if (/[0-9]/.test(this.currentChar)) {
                    // 数字の処理
                    const token = this.readNumber();
                    tokens.push(token);
                }
                else if (/[a-zA-Z_]/.test(this.currentChar)) {
                    // 英字またはアンダースコアの処理（識別子）
                    const token = this.readIdentifier();
                    tokens.push(token);
                }
                else if (['[', '{', '('].includes(this.currentChar)) {
                    // ブロック開始記号の処理
                    const token = this.handleBlockStart();
                    tokens.push(token);
                }
                else if ([']', '}', ')'].includes(this.currentChar)) {
                    // ブロック終了記号の処理
                    const token = this.handleBlockEnd();
                    tokens.push(token);
                }
                else {
                    // その他の文字（演算子など）の処理
                    const token = this.readOperator();
                    if (token) {
                        tokens.push(token);
                    } else {
                        // 未知の文字の場合はエラー
                        throw new Error(`不明な文字です: '${this.currentChar}' (位置: ${this.position}, 行: ${this.line}, 列: ${this.column})`);
                    }
                }
            }

            // ファイル終端トークンを追加
            //tokens.push({ type: TokenType.EOF, value: null });

            // デバッグ用にトークン数を出力
            //console.debug(`字句解析完了: ${tokens.length} 個のトークンを生成`);

            // トークンのリストを返す
            return tokens;

        } catch (error) {
            // エラーが発生した場合は位置情報を付加して再スロー
            console.error(`字句解析エラー (${this.line}行目, ${this.column}列): ${error.message}`);
            throw error;
        }
    }

    /**
     * 次の文字に進む
     * 位置情報を更新し、現在の文字を取得
     */
    advance() {
        // 現在の位置を1つ進める
        this.position++;

        // 入力の終端を超えたかチェック
        if (this.position >= this.input.length) {
            // 終端を超えた場合はnullをセット
            this.currentChar = null;
        } else {
            // 終端を超えていない場合は次の文字を取得
            this.currentChar = this.input[this.position];
            // 列位置を1つ増加
            this.column++;
        }
    }

    /**
     * 現在位置からスペース文字をスキップする
     * 余積　中置演算子 としての空白を処理
     * 
     * @returns {object|null} タブとして扱う特殊な空白の場合はトークン、それ以外はnull
     */
    skipWhitespace() {
        // 現在位置の直前の文字が?や:かどうかを確認
        const prevCharIsSpecial = this.position > 0 &&
            (this.input[this.position - 1] === '?' ||
                this.input[this.position - 1] === ':');

        // ?や:の直後の空白の場合、タブと同様に扱う
        if (prevCharIsSpecial && this.currentChar === ' ') {
            // タブと同等のトークンを生成
            const token = { type: TokenType.f_block, value: '\t' };

            // 連続する空白をスキップ（1つのタブとして扱う）
            while (this.currentChar === ' ') {
                this.advance();
            }

            return token;
        }

        // 通常の空白処理（単にスキップする）
        while (this.currentChar === ' ') {
            this.advance();
        }

        return null;
    }

    /**
     * 改行文字の処理
     * 行番号と列番号を更新
     * 
     * @returns {null} 改行はトークンとして扱わないのでnullを返す
     */
    handleNewline() {
        // \r\n の組み合わせかチェック
        if (this.currentChar === '\r' &&
            this.position + 1 < this.input.length &&
            this.input[this.position + 1] === '\n') {
            // \rと\nをまとめて処理
            this.advance(); // \rをスキップ
        }
        // 評価トークンを生成
        const token = { type: TokenType.EVAL, value: '\n' };

        // 行番号を1増やす
        this.line++;
        // 列番号を1にリセット（次の行の最初の列）
        this.column = 1;
        // 次の文字に進む
        this.advance();

        // 評価（改行）トークンを返す
        return token;
    }

    /**
     * タブ文字の処理
     * 行頭またはタブ文字の直後に続くタブをf_blockトークンとして処理、それ以外はエラー
     * 連続するタブは別々のトークンとして処理される
     * 
     * @returns {object} タブトークン
     */
    handleTab() {
        // 行の先頭または直前の文字がタブかどうかを確認
        const isValidTabPosition = this.column === 1 ||
            (this.position > 0 && (this.input[this.position - 1] === '\n' || this.input[this.position - 1] === '\t'));

        // 行の先頭でない場合はエラー
        if (!isValidTabPosition) {
            throw new Error(`無効な位置でタブが使用されています (行: ${this.line}, 列: ${this.column})`);
        }

        // タブを表すトークンを生成
        const token = { type: TokenType.f_block, value: '\t' };
        // 次の文字に進む
        this.advance();

        return token;
    }

    /**
     * コメント行の処理
     * 行頭のバッククォートから次の改行までをスキップ
     * 
     * @returns {null} コメントはトークンとして扱わないのでnullを返す
     */
    skipCommentLine() {
        // 行の先頭かどうかを確認
        const isLineStart = this.column === 1 ||
            (this.position > 0 && this.input[this.position - 1] === '\n');

        // 行の先頭でない場合は処理しない
        if (!isLineStart) {
            return null;
        }

        // バッククォート自体をスキップ
        this.advance();

        // 次の改行文字または終端まで読み飛ばす
        while (this.currentChar !== null && this.currentChar !== '\n') {
            this.advance();
        }

        // コメント行はトークンを生成しないのでnullを返す
        return null;
    }

    /**
         * 数値リテラルを読み取る
         * 連続する数字を読み取って数値トークンを生成
         * ※残件：整数以外の数値処理を将来的に改修
         * 
         * @returns {object} 数値トークン
         */
    readNumber() {
        // 結果用の空文字列を初期化
        let result = '';

        // 現在の文字が数字である限りループを続ける
        while (this.currentChar !== null && /[0-9]/.test(this.currentChar)) {
            // 結果の文字列に現在の文字を追加
            result += this.currentChar;
            // 次の文字に進む
            this.advance();
        }

        // 数値トークンを生成して返す
        return { type: TokenType.number, value: result };

        /* 
        // 以下は将来の拡張のためにコメントアウト（浮動小数点や特殊基数の処理）
        // 結果用の空文字列を初期化
        let result = '';
        
        // 小数点が現れたかどうかのフラグ
        let hasDot = false;
        
        // 16進数、8進数、2進数のフラグ
        let isSpecialBase = false;
        
        // 特殊な基数（16進数、8進数、2進数）の処理
        if (this.currentChar === '0' && this.position + 1 < this.input.length) {
            const nextChar = this.input[this.position + 1];
            if (nextChar === 'x' || nextChar === 'o' || nextChar === 'b') {
                // 0の部分を追加
                result += this.currentChar;
                this.advance();
                
                // x, o, bの部分を追加
                result += this.currentChar;
                this.advance();
                
                isSpecialBase = true;
                
                // 特殊な基数に応じた数字を読み取る
                if (result.endsWith('x')) { // 16進数
                    while (this.currentChar !== null && /[0-9a-fA-F]/.test(this.currentChar)) {
                        result += this.currentChar;
                        this.advance();
                    }
                } else if (result.endsWith('o')) { // 8進数
                    while (this.currentChar !== null && /[0-7]/.test(this.currentChar)) {
                        result += this.currentChar;
                        this.advance();
                    }
                } else if (result.endsWith('b')) { // 2進数
                    while (this.currentChar !== null && /[01]/.test(this.currentChar)) {
                        result += this.currentChar;
                        this.advance();
                    }
                }
                
                // 特殊な基数の処理が完了したのでトークンを生成して返す
                return { type: TokenType.number, value: result };
            }
        }
        
        // 通常の数値（整数または浮動小数点）の処理
        while (
            this.currentChar !== null &&
            (
                /[0-9]/.test(this.currentChar) ||
                (this.currentChar === '.' && !hasDot) || // 小数点は1回だけ許可
                // 指数表記の処理 (例: 1e+10, 2.5E-5)
                (
                    (this.currentChar === 'e' || this.currentChar === 'E') &&
                    result.length > 0 &&
                    this.position + 1 < this.input.length &&
                    (/[0-9]/.test(this.input[this.position + 1]) ||
                        ((this.input[this.position + 1] === '+' || this.input[this.position + 1] === '-') &&
                            this.position + 2 < this.input.length &&
                            /[0-9]/.test(this.input[this.position + 2])))
                )
            )
        ) {
            // 小数点を見つけた場合、フラグを更新
            if (this.currentChar === '.') {
                hasDot = true;
            }
            
            // 指数表記を処理（e+10, E-5など）
            if (this.currentChar === 'e' || this.currentChar === 'E') {
                // 指数部分を結果に追加
                result += this.currentChar;
                this.advance();
                
                // +または-の符号があれば追加
                if (this.currentChar === '+' || this.currentChar === '-') {
                    result += this.currentChar;
                    this.advance();
                }
                
                // 指数部分の数字を読み取る
                while (this.currentChar !== null && /[0-9]/.test(this.currentChar)) {
                    result += this.currentChar;
                    this.advance();
                }
                
                // 指数表記の処理が完了したのでループを抜ける
                break;
            }
            
            // 結果の文字列に現在の文字を追加
            result += this.currentChar;
            // 次の文字に進む
            this.advance();
        }
        
        // 数値トークンを生成して返す
        return { type: TokenType.number, value: result };
        */
    }

    /**
     * 識別子を読み取る
     * 連続する英数字とアンダースコアを読み取って識別子トークンを生成
     * ※残件：識別子はASCIIで扱える記号まで許容するため将来的に改修
     * 
     * @returns {object} 識別子またはunit（_）トークン
     */
    readIdentifier() {
        // 結果用の空文字列を初期化
        let result = '';

        // 現在の文字が英数字またはアンダースコアである限りループを続ける
        while (
            this.currentChar !== null &&
            (/[a-zA-Z0-9_]/.test(this.currentChar))
        ) {
            // 結果の文字列に現在の文字を追加
            result += this.currentChar;
            // 次の文字に進む
            this.advance();
        }

        // 結果が単一の「_」の場合はunitトークン、それ以外は識別子トークン
        if (result === '_') {
            return { type: TokenType.unit, value: result };
        } else {
            return { type: TokenType.identifier, value: result };
        }
    }

    /**
     * 文字列リテラルを読み取る
     * バッククォートで囲まれた文字列を読み取って文字列トークンを生成
     * 
     * @returns {object} 文字列トークン
     */
    readString() {
        // 結果用の空文字列を初期化
        let result = '';

        // 開始バッククォートをスキップ
        this.advance();

        // 終了バッククォートまたは改行文字に達するまでループを続ける
        while (this.currentChar !== null && this.currentChar !== '`' && this.currentChar !== '\n') {
            // 結果の文字列に現在の文字を追加
            result += this.currentChar;

            // 次の文字に進む
            this.advance();
        }

        // 終了バッククォートが見つからずに行末や入力終端に達した場合はエラー
        if (this.currentChar === null || this.currentChar === '\n') {
            throw new Error(`文字列リテラルが閉じられていません (行: ${this.line}, 列: ${this.column})`);
        }

        // 終端のバッククォートをスキップ
        this.advance();

        // 文字列トークンを生成して返す
        return { type: TokenType.string, value: result };
    }

    /**
     * 文字リテラルを読み取る
     * バックスラッシュの後の1文字を文字リテラルとして処理
     * 例: \+ → '+', \n → 'n', \空白 → ' ' などを文字リテラルとして扱う
     * 
     * @returns {object} 文字リテラルトークン
     */
    readCharacter() {
        // バックスラッシュをスキップ
        this.advance();

        // 入力の終端に達した場合はエラー
        if (this.currentChar === null) {
            throw new Error(`文字リテラルが閉じられていません (行: ${this.line}, 列: ${this.column})`);
        }

        // バックスラッシュの次の文字を取得
        const char = this.currentChar;
        // 次の文字に進む
        this.advance();

        // 文字リテラルトークンを生成して返す
        return { type: TokenType.letter, value: char };
    }

    /**
     * 演算子を読み取る
     * 1文字または2文字の演算子を読み取って対応するトークンを生成
     * 
     * @returns {object|null} 演算子トークン、未知の文字の場合はnull
     */
    readOperator() {
        // トークン変数を初期化
        let token = null;

        // 現在の文字と次の文字を取得（複合演算子の判定用）
        const char = this.currentChar;
        const nextChar = this.position + 1 < this.input.length ? this.input[this.position + 1] : null;

        // 演算子の種類に応じて処理を分岐
        switch (char) {
            case ':':
                token = { type: TokenType.f_define, value: char };
                break;
            case '#':
                token = { type: TokenType.f_export, value: char };
                break;
            case '@':
                token = { type: TokenType.f_import, value: char };
                break;
            case '?':
                token = { type: TokenType.f_lambda, value: char };
                break;
            case ',':
                token = { type: TokenType.f_product, value: char };
                break;
            case '~':
                token = { type: TokenType.f_spread, value: char };
                break;
            case '|':
                token = { type: TokenType.f_or, value: char };
                break;
            case ';':
                token = { type: TokenType.f_xor, value: char };
                break;
            case '&':
                token = { type: TokenType.f_and, value: char };
                break;
            case '!':
                // !と!=の区別
                if (nextChar === '=') {
                    token = { type: TokenType.f_neq, value: '!=' };
                    this.advance(); // 追加の文字を消費
                } else {
                    token = { type: TokenType.f_not, value: char };
                    // 後置演算子としても使われる可能性があるが、文脈は構文解析で判断
                }
                break;
            case '<':
                // <と<=の区別
                if (nextChar === '=') {
                    token = { type: TokenType.f_less_eq, value: '<=' };
                    this.advance(); // 追加の文字を消費
                } else if (nextChar === '>' || nextChar === '=') {
                    // <>と><は!=と同等
                    token = { type: TokenType.f_neq, value: char + nextChar };
                    this.advance(); // 追加の文字を消費
                } else {
                    token = { type: TokenType.f_less, value: char };
                }
                break;
            case '>':
                // >と>=の区別
                if (nextChar === '=') {
                    token = { type: TokenType.f_more_eq, value: '>=' };
                    this.advance(); // 追加の文字を消費
                } else {
                    token = { type: TokenType.f_more, value: char };
                }
                break;
            case '=':
                // =と==の区別（どちらも同じトークン）
                if (nextChar === '=') {
                    token = { type: TokenType.f_eq, value: '==' };
                    this.advance(); // 追加の文字を消費
                } else {
                    token = { type: TokenType.f_eq, value: char };
                }
                break;
            case '+':
                token = { type: TokenType.f_add, value: char };
                break;
            case '-':
                token = { type: TokenType.f_sub, value: char };
                break;
            case '*':
                token = { type: TokenType.f_mul, value: char };
                break;
            case '/':
                token = { type: TokenType.f_div, value: char };
                break;
            case '%':
                token = { type: TokenType.f_mod, value: char };
                break;
            case '^':
                token = { type: TokenType.f_power, value: char };
                break;
            case '\'':
                token = { type: TokenType.f_get, value: char };
                break;
            default:
                // 未知の文字の場合はnullを返す
                return null;
        }

        // 次の文字に進む
        this.advance();

        // 生成したトークンを返す
        return token;
    }

    /**
     * ブロック開始記号を処理
     * 「[」「{」「(」のいずれかを処理してBLOCK_STARTトークンを生成
     * 
     * @returns {object} ブロック開始トークン
     */
    handleBlockStart() {
        // 現在の文字を保存
        const char = this.currentChar;
        // 次の文字に進む
        this.advance();

        // ブロック開始トークンを生成して返す
        return { type: TokenType.BLOCK_START, value: char };
    }

    /**
     * ブロック終了記号を処理
     * 「]」「}」「)」のいずれかを処理してBLOCK_ENDトークンを生成
     * 
     * @returns {object} ブロック終了トークン
     */
    handleBlockEnd() {
        // 現在の文字を保存
        const char = this.currentChar;
        // 次の文字に進む
        this.advance();

        // ブロック終了トークンを生成して返す
        return { type: TokenType.BLOCK_END, value: char };
    }

    /**
     * 空白文字の処理
     * 通常は単に次の文字へ進める
     * 
     * @returns {null} 空白はトークンとして扱わないのでnullを返す
     */
    handleWhitespace() {
        // 次の文字に進む
        this.advance();

        // 空白はトークンとして扱わないのでnullを返す
        return null;
    }
}

// 外部にエクスポート
exports.Lexer = Lexer;
exports.TokenType = TokenType;