@echo off
echo Starting SalesPrep...
echo.

start "SalesPrep Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak >nul
start "SalesPrep Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo =========================================
echo  SalesPrep is running!
echo  Open: http://localhost:5173
echo  Login: mirza.22sept@gmail.com / 1234567
echo =========================================
echo.
start http://localhost:5173
