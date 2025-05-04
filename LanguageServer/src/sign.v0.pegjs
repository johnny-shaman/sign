Start = e:Expression* {return e.join("");}

Expression = Export
  / Flat
  / Literal
  / EOL

Export = export? Define
Define = tag _ be? _ (Define / Output)*
Output = (tag / hex / (obtain tag)) __ output? __ (Output / Apply)*
Apply = Function __ (Pair / Flat / Atoms)

Function
  = Closuer
  / Compose
  / Pointless
  / tag

  Closuer = (Arguments / unit) _ lambda _ Expression

    Arguments = (tag _)* (lift? tag)

  Compose = (tag / Closuer / Pointless) __ Compose
  Pointless
    = "(" (DirectMap / DirectFold) ")"
    / "{" (DirectMap / DirectFold) "}"
    / "[" (DirectMap / DirectFold) "]"

    DirectMap = PartialApply pair
    DirectFold = PartialApply

      PartialApply
        = atom? _ infix _ atom?
        / prefix "_"
        / "_" postfix
        / atom _ infix _ unit?
        / tag __ atom*

Pair
  = lift+ (Pair / tag)
  / "(" (((spreadable / tag) spread (spreadable / tag)) / Atoms) ")"
  / "{" (((spreadable / tag) spread (spreadable / tag)) / Atoms) "}"
  / "[" (((spreadable / tag) spread (spreadable / tag)) / Atoms) "]"
  / (Function / atom) _ (pair _ (Pair / Or))*

Atoms = atom+

Or = And (orxor Or)*
And = Not (_ and _ And)*
Not = not* Compare
Compare = Additive (_ compare _ Compare)*
Additive = Multiple (_ additive _ Additive)*
Multiple = Power (_ multiple _ Multiple)*
Power = Factrial (_ pow _ Additive)*
Factrial = (Absolute / Negate) factrial*
Absolute = "|" (Additive / Get) "|"
Flat = Set flat*
Set = Get (_ be _ Apply)*
Negate = "-"? (Get / Number)
Get = (tag / Pair / Import) (_ get _ key)*
Get_r = (key __ get_r __)*  (tag / Pair / Import)
Import = Input import
Input = input Expression

Block
  = "(" _ Expression _ ")"
  / "{" _ Expression _ "}"
  / "[" _ Expression _ "]"
  / IndentBlock

IndentBlock = BlockStart Expression
  BlockStart = $(EOL tab+)

Literal = atom / Block
atom = $(string / letter / bin / oct / hex / Number / tag / unit)
spreadable = $(Number / hex / oct / bin / letter)
Number = uint / int / float
uint = $([1-9] [0-9]*)
int = $("-"? uint)
float = $("-"? [0-9]+ "."? [0-9]*)
hex = $("0x" [0-9A-Fa-f]+)
oct = $("0o" [0-7]+)
bin = $("0b" [01]+)
tag = $(([A-Za-z] / ("_" [0-9A-Za-z_])) [0-9A-Za-z_]*) 
letter = $("\\" .)
comment = $("`" [^\n\r`]*)
string = $("`" [^\n\r`]* "`") / letter+
unit = $"_"
key = $(string / letter / tag / int)

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
