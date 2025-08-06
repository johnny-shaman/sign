// LanguageServer\src\formatter.pegjs 流用
// 引数の間のスペース削除される部分、単項マイナスを修正
        Start = t:Token* {
            let result = t.join("").replace(/  +/g, " ");
            // 単項マイナスのパターンを修正（複数のパターンに分けて）
            result = result.replace(/(\n\s+) - ([a-zA-Z0-9_])/g, '$1-$2');  // 行頭
            result = result.replace(/(:\s*) - ([a-zA-Z0-9_])/g, '$1-$2');   // コロン後
            result = result.replace(/([,&|;(]) - ([a-zA-Z0-9_])/g, '$1-$2'); // その他
            return result;
        }
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
		_ = [ ]+ {return " "}
