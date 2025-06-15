// Sign言語スタックマシンコンパイラ
// ▼実装済み
// 四則演算（+ - * /）
// 比較演算（= <= >= !=）
// 文字列
// 中置#演算子（標準出力のため、0x1 # output の形式は動確済み）
// 関数複数回呼び出し対応

// 演算モジュールのインポート
const StringOperations = require('./operations/string-operations');

class SignStackCompiler {
    constructor() {
        // スタックマシン状態
        this.outputQueue = [];
        this.dataStack = [];
        this.operandInfo = [];  // オペランドの種類情報（変数 or リテラル）
        this.stringTable = [];  // 文字列テーブル
        this.maxStackDepth = 8; // X8-X15 対応

        // 出力コード
        this.assembly = [];

        // 演算モジュール
        this.stringOps = new StringOperations(this);
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

        // メインエントリポイント生成
        this.generateMainEntry(jsonAst);

        // エピローグ生成
        this.generateEpilogue();

        return this.assembly.join('\n');
    }

    // Output文コンパイル（トップレベル実行）
    compileOutputStatement(stmt) {
        console.log(`📤 Compiling OutputStatement: ${stmt.address.value} # ${stmt.value.value}`);

        // プリアンブルの後に即座実行コードを挿入
        this.assembly.push('');
        this.assembly.push('# Immediate execution - OutputStatement');

        // スタック状態リセット
        this.dataStack = [];
        this.outputQueue = [];

        // Output操作をコンパイル
        this.compileOutputOperation({ address: stmt.address, value: stmt.value });

        // スタックマシン命令を生成
        this.generateStackMachineCode();
        this.assembly.push('');
    }

    // トップレベル文のコンパイル（新規追加）
    compileTopLevelStatement(stmt) {
        if (stmt.type === 'FunctionApplication') {
            this.assembly.push('# Top-level function application');
            this.compileStandaloneFunctionApplication(stmt);
        } else if (stmt.type === 'OutputStatement') {
            this.compileOutputStatement(stmt);
        } else {
            console.log(`Unknown top-level statement: ${stmt.type}`);
        }
    }

    // スタンドアロン関数適用（スタック状態を独立管理）
    compileStandaloneFunctionApplication(stmt) {
        // スタック状態を完全にリセット
        this.dataStack = [];
        this.outputQueue = [];
        this.operandInfo = [];
        
        // 関数適用をコンパイル
        this.compileFunctionApplication(stmt);
        this.generateStackMachineCode();
    }

    // 関数コンパイル
    compileFunction(funcDef) {
        console.log(`📝 Compiling function: ${funcDef.name}`);

        // 関数ラベル
        this.assembly.push(`${funcDef.name}:`);

        // 関数専用のスタック状態リセット 
        this.dataStack = [];
        this.outputQueue = [];
        this.operandInfo = [];

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

            case 'ComparisonChain':
                this.generateComparisonChain(expr);
                break;

            case 'UnaryOperation':
                this.compileUnaryOperation(expr);
                break;

            case 'FunctionApplication':
                this.compileFunctionApplication(expr);
                break;

            case 'OutputOperation':
                this.compileOutputOperation(expr);
                break;

            case 'PointlessExpression':
                // Phase 4で実装予定
                console.log('PointlessExpression: Phase 4で実装予定');
                break;

            default:
                console.log(`Unknown expression type: ${expr.type}`);
        }
    }

    // Output操作コンパイル
    compileOutputOperation(expr) {
        console.log(`   📤 Output操作: ${expr.address.value || expr.address.name} # ${expr.value.value || expr.value.name}`);

        // アドレスをコンパイル
        this.compileExpression(expr.address);
        // 値をコンパイル  
        this.compileExpression(expr.value);

        // Output命令を追加
        this.outputQueue.push({ type: 'OUTPUT' });
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
        console.log(`🔧 Generating: ${instr.type} ${instr.operator || instr.value || ''}`);
        switch (instr.type) {
            case 'PUSH':
                this.generatePush(instr.value, 'literal', instr.valueType);
                break;

            case 'PUSH_UNIT':
                this.generatePushUnit('unit');
                break;

            case 'LOAD_VAR':
                this.generateLoadVar(instr.name, 'variable');
                break;

            case 'OPERATOR':
                this.generateOperator(instr.operator);
                break;

            case 'COMPARISON':
                this.generateComparison(instr.operator);
                break;

            case 'UNARY_OP':
                this.generateUnaryOperator(instr.operator);
                break;

            case 'CALL_FUNCTION':
                this.generateFunctionCall(instr.functionName, instr.argCount);
                break;

            case 'OUTPUT':
                this.generateOutput();
                break;
        }
    }

    // 値プッシュ
    generatePush(value, type = 'literal', valueType = 'integer') {
        const reg = this.getNextDataReg();
        if (typeof value === 'number') {
            this.assembly.push(`# push literal ${value}`);
            this.assembly.push(`    mov ${reg}, #${value}`);
        } else if (typeof value === 'string') {
            const stringIndex = this.addToStringTable(value);
            this.assembly.push(`# push string literal "${value}"`);
            this.assembly.push(`    adr ${reg}, string_${stringIndex}`);
        }
        this.dataStack.push(reg);
        this.operandInfo.push({
            type: type,
            value: value,
            valueType: valueType
        });
    }

    // Unit値プッシュ
    generatePushUnit(type = 'unit') {
        this.assembly.push(`# Unit値をプッシュ (xzr使用)`);
        this.dataStack.push('xzr'); // ARM64のゼロレジスタ
        this.operandInfo.push({ type: type, value: null });
    }

    // 変数ロード（関数参照対応版）
    generateLoadVar(varName, type = 'variable') {
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

            // データスタックのx8を一時保存（Output用のファイルディスクリプタ保護）
            this.assembly.push(`    mov x16, x8               // 一時保存`);

            this.assembly.push(`    bl ${varName}`);
            this.assembly.push(`# store function result`);
            this.assembly.push(`    mov ${reg}, x0`);

            this.assembly.push(`    mov x8, x16               // ファイルディスクリプタ復元`);
        }
        this.dataStack.push(reg);
        this.operandInfo.push({ type: type, value: varName });
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

    // Output操作生成（新規実装）
    generateOutput() {
        if (this.dataStack.length < 2) {
            throw new Error(`Output操作には2つの値が必要です (address, value) (現在のスタック: ${this.dataStack.length})`);
        }

        const valueReg = this.dataStack.pop();   // 出力する値
        const addressReg = this.dataStack.pop(); // ファイルディスクリプタ
        const valueInfo = this.operandInfo.pop(); // 値の型情報
        const addressInfo = this.operandInfo.pop(); // アドレス情報

        this.assembly.push(`// output operation: ${addressReg} # ${valueReg}`);

        // 文字列の場合
        if (valueInfo && valueInfo.type === 'literal' && typeof valueInfo.value === 'string') {
            this.assembly.push(`// string output: "${valueInfo.value}"`);
            this.assembly.push(`    mov x0, ${addressReg}         // file descriptor`);
            this.assembly.push(`    mov x1, ${valueReg}           // string address`);

            this.assembly.push(`    mov x2, #${valueInfo.value.length} // string length`);
        } else if (valueInfo && valueInfo.type === 'variable') {
            // 変数の場合（関数の引数など）- 文字列として扱う
            this.assembly.push(`// variable output (assume string): ${valueInfo.value}`);
            const labelId = this.getLabelId();
            this.assembly.push(`    mov x0, ${addressReg}         // file descriptor`);
            this.assembly.push(`    mov x1, ${valueReg}           // string address`);
            // 動的な文字列長計算
            this.assembly.push(`    mov x2, #0                    // length counter`);
            this.assembly.push(`strlen_loop_${labelId}:`);
            this.assembly.push(`    ldrb w3, [x1, x2]            // load byte`);
            this.assembly.push(`    cmp w3, #0                    // check null terminator`);
            this.assembly.push(`    beq strlen_done_${labelId}    // if null, done`);
            this.assembly.push(`    add x2, x2, #1                // increment counter`);
            this.assembly.push(`    b strlen_loop_${labelId}      // continue`);
            this.assembly.push(`strlen_done_${labelId}:`);
        } else {
            // 数値の場合（現在は未実装、エラー回避）
            this.assembly.push(`    mov x0, ${addressReg}         // file descriptor`);
            this.assembly.push(`    mov x1, ${valueReg}           // numeric value (TODO)`);
            this.assembly.push(`    mov x2, #1                    // assume 1 byte`);
        }

        // write システムコール
        this.assembly.push(`    mov x8, #64                   // write syscall`);
        this.assembly.push(`    svc #0                        // system call`);

        // Sign言語仕様準拠の戻り値処理
        const resultReg = this.getNextDataReg();
        this.assembly.push(`    csel ${resultReg}, x0, xzr, ge // success: bytes written, fail: Unit`);
        this.dataStack.push(resultReg);
        this.operandInfo.push({ type: 'computed', value: 'output_result' });
    }

    // 演算子生成（修正版 - レジスタ効率化）
    generateOperator(operator) {
        // 論理演算子は別メソッドで処理
        if (operator === 'and' || operator === 'or') {
            return this.generateLogicalOperator(operator);
        }
        // 比較演算子は別メソッドで処理
        if (this.isComparisonOperator(operator)) {
            return this.generateComparison(operator);
        }

        // スタック状態とオペランド情報の取得
        if (this.dataStack.length < 2) {
            throw new Error(`演算子 ${operator} には2つの値が必要です (現在のスタック: ${this.dataStack.length})`);
        }

        if (this.operandInfo.length < 2) {
            throw new Error(`オペランド情報が不足しています (現在: ${this.operandInfo.length})`);
        }

        // 先にオペランド情報を取得（スタック操作前）
        const rightInfo = this.operandInfo.pop();
        const leftInfo = this.operandInfo.pop();

        const right = this.dataStack.pop(); // 右オペランド
        const left = this.dataStack.pop();  // 左オペランド


        // 文字列演算の判定
        if (this.stringOps.isStringOperation(leftInfo, rightInfo)) {
            return this.stringOps.generateStringOperation(operator, left, right, leftInfo, rightInfo);
        }

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

    // 論理演算子生成（Sign言語の短絡評価）
    generateLogicalOperator(operator) {
        if (this.dataStack.length < 2) {
            throw new Error(`論理演算子 ${operator} には2つの値が必要です (現在のスタック: ${this.dataStack.length})`);
        }

        const right = this.dataStack.pop(); // 右オペランド
        const left = this.dataStack.pop();  // 左オペランド
        const rightInfo = this.operandInfo.pop();
        const leftInfo = this.operandInfo.pop();

        switch (operator) {
            case 'and':
                // Sign言語のand: 左≠Unit なら右を返す、左==Unit なら左(Unit)を返す
                this.assembly.push(`# ${left} & ${right} (Sign短絡評価and)`);
                this.assembly.push(`    cmp ${left}, xzr`);
                this.assembly.push(`    csel ${left}, ${right}, ${left}, ne`);
                this.assembly.push(`# result: ${left}!=Unit ? ${right} : ${left}`);
                break;

            case 'or':
                // Sign言語のor: 左≠Unit なら左を返す（短絡）、左==Unit なら右を返す
                this.assembly.push(`# ${left} | ${right} (Sign短絡評価or)`);
                this.assembly.push(`    cmp ${left}, xzr`);
                this.assembly.push(`    csel ${left}, ${left}, ${right}, ne`);
                this.assembly.push(`# result: ${left}!=Unit ? ${left} : ${right}`);
                break;

            default:
                this.assembly.push(`# TODO: 論理演算子 ${operator}`);
                break;
        }

        // 結果は左レジスタに格納
        this.dataStack.push(left);
        this.operandInfo.push({ type: 'computed', value: `${operator}_result` });
    }

    // 比較演算子判定
    isComparisonOperator(operator) {
        return ['less', 'less_equal', 'equal', 'more_equal', 'more', 'not_equal'].includes(operator);
    }

    // 比較演算子生成（Sign言語特有の値返却仕様）
    generateComparison(operator) {
        if (this.dataStack.length < 2) {
            throw new Error(`比較演算子 ${operator} には2つの値が必要です (現在のスタック: ${this.dataStack.length})`);
        }

        const right = this.dataStack.pop(); // 右オペランド
        const left = this.dataStack.pop();  // 左オペランド
        const rightInfo = this.operandInfo.pop();
        const leftInfo = this.operandInfo.pop();

        // 文字列比較の場合は別処理
        if (operator === 'equal' || operator === 'not_equal') {
            return this.generateStringComparison(operator, left, right, leftInfo, rightInfo);
        }

        // 数値比較の処理（既存のコード）
        this.generateNumericComparison(operator, left, right, leftInfo, rightInfo);
    }

    // 文字列比較生成（内容比較）
    generateStringComparison(operator, left, right, leftInfo, rightInfo) {
        // 変数を判定（値として意味のある方を返す）
        const variableReg = this.determineVariableOperand(left, right, leftInfo, rightInfo);

        this.assembly.push(`# ${left} ${operator} ${right} (文字列比較)`);

        // 簡易文字列比較（同じアドレスかチェック）
        // 本格実装では strcmp 相当が必要
        this.assembly.push(`    cmp ${left}, ${right}`);

        if (operator === 'equal') {
            this.assembly.push(`    csel ${left}, ${variableReg}, xzr, eq`);
            this.assembly.push(`# result: equal ? ${variableReg} : Unit`);
        } else { // not_equal
            this.assembly.push(`    csel ${left}, ${variableReg}, xzr, ne`);
            this.assembly.push(`# result: not_equal ? ${variableReg} : Unit`);
        }

        this.dataStack.push(left);
        this.operandInfo.push({ type: 'variable', value: 'comparison_result' });
    }

    // 数値比較生成
    generateNumericComparison(operator, left, right, leftInfo, rightInfo) {
        // 変数を判定（値として意味のある方を返す）
        const variableReg = this.determineVariableOperand(left, right, leftInfo, rightInfo);

        // ARM64条件コードのマッピング
        const conditionMap = {
            'less': 'lt',         // less than (signed)
            'less_equal': 'le',   // less than or equal (signed)
            'more_equal': 'ge',   // greater than or equal (signed)
            'more': 'gt',         // greater than (signed)
        };

        const condition = conditionMap[operator];
        if (!condition) {
            throw new Error(`未対応の比較演算子: ${operator}`);
        }

        // Sign言語の比較演算仕様:
        // - true時: 変数オペランド（値として意味のある方）を返す
        // - false時: Unit(_) = xzr を返す

        this.assembly.push(`# ${left} ${operator} ${right} (Sign比較演算)`);
        this.assembly.push(`    cmp ${left}, ${right}`);

        // 条件付き選択: 条件が真なら変数オペランド、偽ならUnit(xzr)
        this.assembly.push(`    csel ${left}, ${variableReg}, xzr, ${condition}`);

        // デバッグ用コメント
        this.assembly.push(`# result: ${condition} ? ${variableReg} : Unit`);

        // 結果は左レジスタに格納
        this.dataStack.push(left);
        this.operandInfo.push({ type: 'variable', value: 'comparison_result' });
    }

    // 変数オペランドを判定（Sign言語仕様：値として意味のある方を返す）
    determineVariableOperand(left, right, leftInfo, rightInfo) {
        console.log(`🔍 Variable detection: left(${leftInfo.type}:${leftInfo.value}) vs right(${rightInfo.type}:${rightInfo.value})`);

        // 左が変数で右がリテラル → 左の変数を返す
        if (leftInfo.type === 'variable' && rightInfo.type === 'literal') {
            console.log(`   → 左の変数 ${left} を選択`);
            return left;
        }

        // 左がリテラルで右が変数 → 右の変数を返す  
        if (leftInfo.type === 'literal' && rightInfo.type === 'variable') {
            console.log(`   → 右の変数 ${right} を選択`);
            return right;
        }

        // 両方変数 → 左を優先（デフォルト）
        if (leftInfo.type === 'variable' && rightInfo.type === 'variable') {
            console.log(`   → 両方変数：左 ${left} を優先選択`);
            return left;
        }

        // 両方リテラル → 左を優先（デフォルト）
        console.log(`   → デフォルト：左 ${left} を選択`);
        return left;
    }

    // 比較演算チェーンの生成（ComparisonChain AST用）
    generateComparisonChain(chainNode) {
        console.log(`   🔗 比較チェーン: ${chainNode.comparisons.length}個の比較`);

        // 最初の値をスタックに配置
        this.compileExpression(chainNode.comparisons[0].left);

        // 各比較を順次実行
        for (const comparison of chainNode.comparisons) {
            // 右オペランドをコンパイル
            this.compileExpression(comparison.right);

            // 比較演算を実行
            this.outputQueue.push({
                type: 'COMPARISON',
                operator: comparison.operator
            });
        }

        // ComparisonChainの結果は最後の比較結果
        // Sign言語仕様: true時は最終値、false時はUnit
        this.assembly.push(`# ComparisonChain complete`);
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

    // ユニークラベルID生成（新規追加）
    getLabelId() {
        if (!this.labelCounter) {
            this.labelCounter = 0;
        }
        return this.labelCounter++;
    }

    // 文字列テーブルに追加
    addToStringTable(str) {
        const existingIndex = this.stringTable.indexOf(str);
        if (existingIndex !== -1) {
            return existingIndex;  // 既存の文字列は再利用
        }
        this.stringTable.push(str);
        return this.stringTable.length - 1;
    }

    // プリアンブル生成
    generatePreamble() {
        this.assembly.push('# Sign Language Compiler - Generated AArch64 Assembly');
        this.assembly.push('# Phase 2-1: Unit値処理 + FunctionApplication実装');
        this.assembly.push('.text');
        this.assembly.push('.global _start');
        this.assembly.push('');
    }

    // メインエントリポイント生成（修正版）
    generateMainEntry(jsonAst) {
        this.assembly.push('_start:');
        this.assembly.push('# Main entry point');

        // トップレベル文の実行
        for (const stmt of jsonAst.statements) {
            if (stmt.type !== 'FunctionDefinition') {
                this.compileTopLevelStatement(stmt);
            }
        }

        // 正常終了
        this.assembly.push('    mov x8, #93               // exit syscall');
        this.assembly.push('    mov x0, #0                // exit status');
        this.assembly.push('    svc #0                    // system call');
    }

    // エピローグ生成
    generateEpilogue() {
        // 文字列テーブルの生成
        if (this.stringTable.length > 0) {
            this.assembly.push('');
            this.assembly.push('.data');
            this.assembly.push('# String table');
            this.stringTable.forEach((str, index) => {
                this.assembly.push(`string_${index}:`);
                this.assembly.push(`    .asciz "${str}"`);
            });
            this.assembly.push('');
        }
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignStackCompiler;
}