     Start = t:Token* {return t.join("")} 

        Token = 
            String     { return text(); }
            / Character { return text(); }
            / Number     { return text(); }
            / _ op:InfixOperator _ {return ` ${op} `}
            / op:InfixOperator _ {return ` ${op} `}
            / _ op:InfixOperator {return ` ${op} `}
            / op:InfixOperator   { return ` ${op} `; }
            / Any         { return text(); }

        String = $("`" [^`\n\r]* "`")

        Character = $("\\" .)

        InfixOperator = 
              ":"   // define
            / "?"   // lambda
            / "<"   // less
            / ">"   // more
            / "<="  // less_equal
            / ">="  // more_equal
            / "="   // equal
            / "=="  // equal
            / "!="  // not_equal
            / ","   // product
            / ";"   // xor
            / "&"   // and
            / "<"   // less
            / ">"   // more
            / "="   // equal
            / "+"   // add
            / "-"   // sub
            / "*"   // mul
            / "/"   // div
            / "%"   // mod
            / "^"   // pow
            / "'"   // get

        Any = $.

        _ = $[ ] {return " "} // whitespace

        Number = 
            $([0])
            / $([-]?[0-9]*[.]?[0-9]+[e]?[0-9]+)
            / $(([-]?([0-9]{1,3})([,]?[0-9]{3})*[.]?[0-9]*)[e]?[0-9]*)