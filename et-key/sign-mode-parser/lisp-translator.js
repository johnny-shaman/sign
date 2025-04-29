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
 * ver_20250428_0
 */

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
      return translateIdentifier(node);
    case 'List':
      // リストの内容を確認して条件分岐かどうかを判断
      if (isLambdaDefinition(node)) {
        return translateLambda(node);
      }   
      if (isConditionalPattern(node)) {
        return translateConditional(node);
      }
      // それ以外のリストは未実装
      return "; List型の条件分岐以外はまだ実装されていません";
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
  if (node.value && node.value.type === 'List' && isLambdaDefinition(node.value)) {
    const params = extractLambdaParams(node.value);
    const body = extractLambdaBody(node.value);
    return `(defun ${identifier} (${params.join(' ')}) ${body})`;
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
  return node.name;
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
      subElem.type === 'Identifier' && 
      subElem.name === ':'
    )
  );
}

/**
 * ラムダ定義パターンかどうかをチェック
 * 
 * @param {Object} node - チェックするノード
 * @returns {boolean} ラムダ定義パターンならtrue
 */
function isLambdaDefinition(node) {
  if (!Array.isArray(node.elements) || node.elements.length < 3) {
    return false;
  }
  
  // ラムダ定義の特徴: 第2要素が ? 演算子
  const secondElement = node.elements[1];
  return secondElement && 
         secondElement.type === 'Identifier' && 
         secondElement.name === '?';
}

/**
 * ラムダ式の引数リストを抽出
 * 
 * @param {Object} node - ラムダノード
 * @returns {Array} 引数名の配列
 */
function extractLambdaParams(node) {
  if (!isLambdaDefinition(node)) {
    return [];
  }
  
  const paramsNode = node.elements[0];
  
  // 引数が単一の識別子の場合
  if (paramsNode.type === 'Identifier') {
    return [paramsNode.name];
  }
  
  // 引数がリストの場合
  if (paramsNode.type === 'List' && Array.isArray(paramsNode.elements)) {
    return paramsNode.elements
      .filter(elem => elem.type === 'Identifier')
      .map(elem => elem.name);
  }
  
  return [];
}

/**
 * ラムダ式の本体を抽出して変換
 * 
 * @param {Object} node - ラムダノード
 * @returns {string} 変換されたラムダ本体
 */
function extractLambdaBody(node) {
  if (!isLambdaDefinition(node)) {
    return "nil";
  }
  
  // 本体部分（3番目以降の要素）
  const bodyElements = node.elements.slice(2);
  
  // 本体が条件分岐の場合
  if (bodyElements.length > 0 && isConditionalPattern({ type: 'List', elements: bodyElements })) {
    return translateConditional({ type: 'List', elements: bodyElements });
  }
  
  // 本体が単一の要素の場合
  if (bodyElements.length === 1) {
    return translateNode(bodyElements[0]);
  }
  
  // 本体が複数の要素の場合（複合式として扱う）
  if (bodyElements.length > 1) {
    const translatedElements = bodyElements.map(elem => translateNode(elem)).join(" ");
    return `(progn ${translatedElements})`;
  }
  
  return "nil";
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
  
  for (const element of node.elements) {
    if (element.type === 'List' && element.elements) {
      // ':' の位置を見つける
      const colonIndex = element.elements.findIndex(e => 
        e.type === 'Identifier' && e.name === ':'
      );
      
      if (colonIndex !== -1 && colonIndex < element.elements.length - 1) {
        // 条件部分と結果部分を抽出
        const condition = element.elements.slice(0, colonIndex);
        const result = element.elements.slice(colonIndex + 1);
        
        // 条件を変換
        let conditionCode;
        if (condition.length === 1) {
          conditionCode = translateNode(condition[0]);
        } else if (condition.length === 3 && condition[1].type === 'Identifier') {
          // 二項演算の条件の場合（例: x > 0）
          const operator = operatorMap[condition[1].name] || condition[1].name;
          const left = translateNode(condition[0]);
          const right = translateNode(condition[2]);
          conditionCode = `(${operator} ${left} ${right})`;
        } else {
          conditionCode = 't'; // 複雑な条件はまだサポートしていないので常にtrue
        }
        
        // 結果を変換
        let resultCode;
        if (result.length === 1) {
          resultCode = translateNode(result[0]);
        } else {
          // 複雑な結果はまだサポートしていない
          resultCode = "'unsupported-result";
        }
        
        condClauses.push(`(${conditionCode} ${resultCode})`);
      }
    } else {
      // デフォルト節として扱う（たとえばelse節に相当）
      const defaultResult = translateNode(element);
      condClauses.push(`(t ${defaultResult})`);
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
  // 引数リストの取得
  const params = extractLambdaParams(node);
  
  // ラムダ本体の変換
  const body = extractLambdaBody(node);
  
  return `(lambda (${params.join(' ')}) ${body})`;
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
  '~': 'sequence'  // 範囲リスト用
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