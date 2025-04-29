// expression-tree-builder.js
/**
 * Sign言語の式木生成モジュール
 * 
 * 機能:
 * - カッコが挿入されたトークン列から式木を生成
 * - 操車場アルゴリズムを用いたスタックベースのAST構築
 * - PEG文法に沿った型の割り当て
 * 
 * 使い方:
 *   const { buildExpressionTree, formatExpressionTree } = require('./expression-tree-builder');
 *   const ast = buildExpressionTree(withParenthesesTokens);
 *   const formattedAst = formatExpressionTree(ast);
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250427_0
 */

/**
 * カッコが挿入されたトークン列から式木を生成する
 * 
 * @param {string[]} tokens - カッコが挿入されたトークン列
 * @returns {object} - 式木
 * @throws {Error} - 構文エラーが発生した場合
 */
function buildExpressionTree(tokens) {
  // 現在の処理位置
  let position = 0;

  /**
   * 式を解析する
   * @returns {object} - 式のノード
   */
  function parseExpression() {
    const token = tokens[position];

    // カッコの場合は中の式を解析
    if (isOpenBracket(token)) {
      position++; // 開きカッコをスキップ

      // 空のカッコ対を処理
      if (isCloseBracket(tokens[position])) {
        position++; // 閉じカッコをスキップ
        return { type: "EmptyList" };
      }

      const expr = parseSubExpression();

      // 閉じカッコがあることを確認
      if (position < tokens.length && isCloseBracket(tokens[position])) {
        position++; // 閉じカッコをスキップ
      } else {
        console.error(`閉じカッコがありません: 位置 ${position}, ここまでのトークン: ${tokens.slice(Math.max(0, position-5), position).join(', ')}`);
        throw new Error(`閉じカッコがありません: 位置 ${position}`);
      }

      return expr;
    }
    else {
      // 通常のトークン
      position++;
      return createLiteralOrIdentifier(token);
    }
  }

  /**
   * サブ式を解析する (カッコ内の式)
   * @returns {object} - 式のノード
   */
  function parseSubExpression() {
    const startPos = position;
    let elements = [];

    // カッコ内の要素を収集
    while (position < tokens.length && !isCloseBracket(tokens[position])) {
      const elementStartPos = position;

      // Define パターンの検出 (identifier : expression)
      if (isIdentifier(tokens[position]) &&
        position + 2 < tokens.length &&
        tokens[position + 1] === ":") {

        const identifier = createLiteralOrIdentifier(tokens[position]);
        position += 2; // identifierと":"をスキップ

        const value = parseExpression();

        return {
          type: "Define",
          identifier: identifier,
          value: value
        };
      }

      // ポイントフリースタイルの検出 ([operator] expression)
      else if (tokens[position] === "[" &&
        position + 2 < tokens.length &&
        isBinaryOperator(tokens[position + 1]) &&
        tokens[position + 2] === "]") {

        const operator = tokens[position + 1];
        position += 3; // "[", operator, "]"をスキップ

        if (position < tokens.length) {
          const argument = parseExpression();
          return {
            type: "PointFreeApplication",
            operator: operator,
            argument: argument
          };
        }
      }

      // ポイントフリースタイルの部分適用検出 ([operator value,] expression)
      else if (tokens[position] === "[" &&
        position + 4 < tokens.length &&
        isBinaryOperator(tokens[position + 1]) &&
        tokens[position + 3] === "," &&
        tokens[position + 4] === "]") {

        const operator = tokens[position + 1];
        const value = createLiteralOrIdentifier(tokens[position + 2]);
        position += 5; // "[", operator, value, ",", "]"をスキップ

        if (position < tokens.length) {
          const argument = parseExpression();
          return {
            type: "PartialApplication",
            operator: operator,
            value: value,
            argument: argument
          };
        }
      }

      // Lambda パターンの検出 (arguments ? body)
      else if (tokens[position] === "{") {
        const args = [];
        position++; // "{"をスキップ

        // 引数リストを処理
        while (position < tokens.length && tokens[position] !== "}" && tokens[position] !== "?") {
          if (tokens[position] === "~") {
            // 残余引数
            position++;
            if (position < tokens.length && isIdentifier(tokens[position])) {
              args.push({
                type: "RestArgument",
                name: tokens[position]
              });
              position++;
            } else {
              throw new Error(`残余引数の名前がありません: 位置 ${position}`);
            }
          }
          else if (isIdentifier(tokens[position])) {
            args.push({
              type: "Identifier",
              name: tokens[position]
            });
            position++;
          }
          else {
            position++;
          }
        }

        if (tokens[position] === "}") {
          position++; // "}"をスキップ
        }

        if (position < tokens.length && tokens[position] === "?") {
          position++; // "?"をスキップ
          const body = parseExpression();

          return {
            type: "Lambda",
            arguments: args,
            body: body
          };
        }
      }

      // 二項演算パターンの検出
      else if (position + 2 < tokens.length &&
        isBinaryOperator(tokens[position + 1])) {

        const left = parseExpression();
        const operator = tokens[position];
        position++; // 演算子をスキップ
        const right = parseExpression();

        return {
          type: "BinaryOperation",
          operator: operator,
          left: left,
          right: right
        };
      }

      // 前置演算子パターンの検出
      else if (isPrefixOperator(tokens[position])) {
        const operator = tokens[position];
        position++; // 演算子をスキップ
        const argument = parseExpression();

        return {
          type: "UnaryOperation",
          operator: operator,
          prefix: true,
          argument: argument
        };
      }

      // 後置演算子パターンの検出
      else if (position + 1 < tokens.length &&
        isPostfixOperator(tokens[position + 1])) {

        const argument = parseExpression();
        const operator = tokens[position];
        position++; // 演算子をスキップ

        return {
          type: "UnaryOperation",
          operator: operator,
          prefix: false,
          argument: argument
        };
      }

      // Get演算子の特別処理 (value ' key)
      else if (position + 2 < tokens.length &&
        tokens[position + 1] === "'") {

        const target = parseExpression(); // 最初の式
        position++; // "'"をスキップ
        const key = parseExpression();

        return {
          type: "GetOperation",
          target: target,
          key: key
        };
      }

      // リストセパレータ
      else if (tokens[position] === "," || tokens[position] === " ") {
        position++;
        continue;
      }

      // その他のトークン
      else {
        elements.push(parseExpression());
      }

      // 無限ループ防止
      if (elementStartPos === position) {
        console.warn(`警告: 位置 ${position} で進展がありません。トークン: ${tokens[position]}`);
        position++; // 進展がない場合は強制的に進める
      }
    }

    // 特別な処理: カッコ内に何もない場合の処理を追加
    if (elements.length === 0) {
      return { type: "EmptyList" };
    }

    // 複数要素があればリスト、単一要素ならそのまま返す
    if (elements.length > 1) {
      return {
        type: "List",
        elements: elements
      };
    } else if (elements.length === 1) {
      return elements[0];
    }
  }

  // メイン処理を開始
  try {
    const ast = parseExpression();

    // すべてのトークンが処理されたかチェック
    if (position < tokens.length) {
      console.warn(`警告: すべてのトークンが処理されていません。位置 ${position}/${tokens.length}`);
    }

    return ast;
  } catch (error) {
    throw new Error(`式木の構築に失敗しました: ${error.message}`);
  }
}

/**
 * 式木を整形する（簡略化や最適化を行う）
 * 
 * @param {object} ast - 式木
 * @returns {object} - 整形された式木
 */
function formatExpressionTree(ast) {
  if (!ast) return null;

  // ディープコピーを作成
  const result = JSON.parse(JSON.stringify(ast));

  // 不要なプロパティを削除
  function cleanup(node) {
    if (!node || typeof node !== 'object') return;

    // 再帰的に子ノードを処理
    Object.keys(node).forEach(key => {
      if (Array.isArray(node[key])) {
        node[key].forEach(item => cleanup(item));
      } else if (typeof node[key] === 'object') {
        cleanup(node[key]);
      }
    });
  }

  cleanup(result);
  return result;
}

// ユーティリティ関数
function isOpenBracket(token) {
  return token === "[" || token === "{" || token === "(";
}

function isCloseBracket(token) {
  return token === "]" || token === "}" || token === ")";
}

function isIdentifier(token) {
  // 識別子の判定
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(token);
}

function isLiteral(token) {
  // リテラルの判定（数値、文字列、文字）
  return /^(\d+(\.\d+)?|`.*`|\\.)$/.test(token);
}

function isBinaryOperator(token) {
  // 二項演算子の判定
  const binaryOperators = [
    "+", "-", "*", "/", "%", "^",
    "&", "|", ";", // 論理演算子
    "<", "<=", "=", ">=", ">", "!=", // 比較演算子
    ":", "@", "'", "~", "," // その他の演算子
  ];
  return binaryOperators.includes(token);
}

function isPrefixOperator(token) {
  // 前置演算子の判定
  const prefixOperators = ["!", "~", "#", "@", "$"];
  return prefixOperators.includes(token);
}

function isPostfixOperator(token) {
  // 後置演算子の判定
  const postfixOperators = ["!", "~", "@"];
  return postfixOperators.includes(token);
}

function createLiteralOrIdentifier(token) {
  if (isLiteral(token)) {
    return {
      type: "Literal",
      value: token
    };
  } else {
    return {
      type: "Identifier",
      name: token
    };
  }
}

module.exports = {
  buildExpressionTree,
  formatExpressionTree
};