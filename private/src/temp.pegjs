{
  let tagList = {}
}

literal = $(_* ( letter / bin / oct / hex / number / unit) _*)

number = $("-"? [0-9]+ "."? [0-9]* )
hex = $("0x"([0-9] / [A-F] / [a-f])+)
oct = $("0o"[0-7]+)
bin = $("0b"("0" / "1")+)
tag = $(("_" / [A-Z] / [a-z]) ("_" / [A-Z] / [a-z] / [0-9])*)
letter = $("\\" .)
unit = $"_"

Pointless
  = $((infix_ / infixL / infixR) _* literal)
  / $(literal _* (infix_ / infixL / infixR))
  / $(prefix)
  / $("_" postfix)

prefix = export / import / not / spread
infixR = define / lambda / pair / pow
infixL = or / xor / and / add / sub / mul / div / mod / get
infix_ = lt / le / eq / ne / me / mt
postfix = spread / factrial

export = "#"
define = ":"
lambda = "?"
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
tab = "\t"

_ = " "
