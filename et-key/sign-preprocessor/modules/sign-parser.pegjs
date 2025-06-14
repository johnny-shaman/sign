// Sign言語軽量PEG.js構文解析仕様（軽量化Ver）
// プリプロセス済みコード専用パーサー
// 
// 設計方針:
// - 6段階優先順位による高速化（16段階→6段階）
// - 連鎖比較の特化最適化
// - プリプロセス後の位置ベース引数(_0, _1)に最適化
// - インデントブロック構文サポート
// - Export定義機能の完全対応
// - @演算子の文脈分離による曖昧性解決

Start = program:Program { return program; }

// ==================== プログラム構造 ====================

Program = statements:(Statement _?)* { 
    return { 
        type: "Program", 
        statements: statements.map(s => s[0]).filter(s => s !== null)
    }; 
}

Statement = 
      ExportDefinition
    / Definition 
    / OutputStatement
    / Lambda
    / Comment
    / EmptyLine

Comment = "`" [^\n\r]* { return null; }
EmptyLine = _ EOL { return null; }

// Output文（トップレベル実行）
OutputStatement = 
    address:(HexNumber / Identifier) _ OutputSymbol _ value:Logical {
        return { 
            type: "OutputStatement", 
            address: address, 
            value: value 
        };
    }

// ==================== 7階優先順位（高速化済み） ====================

// 0. Export定義（#identifier : value 構文）
ExportDefinition = 
    "#" identifier:Identifier _ ":" _ value:Lambda {
        return { 
            type: "ExportDefinition", 
            name: identifier.name, 
            body: value,
            exported: true
        };
    }

// 1. 定義（最低優先度）
Definition = 
    identifier:Identifier _ ":" _ value:Lambda {
        return { 
            type: "FunctionDefinition", 
            name: identifier.name, 
            body: value 
        };
    }

// 2. ラムダ式（インデントブロック対応）
Lambda = 
    params:ParameterList _ "?" _ body:IndentedBody {
        return { 
            type: "LambdaExpression", 
            parameters: params.map(p => p.name), 
            body: body 
        };
    }
    / Logical

// インデントブロック対応（プリプロセス後の短絡評価チェーン用）
IndentedBody = 
    EOL TAB+ body:Logical { return body; }  // インデント後の本体
    / body:Logical { return body; }         // 同一行の本体

ParameterList = 
    first:Parameter rest:(_ p:Parameter { return p; })* {
        return [first, ...rest];
    }

Parameter = 
    "~" name:PositionalId { return { type: "Parameter", name: name, continuous: true }; }
    / name:PositionalId { return { type: "Parameter", name: name, continuous: false }; }

// 位置ベース引数（プリプロセス後）と通常の識別子をサポート
PositionalId = 
    $("_" [0-9]+) { return text(); }  // _0, _1, _2 など
    / RegularId

RegularId = $([A-Za-z_] [0-9A-Za-z_]*) { return text(); }

// 3. 論理演算（短絡評価チェーン）
Logical = 
    left:ComparisonChain rest:(_ op:LogicalOp _ right:ComparisonChain { return {op, right}; })* {
        return rest.reduce((acc, item) => ({
            type: "BinaryOperation", 
            operator: item.op, 
            left: acc, 
            right: item.right
        }), left);
    }

LogicalOp = 
    "|" { return "or"; }
    / "&" { return "and"; }

// 4. 連鎖比較（Sign言語特有・最適化済み）
// 3 < x = y < 20 のような連鎖比較を効率的に処理
ComparisonChain = 
    first:Arithmetic rest:ComparisonPart* {
        if (rest.length === 0) return first;
        
        // 連鎖比較専用のAST構造を生成
        const comparisons = [];
        let current = first;
        
        for (let i = 0; i < rest.length; i++) {
            comparisons.push({
                type: "Comparison",
                operator: rest[i].operator,
                left: current,
                right: rest[i].operand
            });
            current = rest[i].operand;
        }
        
        return {
            type: "ComparisonChain",
            comparisons: comparisons,
            finalValue: current,         // true時に返す最終値
            failValue: { type: "Unit" }  // false時に返すUnit値
        };
    }

ComparisonPart = _ op:ComparisonOp _ operand:Arithmetic {
    return { operator: op, operand: operand };
}

ComparisonOp = 
    "<=" { return "less_equal"; }
    / ">=" { return "more_equal"; }
    / "!=" { return "not_equal"; }
    / "<" { return "less"; }
    / ">" { return "more"; }
    / "=" { return "equal"; }

// 5. 算術演算・積・アクセス
Arithmetic = 
    left:OutputOperation rest:(_ op:ArithmeticOp _ right:OutputOperation { return {op, right}; })* {
        return rest.reduce((acc, item) => ({
            type: "BinaryOperation", 
            operator: item.op, 
            left: acc, 
            right: item.right
        }), left);
    }

OutputOperation = 
    address:(HexNumber / Identifier) _ OutputSymbol _ value:Primary {
        return { 
            type: "OutputOperation", 
            address: address, 
            value: value 
        };
    }
    / Primary

// 6. 一次式・関数適用（最高優先度） 
Primary = 
    left:PrimaryExpression rest:(_ op:ArithmeticOp _ right:PrimaryExpression { return {op, right}; })* {
         return rest.reduce((acc, item) => ({
            type: "BinaryOperation", 
            operator: item.op, 
            left: acc, 
            right: item.right
        }), left);
    }

PrimaryExpression = 
      FunctionApplication  // 関数適用を最優先（@演算子の曖昧性解決）
    / UnaryExpression      // 単項演算子（前置・後置）
    / Atom               // 基本要素

ArithmeticOp = 
    "+" { return "add"; }
    / "-" { return "sub"; }
    / "*" { return "mul"; }
    / "/" { return "div"; }
    / "^" { return "pow"; }
    / "%" { return "mod"; }
    / "," { return "product"; }  // 積演算子（リスト構築）
    / "@" { return "get"; }      // get演算子（構造アクセス）

// OutputSymbolの定義確認（既存）
OutputSymbol = "#"

// 関数適用（関数部分と引数部分の両方で単項演算子を受け入れ）
FunctionApplication = 
    func:(UnaryExpression / Atom) args:(_ arg:(UnaryExpression / Atom) { return arg; })+ {
        return { type: "FunctionApplication", function: func, arguments: args };
    }

// 単項演算子（前置・後置対応）
UnaryExpression = 
    // 前置演算子
    "-" &([0-9] / Identifier) operand:Atom {  // 単項マイナス
        return { type: "UnaryOperation", operator: "unary_minus", operand: operand };
    }
    / "+" &([0-9] / Identifier) operand:Atom {  // 単項プラス
        return { type: "UnaryOperation", operator: "unary_plus", operand: operand };
    }
    / "@" &([0-9A-Fa-fx] / Identifier) &(!(" ")) operand:Atom {  // input前置演算子（空白なし）
        return { type: "UnaryOperation", operator: "input", operand: operand };
    }
    / "!" &(Atom) operand:Atom {  // not演算子
        return { type: "UnaryOperation", operator: "not", operand: operand };
    }
    / "~" &(Atom) operand:Atom {  // expand前置演算子
        return { type: "UnaryOperation", operator: "expand", operand: operand };
    }
    / "$" &(Identifier) operand:Atom {  // address演算子
        return { type: "UnaryOperation", operator: "address", operand: operand };
    }
    // 後置演算子
    / operand:Atom "~" &(!([0-9A-Za-z_])) {  // expand後置演算子
        return { type: "UnaryOperation", operator: "expand", operand: operand };
    }
    / operand:Atom "@" &(!([0-9A-Za-z_])) {  // import後置演算子
        return { type: "UnaryOperation", operator: "import", operand: operand };
    }
    / operand:Atom "!" &(!([ 0-9A-Za-z_])) {  // factorial後置演算子
        return { type: "UnaryOperation", operator: "factorial", operand: operand };
    }

Atom = 
    PointlessExpression
    / Block
    / Literal
    / Identifier

// ==================== ポイントレス記法 ====================

PointlessExpression = 
    "[" _ content:PointlessContent _ "]" {
        return { type: "PointlessExpression", content: content };
    }

PointlessContent = 
    // Map記法: [* 2,] のような演算子適用 
    op:OperatorSymbol _ operand:Literal _ "," {
        return { type: "MapOperation", operator: op, operand: operand };
    }
    // 部分適用: [+ 2] または [2 +]
    / op:OperatorSymbol _ operand:Literal {
        return { type: "PartialApplication", operator: op, right: operand };
    }
    / operand:Literal _ op:OperatorSymbol {
        return { type: "PartialApplication", operator: op, left: operand };
    }
    // 演算子の関数化: [+]
    / op:OperatorSymbol {
        return { type: "OperatorFunction", operator: op };
    }
    // 通常の式
    / Lambda

OperatorSymbol = 
    "+" / "-" / "*" / "/" / "^" / "%" / "<" / ">" / "=" / "&" / "|" / "," / "@"

// ==================== ブロックとリテラル ====================

Block = 
    "(" _ expr:Lambda _ ")" { return expr; }
    / "{" _ expr:Lambda _ "}" { return expr; }

Literal = Number / String / Character / Unit

// Unit値（空リスト・恒等射・単位元を表現）
Unit = "_" !([0-9A-Za-z_]) { return { type: "Unit" }; }

Number = HexNumber / Float / Integer

Integer = 
    sign:"-"? digits:$([0-9]+) {
        return { type: "Literal", value: parseInt((sign || "") + digits), literalType: "integer" }; 
    }

Float = 
    sign:"-"? intPart:$([0-9]+) "." fracPart:$([0-9]+) {
        const raw = (sign || "") + intPart + "." + fracPart;
        return { type: "Literal", value: parseFloat(raw), literalType: "float" }; 
    }

// 16進数リテラル（ハードウェア操作用）
HexNumber = 
    "0x" digits:$([0-9A-Fa-f]+) {
        return { type: "Literal", value: parseInt(digits, 16), literalType: "hex" };
    }

String = 
    "`" content:[^`\n\r]* "`" { 
        return { type: "Literal", value: content.join(""), literalType: "string" }; 
    }

Character = 
    "\\" char:. { 
        return { type: "Literal", value: char, literalType: "character" }; 
    }

Identifier = 
    name:RegularId { return { type: "Variable", name: name }; }

// ==================== 空白・制御 ====================

TAB = "\t"
// 改行+インデントも空白として扱う（インデントブロック対応）
_ = ([ \t] / (EOL TAB+))*
EOL = "\n" / "\r\n" / "\r"
EOF = !.

/*
 * Sign言語軽量パーサー 軽量化Ver
 * 
 * 主な最適化:
 * 1. 6段階優先順位による大幅な処理速度向上（16段階→6段階）
 * 2. Sign言語特有の連鎖比較の効率的処理
 * 3. プリプロセス後の位置ベース引数に最適化
 * 4. インデントブロック構文のサポート
 * 5. 後置演算子の正しい処理順序
 * 6. Export定義機能の完全対応
 * 7. @演算子の文脈分離による曖昧性解決
 * 8. コンパイラ向けに特化したAST構造
 * 
 * 対応する機能:
 * - Export定義（#identifier : value）
 * - 関数定義（位置ベース引数）
 * - ラムダ式（インデントブロック対応）
 * - 連鎖比較（3 < x = y < 20）
 * - 短絡評価チェーン（condition & result | ...）
 * - ポイントレス記法（[+], [+ 2], [* 2,]）
 * - 前置・後置単項演算子
 * - 16進数リテラル（ハードウェア操作用）
 * - Unit値（空リスト・恒等射・単位元）
 * 
 */