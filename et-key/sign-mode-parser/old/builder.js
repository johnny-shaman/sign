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
 * ver_20250324_0
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
    previousIndentLevel: 0,    // 前回のインデントレベル（タブ減少検出用）
    indentLevelStack: [0],     // インデントレベルの履歴スタック
    currentStatement: [],      // 現在処理中の文のトークン
    inStatement: false,        // 文の処理中フラグ
    isLineStart: true,         // 行頭判定フラグ
    blockStack: [],            // ブロック開始の種類を追跡するスタック
    operatorBuffer: null,      // 演算子バッファ
    pendingBlocks: 0           // 処理待ちのブロック数
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

  // 最終的なルートスコープをクリーンアップして平坦化
  const cleanedTree = cleanupExpressionTree(context.scopeStack[0]);
  return flattenTree(cleanedTree);
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
 * 式木を平坦化する（望ましい出力形式に変換）
 * @param {Array} tree - クリーンアップされた式木
 * @returns {Array} 平坦化された式木
 */
function flattenTree(tree) {
  return tree.map(node => {
    if (!Array.isArray(node)) return node;

    // ステートメントを平坦化
    return flattenStatement(node);
  });
}

/**
 * ステートメント（文）を平坦化する
 * @param {Array} statement - ステートメント
 * @returns {Array} 平坦化されたステートメント
 */
function flattenStatement(statement) {
  // すでに平坦な場合はそのまま返す
  if (!statement.some(item => Array.isArray(item))) {
    return statement;
  }

  // 平坦化した結果を格納する配列
  const result = [];

  // 再帰的に平坦化
  extractTokens(statement, result);

  return result;
}

/**
 * ネストされた配列から再帰的にトークンを抽出
 */
function extractTokens(node, result) {
  for (const item of node) {
    if (Array.isArray(item)) extractTokens(item, result);
    else result.push(item);
  }
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
  let optimizedTokens = optimizeTokens(context.currentStatement);
  // 最適化後も空になった場合はスキップ
  if (optimizedTokens.length === 0) {
    context.currentStatement = [];
    context.inStatement = false;
    return;
  }

  // インデントレベルの変化を検出
  const currentIndent = context.indentLevel;

  // インデントレベルがスタックの最後より小さい場合、ブロック終了
  while (context.indentLevelStack.length > 1 &&
    currentIndent < context.indentLevelStack[context.indentLevelStack.length - 1]) {
    // インデントスタックから1つポップ
    context.indentLevelStack.pop();
    // ブロックスタックからindetエントリを探してポップ
    const blockIndex = context.blockStack.lastIndexOf('indent');
    if (blockIndex >= 0) {
      context.blockStack.splice(blockIndex, 1);
    }
    // スコープをポップ
    if (context.scopeStack.length > 1) {
      popScope(context);
    }
  }

  // 最適化したトークン配列を追加
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
  // 空白と改行を除去
  // Sign言語では空白は演算子の役割を持つが、初期実装では単純化のため除去
  // 将来的には空白演算子の処理を追加する予定
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
    // 現在の文を確定するが、ラムダ式内のインデントブロック開始の場合は別処理
    const isLambdaBlockStart =
      currentMode(context) === MODE.LAMBDA &&
      context.currentIndex + 1 < tokens.length &&
      tokens[context.currentIndex + 1] === '\t';

    // 通常の改行処理
    if (!isLambdaBlockStart && context.inStatement &&
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
    context.previousIndentLevel = context.indentLevel;
    // インデントレベルをリセット
    context.indentLevel = 0;
    return;
  }

  // 空白トークンはスキップ
  // Sign言語では空白が演算子として機能する場合があるが、初期実装では単純化のため無視
  if (token === ' ') {
    context.isLineStart = false;  // 空白でも行頭判定は更新
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
    // インデントレベルがスタックの最後の値より大きい場合、新しいブロックを開始
    if (context.indentLevel > context.indentLevelStack[context.indentLevelStack.length - 1]) {
      context.indentLevelStack.push(context.indentLevel);
      context.blockStack.push('indent');
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
    context.isLineStart = false;
    return;
  }

  context.isLineStart = false;  // 意味のあるトークンが来たら行頭ではなくなる

  // ブロック開始の処理
  if (BLOCK_START.includes(token)) {
    // ブロックの種類をスタックに記録
    context.blockStack.push(token);
    pushMode(MODE.BLOCK, context);
    pushScope(context);
    context.pendingBlocks++;
    addTokenToStatement(token, context);
    return;
  }

  // ラムダ演算子の処理
  if (token === '?') {
    pushMode(MODE.LAMBDA, context);
    // ラムダ演算子をステートメントに追加
    addTokenToStatement(token, context);
    return;
  }

  // 前置演算子の処理
  if (PREFIX_OPERATORS.includes(token)) {
    // 前置演算子をそのままステートメントに追加
    addTokenToStatement(token, context);
    pushMode(MODE.PREFIX, context);
    return;
  }

  // 後置演算子の処理（前のトークンを見て判断）
  if (POSTFIX_OPERATORS.includes(token) && context.currentIndex > 0) {
    const prevToken = tokens[context.currentIndex - 1];
    if (!/^[+\-*\/=<>!&|;,~'^#@\[\]\{\}\(\)]$/.test(prevToken)) {
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
  // 対応するブロック終了トークンを判定
  const isMatchingEnd = (start, end) => {
    return (start === '[' && end === ']') ||
      (start === '{' && end === '}') ||
      (start === '(' && end === ')');
  };

  // ブロック開始トークンに対応する終了トークンかチェック
  const lastBlockStart = context.blockStack[context.blockStack.length - 1];
  if (BLOCK_END.includes(token) &&
    (lastBlockStart === 'indent' || isMatchingEnd(lastBlockStart, token))) {
    popMode(context);
    context.blockStack.pop();
    context.pendingBlocks--;
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
  // ラムダ式内の改行とインデントの特殊処理
  if (token === '\n') {
    // 改行後にインデントがあるかチェック
    const hasIndent = context.currentIndex + 1 < tokens.length &&
      tokens[context.currentIndex + 1] === '\t';

    if (hasIndent) {
      // インデントがある場合は改行を保持
      addTokenToStatement(token, context);
      return;
    }
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