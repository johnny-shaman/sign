// LanguageServer\src\prep_func.pegjs 流用
// Identifierの部分を追加（引数が文字列の場合も置換可能に修正）
       Start = t:Token* {return t.join("")}

        Token = 
            String     { return text(); }
            / Character { return text(); }
            / l:Lambda          { return l; }
            / Identifier { return text(); }
            / _
            / AnyChar         { return text(); }

        String = $("`" [^`\n\r]* "`")

        Character = $("\\" .)

       Lambda = 
            params:Parameters _ "?" _ body:Token+ {
				console.log(params);
                const paramMap = {};
                let index = 0;
                
                // 引数部分を位置ベースに変換
                const Params = params.map(o => o.paramForm ).join(' ');
				const Body = body.flatMap(
                	bt => params.filter(o => o.name === bt).length
						? params.filter(o => o.name === bt).map(o => o[bt])
                        : bt
                ).join("");
                return `${Params} ? ${Body}`;
            }

        Parameters = _0:Parameter _1:(_ p:Parameter { return p})*{
            return [_0, ..._1].map(
				(o, i) => Object.assign(o, {
					[o.name] : `_${i}`,           // ボディ置換用（~なし）
					paramForm: `${o.continue}_${i}` // パラメータリスト用（~あり）
				})
			);
		}

        Parameter = 
            "~" name:Identifier { return { name, continue: "~" }; }
            / name:Identifier { return { name, continue: "" }; }

        Identifier = $([a-zA-Z_][a-zA-Z0-9_]*)

        _ = [ ]
        EOL = [\\n\\r]
        AnyChar = .
