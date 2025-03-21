// builder.js
/**
 * Sign言語のモードベース式木ビルダー
 * 
 * 機能:
 * - トークン配列から式木構造への変換
 * - モードスタックによる文脈依存処理
 * - スコープ階層の管理
 * - 各種演算子の文脈依存解析
 * - ブロック構造の構築
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250321_0
 */

/**
 * モード定数定義
 */
const MODE = {
    NORMAL: 'normal',      // 通常モード
    STRING: 'string',      // 文字列処理モード
    CHAR: 'char',          // 文字リテラル処理モード
    BLOCK: 'block',        // ブロック処理モード
    INFIX: 'infix',        // 中置演算子処理モード
    PREFIX: 'prefix',      // 前置演算子処理モード
    POSTFIX: 'postfix',    // 後置演算子処理モード
    LAMBDA: 'lambda'       // ラムダ式処理モード
  };
  
  /**
   * 前置演算子のリスト
   */
  const PREFIX_OPERATORS = ['!', '~', '@', '#'];
  
  /**
   * 後置演算子のリスト
   */
  const POSTFIX_OPERATORS = ['!', '~'];
  
  /**
   * ブロック開始トークン
   */
  const BLOCK_START = ['[', '{', '('];
  
  /**
   * ブロック終了トークン
   */
  const BLOCK_END = [']', '}', ')'];
  
  /**
   * 中置演算子のリスト
   */
  const INFIX_OPERATORS = [':', '+', '-', '*', '/', '%', '^', '=', '<', '>', '<=', '>=', '!=', '<>', '><', '&', '|', ';', ',', '~', "'"];
  
  /**
   * トークン配列から式木を生成する
   * @param {string[]} tokens - トークン配列
   * @returns {Array} 式木（配列の入れ子構造）
   */
  function buildExpressionTree(tokens) {
    // 処理コンテキスト
    const context = {
      modeStack: [MODE.NORMAL],  // モードスタック（初期モード：NORMAL）
      scopeStack: [[]],          // スコープスタック（初期スコープ：空配列）
      currentIndex: 0,           // 現在処理中のトークンインデックス
      stringBuffer: '',          // 文字列処理バッファ
      indentLevel: 0             // インデントレベル（タブの数）
    };
  
    // すべてのトークンを処理
    while (context.currentIndex < tokens.length) {
      processToken(tokens[context.currentIndex], tokens, context);
      context.currentIndex++;
    }
  
    // 最終的なルートスコープを返す
    return context.scopeStack[0];
  }
  
  /**
   * 現在のモードを取得
   * @param {Object} context - 処理コンテキスト
   * @returns {string} 現在のモード
   */
  function currentMode(context) {
    return context.modeStack[context.modeStack.length - 1];
  }
  
  /**
   * 新しいモードをスタックにプッシュ
   * @param {string} mode - 新しいモード
   * @param {Object} context - 処理コンテキスト
   */
  function pushMode(mode, context) {
    context.modeStack.push(mode);
  }
  
  /**
   * モードスタックから最上位のモードをポップ
   * @param {Object} context - 処理コンテキスト
   * @returns {string} ポップされたモード
   */
  function popMode(context) {
    return context.modeStack.pop();
  }
  
  /**
   * 現在のスコープを取得
   * @param {Object} context - 処理コンテキスト
   * @returns {Array} 現在のスコープ
   */
  function currentScope(context) {
    return context.scopeStack[context.scopeStack.length - 1];
  }
  
  /**
   * 新しいスコープをスタックにプッシュ
   * @param {Object} context - 処理コンテキスト
   */
  function pushScope(context) {
    const newScope = [];
    currentScope(context).push(newScope);
    context.scopeStack.push(newScope);
  }
  
  /**
   * スコープスタックから最上位のスコープをポップ
   * @param {Object} context - 処理コンテキスト
   */
  function popScope(context) {
    context.scopeStack.pop();
  }
  
  /**
   * 現在のスコープにトークンを追加
   * @param {string} token - 追加するトークン
   * @param {Object} context - 処理コンテキスト
   */
  function addTokenToCurrentScope(token, context) {
    currentScope(context).push(token);
  }
  
  /**
   * トークンを処理する
   * @param {string} token - 処理するトークン
   * @param {string[]} tokens - トークン配列（先読み用）
   * @param {Object} context - 処理コンテキスト
   */
  function processToken(token, tokens, context) {
    const mode = currentMode(context);
  
    // 現在のモードに基づいて処理を分岐
    switch (mode) {
      case MODE.NORMAL:
        processNormalMode(token, tokens, context);
        break;
      case MODE.STRING:
        processStringMode(token, context);
        break;
      case MODE.BLOCK:
        processBlockMode(token, tokens, context);
        break;
      case MODE.INFIX:
        processInfixMode(token, context);
        break;
      case MODE.PREFIX:
        processPrefixMode(token, context);
        break;
      case MODE.POSTFIX:
        processPostfixMode(token, context);
        break;
      case MODE.LAMBDA:
        processLambdaMode(token, tokens, context);
        break;
      default:
        // 未知のモードの場合は通常モードと同じ処理
        processNormalMode(token, tokens, context);
    }
  }
  
  /**
   * 通常モードでのトークン処理
   * @param {string} token - 処理するトークン
   * @param {string[]} tokens - トークン配列（先読み用）
   * @param {Object} context - 処理コンテキスト
   */
  function processNormalMode(token, tokens, context) {
    // 改行の処理
    if (token === '\n') {
      // 改行をトークンとして追加
      addTokenToCurrentScope('\n', context);
      // インデントレベルをリセット
      context.indentLevel = 0;
      return;
    }
  
    // タブの処理
    if (token === '\t') {
      context.indentLevel++;
      // タブが出現したら新しいブロックを作成
      if (context.indentLevel === 1) {
        pushScope(context);
      }
      return;
    }
  
    // 文字列リテラルの開始
    if (token.startsWith('`')) {
      if (token.endsWith('`') && token.length > 1) {
        // 完結した文字列はそのままスコープに追加
        addTokenToCurrentScope(token, context);
      } else {
        // 未完の文字列は文字列モードに移行
        pushMode(MODE.STRING, context);
        context.stringBuffer = token;
      }
      return;
    }
  
    // 文字リテラルの処理
    if (token.startsWith('\\')) {
      addTokenToCurrentScope(token, context);
      return;
    }
  
    // ブロック開始の処理
    if (BLOCK_START.includes(token)) {
      pushMode(MODE.BLOCK, context);
      pushScope(context);
      return;
    }
  
    // ラムダ演算子の処理
    if (token === '?') {
      pushMode(MODE.LAMBDA, context);
      addTokenToCurrentScope(token, context);
      return;
    }
  
    // 前置演算子の処理
    if (PREFIX_OPERATORS.includes(token)) {
      pushMode(MODE.PREFIX, context);
      addTokenToCurrentScope(token, context);
      return;
    }
  
    // 後置演算子の処理（前のトークンを見て判断）
    if (POSTFIX_OPERATORS.includes(token) && context.currentIndex > 0) {
      const prevToken = tokens[context.currentIndex - 1];
      // 数値や識別子の後に来る場合は後置演算子
      if (!/[+\-*\/=<>!&|;,~'^#@\[\]\{\}\(\)]/.test(prevToken)) {
        pushMode(MODE.POSTFIX, context);
        addTokenToCurrentScope(token, context);
        return;
      }
    }
  
    // 中置演算子の処理
    if (INFIX_OPERATORS.includes(token)) {
      pushMode(MODE.INFIX, context);
      addTokenToCurrentScope(token, context);
      return;
    }
  
    // その他のトークン（識別子、数値など）
    addTokenToCurrentScope(token, context);
  }
  
  /**
   * 文字列モードでのトークン処理
   * @param {string} token - 処理するトークン
   * @param {Object} context - 処理コンテキスト
   */
  function processStringMode(token, context) {
    // 文字列バッファにトークンを追加
    context.stringBuffer += token;
    
    // 終了バッククォートが見つかったら文字列モードを終了
    if (token.endsWith('`')) {
      addTokenToCurrentScope(context.stringBuffer, context);
      context.stringBuffer = '';
      popMode(context);
    }
  }
  
  /**
   * ブロックモードでのトークン処理
   * @param {string} token - 処理するトークン
   * @param {string[]} tokens - トークン配列（先読み用）
   * @param {Object} context - 処理コンテキスト
   */
  function processBlockMode(token, tokens, context) {
    // ブロック終了の処理
    if (BLOCK_END.includes(token)) {
      popMode(context);
      popScope(context);
      return;
    }
    
    // ブロック内のトークンは通常モードと同じように処理
    processNormalMode(token, tokens, context);
  }
  
  /**
   * 中置演算子モードでのトークン処理
   * @param {string} token - 処理するトークン
   * @param {Object} context - 処理コンテキスト
   */
  function processInfixMode(token, context) {
    // 演算子の次のトークンを処理
    addTokenToCurrentScope(token, context);
    popMode(context);
  }
  
  /**
   * 前置演算子モードでのトークン処理
   * @param {string} token - 処理するトークン
   * @param {Object} context - 処理コンテキスト
   */
  function processPrefixMode(token, context) {
    // 演算子の次のトークンを処理
    addTokenToCurrentScope(token, context);
    popMode(context);
  }
  
  /**
   * 後置演算子モードでのトークン処理
   * @param {string} token - 処理するトークン
   * @param {Object} context - 処理コンテキスト
   */
  function processPostfixMode(token, context) {
    // 後置演算子の処理は完了しているので、次のトークンを通常モードで処理
    processNormalMode(token, [], context);
    popMode(context);
  }
  
  /**
   * ラムダ式モードでのトークン処理
   * @param {string} token - 処理するトークン
   * @param {string[]} tokens - トークン配列（先読み用）
   * @param {Object} context - 処理コンテキスト
   */
  function processLambdaMode(token, tokens, context) {
    // ラムダ式内部のトークン処理
    if (token === '\n') {
      // 改行後にインデントがあればラムダ本体のブロック開始
      if (context.currentIndex + 1 < tokens.length && tokens[context.currentIndex + 1] === '\t') {
        addTokenToCurrentScope(token, context);
        return;
      }
    }
    
    // ラムダ式内の処理は通常モードと同じように
    processNormalMode(token, tokens, context);
    
    // ラムダ式の終了条件（簡易的なもの）
    if (token === '\n' || BLOCK_END.includes(token)) {
      popMode(context);
    }
  }
  
  // モジュールのエクスポート
  module.exports = {
    buildExpressionTree
  };