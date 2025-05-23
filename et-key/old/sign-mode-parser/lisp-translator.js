// lisp-translator.js
/**
 * Sign言語からLISPコードへの変換モジュール
 * 
 * 機能:
 * - 式木からLISPコードを生成する
 * - Sign言語の構文をLISP構文に変換する
 * - 再帰的に式木をトラバースして変換を行う
 * 
 * 使い方:
 *   const { generateLispCode } = require('./lisp-translator');
 *   const lispCode = generateLispCode(expressionTree);
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250503_0
 */

// 予約語チェック用モジュールのインポート
const { isReservedName, makeSafeIdentifier } = require('./lisp-reserved-names');

/**
 * 式木をLISPコードに変換するメイン関数
 * 
 * @param {Object} expressionTree - 式木構造
 * @returns {string|null} 生成されたLISPコード、または失敗時はnull
 */
function generateLispCode(expressionTree) {
  if (!expressionTree) {
    return null;
  }

  try {
    return translateNode(expressionTree);
  } catch (error) {
    console.error(`LISP変換エラー: ${error.message}`);
    return null;
  }
}

/**
 * ノードの種類に基づいて適切な変換関数を呼び出す
 * 
 * @param {Object} node - 変換するノード
 * @returns {string} 生成されたLISPコード
 */
function translateNode(node) {
  if (!node) return "nil";

  switch (node.type) {
    case 'Define':
      return translateDefine(node);
    case 'BinaryOperation':
      return translateBinaryOperation(node);
    case 'Literal':
      return translateLiteral(node);
    case 'Identifier':
      // 前置〜と後置〜の処理
      if (isRestParameter(node)) {
        return `&rest ${node.name.substring(1)}`;
      } else if (isSpreadOperator(node)) {
        // 後置〜の場合は文脈によって処理が異なるが、
        // translateIdentifierで基本的な変換を行う
        return translateIdentifier(node);
      }
      return translateIdentifier(node);
    case 'List':
      // リストの内容を確認して条件分岐かどうかを判断
      if (isConditionalPattern(node)) {
        return translateConditional(node);
      }
      // 関数適用パターンの確認
      if (isFunctionApplication(node)) {
        return translateFunctionApplication(node);
      }
      // 通常のリスト
      return translateList(node);
    case 'Lambda':
      return translateLambda(node);
    case 'ConditionalClause':
      // ConditionalClause型ノードの処理
      const condition = translateNode(node.condition);
      const result = translateNode(node.result);
      return `(${condition} ${result})`;
    // 他のケースは順次実装
    case 'Function':
      // return translateFunction(node);
      return "; Function型はまだ実装されていません";
    case 'PointFreeApplication':
      // return translatePointFreeApplication(node);
      return "; PointFreeApplication型はまだ実装されていません";
    default:
      return `; 未サポートのノードタイプ: ${node.type || 'undefined'}`;
  }
}

/**
 * Define型ノードをLISPコードに変換
 * 
 * @param {Object} node - Define型ノード
 * @returns {string} 生成されたLISPコード
 */
function translateDefine(node) {
  const identifier = translateIdentifier(node.identifier);
  const value = translateNode(node.value);

  // 値がラムダ式の場合、defunを使用する
  if (node.value && node.value.type === 'Lambda') {
    const [params, restParam] = extractLambdaParametersWithRest(node.value);

    // パラメータリストの作成
    let paramList = params.join(' ');
    if (restParam) {
      paramList += (params.length > 0 ? ' &rest ' : '&rest ') + restParam;
    }

    const body = extractLambdaBody(node.value);
    return `(defun ${identifier} (${paramList}) ${body})`;
  } else {
    // それ以外はdefvarを使用
    return `(defvar ${identifier} ${value})`;
  }
}

/**
 * BinaryOperation型ノードをLISPコードに変換
 * 
 * @param {Object} node - BinaryOperation型ノード
 * @returns {string} 生成されたLISPコード
 */
function translateBinaryOperation(node) {
  const operator = operatorMap[node.operator] || node.operator;
  const left = translateNode(node.left);
  const right = translateNode(node.right);

  // 範囲演算子〜の特別処理
  if (node.operator === '~') {
    return `(range ${left} ${right})`;
  }

  // 単項マイナスの特別処理
  if (node.operator === '-' && !left) {
    return `(- ${right})`;
  }

  return `(${operator} ${left} ${right})`;
}

/**
 * Literal型ノードをLISPコードに変換
 * 
 * @param {Object} node - Literal型ノード
 * @returns {string} 生成されたLISPコード
 */
function translateLiteral(node) {
  // 文字列リテラルの処理
  if (typeof node.value === 'string' && node.value.startsWith('`') && node.value.endsWith('`')) {
    // バッククォートを取り除き、ダブルクォートで囲む
    return `"${node.value.slice(1, -1)}"`;
  }

  // 数値リテラルや他のリテラルはそのまま返す
  return node.value;
}

/**
 * Identifier型ノードをLISPコードに変換
 * 
 * @param {Object} node - Identifier型ノード
 * @returns {string} 生成されたLISPコード
 */
function translateIdentifier(node) {
  let identifier = node.name;

  // 後置〜の場合は特別処理
  if (isSpreadOperator(node)) {
    // 〜を除去して識別子名を取得
    identifier = node.name.slice(0, -1);
  }
  // 予約語チェックと変換
  // makeSafeIdentifierは内部でisReservedNameをチェックする
  identifier = makeSafeIdentifier(identifier);

  return identifier;
}

/**
 * 識別子が前置〜かどうかをチェック
 * 
 * @param {Object} node - Identifier型ノード
 * @returns {boolean} 前置〜ならtrue
 */
function isRestParameter(node) {
  return node.type === 'Identifier' && node.name.startsWith('~');
}

/**
 * 識別子が後置〜かどうかをチェック
 * 
 * @param {Object} node - Identifier型ノード
 * @returns {boolean} 後置〜ならtrue
 */
function isSpreadOperator(node) {
  return node.type === 'Identifier' && node.name.endsWith('~');
}

/**
 * ノードが関数適用パターンかどうかをチェック
 * 
 * @param {Object} node - チェックするノード
 * @returns {boolean} 関数適用パターンならtrue
 */
function isFunctionApplication(node) {
  return node.type === 'List' &&
    node.elements &&
    node.elements.length > 0 &&
    node.elements[0].type === 'Identifier';
}

/**
 * 関数適用パターンをLISPコードに変換
 * 
 * @param {Object} node - 関数適用ノード
 * @returns {string} 生成されたLISPコード
 */
function translateFunctionApplication(node) {
  const originalFuncName = node.elements[0].name;
  const funcName = makeSafeIdentifier(originalFuncName);
  const args = node.elements.slice(1);

  // 後置〜を含むかチェック
  const spreadArgs = args.filter(arg =>
    arg.type === 'Identifier' && isSpreadOperator(arg)
  );

  if (spreadArgs.length > 0) {
    // 単一の後置〜引数
    if (args.length === 1 && isSpreadOperator(args[0])) {
      const listName = args[0].name.slice(0, -1);
      const safeListName = makeSafeIdentifier(listName);
      return `(apply #'${funcName} ${safeListName})`;
    }

    // 複数引数（通常引数 + 後置〜）
    else {
      const normalArgs = args
        .filter(arg => !isSpreadOperator(arg))
        .map(arg => translateNode(arg));

      const spreadArg = spreadArgs[0].name.slice(0, -1);
      const safeSpreadArg = makeSafeIdentifier(spreadArg);

      // normalArgsが空でなければリストとして連結
      if (normalArgs.length > 0) {
        return `(apply #'${funcName} (append (list ${normalArgs.join(' ')}) ${safeSpreadArg}))`;
      } else {
        return `(apply #'${funcName} ${safeSpreadArg})`;
      }
    }
  }

  // 通常の関数適用
  else {
    const translatedArgs = args.map(arg => translateNode(arg)).join(' ');
    return `(${funcName} ${translatedArgs})`;
  }
}

/**
 * リストをLISPコードに変換
 * 
 * @param {Object} node - リストノード
 * @returns {string} 生成されたLISPコード
 */
function translateList(node) {
  if (!Array.isArray(node.elements) || node.elements.length === 0) {
    return "nil";
  }

  // 後置〜を含むか確認
  const hasSpreadOperator = node.elements.some(elem =>
    elem.type === 'Identifier' && isSpreadOperator(elem)
  );

  // 後置〜を含む場合の特別処理
  if (hasSpreadOperator) {
    // 最初の要素が識別子で、2番目の要素が後置〜を持つ識別子の場合
    // これは「a args~」のパターン
    if (node.elements.length === 2 &&
      node.elements[0].type === 'Identifier' &&
      node.elements[1].type === 'Identifier' &&
      isSpreadOperator(node.elements[1])) {

      const firstArg = translateNode(node.elements[0]);
      const spreadArg = node.elements[1].name.slice(0, -1);

      // cons または list* を使って先頭要素とリストを結合
      return `(cons ${firstArg} ${spreadArg})`;
    }

    // その他の後置〜を含むリストの処理
    const nonSpreadElems = node.elements
      .filter(elem => !(elem.type === 'Identifier' && isSpreadOperator(elem)))
      .map(elem => translateNode(elem));

    const spreadElems = node.elements
      .filter(elem => elem.type === 'Identifier' && isSpreadOperator(elem))
      .map(elem => elem.name.slice(0, -1));

    if (nonSpreadElems.length > 0 && spreadElems.length > 0) {
      // 通常要素と展開要素の両方がある場合
      const normalList = nonSpreadElems.length === 1
        ? nonSpreadElems[0]
        : `(list ${nonSpreadElems.join(' ')})`;

      // 複数の展開要素がある場合
      if (spreadElems.length > 1) {
        const appendCalls = spreadElems.map(e => e).join(' ');
        return `(append ${normalList} ${appendCalls})`;
      } else {
        // 1つの展開要素の場合
        return `(append ${normalList} ${spreadElems[0]})`;
      }
    } else if (spreadElems.length > 0) {
      // 展開要素のみの場合
      if (spreadElems.length === 1) {
        return spreadElems[0];
      } else {
        return `(append ${spreadElems.join(' ')})`;
      }
    }
  }
  const elements = node.elements.map(elem => translateNode(elem)).join(' ');
  return `(list ${elements})`;
}

/**
 * 条件分岐パターンかどうかをチェック
 * 
 * @param {Object} node - チェックするノード
 * @returns {boolean} 条件分岐パターンならtrue
 */
function isConditionalPattern(node) {
  if (!Array.isArray(node.elements) || node.elements.length < 2) {
    return false;
  }

  // 条件分岐パターンの特徴: 各要素がList型で、その中に条件と結果のペアがある
  return node.elements.some(element =>
    element.type === 'List' &&
    element.elements &&
    element.elements.some(subElem =>
      subElem.type === 'ConditionalClause' &&
      subElem.name === ':'
    )
  );
}

/**
 * ラムダ式の引数リストから前置〜パラメータを抽出
 * 
 * @param {Object} node - ラムダノード
 * @returns {Array} [通常パラメータ, 残余パラメータ] の組
 */
function extractLambdaParametersWithRest(node) {
  if (node.type !== 'Lambda') {
    return [[], null];
  }

  let normalParams = [];
  let restParam = null;

  // Lambda ノードの left プロパティから引数リストを取得
  const params = node.left;

  // 単一の識別子の場合
  if (!Array.isArray(params) && params.type === 'Identifier') {
    if (isRestParameter(params)) {
      restParam = params.name.substring(1);
      restParam = makeSafeIdentifier(restParam);
    } else {
      normalParams = [makeSafeIdentifier(params.name)];
    }
    return [normalParams, restParam];
  }

  // 複数の引数（配列）の場合
  if (Array.isArray(params)) {
    params.forEach(param => {
      if (param.type === 'Identifier') {
        if (isRestParameter(param)) {
          restParam = param.name.substring(1);
          restParam = makeSafeIdentifier(restParam);
        } else {
          normalParams.push(makeSafeIdentifier(param.name));
        }
      }
    });
  }

  return [normalParams, restParam];
}


/**
 * ラムダ式の本体を抽出して変換
 * 
 * @param {Object} node - ラムダノード
 * @returns {string} 変換されたラムダ本体
 */
function extractLambdaBody(node) {
  if (node.type !== 'Lambda') {
    return "nil";
  }

  // Lambda ノードの right プロパティから本体を取得
  const body = node.right;

  if (!body) {
    return "nil";
  }

  // 本体がList型で条件分岐を含む場合
  if (body.type === 'List' && body.elements &&
    body.elements.some(e => e.type === 'ConditionalClause')) {
    return translateConditional(body);
  }

  // 特殊なケースの処理
  // rest_args : a ~args ? a args~ のパターン
  if (body.type === 'List' && body.elements && body.elements.length === 2) {
    const firstElem = body.elements[0];
    const secondElem = body.elements[1];

    if (firstElem.type === 'Identifier' &&
      secondElem.type === 'Identifier' &&
      isSpreadOperator(secondElem)) {

      // a args~ パターンを検出
      const paramName = translateNode(firstElem);
      const restName = secondElem.name.slice(0, -1);

      // 特殊変換: (list* a args) または (cons a args)
      return `(list* ${paramName} ${restName})`;
    }
  }

  // // 0x40 # s~ のようなパターン検出（print関数パターン）
  // // ★最小実装の暫定処理とする★
  // if (body.type === 'BinaryOperation' && body.elements && body.elements.length >= 2) {
  //   // 最初の要素がLiteralで16進数の場合
  //   const firstElem = body.elements[0];

  //   // 16進数と#演算子のパターン検出
  //   if (firstElem.type === 'Literal' &&
  //     typeof firstElem.value === 'string' &&
  //     firstElem.value === '0x40') {

  //     // 後置〜を含む要素を検索
  //     const spreadElem = body.elements.find(elem =>
  //       elem.type === 'Identifier' && isSpreadOperator(elem)
  //     );

  //     if (spreadElem) {
  //       // print関数パターンを検出
  //       const restName = spreadElem.name.slice(0, -1);

  //       // 標準出力への出力と推定（printfのようなもの）
  //       return `(mapc #'princ ${restName})`;
  //     }
  //   }
  // }

  // 通常の式の場合
  return translateNode(body);
}

/**
 * 条件分岐をLISPコードに変換
 * 
 * @param {Object} node - 条件分岐ノード
 * @returns {string} 生成されたLISPコード
 */
function translateConditional(node) {
  // cond構文を構築
  let condClauses = [];
  const elements = node.elements || [];

  // ConditionalClause型の要素を処理
  for (const element of elements) {
    if (element.type === 'ConditionalClause') {
      // 条件と結果を抽出
      const condition = element.condition;
      const result = element.result;

      if (condition && result) {
        // 条件を変換
        const conditionCode = translateNode(condition);
        // 結果を変換
        const resultCode = translateNode(result);

        condClauses.push(`(${conditionCode} ${resultCode})`);
      }
    } else {
      // ConditionalClause型でない要素はデフォルト節として扱う
      const defaultResult = translateNode(element);
      // すでに条件節があれば、これをelse節として追加
      if (condClauses.length > 0) {
        condClauses.push(`(t ${defaultResult})`);
      } else {
        // 条件節がなければそのまま返す
        return defaultResult;
      }
    }
  }

  if (condClauses.length === 0) {
    return "nil";
  }

  return `(cond ${condClauses.join(" ")})`;
}

/**
 * ラムダ式をLISPコードに変換
 * 
 * @param {Object} node - ラムダノード
 * @returns {string} 生成されたLISPコード
 */
function translateLambda(node) {
  if (node.type !== 'Lambda') {
    return "nil";
  }

  // 引数リストの取得（残余パラメータ対応）
  const [params, restParam] = extractLambdaParametersWithRest(node);

  // パラメータリストの作成
  let paramList = params.join(' ');
  if (restParam) {
    paramList += (params.length > 0 ? ' &rest ' : '&rest ') + restParam;
  }

  // ラムダ本体の変換
  const body = extractLambdaBody(node);

  return `(lambda (${paramList}) ${body})`;
}

/**
 * Sign言語の演算子をLISP演算子に変換するためのマッピング
 */
const operatorMap = {
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '%': 'mod',
  '^': 'expt',
  '=': 'equal',
  '!=': '/=',
  '<': '<',
  '<=': '<=',
  '>': '>',
  '>=': '>=',
  '&': 'and',
  '|': 'or',
  ';': 'xor',
  '~': 'range'  // 範囲リスト用
};

/**
 * LISPコードを適切にインデントする
 * 
 * @param {string} code - インデントするコード
 * @param {number} level - インデントレベル
 * @returns {string} インデントされたコード
 */
function indentLispCode(code, level = 0) {
  // 実装予定
  return code;
}

module.exports = {
  generateLispCode
};