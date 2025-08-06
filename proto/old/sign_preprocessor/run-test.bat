@echo
setlocal

REM テスト実行
.\bin\sign_compiler.exe preprocess .\example\sample_test.sn --output .\example\sample_test_processed.sn --dump

endlocal