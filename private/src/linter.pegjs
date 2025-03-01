Expression = e:Export{return e.flat(Infinity).join("");}
Export = export? (Dictionary / Define)
Dictionary = (BlockStart key _* be _*) DorC
DorC = (Dictionary / Coproduct)
Define = (tag _* be _*)* Coproduct
Coproduct = Lambda (Apply / Cons)*
Cons = atom (_+ Coproduct)?
Apply = (Closure / tag) (_+  Coproduct)?
Lambda = Inline? / Match? / LogicOr
Inline = Arguments _* lambda _* Lambda?
Match = Arguments _* lambda _* IndentBlock+
LogicOr = LogicAnd _* logicOr? _* LogicOr?
LogicAnd = LogicNot _* and? _* LogicAnd?
LogicNot = not* Compares
Compares = Additive _* compare? _* Compares?
Additive = Multiple _* additive? _* Additive?
Multiple = Expornential _* multiple? _* Multiple?
Expornential = Factrial _* pow? _* Expornential?
Factrial = Get factrial*
Get = literal _* get? _* Get?

Arguments = $((tag _+)* Rest / unit )
Rest = $(spread? tag)

atom = $(_* (string / letter / bin / oct / hex / number / unit / tag) _*)

literal = $(_* ( atom / Closure / Block) _*)

Closure
  = $("(" _* Lambda _* ")")
  / $("{" _* Lambda _* "}")
  / $("[" _* Lambda _* "]")
  / $("(" _* Pointless _* ")")
  / $("{" _* Pointless _* "}")
  / $("[" _* Pointless _* "]")
  / $("(" _* PointlessMap _* ")")
  / $("{" _* PointlessMap _* "}")
  / $("[" _* PointlessMap _* "]")

Pointless
  = $(infix _* atom)
  / $(atom _* infix)
  / $(prefix)
  / $("_" postfix)
  / $infix

PointlessMap = $(Pointless _* pair)

Block
  = $("(" _* Expression _* ")")
  / $("{" _* Expression _* "}")
  / $("[" _* Expression _* "]")
  / IndentBlock

IndentBlock = BlockStart Expression

BlockStart = $(EOL tab+)

number = ("-"? [0-9]+ "."? [0-9]* )
hex = $("0x"([0-9] / [A-F] / [a-f])+)
oct = $("0o"[0-7]+)
bin = $("0b"("0" / "1")+)
tag = $((([A-Z] / [a-z]) / (("_" / [A-Z] / [a-z]) ("_" / [A-Z] / [a-z] / [0-9]))) ("_" / [A-Z] / [a-z] / [0-9])*)
letter = $("\\" .)
string = $("`" [^\n`]* "`")
unit = $"_"
key = $(string / letter / tag)

infix = $(infixL / infix_ / infixR)

prefix = $(export / import / not / spread)
infixL = $(or / xor / and / add / sub / mul / div / mod / get)
infix_ = $(compare / spread)
infixR = $(be / lambda / pair / pow )
compare = $(lt / le / eq / ne / me / mt )
postfix = $(spread / factrial)

logicOr = $(or / xor)
additive = $(add / sub)
multiple = $(mul / div / mod)

export = $"#"
be = $":"
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
