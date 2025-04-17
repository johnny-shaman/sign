Start = $Expression*

Expression
  = Export
  / Define
  / Output
  / Apply
  / Literals
  / Function
  / Pair
  / Or
  / Absolute
  / Flat
  / Literal
  / EOL

Export = export? Define
Define = tag _ be? _ Expression* //右結合でOK
Output = (tag / hex / (obtain tag)) __ output? __ Expression+ //右結合にでOK
Apply = Function __ Literals
Literals = Literal __ Expression+ //右結合でOK
Function
  = Closuer
  / Compose
  / Pointless

  Closuer = (Arguments / unit) lambda Expression+ //右結合でOK

    Arguments = tag+ (lift tag)?

  Compose = (tag / Closuer / Pointless) __ Compose+
  Pointless
    = "(" (DirectMap / DirectFold) ")"
    / "{" (DirectMap / DirectFold) "}"
    / "[" (DirectMap / DirectFold) "]"

    DirectMap
      = (prefix"_") pair
      / (unit? infix unit?) pair
      / ("_"postfix) pair
      / PartialApply pair

      PartialApply
        = unit? _ infix _ atom
        / atom _ infix _ unit?
        / tag __ Literals

//直和表現
    DirectFold
      = infix
      / (unit infix unit)
      / PartialApply

Pair
  = lift atom
  / "(" ((spreadable / tag) spread (spreadable / tag)) ")"
  / "{" ((spreadable / tag) spread (spreadable / tag)) "}"
  / "[" ((spreadable / tag) spread (spreadable / tag)) "]"
  / (Closuer / Compose / Pointless / atom) _ pair _ Expression* //右結合でOK

Or = And orxor? Or*
And = Not _ and? _ And*
Not = not* Compare
Compare = Additive _ compare? _ Compare*
Additive = Multiple _ additive? _ Additive*
Multiple = Power _ multiple? _ Multiple*
Power = Factrial _ pow? Power*
Factrial = Get factrial+
Absolute = "|" (Additive / Get) "|"
Flat = Get flat
Get = (tag / Pair / Import) (_ get _ key)*
Set = Get _ be _ Expression*
Get_r = (key _ get_r _)*  (tag / Pair / Import)
Import = (tag / string) import

Block
  = "(" _ Expression+ _ ")"
  / "{" _ Expression+ _ "}"
  / "[" _ Expression+ _ "]"
  / IndentBlock

IndentBlock = BlockStart Expression+
  BlockStart = $(EOL tab+)

Literal = atom / Block
atom = $(string / letter / bin / oct / hex / number / tag / unit)
spreadable = $(number / hex / oct / bin / letter)
number = $("-"? [0-9]+ "."? [0-9]* )
hex = $("0x" ([0-9] / [A-F] / [a-f])+)
oct = $("0o" [0-7]+)
bin = $("0b" ("0" / "1")+)
tag = $("_" ([0-9] / [A-Z] / [a-z] / "_")+) / $(([A-Z] / [a-z]) ([0-9] / [A-Z] / [a-z] / "_")+)
letter = $("\\" .)
comment = $("`" [^\n\r`]*)
string = $("`" [^\n\r`]* "`")
unit = $"_"
key = $(string / letter / tag)

prefix = $(export / import / not / lift / obtain)
infix = $(be / lambda / pair / or / xor / and / add / sub / mul / div / mod / get / compare / pow)
compare = $(lt / le / eq / ne / me / mt )
postfix = $(flat / factrial)

orxor
  = $(__ or __)
  / $(_ xor _)
additive = $(add / sub)
multiple = $(mul / div / mod)

export = $"#"
output = $"#"
obtain = $"$"
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
lift = $"~"
flat = $"~"
get = $"'"
get_r = $"@"
import = $"@"
input = $"@"
tab = $"\t"
EOL = $("\n" / "\r" "\n"?)
_ = $(" "*) {return " "}
__ = $(" "+) {return " "}
