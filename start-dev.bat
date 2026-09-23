@echo off
echo Starting ArogyaMitra (PHC Connect) Development Servers...
echo ========================================================
echo - API Server:        http://localhost:5000
echo - Patient App:       http://localhost:3000
echo - Staff Dashboard:   http://localhost:3001
echo ========================================================
call npm.cmd run dev
pause
