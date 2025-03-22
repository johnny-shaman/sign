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
 * ver_20250322_1
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
    indentLevel: 0,            // インデントレベル（タブの数）
    currentStatement: [],      // 現在処理中の文のトークン
    inStatement: false,        // 文の処理中フラグ
    isLineStart: true          // 行頭判定フラグ
  };

  // すべてのトークンを処理
  while (context.currentIndex < tokens.length) {
    processToken(tokens[context.currentIndex], tokens, context);
    context.currentIndex++;
  }
  // 最後の文が未完了なら確定させる
  if (context.inStatement &&
    context.currentStatement.length > 0 &&
    hasSignificantContent(context.currentStatement)) {
    finalizeStatement(context);
  }

  // 最終的なルートスコープをクリーンアップして返す
  return cleanupExpressionTree(context.scopeStack[0]);
}

/**
 * 式木を再帰的にクリーンアップする（空の配列や無意味なトークンを除去）
 * @param {Array} tree - クリーンアップする式木
 * @returns {Array} クリーンアップされた式木
 */
function cleanupExpressionTree(tree) {
  // 空の配列や無意味なトークンをフィルタリング
  const cleanedTree = tree.filter(item => {
    // 配列の場合は中身を再帰的にクリーンアップ
    if (Array.isArray(item)) {
      const cleanedItem = cleanupExpressionTree(item);
      // 空の配列は除外
      return cleanedItem.length > 0;
    }
    // 文字列の場合は意味のあるトークンのみを残す
    return isSignificantToken(item);
  });

  return cleanedTree;
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
 * 現在の文にトークンを追加
 * @param {string} token - 追加するトークン
 * @param {Object} context - 処理コンテキスト
 */
function addTokenToStatement(token, context) {
  if (!context.inStatement) {
    context.inStatement = true;
  }
  context.currentStatement.push(token);
}

/**
 * トークンが意味のあるものかを判定
 * @param {string} token - 判定するトークン
 * @returns {boolean} 意味のあるトークンならtrue
 */
function isSignificantToken(token) {
  // 空白や改行、タブ、コメント開始は意味のないトークン
  return token !== ' ' && token !== '\n' && token !== '\t' && !token.startsWith('`');
}

/**
 * 現在のステートメントに有意な内容が含まれているか判定
 * @param {string[]} statement - 判定するステートメント
 * @returns {boolean} 有意な内容があればtrue
 */
function hasSignificantContent(statement) {
  // 空白や改行、タブ以外のトークンが1つでもあればtrue
  return statement.some(isSignificantToken);
}

/**
 * 現在の文を最適化して確定
 * @param {Object} context - 処理コンテキスト
 */
function finalizeStatement(context) {
  const optimizedTokens = optimizeTokens(context.currentStatement);
  // 最適化後も空になった場合はスキップ
  if (optimizedTokens.length === 0) {
    context.currentStatement = [];
    context.inStatement = false;
    return;
  }

  // 有意な内容の配列を追加
  currentScope(context).push(optimizedTokens);
  // 文の状態をリセット
  context.currentStatement = [];
  context.inStatement = false;
}

/**
 * トークン配列を最適化（不要な空白を除去）
 * @param {string[]} tokens - トークン配列
 * @returns {string[]} 最適化されたトークン配列
 */
function optimizeTokens(tokens) {
  // すべての空白トークンを完全に除去する
  return tokens.filter(token => token !== ' ' && token !== '\n');
}

/**
 * トークンが演算子かどうか判定
 * @param {string} token - 判定するトークン
 * @returns {boolean} 演算子ならtrue
 */
function isOperator(token) {
  return INFIX_OPERATORS.includes(token) ||
    PREFIX_OPERATORS.includes(token) ||
    POSTFIX_OPERATORS.includes(token) ||
    token === '?';
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
    // 現在の文を確定
    if (context.inStatement &&
      context.currentStatement.length > 0 &&
      hasSignificantContent(context.currentStatement)) {
      finalizeStatement(context);
    } else {
      // 意味のない文はリセットのみ
      context.currentStatement = [];
      context.inStatement = false;
    }

    // 次の行は行頭と判定
    context.isLineStart = true;
    // インデントレベルをリセット
    context.indentLevel = 0;
    return;
  }

  // 空白トークンはスキップ
  // Sign言語では空白が演算子として機能する場合があるが、初期実装では単純化のため無視
  if (token === ' ') {
    return;
  }

  // 行頭のコメント行チェック
  if (context.isLineStart && (token === '`' || token.startsWith('`'))) {
    // コメント行は完全にスキップ
    context.currentStatement = [];
    context.inStatement = false;
    return;
  }

  // 行頭判定を更新（意味のあるトークンが来たら行頭ではなくなる）
  if (token !== ' ' && token !== '\t') {
    context.isLineStart = false;
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
      // 完結した文字列はそのまま文に追加
      addTokenToStatement(token, context);
    } else {
      // 未完の文字列は文字列モードに移行
      pushMode(MODE.STRING, context);
      context.stringBuffer = token;
    }
    return;
  }

  // 文字リテラルの処理
  if (token.startsWith('\\')) {
    addTokenToStatement(token, context);
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
    addTokenToStatement(token, context);
    return;
  }

  // 前置演算子の処理
  if (PREFIX_OPERATORS.includes(token)) {
    pushMode(MODE.PREFIX, context);
    addTokenToStatement(token, context);
    return;
  }

  // 後置演算子の処理（前のトークンを見て判断）
  if (POSTFIX_OPERATORS.includes(token) && context.currentIndex > 0) {
    const prevToken = tokens[context.currentIndex - 1];
    // 数値や識別子の後に来る場合は後置演算子
    if (!/[+\-*\/=<>!&|;,~'^#@\[\]\{\}\(\)]/.test(prevToken)) {
      pushMode(MODE.POSTFIX, context);
      addTokenToStatement(token, context);
      return;
    }
  }

  // 中置演算子の処理
  if (INFIX_OPERATORS.includes(token)) {
    pushMode(MODE.INFIX, context);
    addTokenToStatement(token, context);
    return;
  }

  // その他のトークン（識別子、数値など）
  addTokenToStatement(token, context);
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