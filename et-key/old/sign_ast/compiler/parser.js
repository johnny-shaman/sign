// compiler/parser.js
/**
 * Sign言語の構文解析モジュール - 強化版
 * 
 * 機能:
 * - トークン列からの抽象構文木（AST）の生成
 * - Sign言語の文法規則に基づく構文の検証
 * - ブロック構文やラムダ式などの特殊な構文の処理
 * - 構文エラーの検出と報告
 * - エラー回復機能の強化
 * 
 * 使用方法:
 * const parser = new Parser(tokens);
 * const ast = parser.parse();
 * 
 * CreateBy Claude3.7Sonet
 * ver_20250303_0
*/

const { logger } = require('../utils/logger');
const { TokenType } = require('./lexer');

// logger.warning から logger.warn への互換性ラッパー
if (!logger.warn && logger.warning) {
    logger.warn = logger.warning;
} else if (!logger.warning && logger.warn) {
    logger.warning = logger.warn;
} else if (!logger.warn && !logger.warning) {
    logger.warn = logger.warning = function (msg) { console.log(`[WARNING] ${msg}`); };
}

/**
 * パーサーのコンテキスト情報を管理するクラス
 * 解析中の状態を追跡するために使用
 */
class ParserContext {
    constructor() {
        this.inLambda = false;         // ラムダ式の内部にいるか
        this.inPointFree = false;      // ポイントフリー記法の内部にいるか
        this.expectingBracket = [];    // 期待している閉じ括弧のスタック
        this.bracketBalance = 0;       // 括弧のバランスカウンター
        this.indentLevel = 0;          // 現在のインデントレベル
        this.allowNumericParams = false; // 数値パラメータを許可するか
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;        // 解析対象のトークン配列
        this.current = 0;            // 現在解析中のトークンインデックス
        this.indentationStack = [0]; // インデントレベルを管理するスタック
        this.errors = [];            // エラーの記録用配列
        this.warnings = [];          // 警告の記録用配列
        this.parseMode = 'recovery'; // デフォルトで回復モードを使用
        this.resetContext();         // コンテキスト情報を初期化
        this.bracketStack = [];      // 括弧のスタック
    }

    /**
     * コンテキスト情報をリセットする
     * ラムダ式内のフラグや括弧の期待などをクリア
     */
    resetContext() {
        logger.debug('パーサーコンテキストをリセットします');
        this.context = new ParserContext(); // コンテキスト情報    
    }

    /**
     * パースモードを設定
     * @param {string} mode - パースモード ('strict' または 'recovery')
     */
    setParseMode(mode) {
        if (mode === 'strict' || mode === 'recovery') {
            this.parseMode = mode;
            logger.debug(`パースモードを ${mode} に設定しました`);
        } else {
            logger.warning(`無効なパースモード: ${mode}, 'strict'を使用します`);
            this.parseMode = 'strict';
        }
    }

    /**
     * 構文解析の実行
     * @returns {Object} ASTのルートノード（Program）
     */
    parse() {
        try {
            logger.info('構文解析を開始します...');
            const startTime = Date.now();
            this.errors = [];
            this.warnings = [];

            this.resetContext(); // コンテキストを確実にリセット

            // プログラム全体の構文解析を実行
            const ast = this.parseProgram();

            // 解析が終了したかチェック
            if (!this.isAtEnd()) {
                // 終了していない場合は予期しないトークンが残っている
                throw this.error("予期しないトークンが残っています");
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            logger.info(`構文解析が完了しました (${duration}ms)`);

            // デバッグ情報：トークン処理統計
            if (process.env.DEBUG === 'true') {
                logger.debug(`処理したトークン数: ${this.tokens.length}`);
                this.printAstStats(ast);
            }

            // 警告がある場合は表示
            if (this.warnings.length > 0) {
                logger.warning(`${this.warnings.length}件の警告があります:`);
                this.warnings.forEach(warning => {
                    logger.warning(`- ${warning}`);
                });
            }

            // 構文ツリーの妥当性検証
            if (process.env.VALIDATE_AST === 'true') {
                this.validateAst(ast);
            }

            // 最終的なASTに警告とエラーを含める
            ast.warnings = this.warnings;
            ast.errors = this.errors;

            return ast;

        } catch (error) {
            // エラーログを出力
            logger.error('構文解析エラー:', error.message);
            this.errors.push(error.message);

            // エラー情報を含むASTを生成
            return {
                type: 'Program',
                body: [],
                errors: [error.message]
            };
        }
    }

    /**
     * ASTの妥当性を検証
     * @param {Object} ast - 検証するAST
     */
    validateAst(ast) {
        logger.info('ASTの妥当性検証を開始...');

        try {
            // ルートノードのチェック
            if (!ast || ast.type !== 'Program') {
                this.addWarning('ルートノードがProgramではありません');
            }

            // 各ノードの整合性チェック
            if (ast.body) {
                ast.body.forEach((node, index) => {
                    this.validateNode(node, `body[${index}]`);
                });
            }

            logger.info('ASTの妥当性検証が完了しました');
        } catch (error) {
            logger.error('AST検証中にエラーが発生しました:', error.message);
        }
    }

    /**
     * 個別のASTノードを検証
     * @param {Object} node - 検証するノード
     * @param {string} path - 現在のノードパス（エラー報告用）
     */
    validateNode(node, path) {
        if (!node) {
            this.addWarning(`${path}: ノードがnullまたはundefinedです`);
            return;
        }

        if (!node.type) {
            this.addWarning(`${path}: ノードにtypeプロパティがありません`);
            return;
        }

        // ノードタイプに基づく検証
        switch (node.type) {
            case 'BinaryOperation':
                if (!node.operator) {
                    this.addWarning(`${path}: BinaryOperationにoperatorがありません`);
                }
                if (!node.left) {
                    this.addWarning(`${path}: BinaryOperationにleftがありません`);
                } else {
                    this.validateNode(node.left, `${path}.left`);
                }
                if (!node.right) {
                    this.addWarning(`${path}: BinaryOperationにrightがありません`);
                } else {
                    this.validateNode(node.right, `${path}.right`);
                }
                break;

            case 'UnaryOperation':
                if (!node.operator) {
                    this.addWarning(`${path}: UnaryOperationにoperatorがありません`);
                }
                if (!node.position) {
                    this.addWarning(`${path}: UnaryOperationにpositionがありません`);
                }
                if (!node.expression) {
                    this.addWarning(`${path}: UnaryOperationにexpressionがありません`);
                } else {
                    this.validateNode(node.expression, `${path}.expression`);
                }
                break;

            case 'Lambda':
                if (!Array.isArray(node.parameters)) {
                    this.addWarning(`${path}: Lambdaにparameters配列がありません`);
                }
                if (!node.body) {
                    this.addWarning(`${path}: Lambdaにbodyがありません`);
                } else {
                    this.validateNode(node.body, `${path}.body`);
                }
                break;

            case 'ConditionalLambda':
                if (!Array.isArray(node.parameters)) {
                    this.addWarning(`${path}: ConditionalLambdaにparameters配列がありません`);
                }
                if (!Array.isArray(node.branches)) {
                    this.addWarning(`${path}: ConditionalLambdaにbranches配列がありません`);
                } else {
                    node.branches.forEach((branch, i) => {
                        if (!branch.condition) {
                            this.addWarning(`${path}.branches[${i}]: 条件がありません`);
                        } else {
                            this.validateNode(branch.condition, `${path}.branches[${i}].condition`);
                        }
                        if (!branch.result) {
                            this.addWarning(`${path}.branches[${i}]: 結果がありません`);
                        } else {
                            this.validateNode(branch.result, `${path}.branches[${i}].result`);
                        }
                    });
                }
                break;

            case 'Application':
                if (!node.function) {
                    this.addWarning(`${path}: Applicationにfunctionがありません`);
                } else {
                    this.validateNode(node.function, `${path}.function`);
                }
                if (!Array.isArray(node.arguments)) {
                    this.addWarning(`${path}: Applicationにarguments配列がありません`);
                } else {
                    node.arguments.forEach((arg, i) => {
                        this.validateNode(arg, `${path}.arguments[${i}]`);
                    });
                }
                break;

            case 'Coproduct':
                if (!node.left) {
                    this.addWarning(`${path}: Coproductにleftがありません`);
                } else {
                    this.validateNode(node.left, `${path}.left`);
                }
                if (!node.right) {
                    this.addWarning(`${path}: Coproductにrightがありません`);
                } else {
                    this.validateNode(node.right, `${path}.right`);
                }
                break;

            case 'Product':
                if (!Array.isArray(node.elements)) {
                    this.addWarning(`${path}: Productにelements配列がありません`);
                } else {
                    node.elements.forEach((elem, i) => {
                        this.validateNode(elem, `${path}.elements[${i}]`);
                    });
                }
                break;

            case 'PropertyAccess':
                if (!node.object) {
                    this.addWarning(`${path}: PropertyAccessにobjectがありません`);
                } else {
                    this.validateNode(node.object, `${path}.object`);
                }
                if (!node.property) {
                    this.addWarning(`${path}: PropertyAccessにpropertyがありません`);
                } else {
                    this.validateNode(node.property, `${path}.property`);
                }
                break;

            case 'PropertyAssignment':
                if (!node.object) {
                    this.addWarning(`${path}: PropertyAssignmentにobjectがありません`);
                } else {
                    this.validateNode(node.object, `${path}.object`);
                }
                if (!node.property) {
                    this.addWarning(`${path}: PropertyAssignmentにpropertyがありません`);
                } else {
                    this.validateNode(node.property, `${path}.property`);
                }
                if (!node.value) {
                    this.addWarning(`${path}: PropertyAssignmentにvalueがありません`);
                } else {
                    this.validateNode(node.value, `${path}.value`);
                }
                break;

            case 'PointFreeOperator':
                if (!node.operator) {
                    this.addWarning(`${path}: PointFreeOperatorにoperatorがありません`);
                }
                if (!node.position) {
                    this.addWarning(`${path}: PointFreeOperatorにpositionがありません`);
                }
                break;

            case 'PartialApplication':
                if (!node.operator) {
                    this.addWarning(`${path}: PartialApplicationにoperatorがありません`);
                }
                // leftとrightはどちらか一方が必須
                if (!node.left && !node.right) {
                    this.addWarning(`${path}: PartialApplicationにleftとrightの両方がありません`);
                }
                if (node.left) {
                    this.validateNode(node.left, `${path}.left`);
                }
                if (node.right) {
                    this.validateNode(node.right, `${path}.right`);
                }
                break;

            case 'Block':
                if (!Array.isArray(node.body)) {
                    this.addWarning(`${path}: Blockにbody配列がありません`);
                } else {
                    node.body.forEach((stmt, i) => {
                        this.validateNode(stmt, `${path}.body[${i}]`);
                    });
                }
                break;

            case 'EmptyList':
                // 特別なチェック不要
                break;

            // 基本型についてはチェック不要
            case 'Number':
            case 'String':
            case 'Character':
            case 'Identifier':
            case 'Unit':
                break;

            default:
                this.addWarning(`${path}: 未知のノードタイプ: ${node.type}`);
        }
    }

    /**
     * 警告を追加
     * @param {string} message - 警告メッセージ
     */
    addWarning(message) {
        this.warnings.push(message);
        if (process.env.DEBUG === 'true') {
            logger.warning(message);
        }
    }

    /**
     * AST統計情報の出力（デバッグ用）
     * @param {Object} ast - 出力するAST
     * @param {number} depth - 現在の深さ（再帰呼び出し用）
     */
    printAstStats(ast, depth = 0) {
        if (!ast) return;

        // ノードの種類ごとの数をカウント
        const nodeTypes = {};
        this.countNodeTypes(ast, nodeTypes);

        // 結果を出力
        logger.debug('AST統計:');
        for (const [type, count] of Object.entries(nodeTypes)) {
            logger.debug(`  ${type}: ${count}`);
        }

        // 最大深さを計算
        const maxDepth = this.calculateAstDepth(ast);
        logger.debug(`  最大深さ: ${maxDepth}`);
    }

    /**
     * ASTノードの種類ごとのカウント
     * @param {Object} node - カウント対象のノード
     * @param {Object} counts - カウント結果を格納するオブジェクト
     */
    countNodeTypes(node, counts) {
        if (!node || typeof node !== 'object') return;

        // ノードの種類をカウント
        if (node.type) {
            counts[node.type] = (counts[node.type] || 0) + 1;
        }

        // オブジェクトのプロパティを再帰的に処理
        for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
                // 配列の場合は各要素を処理
                if (Array.isArray(node[key])) {
                    for (const item of node[key]) {
                        this.countNodeTypes(item, counts);
                    }
                } else {
                    // オブジェクトの場合は再帰的に処理
                    this.countNodeTypes(node[key], counts);
                }
            }
        }
    }

    /**
     * ASTの最大深さを計算
     * @param {Object} node - 深さを計算するノード
     * @returns {number} 最大深さ
     */
    calculateAstDepth(node) {
        if (!node || typeof node !== 'object') return 0;

        let maxChildDepth = 0;

        // オブジェクトのプロパティを再帰的に処理
        for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
                // 配列の場合は各要素の最大深さを計算
                if (Array.isArray(node[key])) {
                    for (const item of node[key]) {
                        const childDepth = this.calculateAstDepth(item);
                        maxChildDepth = Math.max(maxChildDepth, childDepth);
                    }
                } else {
                    // オブジェクトの場合は再帰的に深さを計算
                    const childDepth = this.calculateAstDepth(node[key]);
                    maxChildDepth = Math.max(maxChildDepth, childDepth);
                }
            }
        }

        // 現在のノードの深さは子の最大深さ + 1
        return maxChildDepth + 1;
    }

    /**
     * コンテキスト情報を保存してから処理を実行
     * 処理後にコンテキストを復元
     * @param {Function} parserFunction - 実行する解析関数
     * @param {Object} contextChanges - 一時的に変更するコンテキスト情報
     * @returns {Object} 解析結果のASTノード
     */
    withContext(parserFunction, contextChanges = {}) {
        // 現在のコンテキストをディープコピーして保存
        const savedContext = JSON.parse(JSON.stringify(this.context));

        // 変更を適用
        Object.assign(this.context, contextChanges);

        try {
            // 関数を実行して結果を取得
            const result = parserFunction();
            // コンテキストを復元
            this.context = savedContext;
            return result;
        } catch (error) {
            // エラーが発生した場合もコンテキストを確実に復元
            this.context = savedContext;
            throw error; // エラーを再スロー
        }
    }

    /**
     * プログラム全体の解析
     * @returns {Object} Programノード
     */
    parseProgram() {
        const body = [];  // プログラム本体の式を格納する配列

        // EOF（ファイル終端）に達するまで式を解析
        while (!this.isAtEnd()) {
            try {
                // 式を解析して本体に追加
                const expr = this.parseExpression();

                // 有効な式のみ追加
                if (expr) {
                    body.push(expr);
                }

                // 式の末尾にはEVAL（改行）があるはず
                if (!this.isAtEnd() && !this.check(TokenType.EVAL)) {
                    // 改行がない場合の処理
                    if (this.parseMode === 'strict') {
                        throw this.error("式の後に改行が必要です");
                    } else {
                        this.addWarning(`${this.current}行目: 式の後に改行がありません`);
                    }
                }

                // EVAL（改行）トークンを消費
                if (this.check(TokenType.EVAL)) {
                    this.advance();
                }

            } catch (error) {
                // エラーをログに記録
                logger.error(`式の解析中にエラー: ${error.message}`);
                this.errors.push(error.message);

                // エラー回復：次の改行まで読み飛ばす
                this.synchronize();
            }
        }

        // プログラムノードを返す
        return {
            type: 'Program',
            body: body
        };
    }

    /**
     * ポイントフリースタイル記法の後置演算子バージョンを解析（例: [_!]）
     * @returns {Object} 後置演算子をポイントフリースタイルで表すASTノード
     */
    parsePostfixPointFree() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // _トークンを消費
            this.advance();

            // 演算子トークンを取得
            if (!this.isOperator(this.peek().type)) {
                throw this.error("後置ポイントフリー記法には演算子が必要です");
            }

            const operatorToken = this.advance();
            const operator = operatorToken.value;

            // 閉じ括弧をチェック
            this.consume(TokenType.BLOCK_END, "ポイントフリー記法の閉じ括弧 ']' が必要です");

            // ポイントフリー演算子ノードを生成（後置版）
            return {
                type: 'PointFreeOperator',
                operator: operator,
                position: 'postfix'
            };
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理: 元の位置に戻る
                this.current = startPos;
                // 単位元を返すか、他の解析を試みる
                return { type: 'Unit', value: '_' };
            }
            throw error;
        }
    }

    /**
     * 式（expression）の解析
     * @returns {Object} 式を表すASTノード、空行の場合はnull
     */
    parseExpression() {
        // 単純な空行のチェック（改行トークンのみ）
        if (this.check(TokenType.EVAL)) {
            return null;
        }

        // インデント後に何もない（実質的な空行）をチェック
        if (this.check(TokenType.f_block)) {
            // 現在位置のタブトークンをすべて数える
            let tabCount = 0;
            let position = this.current;

            // 連続するタブをカウント
            while (position < this.tokens.length &&
                this.tokens[position].type === TokenType.f_block) {
                tabCount++;
                position++;
            }

            // タブの後に改行または終端がある場合は空行と判断
            if (position < this.tokens.length &&
                (this.tokens[position].type === TokenType.EVAL ||
                    this.tokens[position].type === TokenType.EOF)) {

                // タブトークンをすべて消費
                for (let i = 0; i < tabCount; i++) {
                    this.advance();
                }

                return null;
            }
        }

        // エクスポート（#）から始まる場合
        if (this.check(TokenType.f_export)) {
            return this.parseExport();
        }

        // インポート（@）から始まる場合
        if (this.check(TokenType.f_import)) {
            return this.parseImport();
        }

        // それ以外は通常の定義または式
        return this.parseDefine();
    }

    /**
     * エクスポート（#から始まる式）の解析
     * @returns {Object} エクスポートを表すASTノード
     */
    parseExport() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // #から始まる式の解析
            if (this.match(TokenType.f_export)) {
                const definition = this.parseDefine();
                return {
                    type: 'Export',
                    value: definition
                };
            }
            throw this.error("エクスポート式の解析に失敗しました");
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理: 元の位置に戻る
                this.current = startPos;
                this.advance(); // #を消費
                // 単純な識別子を返す
                return {
                    type: 'Export',
                    value: { type: 'Identifier', value: 'export_error' }
                };
            }
            throw error;
        }
    }

    /**
     * インポート（@から始まる式）の解析
     * @returns {Object} インポートを表すASTノード
     */
    parseImport() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // @トークンを消費
            this.advance();

            // インポート対象を解析（識別子または文字列）
            let source;
            if (this.check(TokenType.identifier)) {
                source = {
                    type: 'Identifier',
                    value: this.advance().value
                };
            } else if (this.check(TokenType.string)) {
                source = {
                    type: 'String',
                    value: this.advance().value
                };
            } else {
                throw this.error("インポート文の後には識別子または文字列が必要です");
            }

            // スプレッド演算子（~）がある場合は特別に処理
            if (this.check(TokenType.f_spread)) {
                this.advance(); // スプレッド演算子を消費
                // スプレッドインポートとして処理
                return {
                    type: 'SpreadImport',
                    source: source
                };
            }

            // 通常のインポートノードを返す
            return {
                type: 'Import',
                source: source
            };
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理: 元の位置に戻る
                this.current = startPos;
                this.advance(); // @を消費
                // デフォルトソースを使用
                return {
                    type: 'Import',
                    source: { type: 'Identifier', value: 'import_error' }
                };
            }
            throw error;
        }
    }

    /**
     * 定義（define）の解析
     * @returns {Object} 定義を表すASTノード
     */
    parseDefine() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // まず左辺の余積を解析
            const left = this.parseCoproduct();

            // 定義演算子（:）がある場合
            if (this.match(TokenType.f_define)) {
                // 定義の右辺を解析
                const value = this.parseDefine(); // 再帰的に解析（ネストした定義をサポート）

                // 左辺が識別子か条件式かチェック
                if (left.type !== 'Identifier' &&
                    left.type !== 'BinaryOperation' &&
                    left.type !== 'Application' &&
                    left.type !== 'PropertyAccess' &&
                    left.type !== 'RangeOperation' && // 範囲操作も許可
                    left.type !== 'Coproduct') {      // ネストした識別子を持つ余積も許可

                    // 無効な場合は警告を出すが処理は続行
                    this.addWarning(`無効な定義左辺: ${left.type} を識別子として扱います`);
                }

                // 定義ノードを返す
                return {
                    type: 'Definition',
                    identifier: left,
                    value: value
                };
            }

            // 定義演算子がない場合は、解析した余積をそのまま返す
            return left;
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理: 定義文のフォーマットに問題がある場合
                this.current = startPos;

                try {
                    // 左辺だけでも正常に解析できるか試す
                    const left = this.parseCoproduct();

                    // 定義演算子があれば消費
                    if (this.check(TokenType.f_define)) {
                        this.advance();

                        // 右辺も正常に解析できるか試す
                        try {
                            const value = this.parseDefine();
                            // 成功した場合は通常の定義を返す
                            return {
                                type: 'Definition',
                                identifier: left,
                                value: value
                            };
                        } catch (innerError) {
                            // 右辺の解析に失敗した場合は単位元をデフォルト値として使用
                            this.addWarning(`定義の右辺解析エラー: ${innerError.message}`);
                            return {
                                type: 'Definition',
                                identifier: left,
                                value: { type: 'Unit', value: '_' }
                            };
                        }
                    } else {
                        // 定義演算子がなければ左辺をそのまま返す
                        return left;
                    }
                } catch (innerError) {
                    // 左辺の解析にも失敗した場合
                    this.addWarning(`定義解析エラー: ${innerError.message}`);
                    // ダミー識別子を作成
                    return {
                        type: 'Identifier',
                        value: 'define_error'
                    };
                }
            }
            throw error;
        }
    }

    /**
     * ラムダ式（lambda）の解析
     * パラメータリストを正確に認識し、
     * ラムダ本体の構造を適切に処理
     * @returns {Object} ラムダ式を表すASTノード
     */
    parseLambda() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        // コンテキストを変更して解析 - エラー処理を強化
        return this.withContext(() => {
            try {
                // ラムダ解析フラグを設定
                this.context.inLambda = true;
                // 数値パラメータの許可フラグを設定
                this.context.allowNumericParams = true;

                // まず製品（パラメータリスト）を解析
                let params;
                try {
                    params = this.parseProduct();
                } catch (error) {
                    if (this.parseMode === 'recovery') {
                        logger.warn(`パラメータリストの解析に失敗: ${error.message}`);
                        // 回復: 単位元をデフォルトパラメータとして使用
                        params = { type: 'Unit', value: '_' };
                    } else {
                        throw error;
                    }
                }

                // ラムダ演算子（?）がない場合は製品をそのまま返す
                if (!this.match(TokenType.f_lambda)) {
                    return params;
                }

                // パラメータを適切な形式に変換
                let parameters = [];

                try {
                    // パラメータリストの処理と検証
                    if (params.type === 'RangeOperation') {
                        // 範囲操作はラムダパラメータとして特別処理
                        parameters = [{
                            type: 'RangeParameter',
                            start: params.left,
                            end: params.right
                        }];
                    } else if (params.type === 'Identifier') {
                        // 単一の識別子の場合
                        parameters = [params];
                    } else if (params.type === 'SpreadOperation' && params.position === 'prefix') {
                        // 残余引数の場合
                        parameters = [params];
                    } else if (params.type === 'Product') {
                        // 製品（カンマ区切りリスト）の場合
                        parameters = params.elements || [];

                        // 要素が存在するかチェック
                        if (!parameters || parameters.length === 0) {
                            parameters = [{ type: 'Identifier', value: '_' }];
                        } else {
                            // パラメータとして有効な要素を変換
                            parameters = parameters.map(param => {
                                // 識別子と残余引数はそのまま
                                if (param.type === 'Identifier' ||
                                    (param.type === 'SpreadOperation' && param.position === 'prefix') ||
                                    param.type === 'RangeOperation') {
                                    return param;
                                }
                                // 数値は仮想的な識別子に変換
                                else if (param.type === 'Number' && this.context.allowNumericParams) {
                                    return {
                                        type: 'Identifier',
                                        value: `_param_${param.value}`,
                                        originalValue: param
                                    };
                                }
                                // その他は警告を出して_に置き換え
                                this.addWarning(`無効なパラメータタイプ ${param.type} を識別子に変換します`);
                                return { type: 'Identifier', value: '_' };
                            });
                        }
                    } else if (params.type === 'Coproduct') {
                        // 余積（スペース区切りリスト）の処理
                        try {
                            const paramList = this.flattenCoproduct(params);
                            parameters = [];

                            // パラメータとして適切な要素を変換
                            paramList.forEach(item => {
                                if (item.type === 'Identifier' ||
                                    (item.type === 'SpreadOperation' && item.position === 'prefix') ||
                                    item.type === 'RangeOperation') {
                                    parameters.push(item);
                                } else if (item.type === 'Number' && this.context.allowNumericParams) {
                                    // 数値を仮想的な識別子に変換
                                    parameters.push({
                                        type: 'Identifier',
                                        value: `_param_${item.value}`,
                                        originalValue: item
                                    });
                                } else {
                                    this.addWarning(`余積内の無効なパラメータタイプ ${item.type} をスキップします`);
                                }
                            });
                        } catch (error) {
                            if (this.parseMode === 'recovery') {
                                this.addWarning(`余積の展開エラー: ${error.message}`);
                                parameters = [{ type: 'Identifier', value: '_' }];
                            } else {
                                throw error;
                            }
                        }
                    } else if (params.type === 'Number' && this.context.allowNumericParams) {
                        // 数値パラメータの特別処理
                        parameters = [{
                            type: 'Identifier',
                            value: `_param_${params.value}`,
                            originalValue: params
                        }];
                    } else if (params.type === 'String') {
                        // 文字列パラメータは識別子として扱う（特殊ケース）
                        parameters = [{
                            type: 'Identifier',
                            value: `_str_param_${params.value.replace(/[^a-zA-Z0-9_]/g, '_')}`,
                            originalValue: params
                        }];
                    } else if (params.type === 'Unit') {
                        // 単位元は単一パラメータとして処理
                        parameters = [{ type: 'Identifier', value: '_' }];
                    } else {
                        if (this.parseMode === 'recovery') {
                            this.addWarning(`未知のパラメータタイプ ${params.type} をデフォルトパラメータに置き換えます`);
                            parameters = [{ type: 'Identifier', value: '_' }];
                        } else {
                            throw this.error(`ラムダ式のパラメータリストが無効です: ${params.type}`);
                        }
                    }
                } catch (error) {
                    if (this.parseMode === 'recovery') {
                        this.addWarning(`パラメータ処理エラー: ${error.message}`);
                        parameters = [{ type: 'Identifier', value: '_' }];
                    } else {
                        throw error;
                    }
                }

                // パラメータが見つからない場合のフォールバック
                if (!parameters || parameters.length === 0) {
                    parameters = [{ type: 'Identifier', value: '_' }]; // デフォルトパラメータ
                }

                // ラムダ本体の解析 - インデントブロックまたはインラインの式
                let body = null;

                try {
                    if (this.check(TokenType.EVAL)) {
                        // 改行がある場合はインデントブロックを期待
                        this.advance(); // 改行を消費

                        if (this.check(TokenType.f_block)) {
                            // インデントブロックの内容を解析
                            body = this.parseIndentBlock();

                            // ブロック内に条件分岐があるかチェック
                            if (body && body.type === 'Block' && body.body) {
                                try {
                                    const branches = this.checkForConditionalBranches(body.body);
                                    if (branches && branches.length > 0) {
                                        return {
                                            type: 'ConditionalLambda',
                                            parameters: parameters,
                                            branches: branches
                                        };
                                    }
                                } catch (error) {
                                    if (this.parseMode === 'recovery') {
                                        this.addWarning(`条件分岐チェックエラー: ${error.message}`);
                                    } else {
                                        throw error;
                                    }
                                }
                            }
                        } else {
                            if (this.parseMode === 'recovery') {
                                this.addWarning("インデントブロックがありません、デフォルト値を使用します");
                                body = { type: 'Unit', value: '_' };
                            } else {
                                throw this.error("ラムダ式の本体にはインデントブロックが必要です");
                            }
                        }
                    } else {
                        // インラインの式
                        try {
                            body = this.parseArithmetic();
                        } catch (error) {
                            if (this.parseMode === 'recovery') {
                                this.addWarning(`インライン式の解析エラー: ${error.message}`);
                                body = { type: 'Unit', value: '_' };
                            } else {
                                throw error;
                            }
                        }
                    }
                } catch (error) {
                    if (this.parseMode === 'recovery') {
                        this.addWarning(`ラムダ本体の解析エラー: ${error.message}`);
                        body = { type: 'Unit', value: '_' }; // 単位元をデフォルトとして使用
                    } else {
                        throw error;
                    }
                }

                // bodyがnullの場合はフォールバックを提供
                if (!body) {
                    body = { type: 'Unit', value: '_' };
                }

                // ラムダノードの生成
                return {
                    type: 'Lambda',
                    parameters: parameters,
                    body: body
                };
            } catch (error) {
                // エラーが発生した場合、バックトラック
                if (this.parseMode === 'recovery') {
                    this.addWarning(`ラムダ式の解析エラー: ${error.message}`);
                    this.current = startPos;

                    // 可能であれば製品として解析を試みる
                    try {
                        return this.parseProduct();
                    } catch (innerError) {
                        // それも失敗した場合は単位元を返す
                        return { type: 'Unit', value: '_' };
                    }
                }
                throw error;
            }
        }, { inLambda: true, allowNumericParams: true });
    }

    /**
     * 余積ノードをフラット化して要素のリストを取得
     * 入れ子になった余積を再帰的に処理
     * @param {Object} node - フラット化するCoproductノード
     * @returns {Array} - フラット化された要素の配列
     */
    flattenCoproduct(node) {
        // nullや空のノードのチェック
        if (!node) {
            return [];
        }

        // 余積でない場合は単一要素の配列として返す
        if (node.type !== 'Coproduct') {
            return [node];
        }

        // 両方のサブツリーをフラットにして結合
        const leftElements = this.flattenCoproduct(node.left) || [];
        const rightElements = this.flattenCoproduct(node.right) || [];

        return [...leftElements, ...rightElements];
    }

    /**
     * 条件分岐を含むブロックをチェック
     * @param {Array} blockStatements - ブロック内のステートメント配列
     * @returns {Array} 条件分岐の配列
     */
    checkForConditionalBranches(blockStatements) {
        if (!blockStatements || !Array.isArray(blockStatements)) {
            return [];
        }

        const branches = [];

        for (const stmt of blockStatements) {
            // 各ステートメントが条件:式 の形式かチェック
            if (stmt && stmt.type === 'Definition') {
                // 条件部分と結果部分を取得
                const condition = stmt.identifier;
                const result = stmt.value;

                // 条件と結果の両方がある場合のみ分岐として追加
                if (condition && result) {
                    branches.push({
                        condition: condition,
                        result: result
                    });
                }
            }
        }

        return branches;
    }

    /**
     * 製品（カンマ区切りリスト）の解析
     * @returns {Object} 製品を表すASTノード
     */
    parseProduct() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            let expr = this.parseArithmetic();

            // カンマがあれば製品として処理
            if (this.match(TokenType.f_product)) {
                const elements = [expr];

                // 次の要素を解析
                try {
                    elements.push(this.parseArithmetic());
                } catch (error) {
                    if (this.parseMode === 'recovery') {
                        this.addWarning(`製品の2番目の要素解析エラー: ${error.message}`);
                        elements.push({ type: 'Unit', value: '_' });
                    } else {
                        throw error;
                    }
                }

                // さらにカンマが続く限り要素を追加
                while (this.match(TokenType.f_product)) {
                    try {
                        elements.push(this.parseArithmetic());
                    } catch (error) {
                        if (this.parseMode === 'recovery') {
                            this.addWarning(`製品の追加要素解析エラー: ${error.message}`);
                            elements.push({ type: 'Unit', value: '_' });
                        } else {
                            throw error;
                        }
                    }
                }

                return {
                    type: 'Product',
                    elements: elements
                };
            }

            return expr;
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理
                this.current = startPos;
                this.addWarning(`製品解析エラー: ${error.message}`);
                return { type: 'Unit', value: '_' };
            }
            throw error;
        }
    }

    /**
     * 算術演算（加減乗除など）の解析
     * @returns {Object} 算術演算を表すASTノード
     */
    parseArithmetic() {
        // 最も低い優先度の演算子（論理演算）から解析
        return this.parseLogical();
    }

    /**
     * 論理演算（OR/XOR）の解析
     * @returns {Object} 論理演算を表すASTノード
     */
    parseLogical() {
        // まず論理AND演算を解析
        let expr = this.parseLogicalAnd();

        // | または ; 演算子がある限りループ
        while (this.match(TokenType.f_or) || this.match(TokenType.f_xor)) {
            // 演算子を取得（直前に消費したトークン）
            const operator = this.tokens[this.current - 1].value;

            // 右辺を解析
            let right;
            try {
                right = this.parseLogicalAnd();
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`論理演算子 ${operator} の右辺解析エラー: ${error.message}`);
                    right = { type: 'Unit', value: '_' };
                } else {
                    throw error;
                }
            }

            // 二項演算ノードを生成
            expr = {
                type: 'BinaryOperation',
                operator: operator,
                left: expr,
                right: right
            };
        }

        return expr;
    }

    /**
     * 論理AND演算の解析
     * @returns {Object} 論理AND演算を表すASTノード
     */
    parseLogicalAnd() {
        // まず論理NOT演算を解析
        let expr = this.parseLogicalNot();

        // & 演算子がある限りループ
        while (this.match(TokenType.f_and)) {
            // 演算子を取得
            const operator = this.tokens[this.current - 1].value;

            // 右辺を解析
            let right;
            try {
                right = this.parseLogicalNot();
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`論理AND演算子の右辺解析エラー: ${error.message}`);
                    right = { type: 'Unit', value: '_' };
                } else {
                    throw error;
                }
            }

            // 二項演算ノードを生成
            expr = {
                type: 'BinaryOperation',
                operator: operator,
                left: expr,
                right: right
            };
        }

        return expr;
    }

    /**
     * 論理NOT演算の解析
     * @returns {Object} 論理NOT演算を表すASTノード
     */
    parseLogicalNot() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        // ! 演算子がある場合
        if (this.match(TokenType.f_not)) {
            try {
                // 続く式を解析
                const expr = this.parseLogicalNot(); // 再帰的に処理（複数の ! の処理をサポート）

                // 単項演算ノードを生成
                return {
                    type: 'UnaryOperation',
                    operator: '!',
                    position: 'prefix',
                    expression: expr
                };
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    // 回復処理
                    this.current = startPos;
                    this.advance(); // ! は消費
                    this.addWarning(`論理NOT演算子の式解析エラー: ${error.message}`);
                    return {
                        type: 'UnaryOperation',
                        operator: '!',
                        position: 'prefix',
                        expression: { type: 'Unit', value: '_' }
                    };
                }
                throw error;
            }
        }

        // それ以外は比較演算を解析
        return this.parseSpread();
    }

    /**
     * スプレッド演算子の解析
     * 前置/後置/中置のすべてのスプレッド演算子パターンを処理
     * @returns {Object} スプレッド演算子を含む式のASTノード
     */
    parseSpread() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        // 前置の ~ 演算子（残余引数リスト構築）の処理
        if (this.match(TokenType.f_spread)) {
            try {
                // 続く式を解析
                const expr = this.parseCompareOrRange();

                // 前置スプレッド演算ノードを生成
                return {
                    type: 'SpreadOperation',
                    operator: '~',
                    position: 'prefix',
                    expression: expr
                };
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    // 回復処理
                    this.current = startPos;
                    this.advance(); // ~ は消費
                    this.addWarning(`前置スプレッド演算子の式解析エラー: ${error.message}`);
                    return {
                        type: 'SpreadOperation',
                        operator: '~',
                        position: 'prefix',
                        expression: { type: 'Identifier', value: 'spread_error' }
                    };
                }
                throw error;
            }
        }

        // 前置でない場合は通常の式から開始
        let expr = this.parseCompareOrRange();

        // 後置の ~ 演算子（展開）の処理
        if (this.match(TokenType.f_spread)) {
            // 後置スプレッド演算ノードを生成
            expr = {
                type: 'SpreadOperation',
                operator: '~',
                position: 'postfix',
                expression: expr
            };
        }

        return expr;
    }

    /**
     * 比較演算または範囲リスト構築の解析
     * @returns {Object} 比較演算または範囲リストを表すASTノード
     */
    parseCompareOrRange() {
        // まず比較演算を解析
        let expr = this.parseComparison();

        // 中置の ~ 演算子（範囲リスト構築）の処理
        if (this.match(TokenType.f_spread)) {
            try {
                // 右辺を解析
                const right = this.parseComparison();

                // 範囲リスト構築ノードを生成
                expr = {
                    type: 'RangeOperation',
                    operator: '~',
                    left: expr,
                    right: right
                };
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`範囲演算子の右辺解析エラー: ${error.message}`);
                    // エラー時は左辺をそのまま返す
                    return expr;
                }
                throw error;
            }
        }

        return expr;
    }

    /**
     * 比較演算の解析
     * @returns {Object} 比較演算を表すASTノード
     */
    parseComparison() {
        // まず加減算を解析
        let expr = this.parseAdditive();

        // 比較演算子がある限りループ
        while (
            this.match(TokenType.f_less) ||
            this.match(TokenType.f_less_eq) ||
            this.match(TokenType.f_eq) ||
            this.match(TokenType.f_more_eq) ||
            this.match(TokenType.f_more) ||
            this.match(TokenType.f_neq)
        ) {
            // 演算子を取得
            const operator = this.tokens[this.current - 1].value;

            try {
                // 右辺を解析
                const right = this.parseAdditive();

                // 二項演算ノードを生成
                expr = {
                    type: 'BinaryOperation',
                    operator: operator,
                    left: expr,
                    right: right
                };
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`比較演算子 ${operator} の右辺解析エラー: ${error.message}`);
                    // エラー時は単項演算として扱う
                    expr = {
                        type: 'BinaryOperation',
                        operator: operator,
                        left: expr,
                        right: { type: 'Unit', value: '_' }
                    };
                    break;
                }
                throw error;
            }
        }

        return expr;
    }

    /**
     * 加減算の解析
     * @returns {Object} 加減算を表すASTノード
     */
    parseAdditive() {
        // まず乗除算を解析
        let expr = this.parseMultiplicative();

        // + または - 演算子がある限りループ
        while (this.match(TokenType.f_add) || this.match(TokenType.f_sub)) {
            // 演算子を取得（直前に消費したトークン）
            const operator = this.tokens[this.current - 1].value;

            try {
                // 右辺を解析
                const right = this.parseMultiplicative();

                // 二項演算ノードを生成
                expr = {
                    type: 'BinaryOperation',
                    operator: operator,
                    left: expr,
                    right: right
                };
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`加減算演算子 ${operator} の右辺解析エラー: ${error.message}`);
                    // エラー時は単項演算として扱う
                    expr = {
                        type: 'BinaryOperation',
                        operator: operator,
                        left: expr,
                        right: { type: 'Unit', value: '_' }
                    };
                    break;
                }
                throw error;
            }
        }

        return expr;
    }

    /**
     * 乗除算の解析
     * @returns {Object} 乗除算を表すASTノード
     */
    parseMultiplicative() {
        // まず累乗演算を解析
        let expr = this.parsePower();

        // *, /, % 演算子がある限りループ
        while (this.match(TokenType.f_mul) ||
            this.match(TokenType.f_div) ||
            this.match(TokenType.f_mod)) {
            // 演算子を取得
            const operator = this.tokens[this.current - 1].value;

            try {
                // 右辺を解析
                const right = this.parsePower();

                // 二項演算ノードを生成
                expr = {
                    type: 'BinaryOperation',
                    operator: operator,
                    left: expr,
                    right: right
                };
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`乗除算演算子 ${operator} の右辺解析エラー: ${error.message}`);
                    // エラー時は単項演算として扱う
                    expr = {
                        type: 'BinaryOperation',
                        operator: operator,
                        left: expr,
                        right: { type: 'Unit', value: '_' }
                    };
                    break;
                }
                throw error;
            }
        }

        return expr;
    }

    /**
     * 累乗演算の解析
     * @returns {Object} 累乗演算を表すASTノード
     */
    parsePower() {
        // まず階乗演算を解析
        let expr = this.parseFactorial();

        // ^ 演算子がある場合
        if (this.match(TokenType.f_power)) {
            try {
                // 右辺を解析（右結合なので再帰的にparsePowerを呼ぶ）
                const right = this.parsePower();

                // 二項演算ノードを生成
                expr = {
                    type: 'BinaryOperation',
                    operator: '^',
                    left: expr,
                    right: right
                };
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`累乗演算子の右辺解析エラー: ${error.message}`);
                    // エラー時は単項演算として扱う
                    expr = {
                        type: 'BinaryOperation',
                        operator: '^',
                        left: expr,
                        right: { type: 'Number', value: '2' } // デフォルトで2乗とする
                    };
                } else {
                    throw error;
                }
            }
        }

        return expr;
    }

    /**
     * 階乗演算の解析
     * @returns {Object} 階乗演算を表すASTノード
     */
    parseFactorial() {
        // まずゲット演算子を解析
        let expr = this.parseGet();

        // ! 演算子（後置）がある限りループ
        while (this.match(TokenType.f_factorial)) {
            // 単項演算ノードを生成
            expr = {
                type: 'UnaryOperation',
                operator: '!',
                position: 'postfix',
                expression: expr
            };
        }

        return expr;
    }

    /**
     * ゲット演算子の解析
     * @returns {Object} ゲット演算を表すASTノード
     */
    parseGet() {
        // まず基本要素を解析
        let expr = this.parseEval();

        // ' 演算子がある限りループ
        while (this.match(TokenType.f_get)) {
            try {
                // プロパティ識別子の解析
                let property;

                // 識別子
                if (this.check(TokenType.identifier)) {
                    property = {
                        type: 'Identifier',
                        value: this.advance().value
                    };
                }
                // 文字列
                else if (this.check(TokenType.string)) {
                    property = {
                        type: 'String',
                        value: this.advance().value
                    };
                }
                // 数値
                else if (this.check(TokenType.number)) {
                    property = {
                        type: 'Number',
                        value: this.advance().value
                    };
                }
                // スプレッド演算子
                else if (this.check(TokenType.f_spread)) {
                    this.advance(); // ~ を消費
                    property = {
                        type: 'SpreadProperty',
                        value: this.parseEval()
                    };

                }
                // インライン括弧で囲まれたプロパティ参照
                else if (this.check(TokenType.BLOCK_START)) {
                    try {
                        // 括弧内のプロパティ式を解析
                        property = this.parseInlineBlock();
                    } catch (error) {
                        if (this.parseMode === 'recovery') {
                            this.addWarning(`インラインプロパティ解析エラー: ${error.message}`);
                            property = { type: 'Identifier', value: 'property_error' };
                        } else throw error;
                    }
                }
                // その他の式（括弧で囲まれた式など）
                else {
                    property = this.parseEval();
                }

                // プロパティ書き換え演算子（:）がある場合
                if (this.match(TokenType.f_define)) {
                    // 代入する値を解析
                    let value;
                    try {
                        value = this.parseArithmetic();
                    } catch (error) {
                        if (this.parseMode === 'recovery') {
                            this.addWarning(`プロパティ代入値解析エラー: ${error.message}`);
                            value = { type: 'Unit', value: '_' };
                        } else {
                            throw error;
                        }
                    }

                    // プロパティ更新ノードを生成
                    expr = {
                        type: 'PropertyAssignment',
                        object: expr,
                        property: property,
                        value: value
                    };
                } else {
                    // 通常のプロパティアクセスノードを生成
                    expr = {
                        type: 'PropertyAccess',
                        object: expr,
                        property: property
                    };
                }
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`プロパティアクセス解析エラー: ${error.message}`);
                    // エラー時は元の式をそのまま返す
                    break;
                }
                throw error;
            }
        }

        return expr;
    }

    /**
     * 評価（改行）演算子の解析
     * すでにEVALトークンは消費されているので、
     * この関数は単純にプライマリ式を返す
     * @returns {Object} 解析された式
     */
    parseEval() {
        return this.parsePrimary();
    }

    /**
     * 基本要素（リテラルまたはブロック）の解析
     * @returns {Object} 基本要素を表すASTノード
     */
    parsePrimary() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // ブロック構文の場合
            if (this.check(TokenType.f_block)) {
                return this.parseIndentBlock();
            } else if (this.check(TokenType.BLOCK_START)) {
                return this.parseInlineBlock();
            }

            // それ以外はリテラルとして解析
            return this.parseLiteral();
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理: 元の位置に戻る
                this.current = startPos;
                this.addWarning(`基本要素解析エラー: ${error.message}`);

                // 安全なフォールバック: 特定のトークンタイプによって適切な処理
                if (this.check(TokenType.number)) {
                    this.advance();
                    return { type: 'Number', value: '0' }; // デフォルト数値
                } else if (this.check(TokenType.string)) {
                    this.advance();
                    return { type: 'String', value: '' }; // 空文字列
                } else if (this.check(TokenType.identifier)) {
                    this.advance();
                    return { type: 'Identifier', value: 'error_id' }; // エラー識別子
                } else {
                    // それ以外は単位元を返す
                    return { type: 'Unit', value: '_' };
                }
            }
            throw error;
        }
    }

    /**
     * ブロック構文の解析
     * @returns {Object} ブロックを表すASTノード
     */
    parseBlock() {
        // ブロックの種類を判断
        if (this.check(TokenType.f_block)) {
            // インデントによるブロック
            return this.parseIndentBlock();
        } else if (this.check(TokenType.BLOCK_START)) {
            // 括弧によるインラインブロック
            return this.parseInlineBlock();
        }

        // それ以外はリテラルとして解析
        return this.parseLiteral();
    }

    /**
     * インデントによるブロックの解析
     * インデントレベルを追跡して正確にブロック構造を構築
     * @returns {Object} ブロックを表すASTノード
     */
    parseIndentBlock() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // 現在のインデントレベルを取得
            const startIndent = this.countIndentation();
            // 前のインデントレベルを保存
            const prevIndentLevel = this.context.indentLevel;
            // 新しいインデントレベルを設定
            this.context.indentLevel = startIndent;

            logger.debug(`インデントブロック解析開始: レベル ${startIndent}`);

            // タブトークンを消費
            let indentCount = 0;
            while (this.check(TokenType.f_block)) {
                this.advance();
                indentCount++;
            }

            // 実際のインデント数と期待数が一致するか検証
            if (indentCount !== startIndent) {
                logger.warning(`インデント不一致: 期待 ${startIndent}, 実際 ${indentCount}`);
            }

            // ブロック内の式を解析
            const expression = this.parseExpression();
            if (!expression) {
                // 空のブロックの場合は単位元を返す
                this.context.indentLevel = prevIndentLevel;
                return {
                    type: 'Unit',
                    value: '_'
                };
            }

            // ブロックの終わりを判断（インデントレベルが戻るまで）
            const body = [expression];

            // 後続の行が同じインデントレベルであれば処理を続ける
            while (this.check(TokenType.EVAL) &&
                this.peek(1).type === TokenType.f_block &&
                this.countIndentation(1) === startIndent) {

                this.advance(); // 改行を消費

                // タブトークンを消費
                while (this.check(TokenType.f_block)) {
                    this.advance();
                }

                // ブロック内の次の式を解析
                const nextExpr = this.parseExpression();
                if (nextExpr) {
                    body.push(nextExpr);
                }
            }

            // インデントレベルを元に戻す
            this.context.indentLevel = prevIndentLevel;

            // 複数の式がある場合はブロックとして返す
            if (body.length > 1) {
                return {
                    type: 'Block',
                    body: body
                };
            }

            // 単一の式の場合はその式をそのまま返す
            return expression;
        } catch (error) {
            if (this.parseMode === 'recovery') {
                this.addWarning(`インデントブロック解析エラー: ${error.message}`);
                // バックトラックして回復
                this.current = startPos;

                // タブトークンを消費
                while (this.check(TokenType.f_block)) {
                    this.advance();
                }

                // 空のブロックを返して続行
                return { type: 'Block', body: [] };
            }
            throw error;
        }
    }

    /**
     * インラインブロック（括弧で囲まれた式）の解析
     * @returns {Object} ブロックを表すASTノード
     */
    parseInlineBlock() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // 開始括弧を消費
            const startToken = this.advance();

            // 括弧のネストレベルを増やす
            this.context.bracketBalance++;

            // 対応する閉じ括弧を予測
            let endChar;
            if (startToken.value === '(') endChar = ')';
            else if (startToken.value === '[') endChar = ']';
            else if (startToken.value === '{') endChar = '}';

            // 期待する閉じ括弧をスタックに追加
            this.context.expectingBracket.push(endChar);

            // 空の括弧かチェック
            if (this.check(TokenType.BLOCK_END)) {
                // 閉じ括弧を消費
                this.advance();

                // 括弧のネストレベルを減らす
                this.context.bracketBalance--;

                // 期待する閉じ括弧をスタックから削除
                if (this.context.expectingBracket.length > 0) {
                    this.context.expectingBracket.pop();
                }

                // 空リストとして扱う
                return { type: 'EmptyList', value: '[]' };
            }

            // 特殊な関数表現（ポイントフリースタイル記法または部分適用）のチェック
            // []内に演算子や式を含む場合の処理
            if (startToken.value === '[') {
                // 直後に演算子がある場合（例: [+] や [*]）
                if (this.isOperator(this.peek().type)) {
                    // ポイントフリー記法を処理
                    const pfExpr = this.parsePointFreeNotation();

                    // 括弧のネストレベルを減らす
                    this.context.bracketBalance--;

                    // 期待する閉じ括弧をスタックから削除
                    if (this.context.expectingBracket.length > 0) {
                        this.context.expectingBracket.pop();
                    }

                    return pfExpr;
                }

                // 次のトークンが識別子や数値などの場合、部分適用の可能性をチェック
                const possiblePartialApp = this.checkPartialApplication();
                if (possiblePartialApp) {
                    // 括弧のネストレベルを減らす (すでに消費済み)
                    this.context.bracketBalance--;

                    // 期待する閉じ括弧をスタックから削除
                    if (this.context.expectingBracket.length > 0) {
                        this.context.expectingBracket.pop();
                    }

                    return possiblePartialApp;
                }
            }

            // 通常のブロック処理
            // 括弧内の式を解析
            let expr;
            try {
                expr = this.parseExpression();
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`括弧内の式解析エラー: ${error.message}`);
                    expr = { type: 'Unit', value: '_' };
                } else {
                    throw error;
                }
            }

            // 閉じ括弧を消費
            if (this.check(TokenType.BLOCK_END)) {
                const endToken = this.advance();

                // 閉じ括弧と開始括弧が対応するか確認
                if (endToken.value !== endChar) {
                    this.addWarning(`括弧の不一致: 期待 ${endChar}, 実際 ${endToken.value}`);
                    // 括弧バランスを調整
                    if (this.context.expectingBracket.includes(endToken.value)) {
                        // 期待セットにある括弧なら調整
                        while (this.context.expectingBracket.length > 0 &&
                            this.context.expectingBracket[this.context.expectingBracket.length - 1] !== endToken.value) {
                            this.context.expectingBracket.pop();
                            this.context.bracketBalance--;
                        }
                    }
                }
            } else {
                this.addWarning(`閉じ括弧 ${endChar} が見つかりません、自動補完します`);
            }

            // 括弧のネストレベルを減らす
            this.context.bracketBalance--;

            // 期待する閉じ括弧をスタックから削除
            if (this.context.expectingBracket.length > 0) {
                this.context.expectingBracket.pop();
            }

            return expr;
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理
                this.current = startPos;
                this.addWarning(`インラインブロック解析エラー: ${error.message}`);

                // 開始括弧を消費
                this.advance();

                // 閉じ括弧までスキップ
                let bracketLevel = 1;
                while (bracketLevel > 0 && !this.isAtEnd()) {
                    if (this.check(TokenType.BLOCK_START)) {
                        bracketLevel++;
                    } else if (this.check(TokenType.BLOCK_END)) {
                        bracketLevel--;
                    }

                    if (bracketLevel > 0) {
                        this.advance();
                    }
                }

                // 閉じ括弧があれば消費
                if (this.check(TokenType.BLOCK_END)) {
                    this.advance();
                }

                // 空のリストを返す
                return { type: 'EmptyList', value: '[]' };
            }
            throw error;
        }
    }

    /**
     * ポイントフリースタイル記法の解析（例: [+], [*]）
     * 様々なポイントフリー記法のパターンを正確に識別
     * @returns {Object} 関数化された演算子を表すASTノード
     */
    parsePointFreeNotation() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        // コンテキストを変更して解析
        return this.withContext(() => {
            try {
                // ポイントフリーモードを設定
                this.context.inPointFree = true;

                // 後置演算子のチェック ([_!] 形式)
                if (this.check(TokenType.unit)) {
                    return this.parsePostfixPointFree();
                }

                // 演算子トークンを取得する前に閉じ括弧をチェック
                // 空の角括弧の場合などの対応
                if (this.check(TokenType.BLOCK_END)) {
                    // 空リストとして処理
                    this.advance();
                    return { type: 'EmptyList', value: '[]' };
                }

                // 次のトークンが演算子かどうか再確認
                if (!this.isOperator(this.peek().type)) {
                    // 演算子でない場合、部分適用などの別の形式を試す
                    const possiblePartialApp = this.checkPartialApplication();
                    if (possiblePartialApp) {
                        return possiblePartialApp;
                    }

                    // 演算子でなければリストを解析
                    return this.parseExpressionList();
                }

                // 演算子トークンを取得
                const operatorToken = this.advance();
                const operator = operatorToken.value;


                // Get演算子の特別処理（Sign言語のプロパティアクセス）
                if (operatorToken.type === TokenType.f_get) {
                    // 'の後にプロパティ識別子が続く場合
                    if (this.check(TokenType.identifier) ||
                        this.check(TokenType.string) ||
                        this.check(TokenType.number)) {

                        // プロパティ識別子を消費
                        const property = this.advance();

                        // 閉じ括弧をチェック
                        if (this.check(TokenType.BLOCK_END)) {
                            this.advance(); // 閉じ括弧を消費

                            // プロパティアクセスノードを生成
                            return {
                                type: 'PropertyAccessPointFree',
                                property: { type: property.type === TokenType.identifier ? 'Identifier' : 'Literal', value: property.value }
                            };
                        }
                    }
                }

                // 閉じ括弧をチェック - より柔軟な処理
                if (!this.check(TokenType.BLOCK_END)) {
                    // 次のトークンが数値か識別子なら部分適用として処理
                    if (this.check(TokenType.number) || this.check(TokenType.identifier)) {
                        this.current = startPos + 1; // 演算子の後に戻る
                        return this.checkPartialApplication();
                    }

                    // 次のトークンが閉じ括弧でなければスキップして探す
                    let bracketLevel = 1;
                    let skipPos = this.current;
                    while (skipPos < this.tokens.length && bracketLevel > 0) {
                        if (this.tokens[skipPos].type === TokenType.BLOCK_START) {
                            bracketLevel++;
                        } else if (this.tokens[skipPos].type === TokenType.BLOCK_END) {
                            bracketLevel--;
                        }
                        skipPos++;
                    }

                    if (bracketLevel === 0) {
                        // 閉じ括弧が見つかった - 位置を更新
                        this.current = skipPos;
                    } else {
                        // 閉じ括弧が見つからない - 警告を出すが続行
                        this.addWarning("ポイントフリー記法の閉じ括弧が見つかりません");
                    }
                } else {
                    // 閉じ括弧を消費
                    this.advance();
                }

                // ポイントフリー演算子ノードを生成
                return {
                    type: 'PointFreeOperator',
                    operator: operator,
                    position: this.getOperatorPosition(operatorToken.type)
                };
            } catch (error) {
                // エラーが発生した場合、バックトラック
                if (this.parseMode === 'recovery') {
                    this.addWarning(`ポイントフリー記法の解析エラー: ${error.message}`);
                    this.current = startPos;

                    // 演算子を取得できれば簡易的な処理を行う
                    if (this.isOperator(this.peek().type)) {
                        const operatorToken = this.advance();

                        // 閉じ括弧までスキップ
                        while (!this.isAtEnd() && !this.check(TokenType.BLOCK_END)) {
                            this.advance();
                        }

                        // 閉じ括弧があれば消費
                        if (this.check(TokenType.BLOCK_END)) {
                            this.advance();
                        }

                        return {
                            type: 'PointFreeOperator',
                            operator: operatorToken.value,
                            position: this.getOperatorPosition(operatorToken.type)
                        };
                    }

                    // それも無理なら空リストを返す
                    return { type: 'EmptyList', value: '[]' };
                }
                throw error;
            }
        }, { inPointFree: true });
    }

    /**
     * 括弧内の式リストを解析
     * @returns {Object} 式リストを表すASTノード
     */
    parseExpressionList() {
        const expressions = [];

        // 閉じ括弧までの式を解析
        while (!this.check(TokenType.BLOCK_END) && !this.isAtEnd()) {
            try {
                // 式を解析
                const expr = this.parseExpression();
                if (expr) {
                    expressions.push(expr);
                }

                // カンマがあれば消費
                this.match(TokenType.f_product);
            } catch (error) {
                if (this.parseMode === 'recovery') {
                    this.addWarning(`式リスト内の式解析エラー: ${error.message}`);
                    // 次の式または閉じ括弧までスキップ
                    this.synchronizeToNextExpr();
                } else {
                    throw error;
                }
            }
        }

        // 閉じ括弧を消費
        if (this.check(TokenType.BLOCK_END)) {
            this.advance();
        } else {
            this.addWarning("式リストの閉じ括弧がありません");
        }

        // 要素がない場合は空リスト
        if (expressions.length === 0) {
            return { type: 'EmptyList', value: '[]' };
        }

        // 要素が1つだけの場合はその要素を返す
        if (expressions.length === 1) {
            return expressions[0];
        }

        // 複数の要素がある場合は配列として返す
        return {
            type: 'ExpressionList',
            expressions: expressions
        };
    }

    /**
     * 次の式または閉じ括弧までスキップ
     */
    synchronizeToNextExpr() {
        while (!this.isAtEnd() &&
            !this.check(TokenType.f_product) &&
            !this.check(TokenType.BLOCK_END) &&
            !this.check(TokenType.EVAL)) {
            this.advance();
        }

        // カンマがあれば消費
        if (this.match(TokenType.f_product)) {
            return;
        }
    }

    /**
     * 部分適用の解析（例: [1 +], [+ 2]）
     * 部分適用のパターンを認識し、適切なASTノードを生成
     * @returns {Object|null} 部分適用を表すASTノードまたはnull
     */
    checkPartialApplication() {
        // 現在位置を保存
        const startPos = this.current;

        try {
            // 左辺の式または識別子を解析
            let left = null;
            if (!this.isOperator(this.peek().type) && !this.check(TokenType.BLOCK_END)) {
                try {
                    left = this.parseArithmetic();
                } catch (error) {
                    if (this.parseMode === 'recovery') {
                        this.addWarning(`部分適用の左辺解析エラー: ${error.message}`);
                        left = { type: 'Unit', value: '_' };
                    } else {
                        throw error;
                    }
                }
            }

            // 演算子を解析
            let operator = null;
            if (this.isOperator(this.peek().type)) {
                const opToken = this.advance();
                operator = opToken.value;
            }

            // 右辺の式または識別子を解析
            let right = null;
            if (operator && !this.check(TokenType.BLOCK_END)) {
                try {
                    right = this.parseArithmetic();
                } catch (error) {
                    if (this.parseMode === 'recovery') {
                        this.addWarning(`部分適用の右辺解析エラー: ${error.message}`);
                        right = { type: 'Unit', value: '_' };
                    } else {
                        throw error;
                    }
                }
            }

            // 閉じ括弧をチェック
            if (this.check(TokenType.BLOCK_END)) {
                this.advance(); // 閉じ括弧を消費

                // 部分適用ノードを生成
                if (operator) {
                    return {
                        type: 'PartialApplication',
                        operator: operator,
                        left: left,
                        right: right
                    };
                }

                // 演算子がない場合は単なる式として扱う
                if (left) {
                    return left;
                }

                // 何もない場合は空リスト
                return { type: 'EmptyList', value: '[]' };
            }

            // 部分適用でない場合は元の位置に戻す
            this.current = startPos;
            return null;
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理
                this.current = startPos;
                this.addWarning(`部分適用チェックエラー: ${error.message}`);
                return null;
            }
            throw error;
        }
    }

    /**
     * トークンが演算子かどうかを判断
     * @param {string} tokenType - トークンの種類
     * @returns {boolean} 演算子の場合true
     */
    isOperator(tokenType) {
        return tokenType === TokenType.f_add ||
            tokenType === TokenType.f_sub ||
            tokenType === TokenType.f_mul ||
            tokenType === TokenType.f_div ||
            tokenType === TokenType.f_mod ||
            tokenType === TokenType.f_power ||
            tokenType === TokenType.f_and ||
            tokenType === TokenType.f_or ||
            tokenType === TokenType.f_xor ||
            tokenType === TokenType.f_not ||
            tokenType === TokenType.f_eq ||
            tokenType === TokenType.f_neq ||
            tokenType === TokenType.f_less ||
            tokenType === TokenType.f_less_eq ||
            tokenType === TokenType.f_more ||
            tokenType === TokenType.f_more_eq ||
            tokenType === TokenType.f_spread ||
            tokenType === TokenType.f_get ||
            tokenType === TokenType.f_factorial;
    }

    /**
     * 演算子の位置（前置、中置、後置）を判断
     * @param {string} tokenType - トークンの種類
     * @returns {string} 演算子の位置
     */
    getOperatorPosition(tokenType) {
        // 前置演算子
        if (tokenType === TokenType.f_not ||
            tokenType === TokenType.f_spread ||
            tokenType === TokenType.f_import ||
            tokenType === TokenType.f_export) {
            return 'prefix';
        }

        // 後置演算子
        if (tokenType === TokenType.f_factorial ||
            tokenType === TokenType.EVAL) {
            return 'postfix';
        }

        // その他は中置演算子
        return 'infix';
    }

    /**
     * リテラル（数値、文字列、識別子など）の解析
     * @returns {Object} リテラルを表すASTノード
     */
    parseLiteral() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // 特殊なケース: 演算子がポイントフリー記法の一部として扱われる場合
            if (this.context.inPointFree && this.isOperator(this.peek().type)) {
                const token = this.advance();
                return {
                    type: 'Operator',
                    value: token.value,
                    tokenType: token.type
                };
            }

            // 数値リテラル
            if (this.check(TokenType.number)) {
                const token = this.advance();
                return {
                    type: 'Number',
                    value: token.value
                };
            }

            // 文字列リテラル
            if (this.check(TokenType.string)) {
                const token = this.advance();
                return {
                    type: 'String',
                    value: token.value
                };
            }

            // 文字リテラル
            if (this.check(TokenType.letter)) {
                const token = this.advance();
                return {
                    type: 'Character',
                    value: token.value
                };
            }

            // 識別子
            if (this.check(TokenType.identifier)) {
                const token = this.advance();
                return {
                    type: 'Identifier',
                    value: token.value
                };
            }

            // 単位元（_）
            if (this.check(TokenType.unit)) {
                this.advance();
                return {
                    type: 'Unit',
                    value: '_'
                };
            }

            // 該当するリテラルがない場合はエラー
            throw this.error(`リテラルが必要ですが、${this.peek().type}が見つかりました`);
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理
                this.current = startPos;

                // 次のトークンを消費して、適切なリテラルを代替で生成
                if (this.check(TokenType.number)) {
                    this.advance();
                    return { type: 'Number', value: '0' };
                } else if (this.check(TokenType.string)) {
                    this.advance();
                    return { type: 'String', value: '' };
                } else if (this.check(TokenType.letter)) {
                    this.advance();
                    return { type: 'Character', value: 'x' };
                } else if (this.check(TokenType.identifier)) {
                    this.advance();
                    return { type: 'Identifier', value: 'error_id' };
                } else if (this.check(TokenType.unit)) {
                    this.advance();
                    return { type: 'Unit', value: '_' };

                } else if (this.isOperator(this.peek().type)) {
                    // 演算子の場合も特別処理
                    const token = this.advance();
                    return {
                        type: 'Operator',
                        value: token.value,
                        tokenType: token.type
                    };
                } else {
                    // その他のトークンの場合は単に次のトークンを消費
                    if (!this.isAtEnd()) {
                        this.advance();
                    }
                    return { type: 'Unit', value: '_' };
                }
            }
            throw error;
        }
    }

    /**
     * 余積（coproduct）の解析
     * @returns {Object} 余積または関数適用を表すASTノード
     */
    parseCoproduct() {
        // バックトラッキング用に位置を記録
        const startPos = this.current;

        try {
            // まずラムダ式を解析
            let expr = this.parseLambda();

            // スペースで区切られた要素がある限りループ
            while (!this.isAtEnd() &&
                !this.check(TokenType.EVAL) &&
                !this.check(TokenType.f_define) &&
                !this.check(TokenType.f_lambda) &&
                !this.check(TokenType.f_spread) &&
                !this.check(TokenType.BLOCK_END)) {

                try {
                    // 次の要素を解析
                    const right = this.parseLambda();

                    // 左側が関数かどうかを判断 - より詳細な判定
                    if (this.isFunctionLike(expr)) {
                        // 関数適用として処理
                        // 既存の引数があれば拡張、なければ新規作成
                        if (expr.type === 'Application') {
                            expr.arguments.push(right);
                        } else {
                            expr = {
                                type: 'Application',
                                function: expr,
                                arguments: [right]
                            };
                        }
                    } else {
                        // 通常の余積として処理
                        expr = {
                            type: 'Coproduct',
                            left: expr,
                            right: right
                        };
                    }
                } catch (error) {
                    if (this.parseMode === 'recovery') {
                        // 次の要素へ進む
                        this.addWarning(`余積要素解析エラー: ${error.message}`);

                        // エラー発生位置から次の有効な要素を探す
                        let tokenCount = 0;
                        while (!this.isAtEnd() &&
                            !this.check(TokenType.EVAL) &&
                            !this.check(TokenType.f_define) &&
                            tokenCount < 3) {  // 最大3トークンまでスキップ
                            this.advance();
                            tokenCount++;
                        }

                        break;
                    } else {
                        throw error;
                    }
                }
            }

            return expr;
        } catch (error) {
            if (this.parseMode === 'recovery') {
                // 回復処理
                this.current = startPos;
                this.addWarning(`余積解析エラー: ${error.message}`);

                // より単純な解析を試みる
                try {
                    return this.parseLambda();
                } catch (innerError) {
                    // どうしても無理なら単位元を返す
                    return { type: 'Unit', value: '_' };
                }
            }
            throw error;
        }
    }

    // ↓↓↓ ヘルパーメソッド ↓↓↓

    /**
     * 現在のトークンを取得
     * @param {number} offset - 現在位置からのオフセット（デフォルト0）
     * @returns {Object} 現在のトークン
     */
    peek(offset = 0) {
        // 現在位置にオフセットを加えた位置のトークンを返す
        const index = this.current + offset;

        // 配列の範囲内かチェック
        if (index >= this.tokens.length) {
            // 範囲外の場合はEOFトークンを返す
            return { type: TokenType.EOF, value: null };
        }

        return this.tokens[index];
    }

    /**
     * 次のトークンに進む
     * @returns {Object} 消費したトークン
     */
    advance() {
        // 終端に達していなければ位置を進める
        if (!this.isAtEnd()) {
            this.current++;
        }

        // 1つ前のトークン（今消費したもの）を返す
        return this.tokens[this.current - 1];
    }

    /**
     * 現在のトークンが特定の種類かチェック
     * @param {string} type - チェックするトークンの種類
     * @returns {boolean} 一致すればtrue
     */
    check(type) {
        // 終端に達していれば常にfalse
        if (this.isAtEnd()) {
            return false;
        }

        // 現在のトークンが指定された種類かチェック
        return this.peek().type === type;
    }

    /**
     * 現在のトークンが指定された種類に一致するか確認し、一致すれば消費
     * @param {string} type - チェックするトークンの種類
     * @returns {boolean} 一致してトークンを消費した場合true
     */
    match(type) {
        // 一致するかチェック
        if (this.check(type)) {
            // 一致すれば消費してtrueを返す
            this.advance();
            return true;
        }

        // 一致しなければfalseを返す
        return false;
    }

    /**
     * 特定の種類のトークンを期待し、一致すれば消費する
     * @param {string} type - 期待するトークンの種類
     * @param {string} message - エラー時のメッセージ
     * @returns {Object} 消費したトークン
     */
    consume(type, message) {
        // 一致するかチェック
        if (this.check(type)) {
            // 一致すれば消費して返す
            return this.advance();
        }

        // 一致しなければエラーを投げる
        throw this.error(message);
    }

    /**
     * 現在位置の連続するタブトークンの数をカウント
     * @param {number} offset - 現在位置からのオフセット（デフォルト0）
     * @returns {number} タブトークンの数
     */
    countIndentation(offset = 0) {
        let count = 0;
        let pos = this.current + offset;

        // 配列の範囲内かチェック
        while (pos < this.tokens.length && this.tokens[pos].type === TokenType.f_block) {
            count++;
            pos++;
        }

        return count;
    }

    /**
     * 構文解析エラーからの回復
     * 次の文の先頭まで読み飛ばす
     * 括弧のバランスを考慮して適切に回復
     */
    synchronize() {
        // 現在の括弧バランスを追跡
        let bracketBalance = this.context.bracketBalance;

        // 次の式の先頭と思われる位置まで読み飛ばす
        while (!this.isAtEnd()) {
            // 括弧の開始と終了を追跡
            if (this.check(TokenType.BLOCK_START)) {
                bracketBalance++;
            } else if (this.check(TokenType.BLOCK_END)) {
                bracketBalance--;
                // 過剰に閉じられた括弧は0にリセット
                if (bracketBalance < 0) {
                    bracketBalance = 0;
                }
            }

            // 改行が見つかり、かつ括弧のネストレベルが0（全ての括弧が閉じている）
            if (this.check(TokenType.EVAL) && bracketBalance === 0) {
                this.advance(); // 改行を消費

                // 識別子、エクスポート、インポート、タブが次にあれば同期完了
                if (this.check(TokenType.identifier) ||
                    this.check(TokenType.f_export) ||
                    this.check(TokenType.f_import) ||
                    this.check(TokenType.f_block)) {
                    // 同期完了
                    this.context.bracketBalance = bracketBalance;
                    logger.debug(`構文解析を再同期しました: 位置 ${this.current}`);
                    return;
                }
            }

            // 終端に達するまで進め続ける
            this.advance();
        }

        // ファイル終端に達した場合
        this.context.bracketBalance = 0;
        logger.debug(`同期失敗: ファイル終端に達しました`);
    }

    /**
     * 式が関数のような動作をするかチェック
     * @param {Object} expr - チェックする式
     * @returns {boolean} 関数として扱えるならtrue
     */
    isFunctionLike(expr) {
        if (!expr || !expr.type) return false;

        return expr.type === 'Identifier' ||
            expr.type === 'Lambda' ||
            expr.type === 'ConditionalLambda' ||
            expr.type === 'SpreadOperation' ||
            expr.type === 'PointFreeOperator' ||
            expr.type === 'Operator' ||         // 演算子も関数として扱う
            expr.type === 'PartialApplication' ||
            expr.type === 'Application' ||
            expr.type === 'PropertyAccessPointFree' || // ポイントフリーのプロパティアクセスも関数
            expr.type === 'Import' ||
            expr.type === 'SpreadImport' ||
            expr.type === 'PropertyAccess';     // プロパティアクセスも関数
    }

    /**
     * エラー耐性を強化したサンプルコードのテスト
     * 部分的な成功でも解析結果を返す
     * @param {string} sampleCode - テストするSign言語のコード
     * @param {boolean} enableLogging - ログ出力を有効にするか
     * @returns {Object} 成功した部分の解析結果
     */
    static robustTestSample(sampleCode, enableLogging = true) {
        const { Lexer } = require('./lexer');
        const originalDebug = process.env.DEBUG;

        if (enableLogging) {
            process.env.DEBUG = 'true';
        }

        try {
            // 字句解析を実行
            const lexer = new Lexer(sampleCode);
            const tokens = lexer.tokenize();

            // 強化された回復モードで構文解析を実行
            const parser = new Parser(tokens);
            parser.setParseMode('recovery');
            return parser.parse();
        } finally {
            // 環境変数を元に戻す
            process.env.DEBUG = originalDebug;
        }
    }

    /**
     * Signサンプルコードのテスト
     * @param {string} sampleCode - テストするSign言語のコード
     * @returns {Object} 解析結果を含むオブジェクト
     */
    static testSample(sampleCode) {
        const { Lexer } = require('./lexer');

        try {
            // 字句解析を実行
            const lexer = new Lexer(sampleCode);
            const tokens = lexer.tokenize();

            // 構文解析を実行
            const parser = new Parser(tokens);
            parser.setParseMode('recovery'); // 回復モードでパース
            const ast = parser.parse();

            // 結果を返す
            return {
                success: parser.errors.length === 0,
                errors: parser.errors,
                warnings: parser.warnings,
                ast: ast
            };
        } catch (error) {
            return {
                success: false,
                errors: [error.message],
                warnings: [],
                ast: null
            };
        }
    }

    /**
     * 構文解析エラーを生成する
     * @param {string} message - エラーメッセージ
     * @returns {Error} エラーオブジェクト
     */
    error(message) {
        // 現在のトークンを取得
        const token = this.peek() || { type: 'UNKNOWN', value: null };

        // トークン情報と位置情報を含む詳細なエラーメッセージを生成
        let tokenValue = token.value !== null ? `'${token.value}'` : 'null';

        // コンテキスト情報を追加
        let contextInfo = '';
        if (this.context.inLambda) contextInfo += 'ラムダ式内, ';
        if (this.context.inPointFree) contextInfo += 'ポイントフリー式内, ';
        if (this.context.expectingBracket.length > 0) {
            contextInfo += `期待する閉じ括弧: ${this.context.expectingBracket.join('')}, `;
        }
        if (this.context.indentLevel > 0) {
            contextInfo += `インデントレベル: ${this.context.indentLevel}, `;
        }
        if (this.context.bracketBalance > 0) {
            contextInfo += `括弧バランス: ${this.context.bracketBalance}, `;
        }

        // 現在のトークンの周辺のトークン情報を取得
        let context = '';
        const contextStart = Math.max(0, this.current - 2);
        const contextEnd = Math.min(this.tokens.length - 1, this.current + 2);

        for (let i = contextStart; i <= contextEnd; i++) {
            if (i === this.current) {
                context += ` [${this.tokens[i].value || this.tokens[i].type}] `;
            } else {
                context += ` ${this.tokens[i].value || this.tokens[i].type} `;
            }
        }

        const errorMessage = `${message} (トークン ${tokenValue} 種類: ${token.type}, 位置: ${this.current}, コンテキスト: ${context}) [状態: ${contextInfo}]`;

        // エラーオブジェクトを返す
        return new Error(errorMessage);
    }

    /**
     * 構文解析の終了に達したかチェック
     * @returns {boolean} 終了に達していればtrue
     */
    isAtEnd() {
        // 現在のトークンがEOFかどうかをチェック
        return this.peek().type === TokenType.EOF;
    }
}

// 外部にエクスポート
exports.Parser = Parser;
exports.testSignCode = Parser.testSample;
exports.robustTestSignCode = Parser.robustTestSample;