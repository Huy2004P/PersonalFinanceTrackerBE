@echo off
chcp 65001 > nul
title Personal Finance Tracker Backend

echo.
echo ╔════════════════════════════════════════════╗
echo ║   Personal Finance Tracker - Backend       ║
echo ╚════════════════════════════════════════════╝
echo.

REM Kiểm tra Node.js đã cài đặt chưa
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Lỗi: Node.js chưa được cài đặt!
    echo Vui lòng cài đặt Node.js từ https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js đã được cài đặt
node --version
echo.

REM Kiểm tra npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Lỗi: npm chưa được cài đặt!
    pause
    exit /b 1
)

echo ✓ npm đã được cài đặt
npm --version
echo.

REM Kiểm tra file .env
if not exist ".env" (
    echo ⚠️  Cảnh báo: File .env chưa được tạo
    echo Vui lòng tạo file .env và cấu hình biến môi trường
    echo.
)

REM Kiểm tra file serviceAccountKey.json
if not exist "serviceAccountKey.json" (
    echo ⚠️  Cảnh báo: File serviceAccountKey.json chưa được tìm thấy
    echo Vui lòng thêm file serviceAccountKey.json từ Firebase Console
    echo.
)

REM Kiểm tra node_modules
if not exist "node_modules" (
    echo 📦 Cài đặt dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Lỗi: Không thể cài đặt dependencies
        pause
        exit /b 1
    )
    echo ✓ Cài đặt dependencies thành công
    echo.
)

echo 🚀 Đang khởi động server...
echo.

REM Menu chọn chế độ chạy
echo Vui lòng chọn chế độ chạy:
echo [1] Production (node index.js)
echo [2] Development (nodemon index.js)
echo.
set /p choice="Nhập lựa chọn [1 hoặc 2]: "

if "%choice%"=="1" (
    echo.
    echo ▶️  Chạy ở chế độ Production...
    echo.
    call npm start
) else if "%choice%"=="2" (
    REM Kiểm tra nodemon
    where nodemon >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️  nodemon chưa được cài đặt toàn cục
        echo Cài đặt dependencies để sử dụng nodemon...
        call npm install
    )
    echo.
    echo ▶️  Chạy ở chế độ Development (nodemon)...
    echo.
    call npm run dev
) else (
    echo ❌ Lựa chọn không hợp lệ! Chạy ở chế độ Production mặc định
    echo.
    call npm start
)

pause
