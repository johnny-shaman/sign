{
    let indentLevel = 0; // 期待されるインデントレベル
    let currentIndent = 0; // 現在の行のインデントレベル
}
  
  // プログラム全体
  program =
  	comment { return null; } // コメントは無視
    / exprs:expr+ { return exprs; }
  
  // ブロック
  block = "\t"* r:expr+ { return {type:"block", r}; }
  
  // 式（優先順位の最上位）
  expr = export { return expr}

  // エクスポート
  export
  	= "#" r:expr {return {type:"export", r}}
    / define
  
  // 定義演算子（右結合）
  define
    = l:KEY ":" r:define { return { type: "define", l, r }; }
    / logicOr
  
  // 論理OR
  logicOr
    = l:logicAnd "|" r:logicOr { return {type: "or", l, r}; }
    / l:logicAnd ";" r:logicOr { return {type: "xor", l, r}; }
    / logicAnd
  
  // 論理AND
  logicAnd
    = l:logicNot "&" r:logicAnd { return {type: "and", l, r}; }
    / logicNot

  logicNot
    = "!" logicNot { return {type: "not", l, r}; }
    / compare

  // 比較演算子
  compare
    = l:arithmetic "<" r:compare { return {type:"lt", l, r}; }
    / l:arithmetic "<=" r:compare { return {type:"le", l, r}; }
    / l:arithmetic "=" r:compare { return {type:"eq", l, r}; }
    / l:arithmetic "==" r:compare { return {type:"eq", l, r}; }
    / l:arithmetic "!=" r:compare { return {type:"ne", l, r}; }
    / l:arithmetic "><" r:compare { return {type:"ne", l, r}; }
    / l:arithmetic ">=" r:compare { return {type:"me", l, r}; }
    / l:arithmetic ">" r:compare { return {type:"mt", l, r}; }
    / arithmetic
  
  // 加減算
  arithmetic
    = l:term "+" r:arithmetic { return {type:"add", l, r}; }
    / l:term "-" r:arithmetic { return {type:"sub", l, r}; }
    / term
  
  // 乗除算
  term
    = l:factor "*" r:arithmetic { return {type: "mul", l, r}; }
    / l:factor "/" r:arithmetic { return {type: "div", l, r}; }
    / l:factor "%" r:arithmetic { return {type: "mod", l, r}; }

  // べき乗（右結合）
  factor
    = l:primary ("^" r:factor)? { return $2 ? { type: "BinaryOp", operator: "^", l, r: $2[1] } : l; }
  
  // 単項演算子と基本要素
  primary
    = "!" expr:primary { return { type: "UnaryOp", operator: "!", expr }; }
    / "~" expr:primary { return { type: "UnaryOp", operator: "~", expr }; }
    / atom
  
  // 基本要素
  atom
    = number:NUMBER { return { type: "Number", value: number }; }
    / string:STRING { return { type: "String", value: string }; }
    / char:LETTER { return { type: "Character", value: char }; }
    / id:KEY { return { type: "Identifier", name: id }; }
    / "(" exprs:expr+ ")" { return exprs; }

  // ラムダ式
  lambda
    = params:params "?" body:expr { return { type: "Lambda", params, body }; }
  
  // リスト
  list
    = elements:(atom ("," expr)* { return [$1, ...$2.map(e => e[1])] })? { return { type: "List", elements: elements || [] }; }
  
  // 辞書型
  dict
    = "{" pairs:(pair ("," pair)* { return [$1, ...$2.map(p => p[1])] })? "}" { return { type: "Dict", pairs: pairs || [] }; }
  
  // 辞書型のキー:値ペア
  pair
    = key:STRING ":" value:expr { return { key, value }; }
  
  // ラムダのパラメータリスト
  params
    = ids:(KEY ("," KEY)* { return [$1, ...$2.map(id => id[1])] }) { return ids; }
  
  // トークン定義
  NUMBER
    = HEX / OCT / BIN / FLOAT / INT
  
  INT = sign:"-"? digits:[0-9]+ { return parseInt((sign || "") + digits.join(""), 10); }
  FLOAT = sign:"-"? digits:[0-9]+ "." frac:[0-9]+ { return parseFloat((sign || "") + digits.join("") + "." + frac.join("")); }
  HEX = "0x" digits:[0-9A-Fa-f]+ { return parseInt(digits.join(""), 16); }
  OCT = "0o" digits:[0-7]+ { return parseInt(digits.join(""), 8); }
  BIN = "0b" digits:[0-1]+ { return parseInt(digits.join(""), 2); }
  
  STRING = "`" chars:[^`\n]* "`" { return chars.join(""); }
  LETTER = . { return text(); }
  KEY = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

  // コメント
  comment = "`" [^\n]* EOL

  // インデント管理
  indent = "\t"+ &{ currentIndent = text().length / 2; return currentIndent > indentLevel; } { indentLevel = currentIndent; return true; }
  dedent = EOL &{ currentIndent = 0; return true; }
  sameIndent = "/t" &{ return text().length / 2 === indentLevel; }
  
  // 空白と改行
  _ = " "*
  EOL = "\n"
  
  
  
