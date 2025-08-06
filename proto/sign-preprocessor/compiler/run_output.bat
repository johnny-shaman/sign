@echo off
echo Running ARM64 binary via WSL...

rem Change to the directory where this batch file is located
cd /d "%~dp0"

rem Check if output binary exists
if not exist "output" (
    echo Error: output binary not found in current directory!
    echo Current directory: %CD%
    dir output*
    pause
    exit /b 1
)

rem Convert Windows path to WSL Linux path
set CURRENT_DIR=%CD%
set WSL_PATH=%CURRENT_DIR:C:=/mnt/c%
set WSL_PATH=%WSL_PATH:\=/%

echo Current directory: %CD%
echo WSL path: %WSL_PATH%
echo.

rem Check if qemu-aarch64-static is available
wsl which qemu-aarch64-static >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: qemu-aarch64-static not found in WSL!
    echo Please install it with: wsl sudo apt install qemu-user-static
    pause
    exit /b 1
)

echo Executing ARM64 binary...
echo ----------------------------------------

rem Execute the ARM64 binary
wsl --cd "%WSL_PATH%" qemu-aarch64-static ./output

echo ----------------------------------------
echo Execution completed with exit code: %errorlevel%
echo.
pause