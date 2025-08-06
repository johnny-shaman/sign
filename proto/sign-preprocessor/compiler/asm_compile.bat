@echo off
echo Compiling ARM64 assembly via WSL...

rem Change to the directory where this batch file is located
cd /d "%~dp0"

rem Check if output.s exists
if not exist "output.s" (
    echo Error: output.s not found in current directory!
    echo Current directory: %CD%
    dir *.s
    pause
    exit /b 1
)

rem Convert Windows path to WSL Linux path
set CURRENT_DIR=%CD%
set WSL_PATH=%CURRENT_DIR:C:=/mnt/c%
set WSL_PATH=%WSL_PATH:\=/%

echo Current directory: %CD%
echo WSL path: %WSL_PATH%

wsl --cd "%WSL_PATH%" aarch64-linux-gnu-as -o output.o output.s
if %errorlevel% neq 0 (
    echo Assembly failed!
    pause
    exit /b 1
)

wsl --cd "%WSL_PATH%" aarch64-linux-gnu-ld -o output output.o
if %errorlevel% neq 0 (
    echo Linking failed!
    pause
    exit /b 1
)

echo Compilation successful!
echo Output file: output
