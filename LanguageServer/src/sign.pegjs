Start = e:Program* {return e.join("");}

Program
  = 
  (Export / Define)
  / Expression // can Calculate Syntax
  / Import
  / Literal // can Constantic Syntax
  / EOL


Assigns = Export

Export = export? Define
Define = (tag _ be _)* Literal

Literal
  = Function
  / Stream
  / List
  / atom

Function
  = Compose
  / Closuer
  / Pointless
  / tag

  Compose = (tag / Closuer / Pointless) (__ Compose)*

  Closuer = (Arguments / unit) _ f _ Output

    Arguments = (tag __)* lift? tag

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

Stream = atom+

List
  = lift+ (List / tag)
  / "(" (((spreadable / tag) spread (spreadable / tag)) / Stream) ")"
  / "{" (((spreadable / tag) spread (spreadable / tag)) / Stream) "}"
  / "[" (((spreadable / tag) spread (spreadable / tag)) / Stream) "]"
  / (Function / atom) _ (pair _ List)*

Expression = Output
Output = (tag / hex / (place tag)) __ output? __ (Output / Apply)*
Apply = Function __ Literal

Or = And (orxor Or)*
And = Not (_ and _ And)*
Not = not* Compare
Compare = Additive (_ compare _ Compare)*
Additive = Multiple (_ additive _ Additive)*
Multiple = Power (_ multiple _ Multiple)*
Power = Factrial (_ pow _ Additive)*
Factrial = Absolute factrial*
Absolute = "|" (Additive / Get) "|"
Flat = Set flat*
Set = Get (_ be _ Apply)*
Get = (tag / List / Import) (_ get _ key)*
Get_r = (key __ get_r __)*  (tag / List / Import)
Import = Input import
Input = input Expression

Block
  = "(" _ Expression _ ")"
  / "{" _ Expression _ "}"
  / "[" _ Expression _ "]"
  / IndentBlock

IndentBlock = BlockStart Expression
  BlockStart = $(EOL tab+)

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

prefix = $(export / import / not / lift / place)
infix = $(be / f / pair / or / xor / and / add / sub / mul / div / mod / get / compare / pow)
compare = $(lt / le / eq / ne / me / mt )
postfix = $(flat / factrial)

orxor
  = $(__ or __)
  / $(_ xor _)
additive = $(add / sub)
multiple = $(mul / div / mod)

export = $"#"
output = $"#"
place = $"$"
be = $":"
f = $"?"
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
