     Start = t:Token* {return t.join("")} 

        Token = 
            String     { return text(); }
            / Character { return text(); }
            / op:InfixOperator   { return ` ${op} `; }
            / _
            / Any         { return text(); }

        String = $("`" [^`\n\r]* "`")

        Character = $("\\" .)

        InfixOperator = 
              "<="  // less_equal
            / ">="  // more_equal
            / "=="  // equal
            / "!="  // not_equal
            / ":"   // define
            / "?"   // lambda
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
		_ = [ ] {return ""}
