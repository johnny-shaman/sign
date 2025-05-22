@echo
setlocal

REM テスト実行
REM Sign中間表現の変換確認
.\bin\sign_compiler.exe preprocess .\example\sign-preprocessor_test.sn --output .\example\sign-preprocessor_test_processed.sn --dump

endlocal