Start = e:Expression* {return e.join("");}

Expression
  = Export
  / Define
  / Output
  / Apply
  / Atoms
  / Function
  / Pair
  / atom
  / EOL


Export = c:export? r:Define
Define = l:tag _ c:be? _ r:Expression //右結合でOK
Output = l:(tag / hex / (input tag) / (obtain tag)) __ c:output? __ r:Expression //右結合にでOK

//演算の優先順位は Compute（階乗演算 > べき乗演算 > 乗除系演算 > 加減系演算 > 比較演算 > 論理演算） > Apply > LiteralProduct/にしたい
Apply = l:Function c:__ r:Atoms
Atoms = l:literal c:__ r:Expression* //右結合でOK

Function = Tagged / Closuer / Compose / Pointless
  Tagged = l:tag c:be? r:Closuer
  Closuer = l:(Arguments / unit) c:lambda r:Expression //右結合でOK

    Arguments = tag+ (lift tag)?

  Compose = l:(tag / Closuer / Pointless) c:_ r:Compose
  Pointless =
    "(" (DirectMap / DirectFold) ")"
    / "{" (DirectMap / DirectFold) "}"
    / "[" (DirectMap / DirectFold) "]"

    DirectMap = (
      (prefix"_")
      / (unit? infix unit?)
      / ("_"postfix)
      / PartialApply
    ) pair

      PartialApply = (l:unit? c:infix r:atom) / (l:atom c:infix r:unit?) / (c:tag r:Atoms)

//直和表現
      DirectFold = c:(infix / (unit infix unit) / PartialApply)

Pair =
  lift atom
    / "(" ((spreadable / tag) spread (spreadable / tag)) ")"
    / "{" ((spreadable / tag) spread (spreadable / tag)) "}"
    / "[" ((spreadable / tag) spread (spreadable / tag)) "]"
  / (Closuer / Compose / Pointless / atom) _ pair _ Expression //右結合でOK

/*
  = l:literal* _* c:infix _* r:Expression* {return `${l.join("")}${c}${r.flat(Infinity).join("")}`;}
  / l:literal+ r:postfix* { return `${l.join(" ").replace(/^ /gm, "").replace(/ +[\n]/gm, "\n")}${r.join("")}`;}
  / l:prefix+ r:Expression { return `${l.join("")}${r}`;}
  / $comment
  / _+ {return ` `;}
  / EOL
  ((prefix "_") / "_"? infix "_"? / ("_" postfix) / PartialApply / )
*/

Block
  = "(" _ r:(Expression) _ ")"
  / "{" _ r:(Expression) _ "}"
  / "[" _ r:(Expression) _ "]"
  / IndentBlock

IndentBlock = c:BlockStart r:Expression+
  BlockStart = $(EOL tab+)

literal = atom / Block
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
blockInfix = s:$(infix / spread)
infix = s:(be / lambda / pair / or / xor / and / add / sub / mul / div / mod / get / compare / pow) {return ` ${s} `}
compare = $(lt / le / eq / ne / me / mt )
postfix = $(flat / factrial)

logicOr = $(or / xor)
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
import = $"@"
input = $"@"
tab = $"\t"
EOL = $("\n" / "\r" "\n"?)
_ = $(" "*) {return " "}
__ = $(" "+) {return " "}
