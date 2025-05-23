/**
 * Sign言語パーサー - トークン階層化とType付け
 * 
 * ※カッコが付いていれば処理可能なので前処理が必要
 * CreateBy: Claude3.7Sonnet
 * ver_20250425_0
*/

// 演算子の優先順位定義
const OPERATOR_PRECEDENCE = {
  ":": 10,   // 定義演算子（最も低い優先度）
  "?": 20,   // ラムダ演算子
  "+": 30,   // 加算
  "-": 30,   // 減算
  "*": 40,   // 乗算
  "/": 40,   // 除算
  "%": 40,   // 剰余
  "^": 50    // 冪乗（最も高い優先度）
};

// 演算子の結合性（右結合か左結合か）
const RIGHT_ASSOCIATIVE = [":", "?", "^"];

// 改善版：ブロック処理と式解析を分離したメイン関数
function createExpressionTree(tokens) {
  // ブロックの処理
  return processBlockStructure(tokens);
}

// ブロック構造を処理する関数
function processBlockStructure(tokens) {
  // ブロックがない場合は直接式解析
  if (!tokens.includes("[") && !tokens.includes("]")) {
    return parseExpression(tokens);
  }

  const result = [];
  let i = 0;

  while (i < tokens.length) {
    // ブロック開始の処理
    if (tokens[i] === "[") {
      // ブロック内のトークンを特定
      const blockInfo = extractBlockTokens(tokens, i);
      // 再帰的にブロック内を処理
      const blockTree = processBlockStructure(blockInfo.tokens);
      // 結果を追加
      result.push(blockTree);
      // ブロック全体を飛ばす
      i = blockInfo.endIndex + 1;
    }
    // 通常のトークン処理
    else if (tokens[i] !== "]") {
      result.push(tokens[i]);
      i++;
    }
    // 閉じ括弧は無視
    else {
      i++;
    }
  }

  // 単一のブロックの場合、直接式解析
  if (result.length === 1 && typeof result[0] !== 'string') {
    return result[0];
  }

  // 複数のトークンがある場合は式解析
  return parseExpression(result);
}

// ブロック内のトークンを抽出（開始インデックスと終了インデックスも返す）
function extractBlockTokens(tokens, startIndex) {
  const result = [];
  let depth = 0;
  let i = startIndex + 1; // '[' をスキップ

  while (i < tokens.length) {
    if (tokens[i] === "[") {
      depth++;
    } else if (tokens[i] === "]") {
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

  // ブロックが閉じられていない場合の対応
  console.error("構文エラー: ブロックが閉じられていません");
  return {
    tokens: result,
    endIndex: tokens.length - 1
  };
}

// 新しい式解析関数（操車場アルゴリズム）
function parseExpression(tokens) {
  const outputQueue = [];   // 出力キュー（オペランドと処理済み演算子）
  const operatorStack = []; // 演算子スタック

  // トークンを順に処理
  for (const token of tokens) {
    // オブジェクトの場合（ネストされたブロックなど）
    if (typeof token !== 'string') {
      outputQueue.push(token);
      continue;
    }

    // オペランド（数値、識別子など）の場合
    if (!OPERATOR_PRECEDENCE[token]) {
      outputQueue.push(token);
    }
    // 演算子の場合
    else {
      // スタック内の優先順位が高い演算子を処理
      while (
        operatorStack.length > 0 &&
        OPERATOR_PRECEDENCE[operatorStack[operatorStack.length - 1]] &&
        ((RIGHT_ASSOCIATIVE.includes(token) &&
          OPERATOR_PRECEDENCE[operatorStack[operatorStack.length - 1]] > OPERATOR_PRECEDENCE[token]) ||
          (!RIGHT_ASSOCIATIVE.includes(token) &&
            OPERATOR_PRECEDENCE[operatorStack[operatorStack.length - 1]] >= OPERATOR_PRECEDENCE[token]))
      ) {
        outputQueue.push(operatorStack.pop());
      }

      // 現在の演算子をスタックに追加
      operatorStack.push(token);
    }
  }

  // 残りの演算子をすべて出力キューに移動
  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop());
  }

  // 出力キューから二分木構造を構築
  return buildTree(outputQueue);
}

// 出力キューから二分木構造を構築する関数
function buildTree(queue) {
  const stack = [];

  for (const item of queue) {
    // 既にオブジェクトの場合（処理済みのブロックなど）
    if (typeof item !== 'string') {
      stack.push(item);
      continue;
    }

    // 演算子の場合
    if (OPERATOR_PRECEDENCE[item]) {
      // スタックに十分な要素がない場合のエラー処理
      if (stack.length < 2) {
        console.error("構文エラー: 演算子に対するオペランドが不足しています");
        return null;
      }

      // 二項演算子は2つのオペランドが必要
      const right = stack.pop();
      const left = stack.pop();

      // 演算子と左右のオペランドで新しいノードを作成
      const node = {
        operator: item,
        arguments: [left, right]
      };

      // 新しいノードをスタックに追加
      stack.push(node);
    }
    // オペランドの場合
    else {
      // リテラルノードとしてスタックに追加
      stack.push({ value: item });
    }
  }

  // スタックに複数の要素が残っている場合のエラー処理
  if (stack.length !== 1) {
    console.error("構文エラー: 不正な式構造", stack);
    return stack.length > 0 ? stack[0] : null;
  }

  // 最終的な結果はスタックの唯一の要素
  return stack[0];
}

// Type付け処理の例（変更なし）
function assignTypes(node) {
  // ノードがnullまたは未定義の場合は処理しない
  if (!node) return null;

  // リテラルノード（valueプロパティがある）の処理
  if (node.value !== undefined) {
    // 数値かどうかをチェック
    if (!isNaN(Number(node.value))) {
      return {
        type: "Number",
        value: Number(node.value)
      };
    }
    // 文字列リテラル（バッククォート）かをチェック
    else if (node.value.startsWith("`") && node.value.endsWith("`")) {
      return {
        type: "String",
        value: node.value.slice(1, -1)
      };
    }
    // 文字リテラル（\）かをチェック
    else if (node.value.startsWith("\\")) {
      return {
        type: "Character",
        value: node.value.slice(1)
      };
    }
    // 単位 (_) かをチェック
    else if (node.value === "_") {
      return {
        type: "Unit",
        value: "_"
      };
    }
    // それ以外は識別子として扱う
    else {
      return {
        type: "Symbol",
        value: node.value
      };
    }
  }

  // 演算子ノードの処理
  if (node.operator !== null) {
    // 子ノードを再帰的に処理
    const processedArgs = node.arguments.map(arg => assignTypes(arg));

    switch (node.operator) {
      case ":":
        // 左側が識別子の場合は定義
        if (processedArgs[0] && processedArgs[0].type === "Symbol") {
          return {
            type: "Definition",
            operator: ":",
            arguments: processedArgs
          };
        }
        // それ以外は条件分岐
        else {
          return {
            type: "Conditional",
            operator: ":",
            arguments: processedArgs
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
          operator: node.operator,
          arguments: processedArgs
        };

      case "?":
        return {
          type: "Lambda",
          operator: "?",
          arguments: processedArgs
        };

      // その他の演算子...

      default:
        // デフォルトはApplicationとして扱う（空白演算子など）
        return {
          type: "Application",
          operator: node.operator,
          arguments: processedArgs
        };
    }
  }

  // 演算子がないが引数がある場合（ブロック構造）
  if (node.arguments && node.arguments.length > 0) {
    const processedArgs = node.arguments.map(arg => assignTypes(arg));

    // 引数が1つだけの場合は、そのまま返す（不要なBlockを避ける）
    if (processedArgs.length === 1) {
      return processedArgs[0];
    }

    return {
      type: "Block",
      arguments: processedArgs
    };
  }

  // それ以外の場合
  return node;
}

// 例のテスト
function parseExample(example) {
  console.log("orginal:", example);

  // 階層化処理（改善版）
  const hierarchy = createExpressionTree(example);
  console.log("\n createExpressionTree:");
  console.log(JSON.stringify(hierarchy, null, 2));

  // Type付け処理
  const typedTree = assignTypes(hierarchy);
  console.log("\n assignTypes:");
  console.log(JSON.stringify(typedTree, null, 2));

  return typedTree;
}

// テスト実行関数を追加
function runTests() {
  console.log("===== 1: simple =====");
  const example1 = ["[", "z", ":", "x", "+", "y", "]"];
  parseExample(example1);

  console.log("\n\n===== 2: Lambda =====");
  const example2 = ["[", "add", ":", "x", "y", "?", "x", "+", "y", "]"];
  //parseExample(example2);

  console.log("\n\n===== 3: Conditional Branch(switch) =====");
  const example3 = ["[", "x", "<", "y", ":", "x", "]"];
  //parseExample(example3);

  console.log("\n\n===== 4: Nest =====");
  const example4 = ["[", "result", ":", "[", "x", "+", "y", "]", "*", "[", "a", "-", "b", "]", "]"];
  parseExample(example4);

}

// テスト実行
runTests();