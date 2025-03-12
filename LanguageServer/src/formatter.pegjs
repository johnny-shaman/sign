Start = e:Expression* {return e.join("");}

Expression
  = l:literal* _* c:infix _* r:Expression* {return `${l.join("")}${c}${r.flat(Infinity).join("")}`;}
  / l:literal+ r:postfix* { return `${l.join(" ").replace(/^ /gm, "").replace(/ +[\n]/gm, "\n")}${r.join("")}`;}
  / l:prefix+ r:Expression { return `${l.join("")}${r}`;}
  / $comment
  / _+ {return ` `;}
  / EOL

Block
  = l:"(" _* c:(BlockExpression*) _* r:")"  _* e:EOL {return `${l}${c.join("")}${r}${e}`;}
  / l:"{" _* c:(BlockExpression*) _* r:"}"  _* e:EOL {return `${l}${c.join("")}${r}${e}`;}
  / l:"[" _* c:(BlockExpression*) _* r:"]"  _* e:EOL {return `${l}${c.join("")}${r}${e}`;}
  / l:"(" _* c:(BlockExpression*) _* r:")"  _* e:Block {return `${l}${c.join("")}${r} ${e}`;}
  / l:"{" _* c:(BlockExpression*) _* r:"}"  _* e:Block {return `${l}${c.join("")}${r} ${e}`;}
  / l:"[" _* c:(BlockExpression*) _* r:"]"  _* e:Block {return `${l}${c.join("")}${r} ${e}`;}
  / l:"(" _* c:(BlockExpression*) _* r:")"  _* e:Expression* {return `${l}${c.join("")}${r}${e.flat(Infinity).join("")}`;}
  / l:"{" _* c:(BlockExpression*) _* r:"}"  _* e:Expression* {return `${l}${c.join("")}${r}${e.flat(Infinity).join("")}`;}
  / l:"[" _* c:(BlockExpression*) _* r:"]"  _* e:Expression* {return `${l}${c.join("")}${r}${e.flat(Infinity).join("")}`;}
  / IndentBlock

BlockExpression
  = l:literal* _* c:blockInfix _* r:BlockExpression* {return `${l.join("")}${c}${r.join("")}`;}
  / l:literal+ r:postfix* { return `${l.join(" ").replace(/^ /gm, "").replace(/ +[\n]/gm, "\n")}${r.join("")}`;}
  / l:prefix+ r:BlockExpression { return `${l.join("")}${r}`;}
  / _+ {return ` `;}

IndentBlock = l:BlockStart r:Expression+  { return `${l}${r.join("")}`;}
BlockStart = $(EOL tab+)

literal = atom / Block
atom = $(string / letter / bin / oct / hex / number / tag / unit)

number = $("-"? [0-9]+ "."? [0-9]* )
hex = $("0x"([0-9] / [A-F] / [a-f])+)
oct = $("0o"[0-7]+)
bin = $("0b"("0" / "1")+)
tag = $((([A-Z] / [a-z]) / (("_" / [A-Z] / [a-z]) ("_" / [A-Z] / [a-z] / [0-9]))) ("_" / [A-Z] / [a-z] / [0-9])*)
letter = ("\\" .)
comment = $("`" [^\n\r`]*)
string = $("`" [^\n\r`]* "`")
unit = $"_"
key = $(string / letter / tag)

prefix = $(export / import / not / spread)
blockInfix = s:$(infix / spread) {return ` ${s} `}
infix = s:(be / lambda / pair / or / xor / and / add / sub / mul / div / mod / get / compare / pow) {return ` ${s} `}
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
EOL = $("\n" / "\r" "\n"?)
_ = $" "
