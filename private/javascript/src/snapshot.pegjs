{
  function buildList(head, tail) {
    return [head].concat(tail);
  }
}

// トップレベル
Program
  = _ body:ExportLevel* { return { type: "Program", body }; }

// 優先順位に従った演算子レベル
ExportLevel
  = DefineLevel
  / Export

Export
  = "#" right:DefineLevel {
    return { type: "Export", value: exp };
  }

DefineLevel
  = ConstructLevel
  / Define

Define
  = id:Identifier _ ":" _ exp:ConstructLevel {
    return { type: "Define", id, value: exp };
  }

ConstructLevel 
  = LogicalLevel
  / Product
  / Lambda
  / Coproduct

Product
  = head:LogicalLevel tail:(_ "," _ LogicalLevel)* {
    return {
      type: "Product",
      values: buildList(head, tail.map(([,,,v]) => v))
    };
  }

Coproduct
  = FunctionComposition
  / ListComposition
  / ListConstruction
  / FunctionApplication

// 1. 関数合成
FunctionComposition
  = head:Function tail:(_ Function)+ {
    return {
      type: "FunctionComposition",
      functions: buildList(head, tail.map(([_, f]) => f))
    };
  }

// 2. リスト合成
ListComposition
  = head:List tail:(_ List)+ {
    return {
      type: "ListComposition",
      lists: buildList(head, tail.map(([_, l]) => l))
    };
  }

// 3. 関数適用
FunctionApplication
  = func:Function args:(_ Atom)+ {
    return {
      type: "FunctionApplication",
      function: func,
      arguments: args.map(([_, a]) => a)
    };
  }

// 4. リスト構築
ListConstruction
  = head:Atom tail:(_ Atom)+ {
    return {
      type: "ListConstruction",
      elements: buildList(head, tail.map(([_, a]) => a))
    };
  }


// ラムダ演算子
Lambda
  = left:ParamList __ "?" __ right:LogicalLevel {
    return {
      type: "Lambda",
      left,
      right
    };
  }

// パラメータリスト
ParamList
  = "(" _ params:(Identifier (__ Identifier)*)? _ ")" {
    return params 
      ? buildList(params[0], params[1].map(([,,,p]) => p))
      : [];
  }
  / Identifier {
    return [{ type: "Identifier", name: text() }];
  }


// 論理演算子レベル

LogicalLevel
  = CompareLevel
  / LogicalNot
  / LogicalAnd
  / LogicalOr
  / LogicalXor

LogicalNot
  = "!" right:LogicalLevel {
    return {
      type: "LogicalNot",
      left: "",
      right
    };
  }

LogicalAnd
  = left:CompareLevel __ "&" __ right:LogicalLevel {
    return {
      type: "LogicalAnd",
      left,
      right
    };
  }

LogicalOr
  = left:CompareLevel __ ";" __ right:LogicalLevel {
    return {
      type: "LogicalXor",
      left,
      right
    };
  }

LogicalXor
  = left:CompareLevel __ "|" __ right:LogicalLevel {
    return {
      type: "LogicalOr",
      left,
      right
    };
  }

CompareLevel
  = ArithmeticLevel
  / Equal
  / NotEqual
  / LessThan
  / GreaterThan
  / LessEqual
  / GreaterEqual

Equal
  = left:ArithmeticLevel __ "=" __ right:CompareLevel {
    return {
      type: "Equal",
      left,
      right
    };
  }

NotEqual
  = left:ArithmeticLevel __ "/=" __ right:CompareLevel {
    return {
      type: "NotEqual",
      left,
      right
    };
  }

LessThan
  = left:ArithmeticLevel __ "<" __ right:CompareLevel {
    return {
      type: "LessThan",
      left,
      right
    };
  }

GreaterThan
  = left:ArithmeticLevel __ ">" __ right:CompareLevel {
    return {
      type: "GreaterThan",
      left,
      right
    };
  }

LessEqual
  = left:ArithmeticLevel __ "<=" __ right:CompareLevel {
    return {
      type: "LessEqual",
      left,
      right
    };
  }

GreaterEqual
  = left:ArithmeticLevel __ ">=" __ right:CompareLevel {
    return {
      type: "GreaterEqual",
      left,
      right
    };
  }

// ...existing code...

// 算術演算子レベル
ArithmeticLevel
  = MultiplicativeLevel
  / Addition
  / Subtraction

Addition
  = left:MultiplicativeLevel __ "+" __ right:ArithmeticLevel {
    return {
      type: "Addition",
      left,
      right
    };
  }

Subtraction
  = left:MultiplicativeLevel __ "-" __ right:ArithmeticLevel {
    return {
      type: "Subtraction",
      left,
      right
    };
  }

MultiplicativeLevel
  = UnaryLevel
  / Multiplication
  / Division
  / Modulo

Multiplication
  = left:UnaryLevel __ "*" __ right:MultiplicativeLevel {
    return {
      type: "Multiplication",
      left,
      right
    };
  }

Division
  = left:UnaryLevel __ "/" __ right:MultiplicativeLevel {
    return {
      type: "Division",
      left,
      right
    };
  }

Modulo
  = left:UnaryLevel __ "%" __ right:MultiplicativeLevel {
    return {
      type: "Modulo",
      left,
      right
    };
  }

// 単項演算子レベル
UnaryLevel
  = AtomLevel
  / UnaryPlus
  / UnaryMinus

UnaryPlus
  = "+" _ right:AtomLevel {
    return {
      type: "UnaryPlus",
      right
    };
  }

UnaryMinus
  = "-" _ right:AtomLevel {
    return {
      type: "UnaryMinus",
      right
    };
  }

// 評価解決域
ResolveLevel
  = IndentBlock
  / GroupBlock
  / Atom

IndentBlock
  = ("\r" / "\n") "\t" body:ResolveLevel+ {
    return {
      type: "IndentBlock",
      body
    };
  }

GroupBlock
  = "(" _ body:ResolveLevel* _ ")" {
    return {
      type: "GroupBlock",
      body
    };
  }
  / "[" _ body:ResolveLevel* _ "]" {
    return {
      type: "GroupBlock",
      body
    };
  }
  / "{" _ body:ResolveLevel* _ "}" {
    return {
      type: "GroupBlock",
      body
    };
  }

// 単位元
Unit
  = "_" {
    return {
      type: "Unit",
      value: null
    };
  }

// 識別子
Identifier
  = !ReservedWord head:[a-zA-Z_] tail:[a-zA-Z0-9_]* {
    return {
      type: "Identifier",
      name: head + tail.join("")
    };
  }

// 基本要素
Atom
  = Number
  / String
  / Character
  / List
  / Unit
  / Identifier

// ...existing code...

// 数値リテラル
Number
  = Float
  / Integer
  / Scientific

Float
  = sign:("-"?)? whole:[0-9]+ "." decimal:[0-9]+ {
    return {
      type: "Float",
      value: parseFloat((sign || "") + whole.join("") + "." + decimal.join(""))
    };
  }

Integer
  = sign:("-"?)? digits:[0-9]+ {
    return {
      type: "Integer",
      value: parseInt((sign || "") + digits.join(""), 10)
    };
  }

Scientific
  = base:(Float / Integer) ("e" / "E") exp:Integer {
    return {
      type: "Scientific",
      value: base.value * Math.pow(10, exp.value)
    };
  }

// 文字列リテラル
String
  = "`" content:([^`\\] / "\\" .)* "`" {
    return {
      type: "String",
      value: content.map(c => Array.isArray(c) ? c[0] : c).join("")
    };
  }

// 文字リテラル
Character
  = "'" char:([^'\\] / "\\" .) "'" {
    return {
      type: "Character",
      value: Array.isArray(char) ? char[0] : char
    };
  }

// リストリテラル
List
  = "[" _ items:(ListItem (_ "," _ ListItem)*)? _ "]" {
    return {
      type: "List",
      items: items 
        ? buildList(items[0], items[1].map(([,,,item]) => item))
        : []
    };
  }

ListItem
  = ResolveLevel

// 空白とコメント
_ "Space"
  = " "*

__ "mustSpace"
  = " "+


Comment
  = "`" [^\n]* "\n"?