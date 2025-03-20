// js_transpiler/generator.js
/**
 * Sign言語ASTからJavaScriptコード生成モジュール
 * 
 * 機能:
 * - ビジターパターンを使用したAST走査
 * - ノードタイプに応じたJavaScriptコード生成
 * - ブロック構造と式の適切な変換
 * - 関数適用、演算子、特殊構文の変換
 * 
 * 使用方法:
 * const { Generator } = require('./generator');
 * const generator = new Generator(options);
 * const jsCode = generator.generate(ast);
 * 
 * CreateBy Claude3.7Sonnet
 * ver_20250320_4
*/

const { logger } = require('../utils/logger');
const {
  sanitizeIdentifier,
  stringifyValue,
  indentCode,
  generateFunctionCall,
  generatePropertyAccess,
  generateBlock
} = require('./utils/codeGenHelpers');
const { getConfig } = require('./config');

/**
 * Sign言語ASTからJavaScriptコードを生成するクラス
 */
class Generator {
  /**
   * ジェネレーターを初期化
   * @param {Object} options - 生成オプション
   */
  constructor(options = {}) {
    this.options = getConfig(options);
    this.indentLevel = 0;
    this.runtime = this.options.runtime.variableName;
    this.sourceMap = this.options.output.sourceMap;
    this.usedHelpers = new Set(); // 使用されたヘルパー関数を追跡
  }

  /**
   * ASTからJavaScriptコードを生成
   * @param {Object} ast - 入力AST
   * @returns {string} 生成されたJavaScriptコード
   */
  generate(ast) {
    try {
      logger.info('JavaScriptコード生成を開始します...');
      const startTime = Date.now();

      // ASTが正しい形式かチェック
      if (!ast || !ast.type) {
        throw new Error('無効なAST: ASTオブジェクトまたはtypeプロパティがありません');
      }

      // プログラム全体の生成
      const code = this.visitNode(ast);

      // ランタイム依存関係の注入
      const finalCode = this.injectRuntime(code);

      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.info(`JavaScriptコード生成が完了しました (${duration}ms)`);

      return finalCode;
    } catch (error) {
      logger.error('コード生成エラー:', error.message);
      throw error;
    }
  }

  /**
   * AST ノードの訪問を振り分けるディスパッチャー
   * @param {Object} node - 訪問するノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitNode(node) {
    if (!node || !node.type) {
      return '';
    }

    const methodName = `visit${node.type}`;
    if (typeof this[methodName] === 'function') {
      if (this.options.debug.traceGeneration) {
        logger.debug(`ノード訪問: ${node.type}`);
      }
      return this[methodName](node);
    } else {
      logger.warn(`未対応のノード型: ${node.type}`);
      return `/* 未対応: ${node.type} */`;
    }
  }

  /**
   * ランタイムライブラリの参照を注入
   * @param {string} code - 生成されたコード
   * @returns {string} ランタイム参照付きの最終コード
   */
  injectRuntime(code) {
    // ランタイムがまったく使われていない場合は注入不要
    if (this.usedHelpers.size === 0 && !code.includes('Math.pow')) {
      return code;
    }

    // モジュール形式に基づいてランタイムのインポート文を生成
    let runtimeImport;
    if (this.options.output.format === 'module') {
      runtimeImport = `import ${this.runtime} from '${this.options.runtime.importPath}';\n\n`;
    } else {
      runtimeImport = `const ${this.runtime} = require('${this.options.runtime.importPath}');\n\n`;
    }

    // strict modeの追加（オプション）
    const strictMode = this.options.codeGen.strictMode ? `'use strict';\n\n` : '';

    return `${strictMode}${runtimeImport}${code}`;
  }

  /**
   * Programノードの訪問
   * @param {Object} node - Programノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitProgram(node) {
    const body = node.body || [];
    let code = '';

    // 空のプログラムの処理
    if (body.length === 0) {
      return '// 空のSign言語プログラム';
    }

    // 本体の各文を処理
    for (let i = 0; i < body.length; i++) {
      const stmt = body[i];

      if (!stmt) continue;

      let stmtCode = this.visitNode(stmt);

      // コメント行やブロックは出力しない場合
      if (!stmtCode || stmtCode.trim() === '') {
        continue;
      }

      // 文末にセミコロンを追加（必要に応じて）
      if (!stmtCode.endsWith(';') && !stmtCode.endsWith('}')) {
        stmtCode += ';';
      }

      code += stmtCode + '\n';
    }

    return code;
  }

  /**
   * Definitionノードの訪問
   * @param {Object} node - Definitionノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitDefinition(node) {
    if (!node.identifier || !node.value) {
      logger.warn('定義ノードに識別子または値がありません');
      return '/* 無効な定義 */';
    }

    let identifier;

    // 識別子が単純な識別子かより複雑な式か判断
    if (node.identifier.type === 'Identifier') {
      identifier = this.visitIdentifier(node.identifier);
    } else {
      // プロパティアクセスや特殊パターンの場合
      identifier = this.visitNode(node.identifier);
      return `${identifier} = ${this.visitNode(node.value)}`;
    }

    // 定数宣言として生成
    return `const ${identifier} = ${this.visitNode(node.value)}`;
  }

  /**
   * Lambdaノードの訪問
   * @param {Object} node - Lambdaノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitLambda(node) {
    // パラメータの処理
    const params = node.parameters || [];

    // パラメータリストの生成
    const paramList = params.map(param => {
      // スプレッド演算子の処理
      if (param.type === 'SpreadOperation' && param.position === 'prefix') {
        const paramName = this.visitNode(param.expression);
        return `...${paramName}`;
      } else {
        // 通常のパラメータ
        return this.visitNode(param);
      }
    }).join(', ');

    // 本体の式の処理
    let body;
    if (node.body.type === 'Block') {
      // 複合式の場合はブロックで囲む
      const blockCode = this.visitBlock(node.body, true);
      body = `{ ${blockCode} }`;
    } else {
      // 単一式の場合
      body = this.visitNode(node.body);
      if (body.startsWith('return')) {
        body = `{ ${body} }`;
      } else if (!body.startsWith('{')) {
        // 単一式にはreturnを追加
        body = `return ${body}`;
      }
    }

    // カリー化設定をチェック
    const useCurrying = this.options.codeGen && this.options.codeGen.useCurrying;

    if (useCurrying && params.length > 1 && false) {
      // 注: カリー化バージョンは現在無効化（&& falseで常に実行されない）
      // このブランチはSign言語の関数を誤って解釈するため、修正まで無効化
      for (let i = params.length - 1; i >= 0; i--) {
        const param = params[i];
        // スプレッド演算子の処理
        if (param.type === 'SpreadOperation' && param.position === 'prefix') {
          const paramName = this.visitNode(param.expression);
          body = `(...${paramName}) => ${body}`;
        } else {
          // 通常のパラメータ
          const paramName = this.visitNode(param);
          body = `${paramName} => ${body}`;
        }
      }
      return body;
    } else {
      // 標準的な複数引数関数 - すべてのパラメータを一度に処理
      return `(${paramList}) => ${body}`;
    }
  }

  /**
   * ConditionalLambdaノードの訪問
   * @param {Object} node - ConditionalLambdaノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitConditionalLambda(node) {
    // パラメータの処理
    const params = node.parameters || [];
    const paramList = params.map(param => {
      // スプレッド演算子の処理
      if (param.type === 'SpreadOperation' && param.position === 'prefix') {
        return `...${this.visitNode(param.expression)}`;
      }
      // 通常のパラメータ
      return this.visitNode(param);
    }).join(', ');

    // 条件分岐の処理
    const branches = node.branches || [];
    let bodyStatements = [];

    // 各分岐の条件と結果を処理
    for (const branch of branches) {
      const condition = this.visitNode(branch.condition);
      const result = this.visitNode(branch.result);
      bodyStatements.push(`if (${condition}) { return ${result}; }`);
    }

    // デフォルト分岐
    bodyStatements.push('return null; // デフォルト分岐');

    // 条件分岐を含む関数本体を生成
    const body = bodyStatements.join('\n');
    const indentedBody = indentCode(body, 1, this.options.output.indent);

    // アロー関数構文を使用
    return `(${paramList}) => {\n${indentedBody}\n}`;
  }

  /**
   * BinaryOperationノードの訪問
   * @param {Object} node - BinaryOperationノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitBinaryOperation(node) {
    const left = this.visitNode(node.left);
    const right = this.visitNode(node.right);

    // 特殊な演算子の処理
    switch (node.operator) {
      // 等価演算子
      case '=':
        return `(${left} === ${right})`;

      // 非等価演算子
      case '!=':
        return `(${left} !== ${right})`;

      // 累乗演算子
      case '^':
        return `Math.pow(${left}, ${right})`;

      // 論理演算子
      case '&':
        return `(${left} && ${right})`;

      case '|':
        return `(${left} || ${right})`;

      case ';': // XOR
        this.usedHelpers.add('logicalXor');
        return `${this.runtime}.operators.logicalXor(${left}, ${right})`;

      // 標準的なJavaScript演算子
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
      case '<':
      case '<=':
      case '>':
      case '>=':
        return `(${left} ${node.operator} ${right})`;

      // その他の演算子はランタイム呼び出しを使用
      default:
        this.usedHelpers.add(`operators.${node.operator}`);
        return `${this.runtime}.operators["${node.operator}"](${left}, ${right})`;
    }
  }

  /**
   * UnaryOperationノードの訪問
   * @param {Object} node - UnaryOperationノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitUnaryOperation(node) {
    const expression = this.visitNode(node.expression);

    // 演算子の位置に基づいて処理
    if (node.position === 'prefix') {
      // 前置演算子
      switch (node.operator) {
        case '!': // 論理否定
          return `(!${expression})`;

        case '-': // 数値の符号反転
          return `(-${expression})`;

        case '~': // スプレッド演算子（前置）
          this.usedHelpers.add('expandPrefix');
          return `${this.runtime}.operators.expandPrefix(${expression})`;

        default:
          this.usedHelpers.add(`prefixOp.${node.operator}`);
          return `${this.runtime}.prefixOp["${node.operator}"](${expression})`;
      }
    } else if (node.position === 'postfix') {
      // 後置演算子
      switch (node.operator) {
        case '!': // 階乗
          this.usedHelpers.add('factorial');
          return `${this.runtime}.operators.factorial(${expression})`;

        case '~': // スプレッド演算子（後置）
          this.usedHelpers.add('expandPostfix');
          return `${this.runtime}.operators.expandPostfix(${expression})`;

        default:
          this.usedHelpers.add(`postfixOp.${node.operator}`);
          return `${this.runtime}.postfixOp["${node.operator}"](${expression})`;
      }
    }

    // 未知の位置
    logger.warn(`不明な単項演算子位置: ${node.position}`);
    return expression;
  }

  /**
   * Applicationノードの訪問
   * @param {Object} node - Applicationノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitApplication(node) {
    // 特別なケース：余積として誤認識された関数適用の修正
    if (node.function.type === 'Coproduct') {
      // 関数と引数のシナリオ可能性をチェック
      const potentialFunc = node.function.left;
      const firstArg = node.function.right;

      if (this.isFunctionLike(potentialFunc)) {
        // 関数適用のパターン検出（f x y）
        const func = this.visitNode(potentialFunc);
        const firstArgStr = this.visitNode(firstArg);

        // 残りの引数
        const restArgs = node.arguments || [];
        const restArgsStr = restArgs.map(arg => this.visitNode(arg)).join(', ');

        return `${func}(${firstArgStr}${restArgs.length > 0 ? ', ' + restArgsStr : ''})`;
      }
    }

    const func = this.visitNode(node.function);

    // 引数リストの処理
    const args = node.arguments || [];
    const argList = args.map(arg => this.visitNode(arg)).join(', ');

    // 関数呼び出しの生成
    return `${func}(${argList})`;
  }

  /**
   * Coproductノードの訪問
   * @param {Object} node - Coproductノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitCoproduct(node) {
    const left = this.visitNode(node.left);
    const right = this.visitNode(node.right);

    // 文字列関連の処理を最優先
    const isLeftString = node.left.type === 'String' || node.left.type === 'Character';
    const isRightString = node.right.type === 'String' || node.right.type === 'Character';

    // 文字列連結のケース
    if (isLeftString || isRightString) {
      // 両方が文字列リテラルの場合
      if (isLeftString && isRightString) {
        if (left.startsWith('`') && left.endsWith('`') &&
          right.startsWith('`') && right.endsWith('`')) {
          const leftContent = left.slice(1, -1);
          const rightContent = right.slice(1, -1);
          return `\`${leftContent}${rightContent}\``;
        } else {
          return `${left} + ${right}`;
        }
      }

      // 左辺が文字列テンプレートの場合
      if (isLeftString && left.startsWith('`') && left.endsWith('`')) {
        const leftContent = left.slice(1, -1);

        // 右辺が識別子または変数参照の場合はテンプレート挿入
        if (node.right.type === 'Identifier') {
          return `\`${leftContent}\${${right}}\``;
        } else {
          return `\`${leftContent}\` + ${right}`;
        }
      }
      // その他の文字列ケースは単純な連結
      return `${left} + ${right}`;
    }

    // 左辺が関数のようなノードかを厳密にチェック
    if (this.isFunctionLike(node.left)) {
      // 関数適用として処理
      return `${left}(${right})`;
    }

    // その他のリテラル結合はランタイム関数を使用
    this.usedHelpers.add('coproduct');
    return `${this.runtime}.list.coproduct(${left}, ${right})`;
  }

  /**
   * Productノードの訪問
   * @param {Object} node - Productノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitProduct(node) {
    // 要素リストの処理
    const elements = node.elements || [];
    const elementList = elements.map(elem => this.visitNode(elem)).join(', ');

    // 配列リテラルとして生成
    return `[${elementList}]`;
  }

  /**
   * PropertyAccessノードの訪問
   * @param {Object} node - PropertyAccessノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitPropertyAccess(node) {
    const object = this.visitNode(node.object);

    // プロパティの処理
    let property;
    if (node.property.type === 'String' || node.property.type === 'Identifier') {
      // 文字列やリテラルプロパティ名
      property = node.property.value;
    } else {
      // 式としてのプロパティ
      property = this.visitNode(node.property);
    }

    // プロパティアクセス形式の決定
    const notation = this.options.codeGen.bracketNotation;
    if (node.property.type === 'String' || node.property.type === 'Identifier') {
      return generatePropertyAccess(object, property, notation);
    } else {
      // 式の場合はブラケット表記のみ
      return `${object}[${property}]`;
    }
  }

  /**
   * PropertyAssignmentノードの訪問
   * @param {Object} node - PropertyAssignmentノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitPropertyAssignment(node) {
    const object = this.visitNode(node.object);
    const value = this.visitNode(node.value);

    // プロパティの処理
    let property;
    if (node.property.type === 'String' || node.property.type === 'Identifier') {
      // 文字列やリテラルプロパティ名
      property = node.property.value;
    } else {
      // 式としてのプロパティ
      property = this.visitNode(node.property);
    }

    // プロパティ代入形式の決定
    const notation = this.options.codeGen.bracketNotation;
    if (node.property.type === 'String' || node.property.type === 'Identifier') {
      const propAccess = generatePropertyAccess(object, property, notation);
      return `${propAccess} = ${value}`;
    } else {
      // 式の場合はブラケット表記のみ
      return `${object}[${property}] = ${value}`;
    }
  }

  /**
   * PointFreeOperatorノードの訪問
   * @param {Object} node - PointFreeOperatorノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitPointFreeOperator(node) {
    // 演算子の種類と位置の処理
    const { operator, position } = node;

    // 位置に基づいたランタイム関数選択
    if (position === 'prefix') {
      this.usedHelpers.add(`prefixOp.${operator}`);
      return `${this.runtime}.prefixOp["${operator}"]`;
    } else if (position === 'postfix') {
      this.usedHelpers.add(`postfixOp.${operator}`);
      return `${this.runtime}.postfixOp["${operator}"]`;
    } else { // infix
      this.usedHelpers.add(`infixOp.${operator}`);
      return `${this.runtime}.infixOp["${operator}"]`;
    }
  }

  /**
   * PartialApplicationノードの訪問
   * @param {Object} node - PartialApplicationノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitPartialApplication(node) {
    const { operator, left, right } = node;

    // 演算子の取得
    this.usedHelpers.add(`partial`);

    // 左右引数の適用状態に応じて処理
    if (left && right) {
      // 両方の引数が指定されている場合 - 通常は完全適用と同等
      const leftValue = this.visitNode(left);
      const rightValue = this.visitNode(right);

      return `((a, b) => ${this.runtime}.infixOp["${operator}"](a, b))(${leftValue}, ${rightValue})`;
    } else if (left) {
      // 左引数のみの部分適用
      const leftValue = this.visitNode(left);

      return `(b => ${this.runtime}.infixOp["${operator}"](${leftValue}, b))`;
    } else if (right) {
      // 右引数のみの部分適用
      const rightValue = this.visitNode(right);

      return `(a => ${this.runtime}.infixOp["${operator}"](a, ${rightValue}))`;
    } else {
      // 引数なしの場合 - ポイントフリー演算子と等価
      return `${this.runtime}.infixOp["${operator}"]`;
    }
  }

  /**
   * Blockノードの訪問
   * @param {Object} node - Blockノード
   * @param {boolean} isLambdaBody - ラムダ式の本体であるかどうか
   * @returns {string} 生成されたJavaScriptコード
   */
  visitBlock(node, isLambdaBody = false) {
    const statements = node.body || [];
    const bodyStatements = [];

    // ブロック内の各文を処理
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      let code = this.visitNode(stmt);

      // 空文のスキップ
      if (!code || code.trim() === '') continue;

      // ブロック内の最後の文は、ラムダ本体の場合は戻り値として使用
      if (isLambdaBody && i === statements.length - 1 && !code.startsWith('return')) {
        code = `return ${code}`;
      }

      // 文末にセミコロンを追加（必要に応じて）
      if (!code.endsWith(';') && !code.endsWith('}')) {
        code += ';';
      }

      bodyStatements.push(code);
    }

    // 単一のreturn文の場合は単純化
    if (bodyStatements.length === 1 && bodyStatements[0].startsWith('return') && isLambdaBody) {
      return bodyStatements[0];
    }

    return bodyStatements.join('\n');
  }

  /**
   * Numberノードの訪問
   * @param {Object} node - Numberノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitNumber(node) {
    return node.value;
  }

  /**
   * Stringノードの訪問
   * @param {Object} node - Stringノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitString(node) {
    // バックティックをエスケープしてテンプレートリテラルを使用
    return `\`${node.value.replace(/`/g, '\\`')}\``;
  }

  /**
   * Characterノードの訪問
   * @param {Object} node - Characterノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitCharacter(node) {
    // エスケープが必要な文字の処理
    const char = node.value;
    const escaped = char
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    return `'${escaped}'`;
  }

  /**
   * Identifierノードの訪問
   * @param {Object} node - Identifierノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitIdentifier(node) {
    return sanitizeIdentifier(node.value, this.options.codeGen);
  }

  /**
   * Unitノードの訪問
   * @param {Object} node - Unitノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitUnit(node) {
    // Signの単位元（_）をnullに変換
    return 'null';
  }

  /**
   * EmptyListノードの訪問
   * @param {Object} node - EmptyListノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitEmptyList(node) {
    // 空リスト
    return '[]';
  }

  /**
   * Exportノードの訪問
   * @param {Object} node - Exportノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitExport(node) {
    const value = this.visitNode(node.value);

    // エクスポート対象の識別子を取得
    let identifier;
    if (node.value.type === 'Identifier') {
      identifier = node.value.value;
    } else if (node.value.type === 'Definition') {
      identifier = node.value.identifier.value;
    } else {
      // 識別子が特定できない場合はデフォルトエクスポート
      return this.options.output.format === 'module'
        ? `export default ${value}`
        : `module.exports = ${value}`;
    }

    const sanitizedId = sanitizeIdentifier(identifier, this.options.codeGen);

    // モジュール形式に応じたエクスポート文
    if (this.options.output.format === 'module') {
      if (node.value.type === 'Definition') {
        // 定義とエクスポートを同時に行う
        const valueCode = this.visitNode(node.value.value);
        return `export const ${sanitizedId} = ${valueCode};`;
      } else {
        // 既存の識別子のエクスポート
        return `export { ${sanitizedId} };`;
      }
    } else {
      // CommonJS形式
      if (node.value.type === 'Definition') {
        // 定義とエクスポートを同時に行う
        const valueCode = this.visitNode(node.value.value);
        return `const ${sanitizedId} = ${valueCode};\nmodule.exports.${sanitizedId} = ${sanitizedId}`;
      } else {
        // 既存の識別子のエクスポート
        return `module.exports.${sanitizedId} = ${sanitizedId};`;
      }
    }
  }

  /**
   * Importノードの訪問
   * @param {Object} node - Importノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitImport(node) {
    const source = this.visitNode(node.source);

    // モジュール形式に応じたインポート文
    if (this.options.output.format === 'module') {
      return `import * as ${source} from ${source}`;
    } else {
      // CommonJS形式
      return `const ${source} = require(${source})`;
    }
  }

  /**
   * SpreadImportノードの訪問
   * @param {Object} node - SpreadImportノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitSpreadImport(node) {
    // インポートのスプレッド（すべて展開）
    const source = this.visitNode(node.source);

    // モジュール形式に応じたスプレッドインポート
    if (this.options.output.format === 'module') {
      return `import * as _tmp from ${source};\nObject.assign(globalThis, _tmp)`;
    } else {
      // CommonJS形式
      return `const _tmp = require(${source});\nObject.assign(globalThis, _tmp)`;
    }
  }

  /**
   * SpreadOperationノードの訪問
   * @param {Object} node - SpreadOperationノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitSpreadOperation(node) {
    const expression = this.visitNode(node.expression);

    if (node.position === 'prefix') {
      // 前置スプレッド演算子（...）
      return `...${expression}`;
    } else if (node.position === 'postfix') {
      // 後置スプレッド演算子（配列展開）
      this.usedHelpers.add('expandPostfix');
      return `${this.runtime}.operators.expandPostfix(${expression})`;
    } else if (node.position === 'infix') {
      // 中置スプレッド演算子（範囲生成）
      const left = this.visitNode(node.left);
      const right = this.visitNode(node.right);
      this.usedHelpers.add('range');
      return `${this.runtime}.list.range(${left}, ${right})`;
    }

    // 未知の位置
    logger.warn(`不明なスプレッド演算子位置: ${node.position}`);
    return expression;
  }

  /**
   * RangeOperationノードの訪問
   * @param {Object} node - RangeOperationノード
   * @returns {string} 生成されたJavaScriptコード
   */
  visitRangeOperation(node) {
    const left = this.visitNode(node.left);
    const right = this.visitNode(node.right);

    // 範囲演算子
    this.usedHelpers.add('range');
    return `${this.runtime}.list.range(${left}, ${right})`;
  }

  /**
   * ノードが関数のような値かチェック
   * @param {Object} node - チェックするノード
   * @returns {boolean} 関数のような値ならtrue
   */
  isFunctionLike(node) {
    if (!node || !node.type) return false;

    // 明確に関数では「ない」ノード型の判定
    const nonFunctionNodeTypes = [
      'Number',
      'String',
      'Character',
      'Unit',
      'EmptyList',
      'BinaryOperation',
      'RangeOperation',
      'SpreadOperation'
    ];

    if (nonFunctionNodeTypes.includes(node.type)) {
      return false;
    }

    // 明示的に関数と判断できるノード型
    if (['Lambda', 'ConditionalLambda', 'PointFreeOperator', 'PartialApplication'].includes(node.type)) {
      return true;
    }

    // Applicationは常に関数と見なす（関数適用の結果は関数かもしれない）
    if (node.type === 'Application') {
      return true;
    }

    // 識別子の場合、名前のパターンから関数を推測
    if (node.type === 'Identifier') {
      // 関数名パターンの洗練された判定
      const id = node.value;

      // カリー化された関数の部分適用結果である可能性を考慮
      // 動詞で始まる識別子、または動詞+名詞の複合形
      const verbPrefixes = [
        'get', 'set', 'is', 'has', 'can', 'will', 'should', 'create', 'make',
        'build', 'compute', 'calculate', 'add', 'remove', 'filter', 'map',
        'reduce', 'find', 'sort', 'transform', 'convert', 'parse', 'format'
      ];

      // いずれかの動詞プレフィックスで始まるか
      for (const prefix of verbPrefixes) {
        if (id === prefix ||
          (id.startsWith(prefix) &&
            id.length > prefix.length &&
            id[prefix.length] === id[prefix.length].toUpperCase())) {
          return true;
        }
      }

      // 常にユーザー定義関数として扱うべき特別な識別子
      const knownFunctions = [
        'add', 'subtract', 'multiply', 'divide', 'compose', 'map', 'filter',
        'fold', 'reduce', 'apply', 'curry', 'partial', 'pipe'
      ];

      if (knownFunctions.includes(id)) {
        return true;
      }
    }

    // PropertyAccessも関数を返す可能性がある
    if (node.type === 'PropertyAccess') {
      // プロパティアクセスの結果が関数かどうかは実行時にしか分からないことが多いが、
      // メソッド呼び出しのような形式（obj.method）の場合は関数と仮定する
      return true;
    }

    return false;
  }

  /**
   * 識別子が関数を参照しているかの推測
   * @param {string} id - 識別子文字列
   * @returns {boolean} 関数らしければtrue
   */
  isFunctionIdentifier(id) {
    // 名前のパターンから関数らしさを判断
    // この実装は単純な推測で、100%の精度はない
    if (!id) return false;

    // 関数名らしい先頭小文字のキャメルケース
    return /^[a-z][a-zA-Z0-9]*([A-Z][a-zA-Z0-9]*)+$/.test(id) ||
      // 動詞+名詞のパターン
      /^(get|set|create|build|make|find|search|compute|calculate|generate|transform|convert|parse|format|validate|check|is|has|can)[A-Z]/.test(id);
  }
}

// モジュールのエクスポート
module.exports = {
  Generator
};