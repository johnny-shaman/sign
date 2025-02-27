

literal = _* literal:( letter / bin / oct / hex / number / unit) _* {return {literal}}

number = number:$("-"? [0-9]+ "."? [0-9]* ) {return {number};}
hex = hex:$("0x"([0-9] / [A-F] / [a-f])+) {return {hex};}
oct = oct:$("0o"[0-7]+) {return {oct};}
bin = bin:$("0b"("0" / "1")+) {return {oct};}
tag = identifier:$(("_" / [A-Z] / [a-z]) ("_" / [A-Z] / [a-z] / [0-9])*) {return {identifier};}
letter = "\\" letter:. {return {letter}}
unit = "_"

prefix = export / import / not / spread
infixR = define / func / pair / pow
infixL = or / xor / and / add / sub / mul / div / mod / get
infix = lt / le / eq / ne / me / mt / spread
postfix = spread / factrial

export = "#"
define = ":"
func = "?"
pair = ","
or = "|"
xor = ";"
and = "&"
not = "!"
lt = "<"
le = "<="
eq = "=" / "=="
ne = "!=" / "><"
me = ">="
mt = ">"
add = "+"
sub = "-"
mul = "*"
div = "/"
mod = "%"
pow = "^"
factrial = "!"
spread = "~"
get = "'"
import = "@"
block = "\t"

_ = " "
