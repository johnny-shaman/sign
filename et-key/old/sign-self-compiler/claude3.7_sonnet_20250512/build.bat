@echo
setlocal

REM コンパイラ設定
set CXX=g++
REM 通常設定
REM set CXXFLAGS=-std=c++17 -Wall -Wextra -Wpedantic
set INCLUDES=-Isrc -Iutils

REM デバッグ設定
set CXXFLAGS=-std=c++17 -Wall -Wextra -Wpedantic -g -O0 -DDEBUG


REM 出力ディレクトリ
if not exist bin mkdir bin

REM コンパイル実行
echo ビルドを開始します...
%CXX% %CXXFLAGS% %INCLUDES% ^
src\common\error_reporter.cpp ^
src\preprocessor\preprocessor.cpp ^
src\lexer\token.cpp ^
src\lexer\lexer.cpp ^
src\parser\ast\ast_node.cpp ^
src\parser\operator_precedence.cpp ^
src\parser\parser.cpp ^
src\compiler_pipeline.cpp ^
src\main.cpp ^
-o bin\sign_compiler.exe

if %ERRORLEVEL% EQU 0 (
    echo ビルド成功: bin\sign_compiler.exe が作成されました
) else (
    echo ビルド失敗: エラーコード %ERRORLEVEL%
)

endlocal