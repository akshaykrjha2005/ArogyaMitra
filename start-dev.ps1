# ArogyaMitra Startup Script
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue
Write-Host "Starting ArogyaMitra (PHC Connect) Development Servers..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "• API Server:        http://localhost:5000" -ForegroundColor Blue
Write-Host "• Patient Mobile:    http://localhost:3000" -ForegroundColor Green
Write-Host "• Staff Dashboard:   http://localhost:3001" -ForegroundColor Magenta
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
& npm.cmd run dev
