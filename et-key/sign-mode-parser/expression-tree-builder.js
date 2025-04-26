// expression-tree-builder.js
/**
 * Sign言語のトークン配列から式木を構築するモジュール
 * 
 * 機能:
 * - カッコで階層化されたトークン配列から式木を構築
 * - 演算子と引数の関係を表現する構造を生成
 * - ノードに適切な型情報を付与
 * 
 * 入力: カッコが適切に挿入されたトークン配列
 * 出力: Sign言語の式木構造
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250426_1
 */

// 演算子優先度情報をインポート
const operatorInfo = require('./operator-precedence');

/**
 * カッコ付きトークン配列から式木を構築する
 * 
 * @param {string[]} tokens - カッコが付与されたトークン配列
 * @returns {Object} 構築された式木
 */
function buildExpressionTree(tokens) {
  if (!tokens || tokens.length === 0) {
    return null;
  }

  // 階層構造の解析（ブロック処理）
  const hierarchyTree = processHierarchy(tokens);
  
  // 型情報の付与
  const typedTree = assignNodeTypes(hierarchyTree);
  
  return typedTree;
}

/**
 * トークン配列の階層構造を処理する
 * カッコによるブロック構造を再帰的に解析
 * 
 * @param {string[]} tokens - 処理するトークン配列
 * @returns {Object} 階層構造を持つツリー
 */
function processHierarchy(tokens) {
  // ブロックがない場合は直接式を解析
  if (!containsBlock(tokens)) {
    return parseExpression(tokens);
  }

  // 結果を格納する配列
  const result = [];
  let i = 0;

  while (i < tokens.length) {
    // ブロック開始を検出
    if (operatorInfo.isBlockStart(tokens[i])) {
      // ブロック内のトークンを抽出
      const blockInfo = extractBlockTokens(tokens, i);
      // 再帰的にブロック内を処理
      const blockTree = processHierarchy(blockInfo.tokens);
      // 結果を追加
      result.push(blockTree);
      // ブロック全体をスキップ
      i = blockInfo.endIndex + 1;
    }
    // 通常のトークン処理
    else if (!operatorInfo.isBlockEnd(tokens[i])) {
      result.push(tokens[i]);
      i++;
    }
    // ブロック終了トークンはスキップ
    else {
      i++;
    }
  }

  // 単一のブロックだけの場合は直接その内容を返す
  if (result.length === 1 && typeof result[0] !== 'string') {
    return result[0];
  }

  // 複数の要素がある場合は式を解析
  return parseExpression(result);
}

/**
 * トークン配列がブロック構造を含むか判定
 * 
 * @param {Array} tokens - 判定するトークン配列
 * @returns {boolean} ブロック構造を含む場合はtrue
 */
function containsBlock(tokens) {
  if (!tokens || !Array.isArray(tokens)) {
    return false;
  }

  for (const token of tokens) {
    if (operatorInfo.isBlockStart(token) || operatorInfo.isBlockEnd(token)) {
      return true;
    }
    // ネストされた配列/オブジェクトもブロックとみなす
    if (typeof token !== 'string') {
      return true;
    }
  }
  return false;
}

/**
 * ブロック内のトークンを抽出する
 * 
 * @param {string[]} tokens - 処理するトークン配列
 * @param {number} startIndex - ブロック開始位置
 * @returns {Object} ブロック内トークンと終了インデックス
 */
function extractBlockTokens(tokens, startIndex) {
  const result = [];
  let depth = 0;
  let i = startIndex + 1; // ブロック開始トークンをスキップ

  while (i < tokens.length) {
    if (operatorInfo.isBlockStart(tokens[i])) {
      depth++;
    }
    else if (operatorInfo.isBlockEnd(tokens[i])) {
      if (depth === 0) {
        // ブロックの終わりに到達
        return {
          tokens: result,
          endIndex: i
        };
      }
      depth--;
    }
    result.push(tokens[i]);
    i++;
  }

  // ブロックが閉じられていない場合
  console.error("構文エラー: ブロックが閉じられていません");
  return {
    tokens: result,
    endIndex: tokens.length - 1
  };
}

/**
 * 式を解析して演算子と引数の構造を構築する
 * 操車場アルゴリズムを使用
 * 
 * @param {Array} tokens - 解析するトークン配列
 * @returns {Object} 解析された式木
 */
function parseExpression(tokens) {
  if (!tokens || tokens.length === 0) {
    return null;
  }

  // 単一要素の場合は直接返す
  if (tokens.length === 1) {
    // オブジェクトの場合はそのまま返す
    if (typeof tokens[0] !== 'string') {
      return tokens[0];
    }
    // 文字列の場合は値ノードを作成
    return { value: tokens[0] };
  }

  // 操車場アルゴリズムの実装
  const outputQueue = [];   // 出力キュー（後置記法）
  const operatorStack = []; // 演算子スタック

  // トークンを順に処理
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // オブジェクト（ネストされた式）の場合
    if (typeof token !== 'string') {
      outputQueue.push(token);
      continue;
    }

    // 演算子かどうかを判定
    if (operatorInfo.isOperator(token)) {
      // 演算子の優先順位と結合性
      const precedence = operatorInfo.getPrecedence(token);
      const isRightAssoc = operatorInfo.isRightAssociative(token);

      // スタック内の優先順位が高い演算子を処理
      while (
        operatorStack.length > 0 &&
        operatorInfo.isOperator(operatorStack[operatorStack.length - 1]) &&
        ((isRightAssoc && 
          operatorInfo.getPrecedence(operatorStack[operatorStack.length - 1]) > precedence) ||
         (!isRightAssoc && 
          operatorInfo.getPrecedence(operatorStack[operatorStack.length - 1]) >= precedence))
      ) {
        outputQueue.push(operatorStack.pop());
      }

      // 現在の演算子をスタックに追加
      operatorStack.push(token);
    }
    // オペランドの場合は出力キューに追加
    else {
      outputQueue.push(token);
    }
  }

  // 残りの演算子をすべて出力キューに移動
  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop());
  }

  // 出力キューから二分木構造を構築
  return buildTree(outputQueue);
}

/**
 * 出力キューから二分木構造を構築する
 * 
 * @param {Array} queue - 後置記法に変換された式の出力キュー
 * @returns {Object} 構築された二分木
 */
function buildTree(queue) {
  const stack = [];

  for (const item of queue) {
    // オブジェクトの場合（ネスト済み）はそのままスタックに追加
    if (typeof item !== 'string') {
      stack.push(item);
      continue;
    }

    // 演算子の場合
    if (operatorInfo.isOperator(item)) {
      // オペランドが不足している場合のエラー処理
      if (stack.length < 2) {
        console.error(`構文エラー: 演算子 ${item} に対するオペランドが不足しています`);
        return null;
      }

      // 二項演算子なので2つのオペランドが必要
      const right = stack.pop();
      const left = stack.pop();

      // 演算子ノードを作成
      const node = {
        operator: item,
        arguments: [left, right]
      };

      // ノードをスタックに追加
      stack.push(node);
    }
    // オペランドの場合は値ノードとしてスタックに追加
    else {
      stack.push({ value: item });
    }
  }

  // スタックに複数の要素が残っている場合のエラー処理
  if (stack.length !== 1) {
    console.error("構文エラー: 不正な式構造", stack);
    return stack.length > 0 ? stack[0] : null;
  }

  // 最終結果はスタックの唯一の要素
  return stack[0];
}

/**
 * ノードに型情報を付与する
 * 
 * @param {Object} node - 型情報を付与するノード
 * @returns {Object} 型情報が付与されたノード
 */
function assignNodeTypes(node) {
  // ノードがnullまたは未定義の場合は処理しない
  if (!node) return null;

  // 値ノード（リテラル、識別子）の処理
  if (node.value !== undefined) {
    return assignValueNodeType(node);
  }

  // 演算子ノードの処理
  if (node.operator !== undefined) {
    // 子ノードを再帰的に処理
    const processedArgs = node.arguments.map(arg => assignNodeTypes(arg));
    return assignOperatorNodeType(node.operator, processedArgs);
  }

  // ブロックノードの処理（演算子がないが引数があるケース）
  if (node.arguments !== undefined && node.arguments.length > 0) {
    const processedArgs = node.arguments.map(arg => assignNodeTypes(arg));
    
    // 引数が1つだけの場合は、そのまま返す（不要なBlockを避ける）
    if (processedArgs.length === 1) {
      return processedArgs[0];
    }

    return {
      type: "Block",
      arguments: processedArgs
    };
  }

  // その他のケース
  return node;
}

/**
 * 値ノードに型情報を付与する
 * 
 * @param {Object} node - 値ノード
 * @returns {Object} 型情報が付与された値ノード
 */
function assignValueNodeType(node) {
  const value = node.value;

  // 数値の場合
  if (!isNaN(Number(value))) {
    return {
      type: "Number",
      value: Number(value)
    };
  }
  // 文字列リテラル（バッククォート）の場合
  else if (typeof value === 'string' && value.startsWith("`") && value.endsWith("`")) {
    return {
      type: "String",
      value: value.slice(1, -1)
    };
  }
  // 文字リテラル（バックスラッシュ）の場合
  else if (typeof value === 'string' && value.startsWith("\\")) {
    return {
      type: "Character",
      value: value.slice(1)
    };
  }
  // 単位（アンダースコア）の場合
  else if (value === "_") {
    return {
      type: "Unit",
      value: "_"
    };
  }
  // それ以外は識別子として扱う
  else {
    return {
      type: "Symbol",
      value: value
    };
  }
}

/**
 * 演算子ノードに型情報を付与する
 * 
 * @param {string} operator - 演算子
 * @param {Array} args - 処理済みの引数ノード
 * @returns {Object} 型情報が付与された演算子ノード
 */
function assignOperatorNodeType(operator, args) {
  switch (operator) {
    case ":":
      // 左側が識別子の場合は定義
      if (args[0] && args[0].type === "Symbol") {
        return {
          type: "Definition",
          operator: ":",
          arguments: args
        };
      }
      // それ以外は条件分岐
      else {
        return {
          type: "Conditional",
          operator: ":",
          arguments: args
        };
      }

    case "+":
    case "-":
    case "*":
    case "/":
    case "%":
    case "^":
      return {
        type: "BinaryOperation",
        operator: operator,
        arguments: args
      };

    case "?":
      return {
        type: "Lambda",
        operator: "?",
        arguments: args
      };

    case ",":
      return {
        type: "Product",
        operator: ",",
        arguments: args
      };

    case "~":
      // 前置か後置か中置かで型が変わる - シンプル実装では位置判断難しいため必要に応じて拡張
      return {
        type: "RangeOrExpand",
        operator: "~",
        arguments: args
      };

    // 論理演算子
    case "&":
    case "|":
    case ";":
      return {
        type: "LogicalOperation",
        operator: operator,
        arguments: args
      };

    // 比較演算子
    case "<":
    case "<=":
    case "=":
    case ">=":
    case ">":
    case "!=":
      return {
        type: "Comparison",
        operator: operator,
        arguments: args
      };

    // @と#の処理（輸出入と取得）
    case "@":
    case "#":
      return {
        type: "IOOperation",
        operator: operator,
        arguments: args
      };

    // その他の演算子やデフォルト
    default:
      // デフォルトはApplicationとして扱う（空白演算子など）
      return {
        type: "Application",
        operator: operator,
        arguments: args
      };
  }
}

/**
 * 式木を整形された文字列として出力する
 * デバッグ用
 * 
 * @param {Object} tree - 出力する式木
 * @param {number} indent - インデントレベル
 * @returns {string} 整形された文字列
 */
function formatExpressionTree(tree, indent = 0) {
  if (!tree) {
    return 'null';
  }

  const spaces = ' '.repeat(indent * 2);
  
  // 値ノード
  if (tree.value !== undefined) {
    const type = tree.type ? `${tree.type}: ` : '';
    return `${spaces}${type}${JSON.stringify(tree.value)}`;
  }
  
  // 演算子ノード
  if (tree.operator !== undefined) {
    const type = tree.type ? `${tree.type}: ` : '';
    let result = `${spaces}${type}${tree.operator}\n`;
    
    // 引数を再帰的に整形
    if (tree.arguments && tree.arguments.length > 0) {
      tree.arguments.forEach((arg, i) => {
        result += `${spaces}  Arg${i+1}:\n${formatExpressionTree(arg, indent + 2)}\n`;
      });
    }
    
    return result;
  }
  
  // ブロックノード
  if (tree.arguments !== undefined) {
    const type = tree.type ? `${tree.type}` : 'Block';
    let result = `${spaces}${type}\n`;
    
    // 引数を再帰的に整形
    if (tree.arguments.length > 0) {
      tree.arguments.forEach((arg, i) => {
        result += `${spaces}  Item${i+1}:\n${formatExpressionTree(arg, indent + 2)}\n`;
      });
    }
    
    return result;
  }
  
  // その他のケース
  return `${spaces}${JSON.stringify(tree)}`;
}

// モジュールのエクスポート
module.exports = {
  buildExpressionTree,
  assignNodeTypes,
  formatExpressionTree
};