// 完全なSign言語PEG.js構文解析仕様
// 演算子記号表の優先順位1-16を完全実装
// ポイントレス記法と余積表現の4つの意味を実装

Start = program:Program { return program; }

// ==================== プログラム構造 ====================

Program = statements:(Statement _?)* { 
    return { 
        type: "Program", 
        statements: statements.map(s => s[0]).filter(s => s !== null)
    }; 
}

Statement = 
    ExportLevel 
    / Comment
    / _ EOL { return null; }  // 空行も許可

Comment = _ "`" content:[^\n\r`]* "`"? {
    return { type: "Comment", content: content.join("") };
}

// ==================== 優先順位階層（1-16） ====================

// 優先順位1: Export（最低優先度）
ExportLevel = 
    ExportSymbol definition:DefineLevel {
        return { type: "ExportExpression", definition: definition };
    }
    / DefineLevel

// 優先順位2: Define + Output
DefineLevel = 
    identifier:Identifier __ DefineSymbol __ value:OutputLevel {
        return { type: "Definition", identifier: identifier, value: value };
    }
    / OutputLevel

OutputLevel = 
    address:(HexNumber / Identifier) __ OutputSymbol __ value:FunctionApplyLevel {
        return { type: "OutputExpression", address: address, value: value };
    }
    / FunctionApplyLevel

// 優先順位3: 構築域（Coproduct, Lambda, Product, Range）
FunctionApplyLevel = 
    left:(LambdaLevel / PointlessExpression / Unit / Identifier) rest:(__ right:ConcatListLevel { return right; })* {
        return rest.length > 0
            ? { type: "FunctionApplyExpression", left: left, right: rest }
            : left;
    }
    / ConcatListLevel

ConcatListLevel = 
    left:(ProductLevel / Number / String / Character / Unit / Identifier) rest:(__ right:ListConstructLevel { return right; })* {
        return rest.length > 0
            ? { type: "ConcatListLevel", left: left, right: rest }
            : left;
    }
    / ListConstructLevel

ListConstructLevel = 
    left:(Number / Character / Identifier) rest:(__ right:FunctionComposeLevel { return right; })* {
        return rest.length > 0
            ? { type: "ListConstructLevel", left: left, right: rest }
            : left;
    }
    / FunctionComposeLevel

FunctionComposeLevel = 
    left:(LambdaLevel / PointlessExpression / Unit / Identifier) rest:(__ right:ProductLevel { return right; })* {
        return rest.length > 0
            ? { type: "ListConstructLevel", left: left, right: rest }
            : left;
    }
    / LambdaLevel

LambdaLevel = 
    params:ParameterList __ LambdaSymbol BlockStart branches:ConditionalBranches {
        return { type: "LambdaExpression", parameters: params, body: { type: "ConditionalBlock", branches: branches } };
    }
    / params:ParameterList __ LambdaSymbol __ body:ProductLevel {
        return { type: "LambdaExpression", parameters: params, body: body };
    }
    / ProductLevel

// 条件分岐ブロックの解析
ConditionalBranches = 
    first:ConditionalBranch rest:(BlockContinue branch:ConditionalBranch { return branch; })* {
        return [first, ...rest];
    }

ConditionalBranch = 
    condition:FunctionApplyLevel __ DefineSymbol __ result:FunctionApplyLevel {
        return { type: "ConditionalBranch", condition: condition, result: result };
    }
    / defaultValue:FunctionApplyLevel {
        return { type: "DefaultBranch", result: defaultValue };
    }

ParameterList = 
    first:Parameter rest:(__ p:Parameter { return p; })* {
        return [first, ...rest];
    }

Parameter = 
    ContinuousSymbol identifier:Identifier { 
        return { type: "Parameter", name: identifier, continuous: true }; 
    }
    / identifier:Identifier { 
        return { type: "Parameter", name: identifier, continuous: false }; 
    }

ProductLevel = 
    head:RangeLevel tail:(__ ProductSymbol __ elem:RangeLevel { return elem; })* {
        return tail.length > 0 
            ? { type: "ProductExpression", elements: [head, ...tail] }
            : head;
    }

RangeLevel = 
    start:LogicalXorLevel __ RangeSymbol __ end:LogicalXorLevel {
        return { type: "RangeExpression", start: start, end: end };
    }
    / LogicalXorLevel

// 優先順位4-6: 論理域
LogicalXorLevel = 
    left:LogicalOrLevel rest:(__ XorSymbol __ right:LogicalOrLevel { return right; })* {
        return rest.reduce((acc, right) => 
            ({ type: "BinaryOperation", operator: "xor", left: acc, right: right }), left);
    }

LogicalOrLevel = 
    left:LogicalAndLevel rest:(__ OrSymbol __ right:LogicalAndLevel { return right; })* {
        return rest.reduce((acc, right) => 
            ({ type: "BinaryOperation", operator: "or", left: acc, right: right }), left);
    }

LogicalAndLevel = 
    left:LogicalNotLevel rest:(__ AndSymbol __ right:LogicalNotLevel { return right; })* {
        return rest.reduce((acc, right) => 
            ({ type: "BinaryOperation", operator: "and", left: acc, right: right }), left);
    }

LogicalNotLevel = 
    NotSymbol operand:ComparisonLevel {
        return { type: "UnaryOperation", operator: "not", operand: operand };
    }
    / ComparisonLevel

// 優先順位7: 比較演算域（連鎖比較対応）
ComparisonLevel = 
    first:AbsoluteLevel rest:ComparisonChain* {
        if (rest.length === 0) return first;
        return { 
            type: "ChainedComparison", 
            operands: [first, ...rest.map(r => r.operand)], 
            operators: rest.map(r => r.operator) 
        };
    }

ComparisonChain = __ op:ComparisonOperator __ operand:AbsoluteLevel {
    return { operator: op, operand: operand };
}

ComparisonOperator = 
    "<=" { return "less_equal"; }
    / ">=" { return "more_equal"; }
    / "!=" { return "not_equal"; }
    / "<" { return "less"; }
    / ">" { return "more"; }
    / "=" { return "equal"; }

// 優先順位8: 絶対値
AbsoluteLevel = 
    "|" _ expression:ArithmeticAddLevel _ "|" {
        return { type: "UnaryOperation", operator: "abs", operand: expression };
    }
    / ArithmeticAddLevel

// 優先順位9: 加減算
ArithmeticAddLevel = 
    left:ArithmeticMulLevel rest:(_ op:AdditiveOperator _ right:ArithmeticMulLevel 
        { return { operator: op, operand: right }; })* {
        return rest.reduce((acc, item) => 
            ({ type: "BinaryOperation", operator: item.operator, left: acc, right: item.operand }), left);
    }

AdditiveOperator = 
    "+" { return "add"; }
    / "-" { return "sub"; }

// 優先順位10: 乗除算
ArithmeticMulLevel = 
    left:PowerLevel rest:(_ op:MultiplicativeOperator _ right:PowerLevel 
        { return { operator: op, operand: right }; })* {
        return rest.reduce((acc, item) => 
            ({ type: "BinaryOperation", operator: item.operator, left: acc, right: item.operand }), left);
    }

MultiplicativeOperator = 
    "*" { return "mul"; }
    / "/" { return "div"; }
    / "%" { return "mod"; }

// 優先順位11: 冪乗（右結合）
PowerLevel = 
    base:FactorialLevel _ PowerSymbol _ exponent:PowerLevel {
        return { type: "BinaryOperation", operator: "pow", left: base, right: exponent };
    }
    / FactorialLevel

// 優先順位12: 階乗
FactorialLevel = 
    operand:ResolveLevel FactorialSymbol {
        return { type: "UnaryOperation", operator: "factorial", operand: operand };
    }
    / ResolveLevel

// 優先順位13: 解決評価域（Expand, Address, Get）
ResolveLevel = ExpandLevel

ExpandLevel = 
    operand:AddressLevel ExpandSymbol {
        return { type: "UnaryOperation", operator: "expand", operand: operand };
    }
    / AddressLevel

AddressLevel = 
    AddressSymbol operand:GetLevel {
        return { type: "UnaryOperation", operator: "address", operand: operand };
    }
    / GetLevel

GetLevel = GetRightExpression / GetLeftExpression / ImportLevel

// 右単位元: key @ object（左結合）
GetRightExpression = 
    key:(Identifier / String / Integer) __ GetRightSymbol __ object:GetLeftExpression {
        return { type: "GetRightExpression", key: key, object: object };
    }
    / key:(Identifier / String / Integer) __ GetRightSymbol __ object:ImportLevel {
        return { type: "GetRightExpression", key: key, object: object };
    }

// 左単位元: object ' key（左結合）
GetLeftExpression = 
    object:ImportLevel rest:(__ GetLeftSymbol __ key:(Identifier / String / Integer) { return key; })+ {
        return rest.reduce((acc, key) => 
            ({ type: "GetLeftExpression", object: acc, key: key }), object);
    }

// 優先順位14: Import
ImportLevel = 
    module:InputLevel ImportSymbol {
        return { type: "ImportExpression", module: module };
    }
    / InputLevel

// 優先順位15: Input
InputLevel = 
    InputSymbol address:(HexNumber / Identifier) {
        return { type: "InputExpression", address: address };
    }
    / PrimaryLevel

// 優先順位16: ブロック・基本要素
PrimaryLevel = 
    PointlessExpression
    / BlockExpression
    / Literal
    / Identifier
    / "(" _ expr:ExportLevel _ ")" { return expr; }

// ==================== ポイントレス記法 ====================

PointlessExpression = 
    ("[" _ content:PointlessContent _ "]")
    / ("{" _ content:PointlessContent _ "}")
    / ("(" _ content:PointlessContent _ ")") {
        return { type: "PointlessExpression", content: content };
    }

PointlessContent = 
    PartialApplication
    / DirectFold

PartialApplication = 
    op:InfixOperator __ operand:PrimaryLiteral type:(flag:","? {return flag ? "DirectMap" : "PartialApplication"}) {
        return { type, operator: op, right: operand };
    }
    / operand:PrimaryLiteral __ op:InfixOperator type:(flag:","? {return flag ? "DirectMap" : "PartialApplication"}) {
        return { type, operator: op, left: operand };
    }

DirectFold = 
    op:AnyOperator {
        return { type: "OperatorFunction", operator: op };
    }

PrimaryLiteral = Literal / Identifier

// ==================== ブロック構築 ====================

BlockExpression = 
    "(" _ expr:ExportLevel _ ")" { return { type: "Block", bracket: "paren", expression: expr }; }
    / "{" _ expr:ExportLevel _ "}" { return { type: "Block", bracket: "brace", expression: expr }; }
    / "[" _ expr:ExportLevel _ "]" { return { type: "Block", bracket: "square", expression: expr }; }
    / IndentBlock

IndentBlock = BlockStart expr:ExportLevel { 
    return { type: "IndentBlock", expression: expr }; 
}

BlockStart = EOL TAB+
BlockContinue = EOL TAB+

// ==================== リテラル ====================

Literal = 
    Unit
    / Number
    / String
    / Character

Unit = "_" { 
    return { 
        type: "Unit", 
        semantics: ["empty_list", "identity_morphism", "unit_element"]
    }; 
}

Number = Float / Integer / HexNumber / OctNumber / BinNumber

Integer = 
    sign:"-"? digits:UnsignedInteger {
        const value = parseInt((sign || "") + digits);
        return { type: "Integer", value: value, raw: (sign || "") + digits };
    }

UnsignedInteger = $([1-9] [0-9]*) / "0"

Float = 
    sign:"-"? intPart:[0-9]+ "." fracPart:[0-9]+ {
        const raw = (sign || "") + intPart.join("") + "." + fracPart.join("");
        return { type: "Float", value: parseFloat(raw), raw: raw };
    }

HexNumber = $("0x" [0-9A-Fa-f]+) {
    return { type: "HexNumber", value: parseInt(text(), 16), raw: text() };
}

OctNumber = $("0o" [0-7]+) {
    return { type: "OctNumber", value: parseInt(text().slice(2), 8), raw: text() };
}

BinNumber = $("0b" [01]+) {
    return { type: "BinNumber", value: parseInt(text().slice(2), 2), raw: text() };
}

String = 
    "`" content:[^`\n\r]* "`" {
        return { type: "String", value: content.join("") };
    }

Character = 
    "\\" char:. {
        return { type: "Character", value: char };
    }

Identifier = 
    $([A-Za-z_] [0-9A-Za-z_]*) {
        return { type: "Identifier", name: text() };
    }

// ==================== 演算子の位置区別実装 ====================

// 余積演算子（空白演算子）- 優先順位3の重要な演算子
CoproductSymbol = __ { return "coproduct"; }

// # 演算子（Export vs Output）
ExportSymbol = "#" &(Identifier __ ":") { return "export"; }
OutputSymbol = "#" &(" ") { return "output"; }

// ! 演算子（Not vs Factorial）
NotSymbol = "!" &(!FactorialContext) { return "not"; }
FactorialSymbol = "!" &(FactorialContext) { return "factorial"; }
FactorialContext = (_ / EOL / EOF / ")" / "}" / "]" / ProductSymbol / RangeSymbol)

// ~ 演算子（Continuous vs Range vs Expand）
ContinuousSymbol = "~" &(Identifier) { return "continuous"; }
RangeSymbol = "~" &(" ") { return "range"; }
ExpandSymbol = "~" &(ExpandContext) { return "expand"; }
ExpandContext = (_ / EOL / EOF / ")" / "}" / "]" / ProductSymbol)

// @ 演算子（Input vs GetRight vs Import）
InputSymbol = "@" &(HexNumber / Identifier) !(" ") { return "input"; }
GetLeftSymbol = "'" { return "get_left"; }
GetRightSymbol = "@" &(" ") { return "get_right"; }
ImportSymbol = "@" &(ImportContext) { return "import"; }
ImportContext = (_ / EOL / EOF / ")" / "}" / "]")

// その他の基本演算子
DefineSymbol = ":" { return "define"; }
LambdaSymbol = "?" { return "lambda"; }
ProductSymbol = "," { return "product"; }
XorSymbol = ";" { return "xor"; }
OrSymbol = "|" { return "or"; }
AndSymbol = "&" { return "and"; }
PowerSymbol = "^" { return "pow"; }
AddressSymbol = "$" { return "address"; }

// ==================== ポイントレス記法用演算子分類 ====================

AnyOperator = 
    InfixOperator / PrefixOperator / PostfixOperator

InfixOperator = 
    CoproductSymbol / DefineSymbol / ProductSymbol / RangeSymbol / XorSymbol / OrSymbol / AndSymbol
    / ComparisonOperator / AdditiveOperator / MultiplicativeOperator / PowerSymbol / GetLeftSymbol / GetRightSymbol

PrefixOperator = 
    ExportSymbol / NotSymbol / ContinuousSymbol / AddressSymbol / InputSymbol

PostfixOperator = 
    FactorialSymbol / ExpandSymbol / ImportSymbol

// ==================== 空白・制御文字 ====================

_ = $(" "*) // 任意個の空白（トークン区切り）
__ = $(" "+) // 1個以上の空白（優先順位3の余積演算子）

TAB = "\t"
EOL = "\n" / "\r\n" / "\r"
EOF = !.

// ==================== 余積表現の4つの意味論サポート ====================

/*
 * 余積演算子（__）の4つの意味:
 * 1. 関数適用: func __ arg1 __ arg2
 * 2. リスト結合: list1 __ list2 __ list3  
 * 3. 関数合成: [f] __ [g] __ x
 * 4. 式の結合: expr1 __ expr2
 * 
 * 構文解析では CoproductExpression として統一的に処理し、
 * 意味解析段階で文脈に応じて4つの意味を区別する
 * 
 * 例:
 * add 5 3          -> 関数適用
 * [1,2] [3,4]      -> リスト結合  
 * [+1] [*2] 5      -> 関数合成
 * x y z            -> 一般的な余積
 */