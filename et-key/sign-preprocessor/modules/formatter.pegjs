// 動作確認用の簡易フォーマッター
// 最低限の機能で確実に動作するバージョン

Start = parts:Part* { 
  return parts.join(''); 
}

Part 
  = BinaryOpFormat
  / String
  / Comment  
  / Identifier
  / Number
  / Symbol
  / Whitespace
  / EOL

// 2項演算子の前後に空白を挿入
BinaryOpFormat 
  = left:NonOpToken op:BinaryOp right:NonOpToken {
      return left + ' ' + op + ' ' + right;
    }

NonOpToken 
  = String
  / Identifier  
  / Number
  / "(" [^)]* ")"
  / "[" [^\]]* "]"
  / "{" [^}]* "}"

BinaryOp 
  = "+" / "-" / "*" / "/" / "=" / "<" / ">" / "&" / "|" / ":" / "?"

// 基本要素
String = "`" [^`\n\r]* "`" { return text(); }
Comment = "`" [^\n\r]* { return text(); }
Identifier = [A-Za-z_][0-9A-Za-z_]* { return text(); }
Number = "-"? [0-9]+ ("." [0-9]+)? { return text(); }
Symbol = [!@#$%^&*()[\]{};:'"<>?,./|\\`~_+=\-] { return text(); }
Whitespace = [ \t]+ { return ' '; }
EOL = [\n\r]+ { return text(); }