// 完全なSign言語PEG.js構文解析仕様
// 演算子記号表の優先順位1-16を完全実装
// ポイントレス記法と余積表現の4つの意味を実装

Start = Program

// ==================== プログラム構造 ====================

Program = (Statement _?)*

Statement = 
    ExportLevel 
    / Comment
    / EOL

Comment = "`" [^\n\r`]* "`"?

// ==================== 優先順位階層（1-16） ====================

// 優先順位1: Export（最低優先度）
ExportLevel = 
    ExportSymbol DefineLevel
    / DefineLevel

// 優先順位2: Define + Output
DefineLevel = 
    Identifier __ DefineSymbol __ OutputLevel
    / OutputLevel

OutputLevel = 
    (HexNumber / AddressSymbol? Identifier) __ OutputSymbol __ FunctionApplyLevel
    / FunctionApplyLevel

// 優先順位3: 構築域（Coproduct, Lambda, Product, Range）

ListConstructLevel = 
    (Number / Character / Identifier) (__ ConcatListLevel)*
    / ConcatListLevel

ConcatListLevel = 
    (ProductLevel / Number / String / Character / Unit / Identifier) (__ FunctionApplyLevel)*
    / FunctionApplyLevel

FunctionApplyLevel = 
    (LambdaLevel / PointlessExpression / Unit / Identifier) (__ FunctionComposeLevel)*
    / FunctionComposeLevel

FunctionComposeLevel = 
    (LambdaLevel / PointlessExpression / Unit / Identifier) (__ LambdaLevel)*
    / LambdaLevel

LambdaLevel = 
    ParameterList __ LambdaSymbol __ ProductLevel
    / ProductLevel

ParameterList = 
    Parameter (__ Parameter)*

Parameter = 
    ContinuousSymbol Identifier
    / Identifier

ProductLevel = 
    RangeLevel (__ ProductSymbol __ RangeLevel)*

RangeLevel = 
    LogicalXorLevel __ RangeSymbol __ LogicalXorLevel
    / LogicalXorLevel

// 優先順位4-6: 論理域
LogicalXorLevel = 
    LogicalOrLevel (__ XorSymbol __ LogicalOrLevel)*

LogicalOrLevel = 
    LogicalAndLevel (__ OrSymbol __ LogicalAndLevel)*

LogicalAndLevel = 
    LogicalNotLevel (__ AndSymbol __ LogicalNotLevel)*

LogicalNotLevel = 
    NotSymbol ComparisonLevel
    / ComparisonLevel

// 優先順位7: 比較演算域（連鎖比較対応）
ComparisonLevel = 
    AbsoluteLevel ComparisonChain*

ComparisonChain = __ ComparisonOperator __ AbsoluteLevel 

// 優先順位8: 絶対値
AbsoluteLevel = 
    "|" ArithmeticAddLevel "|"
    / ArithmeticAddLevel

// 優先順位9: 加減算
ArithmeticAddLevel = 
    ArithmeticMulLevel (_ AdditiveOperator _ ArithmeticMulLevel)*

// 優先順位10: 乗除算
ArithmeticMulLevel = 
    PowerLevel (_ MultiplicativeOperator _ PowerLevel)*

// 優先順位11: 冪乗（右結合）
PowerLevel = 
    FactorialLevel (_ PowerSymbol _ PowerLevel)*
    / FactorialLevel

// 優先順位12: 階乗
FactorialLevel = 
    ResolveLevel FactorialSymbol
    / ResolveLevel

// 優先順位13: 解決評価域（Expand, Address, Get）
ResolveLevel = ExpandLevel

ExpandLevel = 
    AddressLevel ExpandSymbol
    / AddressLevel

AddressLevel = 
    AddressSymbol GetLevel
    / GetLevel

GetLevel = GetRightExpression / GetLeftExpression / ImportLevel

// 右単位元: key @ object（左結合）
GetRightExpression = 
    (Identifier / String / Integer) __ GetRightSymbol __ GetLeftExpression
    / (Identifier / String / Integer) __ GetRightSymbol __ ImportLevel

// 左単位元: object "'" key（左結合）
GetLeftExpression = 
    ImportLevel (__ GetLeftSymbol __ (Identifier / String / Integer))+

// 優先順位14: Import
ImportLevel = 
    InputLevel ImportSymbol
    / InputLevel

// 優先順位15: Input
InputLevel = 
    InputSymbol (HexNumber / Identifier)
    / PrimaryLevel

// 優先順位16: ブロック・基本要素
PrimaryLevel = 
    PointlessExpression
    / BlockExpression
    / Literal
    / Identifier

// ==================== ポイントレス記法 ====================

PointlessExpression = 
    ("[" _ PointlessContent _ "]")
    / ("{" _ PointlessContent _ "}")
    / ("(" _ PointlessContent _ ")")

PointlessContent = 
    PartialApplication
    / DirectFold

PartialApplication = 
    InfixOperator __ PrimaryLiteral _ ","?
    / PrimaryLiteral __ InfixOperator _ ","?
    / PrefixOperator
    / ("_" PostfixOperator)
DirectFold = 
    InfixOperator

PrimaryLiteral = Literal / Identifier

// ==================== ブロック構築 ====================

BlockExpression = 
    ("(" _ ExportLevel _ ")")
    / ("{" _ ExportLevel _ "}")
    / ("[" _ ExportLevel _ "]")
    / IndentBlock

IndentBlock = BlockStart ExportLevel

BlockStart = $(EOL TAB+)

// ==================== リテラル ====================

Literal = 
    Unit
    / Number
    / String
    / Character

Unit = "_"

Number = Float / Integer / HexNumber / OctNumber / BinNumber

Integer = "-"? UnsignedInteger

UnsignedInteger = $([1-9] [0-9]*) / "0"

Float = "-"? [0-9]+ "." [0-9]+

HexNumber = $("0x" [0-9A-Fa-f]+)

OctNumber = $("0o" [0-7]+)

BinNumber = $("0b" [01]+)

String =
    "`" [^`\n\r]* "`"

Character = 
    "\\" .

Identifier = 
    $([A-Za-z_] [0-9A-Za-z_]*)

// ==================== 演算子の位置区別実装 ====================


// # 演算子（Export vs Output）
ExportSymbol = "#"
OutputSymbol = "#"

// ! 演算子（Not vs Factorial）
NotSymbol = "!"
FactorialSymbol = "!"

// ~ 演算子（Continuous vs Range vs Expand）
ContinuousSymbol = $"~"
RangeSymbol = $"~"
ExpandSymbol = $"~"

// @ 演算子（Input vs GetRight vs Import）
InputSymbol = "@"
GetLeftSymbol = "'"
GetRightSymbol = "@"
ImportSymbol = "@"

// その他の基本演算子
DefineSymbol = ":"
LambdaSymbol = "?"
ProductSymbol = ","
XorSymbol = ";"
OrSymbol = "|"
AndSymbol = "&"

ComparisonOperator = "<=" / ">=" / "!=" / "<" / ">" / "="
AdditiveOperator = "+" / "-"
MultiplicativeOperator = "*" / "/" / "%"
PowerSymbol = "^"

AddressSymbol = "$"

// ==================== ポイントレス記法用演算子分類 ====================

AnyOperator = 
    InfixOperator / PrefixOperator / PostfixOperator

InfixOperator = 
    DefineSymbol / ProductSymbol / RangeSymbol / XorSymbol / OrSymbol / AndSymbol
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
 