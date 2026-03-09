# SellSathi Status Check Script
Write-Host "`n=== SellSathi Status Check ===" -ForegroundColor Cyan

# Check Backend
Write-Host "`n1. Checking Backend (Port 5000)..." -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    if ($backend.StatusCode -eq 200) {
        Write-Host "   ✓ Backend is UP and running!" -ForegroundColor Green
        Write-Host "   Response: $($backend.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Backend is NOT responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check Frontend
Write-Host "`n2. Checking Frontend (Port 5173)..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5
    if ($frontend.StatusCode -eq 200) {
        Write-Host "   ✓ Frontend is UP and running!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Frontend is NOT responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check Configuration Files
Write-Host "`n3. Checking Configuration Files..." -ForegroundColor Yellow

if (Test-Path "backend/.env") {
    Write-Host "   ✓ backend/.env exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ backend/.env is missing" -ForegroundColor Red
}

if (Test-Path "backend/serviceAccountKey.json") {
    Write-Host "   ✓ backend/serviceAccountKey.json exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ backend/serviceAccountKey.json is missing" -ForegroundColor Red
}

if (Test-Path "frontend/.env") {
    Write-Host "   ✓ frontend/.env exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ frontend/.env is missing" -ForegroundColor Red
}

# Check Node Modules
Write-Host "`n4. Checking Dependencies..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   ✓ Root node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Root node_modules is missing" -ForegroundColor Red
}

if (Test-Path "backend/node_modules") {
    Write-Host "   ✓ Backend node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend node_modules is missing" -ForegroundColor Red
}

if (Test-Path "frontend/node_modules") {
    Write-Host "   ✓ Frontend node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Frontend node_modules is missing" -ForegroundColor Red
}

# Summary
Write-Host "`n=== Access URLs ===" -ForegroundColor Cyan
Write-Host "Frontend:    http://localhost:5173/" -ForegroundColor White
Write-Host "Backend:     http://localhost:5000/" -ForegroundColor White
Write-Host "Admin Login: http://localhost:5173/admin/login" -ForegroundColor White
Write-Host "`nAdmin Credentials:" -ForegroundColor Cyan
Write-Host "Phone: 7483743936" -ForegroundColor White
Write-Host "OTP:   123456" -ForegroundColor White

Write-Host "`n=== Status Check Complete ===`n" -ForegroundColor Cyan
