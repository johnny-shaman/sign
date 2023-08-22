start = expression* ;

expression =
    identifier
  / bind
  / lambda
  / boolean
  / logical
  / pair
  / list
  / dict
  / enum
  / access
  / integer
  / float
  / hex
  / character
  / string
  / unpack
  / strict_evaluation
  / binary_operator_partial
  / partial_apply
  / function_call
  / export
  / import
  / "(" expression ")" ;


bind = (identifier / reserved_identifier) ":" expression

lambda = identifier+ ";" expression ;

pair = expression "," expression ;

list = "[" expression* "]" / [ pair ] / spread ;

spread = (integer / character) "~" (integer / character) ;

dict = "{" [bind ("," / "\n")] "}" ;

enum = "{" expression "/" expression "}"

unpack = "~" (pair / list / string / dict / identifier / "(" expression ")") ;

flat = (list / string / identifier / "("expression")") "\\" ;

access = (identifier / reserved_identifier / dict / list) "'" (identifier / reserved_identifier / digit+ / string) ;

character = "`" (any / hex) ;

string = character+ / ("'`" any "`'") / ("\"" any "\"\n") ;

integer = ["-"] digit+ ;

float = ["-"] digit+ "." digit+ ;

hex = "0x" hex_digit+ ;

logical = logical "^" logical_term / logical_term ;

logical_term = logical_term "|" logical_factor / logical_factor ;

logical_factor = logical_factor "&" logical_unary / logical_unary ;

logical_unary = "!" logical_unary / "(" logical ")" / compare / boolean ;

compare = (arithmetic / character) ("=" / "!=" / "<" / "<=" / ">" / ">=") (arithmetic / character) / (string / list) ("=" / "!=") (string / list) ;

arithmetic = (arithmetic {("+" / "-") arithmetic}) / arithmetic_term ;

arithmetic_term = arithmetic_term {("*" / "%" / "/") arithmetic_term} / arithmetic_factor ;

arithmetic_factor = arithmetic_factor {"**" arithmetic_factor} / arithmetic_base ;

arithmetic_base = integer / float / "(" arithmetic ")" ;

binary_operator_partial = binary_operator value / value binary_operator ;

strict_evaluation = "$" expression ;

boolean = "_T_" / "_F_" ;

function_call = (identifier / "(" lambda ")") expression+ ;

partial_apply = (identifier / "(" lambda ")")  [arguments] "_" [arguments] ;

arguments = argument [ argument ] ;

argument = expression / "_" ;

identifier = letter [ letter / digit ] ;

export = "#" identifier ;

import = "@" identifier ;

reserved_identifier = "_" any+ ;

hex_digit = digit / "A" / "B" / "C" / "D" / "E" / "F" / "a" / "b" / "c" / "d" / "e" / "f" ;

letter = "A" / "B" / "C" / "D" / "E" / "F" / "G" / "H" / "I" / "J" / "K" / "L" / "M" / "N" / "O" / "P" / "Q" / "R" / "S" / "T" / "U" / "V" / "W" / "X" / "Y" / "Z" / "a" / "b" / "c" / "d" / "e" / "f" / "g" / "h" / "i" / "j" / "k" / "l" / "m" / "n" / "o" / "p" / "q" / "r" / "s" / "t" / "u" / "v" / "w" / "x" / "y" / "z" ;

digit = "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;

any = [ (?any Unicode character?) ] ;
