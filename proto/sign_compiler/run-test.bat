@echo
setlocal

REM テスト実行
REM Sign中間表現の変換確認
REM .\bin\sign_compiler.exe preprocess .\example\sign-preprocessor_test.sn --output .\example\sign-preprocessor_test_processed.sn --dump
.\bin\sign_compiler.exe preprocess .\example\sign_ast_samples.sn --output .\example\sign_ast_samples_processed.sn --dump

endlocal