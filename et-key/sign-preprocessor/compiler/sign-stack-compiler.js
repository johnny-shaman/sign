// Sign言語スタックマシンコンパイラ - Phase 2-1修正版
// FunctionApplication実装 + アセンブリコメント修正

class SignStackCompiler {
  constructor() {
    // スタックマシン状態
    this.outputQueue = [];
    this.dataStack = [];
    this.maxStackDepth = 8; // X8-X15 対応
    
    // 出力コード
    this.assembly = [];
  }

  // メインコンパイル関数
  compile(jsonAst) {
    this.assembly = [];
    
    // プリアンブル生成
    this.generatePreamble();
    
    // 各文をコンパイル
    for (const stmt of jsonAst.statements) {
      if (stmt.type === 'FunctionDefinition') {
        this.compileFunction(stmt);
      }
    }
    
    // エピローグ生成
    this.generateEpilogue();
    
    return this.assembly.join('\n');
  }

  // 関数コンパイル
  compileFunction(funcDef) {
    console.log(`📝 Compiling function: ${funcDef.name}`);
    
    // 関数ラベル
    this.assembly.push(`${funcDef.name}:`);
    
    // スタック状態リセット
    this.dataStack = [];
    this.outputQueue = [];
    
    // 関数本体をコンパイル
    if (funcDef.body.type === 'LambdaExpression') {
      this.compileLambda(funcDef.body);
    } else {
      this.compileExpression(funcDef.body);
    }
    
    // スタックマシン命令を生成
    this.generateStackMachineCode();
    
    // 戻り値設定（関数終了前）
    this.generateReturnValue();
    
    // 関数終了
    this.assembly.push('    ret');
    this.assembly.push('');
  }

  // ラムダ式コンパイル
  compileLambda(lambda) {
    // パラメータ情報を記録
    const paramCount = lambda.parameters.length;
    console.log(`   λ引数: ${paramCount}個 [${lambda.parameters.join(', ')}]`);
    
    // 本体をコンパイル
    this.compileExpression(lambda.body);
  }

  // 式をコンパイル（AST直接変換）
  compileExpression(expr) {
    switch (expr.type) {
      case 'BinaryOperation':
        this.compileBinaryOperation(expr);
        break;
        
      case 'Variable':
        this.compileVariable(expr);
        break;
        
      case 'Literal':
        this.compileLiteral(expr);
        break;
        
      case 'Unit':
        this.compileUnit();
        break;
        
      case 'UnaryOperation':
        this.compileUnaryOperation(expr);
        break;
        
      case 'FunctionApplication':
        this.compileFunctionApplication(expr);
        break;
        
      case 'PointlessExpression':
        // Phase 4で実装予定
        console.log('PointlessExpression: Phase 4で実装予定');
        break;
        
      default:
        console.log(`Unknown expression type: ${expr.type}`);
    }
  }

  // 関数適用コンパイル（新規実装）
  compileFunctionApplication(expr) {
    console.log(`   📞 関数呼び出し: ${expr.function.name || 'unknown'}`);
    
    // 引数を順次コンパイル（スタックにプッシュ）
    for (const arg of expr.arguments) {
      this.compileExpression(arg);
    }
    
    // 関数呼び出し命令を追加
    this.outputQueue.push({
      type: 'CALL_FUNCTION',
      functionName: expr.function.name,
      argCount: expr.arguments.length
    });
  }

  // 二項演算コンパイル（修正版 - 複合演算対応）
  compileBinaryOperation(expr) {
    console.log(`   🔄 BinOp: ${expr.operator}`);
    
    // AST構造に従って再帰的に処理
    this.compileExpression(expr.left);   // 左辺を先に処理
    this.compileExpression(expr.right);  // 右辺を後で処理
    
    // 演算子を後置記法の順序で出力キューに追加
    this.outputQueue.push({
      type: 'OPERATOR',
      operator: expr.operator
    });
  }

  // リテラルコンパイル
  compileLiteral(expr) {
    console.log(`   📊 リテラル: ${expr.value} (${expr.literalType || 'integer'})`);
    this.outputQueue.push({
      type: 'PUSH',
      value: expr.value,
      valueType: expr.literalType || 'integer'
    });
  }

  // 変数コンパイル
  compileVariable(expr) {
    console.log(`   🔗 変数: ${expr.name}`);
    this.outputQueue.push({
      type: 'LOAD_VAR',
      name: expr.name
    });
  }

  // Unitコンパイル
  compileUnit() {
    console.log(`   ⭕ Unit値`);
    this.outputQueue.push({
      type: 'PUSH_UNIT'
    });
  }

  // 単項演算コンパイル
  compileUnaryOperation(expr) {
    this.compileExpression(expr.operand);
    this.outputQueue.push({
      type: 'UNARY_OP',
      operator: expr.operator
    });
  }

  // スタックマシン命令生成
  generateStackMachineCode() {
    // 後置記法命令列の表示
    console.log(`   🎯 後置記法: [${this.outputQueue.map(i => 
      i.type === 'OPERATOR' ? i.operator : 
      i.type === 'LOAD_VAR' ? i.name :
      i.type === 'PUSH' ? i.value : 
      i.type === 'UNARY_OP' ? `${i.operator}(unary)` :
      i.type === 'CALL_FUNCTION' ? `call(${i.functionName})` :
      i.type
    ).join(', ')}]`);
    
    // 後置記法命令列からAArch64命令生成
    for (const instr of this.outputQueue) {
      this.generateInstruction(instr);
    }
  }

  // 個別命令生成
  generateInstruction(instr) {
    switch (instr.type) {
      case 'PUSH':
        this.generatePush(instr.value);
        break;
        
      case 'PUSH_UNIT':
        this.generatePushUnit();
        break;
        
      case 'LOAD_VAR':
        this.generateLoadVar(instr.name);
        break;
        
      case 'OPERATOR':
        this.generateOperator(instr.operator);
        break;
        
      case 'UNARY_OP':
        this.generateUnaryOperator(instr.operator);
        break;
        
      case 'CALL_FUNCTION':
        this.generateFunctionCall(instr.functionName, instr.argCount);
        break;
    }
  }

  // 値プッシュ
  generatePush(value) {
    const reg = this.getNextDataReg();
    if (typeof value === 'number') {
      this.assembly.push(`# push literal ${value}`);
      this.assembly.push(`    mov ${reg}, #${value}`);
    } else if (typeof value === 'string') {
      // Phase 2以降で実装
      this.assembly.push(`# TODO: String literal "${value}"`);
    }
    this.dataStack.push(reg);
  }

  // Unit値プッシュ
  generatePushUnit() {
    this.assembly.push(`# Unit値をプッシュ (xzr使用)`);
    this.dataStack.push('xzr'); // ARM64のゼロレジスタ
  }

  // 変数ロード（関数参照対応版）
  generateLoadVar(varName) {
    const reg = this.getNextDataReg();
    
    // _0, _1, _2, _3 は引数レジスタ
    if (varName.startsWith('_')) {
      const paramIndex = parseInt(varName.substring(1));
      if (paramIndex < 4) {
        this.assembly.push(`# load parameter ${varName}`);
        this.assembly.push(`    mov ${reg}, x${paramIndex}`);
      } else {
        this.assembly.push(`# TODO: スタックからロード ${varName}`);
      }
    } else {
      // 通常の変数名（関数名）→ 関数呼び出しとして処理
      this.assembly.push(`# 関数参照: ${varName} (引数なし関数呼び出し)`);
      this.assembly.push(`    bl ${varName}`);
      this.assembly.push(`# store function result`);
      this.assembly.push(`    mov ${reg}, x0`);
    }
    this.dataStack.push(reg);
  }

  // 関数呼び出し生成（引数順序修正版）
  generateFunctionCall(functionName, argCount) {
    this.assembly.push(`# 関数呼び出し: ${functionName} (引数${argCount}個)`);
    
    // 引数をスタックから取り出し（後入れ先出しなので逆順）
    const args = [];
    for (let i = 0; i < Math.min(argCount, 4); i++) {
      if (this.dataStack.length > 0) {
        args.push(this.dataStack.pop());
      }
    }
    
    // 引数順序を正しく修正（reverse）
    args.reverse();
    
    // 引数をx0, x1, x2, x3に正しい順序で移動
    for (let i = 0; i < args.length; i++) {
      const argReg = args[i];
      if (argReg !== `x${i}`) {
        this.assembly.push(`# argument ${i}: ${argReg} -> x${i}`);
        this.assembly.push(`    mov x${i}, ${argReg}`);
      } else {
        this.assembly.push(`# argument ${i}: already in x${i}`);
      }
    }
    
    // 4個以上の引数は後で対応
    if (argCount > 4) {
      this.assembly.push(`# TODO: 4個以上の引数対応`);
    }
    
    // 関数呼び出し
    this.assembly.push(`# call function`);
    this.assembly.push(`    bl ${functionName}`);
    
    // 戻り値はx0に入る（これをデータスタックに保存）
    const resultReg = this.getNextDataReg();
    this.assembly.push(`# store return value`);
    this.assembly.push(`    mov ${resultReg}, x0`);
    this.dataStack.push(resultReg);
  }

  // 演算子生成（修正版 - レジスタ効率化）
  generateOperator(operator) {
    if (this.dataStack.length < 2) {
      throw new Error(`演算子 ${operator} には2つの値が必要です (現在のスタック: ${this.dataStack.length})`);
    }
    
    const right = this.dataStack.pop(); // 右オペランド
    const left = this.dataStack.pop();  // 左オペランド
    
    // 結果は左オペランドのレジスタに格納（レジスタ効率化）
    switch (operator) {
      case 'add':
        this.assembly.push(`# ${left} + ${right}`);
        this.assembly.push(`    add ${left}, ${left}, ${right}`);
        break;
      case 'sub':
        this.assembly.push(`# ${left} - ${right}`);
        this.assembly.push(`    sub ${left}, ${left}, ${right}`);
        break;
      case 'mul':
        this.assembly.push(`# ${left} * ${right}`);
        this.assembly.push(`    mul ${left}, ${left}, ${right}`);
        break;
      case 'div':
        // Sign言語の安全除算（ゼロ除算対策）
        this.assembly.push(`# Check for division by zero`);
        this.assembly.push(`    cmp ${right}, #0`);
        this.assembly.push(`# Use minimum value if zero`);
        this.assembly.push(`    csel ${right}, x29, ${right}, eq`);
        this.assembly.push(`# ${left} / ${right} (safe)`);
        this.assembly.push(`    sdiv ${left}, ${left}, ${right}`);
        break;
      case 'mod':
        this.assembly.push(`# Check for modulo by zero`);
        this.assembly.push(`    cmp ${right}, #0`);
        this.assembly.push(`# Use minimum value if zero`);
        this.assembly.push(`    csel ${right}, x29, ${right}, eq`);
        this.assembly.push(`# temp = left / right`);
        this.assembly.push(`    sdiv x16, ${left}, ${right}`);
        this.assembly.push(`# temp = temp * right`);
        this.assembly.push(`    mul x16, x16, ${right}`);
        this.assembly.push(`# left = left - temp`);
        this.assembly.push(`    sub ${left}, ${left}, x16`);
        break;
      default:
        this.assembly.push(`# TODO: 演算子 ${operator}`);
        break;
    }
    
    // 結果は左レジスタに残る
    this.dataStack.push(left);
  }

  // 単項演算子生成
  generateUnaryOperator(operator) {
    if (this.dataStack.length < 1) {
      throw new Error(`単項演算子 ${operator} には1つの値が必要です`);
    }
    
    const operand = this.dataStack.pop();
    
    switch (operator) {
      case 'unary_minus':
        this.assembly.push(`# -${operand}`);
        this.assembly.push(`    neg ${operand}, ${operand}`);
        break;
      case 'unary_plus':
        // 単項プラスは何もしない
        this.assembly.push(`# unary plus: no operation needed`);
        break;
      case 'not':
        this.assembly.push(`# !${operand}`);
        this.assembly.push(`    mvn ${operand}, ${operand}`);
        break;
      case 'factorial':
        this.assembly.push(`# TODO: 階乗 ${operand}`);
        break;
      default:
        this.assembly.push(`# TODO: 単項演算子 ${operator}`);
        break;
    }
    
    this.dataStack.push(operand);
  }

  // 戻り値設定（新規実装）
  generateReturnValue() {
    if (this.dataStack.length > 0) {
      const returnValueReg = this.dataStack[this.dataStack.length - 1];
      
      // 戻り値がx0以外の場合は移動
      if (returnValueReg !== 'x0') {
        this.assembly.push(`# set return value`);
        this.assembly.push(`    mov x0, ${returnValueReg}`);
      } else {
        this.assembly.push(`# return value already in x0`);
      }
    } else {
      // データスタックが空の場合はUnit値を返す
      this.assembly.push(`# no return value, default to Unit`);
      this.assembly.push(`    mov x0, xzr`);
    }
  }

  // 次のデータレジスタ取得
  getNextDataReg() {
    const depth = this.dataStack.length;
    if (depth >= this.maxStackDepth) {
      throw new Error(`データスタックオーバーフロー (最大: ${this.maxStackDepth}, 現在: ${depth})`);
    }
    return `x${8 + depth}`; // x8-x15
  }

  // プリアンブル生成
  generatePreamble() {
    this.assembly.push('# Sign Language Compiler - Generated AArch64 Assembly');
    this.assembly.push('# Phase 2-1: Unit値処理 + FunctionApplication実装');
    this.assembly.push('.text');
    this.assembly.push('.global _start');
    this.assembly.push('');
  }

  // エピローグ生成
  generateEpilogue() {
    this.assembly.push('_start:');
    this.assembly.push('# Main entry point');
    this.assembly.push('    mov x8, #93');
    this.assembly.push('# exit syscall');
    this.assembly.push('    mov x0, #0');
    this.assembly.push('# exit status');
    this.assembly.push('    svc #0');
    this.assembly.push('# system call');
  }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SignStackCompiler;
}