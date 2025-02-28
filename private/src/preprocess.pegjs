Expression = ($("(" / "{" / "[" / tab)* $_* $((prefix+ Expression) / Infix / (literal postfix*) / Pointless / PointlessMap) $_* $(")" / "}" / "]")* )*

Infix = l:literal _* c:infix _* r:Expression {return `${l} ${c} ${r}`}

Pointless
  = l:infix _* r:literal {return `${l} ${r}`}
  / l:literal _* r:infix {return `${l} ${r}`}
  / $(prefix)
  / $("_" postfix)
  / $infix

PointlessMap = l:Pointless _* r:pair {return `${l} ${r}`}

literal = $(_* ( string / letter / bin / oct / hex / number / unit / tag / ($("(" / "{" / "[" / tab) _* Expression _* $(")" / "}" / "]")) _*))

number = $("-"? [0-9]+ "."? [0-9]* )
hex = $("0x"([0-9] / [A-F] / [a-f])+)
oct = $("0o"[0-7]+)
bin = $("0b"("0" / "1")+)
tag = $(("_" / [A-Z] / [a-z]) ("_" / [A-Z] / [a-z] / [0-9])*)
letter = $("\\" .)
string = $("`" [^\n`]* "`")
unit = $"_"

prefix = $(export / import / not / spread)
infix = $(define / lambda / pair / pow/ or / xor / and / add / sub / mul / div / mod / get / lt / le / eq / ne / me / mt / spread)
postfix = $(spread / factrial)

export = $"#"
define = $":"
lambda = $"?"
pair = $","
or = $"|"
xor = $";"
and = $"&"
not = $"!"
lt = $"<"
le = $"<="
eq = $("=" / "==")
ne = $("!=" / "><")
me = $">="
mt = $">"
add = $"+"
sub = $"-"
mul = $"*"
div = $"/"
mod = $"%"
pow = $"^"
factrial = $"!"
spread = $"~"
get = $"'"
import = $"@"
tab = $"\t"

EOL = $("\n" / "\r")

_ = $" "
