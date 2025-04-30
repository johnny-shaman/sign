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
 * ver_20250430_0
 */

// モジュールをインポート
const {
  OPERATOR_PRECEDENCE,
  RIGHT_ASSOCIATIVE,
  isOperator,
  isInfixOperator,
  isPrefixOperator,
  isPostfixOperator
} = require('./operator-precedence');

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

  // コンテキスト管理のためのスタック
  let contextStack = [];

  /**
   * 現在の解析位置がラムダ式の内部にあるかどうかを判断する
   * 
   * @returns {boolean} - ラムダ式内の場合はtrue、それ以外はfalse
   */
  function isInLambdaContext() {
    return contextStack.includes('Lambda');
  }

  /**
   * コンテキストスタックに現在のコンテキストを追加
   * 
   * @param {string} context - 追加するコンテキスト
   */
  function pushContext(context) {
    contextStack.push(context);
  }

  /**
   * コンテキストスタックから最後に追加されたコンテキストを削除して返す
   * 
   * @returns {string|undefined} - スタックから削除されたコンテキスト
   */
  function popContext() {
    return contextStack.pop();
  }

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
        console.error(`閉じカッコがありません: 位置 ${position}, ここまでのトークン: ${tokens.slice(Math.max(0, position - 5), position).join(', ')}`);
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
          operator: tokens[position],
          identifier: identifier,
          value: value
        };
      }

      // 条件分岐パターンの検出 (condition : result)
      // この判定はポジションで行うのではなく、すでに解析済みの左辺と現在のトークンを見る
      else if (position < tokens.length &&
        tokens[position] === ":" &&
        isInLambdaContext() &&
        elements.length > 0) {

        const condition = elements.pop(); // 最後に処理した要素を条件とする
        position++; // ":"をスキップ
        const result = parseExpression();

        return {
          type: "ConditionalClause",
          operator: tokens[position],
          condition: condition,
          result: result
        };
      }

      // ポイントフリースタイルの検出 ([operator] expression)
      else if (tokens[position] === "[" &&
        position + 2 < tokens.length &&
        isOperator(tokens[position + 1]) &&
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
        isOperator(tokens[position + 1]) &&
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
      else if (tokens[position] === "?") {
        const operator = tokens[position];
        // ラムダ演算子を検出
        position++; // "?"をスキップ
        
        // 直前の要素を引数リストとして扱う
        let args = [];
        if (elements.length > 0) {
          const lastElement = elements.pop();
          // 最後の要素が識別子リストなら引数として扱う
          if (lastElement.type === "List") {
            args = lastElement.elements;
          } else {
            // 単一の識別子の場合
            args.push(lastElement);
          }
        }

        // ラムダコンテキストをスタックにプッシュ
        pushContext('Lambda');

        // ラムダ本体を解析
        const body = parseExpression();

        // ラムダコンテキストをスタックからポップ
        popContext();

        return {
          type: "Lambda",
          operator: operator,
          left: args,
          right: body
        };
      }

      // 二項演算パターンの検出 - カッコの階層を考慮
      // ★二項演算リストに?を含むため、ラムダ引数がLISTではない（リテラル1つの）場合は次の?演算子処理で対応
      else if (position + 2 < tokens.length && isOperator(tokens[position + 1]) && tokens[position + 1] !== "?") {
          // 左辺を解析
          let leftStartPos = position;
          let leftDepth = 0;

          // 左辺のカッコ階層を追跡
          if (isOpenBracket(tokens[position])) {
            leftDepth++;
            position++;

            // 対応する閉じカッコを探す
            while (position < tokens.length && leftDepth > 0) {
              if (isOpenBracket(tokens[position])) {
                leftDepth++;
              } else if (isCloseBracket(tokens[position])) {
                leftDepth--;
              }
              position++;
            }

            // 左辺を解析
            position = leftStartPos;
          }

          const left = parseExpression();

          // 演算子を取得
          if (position < tokens.length && isOperator(tokens[position])) {
            const operator = tokens[position];
            position++; // 演算子をスキップ

            // 右辺を解析
            let rightStartPos = position;
            let rightDepth = 0;

            // 右辺のカッコ階層を追跡
            if (position < tokens.length && isOpenBracket(tokens[position])) {
              rightDepth++;
              position++;

              // 対応する閉じカッコを探す
              while (position < tokens.length && rightDepth > 0) {
                if (isOpenBracket(tokens[position])) {
                  rightDepth++;
                } else if (isCloseBracket(tokens[position])) {
                  rightDepth--;
                }
                position++;
              }

              // 右辺の解析位置を戻す
              position = rightStartPos;
            }

            const right = parseExpression();

            return {
              type: "BinaryOperation",
              operator: operator,
              left: left,
              right: right
            };
          }
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

      // 操車場アルゴリズムを用いた二項演算処理
      if (elements.length > 1) {
        // 演算子の優先順位モジュールを活用
        return buildExpressionTreeFromElements(elements);
      } else if (elements.length === 1) {
        return elements[0];
      }
    }

    /**
     * 操車場アルゴリズムを使用して要素リストから式木を構築する
     * 
     * @param {Array} elements - 要素リスト
     * @returns {Object} - 式木
     */
    function buildExpressionTreeFromElements(elements) {
      // 要素が1つの場合はそのまま返す
      if (elements.length === 1) {
        return elements[0];
      }

      // 要素リストに演算子が含まれているか確認
      let hasOperator = false;
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].type === "Identifier" && isInfixOperator(elements[i].name)) {
          hasOperator = true;
          break;
        }
      }

      // 演算子がない場合はリストとして返す
      if (!hasOperator) {
        return {
          type: "List",
          elements: elements
        };
      }

      // 最も優先順位の低い演算子を探す
      let lowestPrecedenceIndex = -1;
      let lowestPrecedenceValue = Infinity;

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        // 演算子の場合
        if (element.type === "Identifier" && isInfixOperator(element.name)) {
          const operatorPrecedence = OPERATOR_PRECEDENCE[element.name] || 0;

          // 右結合性を考慮
          if (RIGHT_ASSOCIATIVE.includes(element.name)) {
            // 右結合の場合は優先順位が同じ場合でも置き換えない
            if (operatorPrecedence < lowestPrecedenceValue) {
              lowestPrecedenceIndex = i;
              lowestPrecedenceValue = operatorPrecedence;
            }
          } else {
            // 左結合の場合は優先順位が同じ場合でも置き換える
            if (operatorPrecedence <= lowestPrecedenceValue) {
              lowestPrecedenceIndex = i;
              lowestPrecedenceValue = operatorPrecedence;
            }
          }
        }
      }

      // 演算子が見つかった場合
      if (lowestPrecedenceIndex !== -1) {
        const operator = elements[lowestPrecedenceIndex].name;

        // 左右の部分リストを作成
        const leftElements = elements.slice(0, lowestPrecedenceIndex);
        const rightElements = elements.slice(lowestPrecedenceIndex + 1);

        // 左右の式木を再帰的に構築
        const leftTree = buildExpressionTreeFromElements(leftElements);
        const rightTree = buildExpressionTreeFromElements(rightElements);

        // 二項演算ノードを作成
        return {
          type: "BinaryOperation",
          operator: operator,
          left: leftTree,
          right: rightTree
        };
      }

      // 演算子が見つからなかった場合はリストとして返す
      return {
        type: "List",
        elements: elements
      };
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