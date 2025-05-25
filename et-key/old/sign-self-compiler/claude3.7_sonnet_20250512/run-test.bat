@echo
setlocal

REM テスト実行
.\bin\sign_compiler.exe preprocess .\example\sample_test.sn --dump
.\bin\sign_compiler.exe tokenize .\example\sample_test.sn --output tokens.json
.\bin\sign_compiler.exe parse .\example\sample_test.sn --output parse.txt

endlocal