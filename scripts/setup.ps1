# DyslexAI + dyslexia-backend setup script (Windows)
# Run once to prepare DB, venv, deps, and seed data.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "=== DyslexAI Setup ===" -ForegroundColor Cyan
Write-Host "Root: $Root"

# 1. Start PostgreSQL (Docker)
Write-Host "`n[1/6] Starting PostgreSQL..." -ForegroundColor Yellow
$dbExists = docker ps -a --format "{{.Names}}" 2>$null | Select-String -Pattern "dyslexia-db"
if ($dbExists) {
    docker start dyslexia-db 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "  (docker start failed - is Docker running?)" -ForegroundColor DarkYellow }
} else {
    docker run --name dyslexia-db `
        -e POSTGRES_DB=dyslexia_db `
        -e POSTGRES_USER=dev `
        -e POSTGRES_PASSWORD=devpass `
        -p 5432:5432 `
        -d postgres:15 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "  Docker not available - ensure Docker Desktop is running" -ForegroundColor Red; exit 1 }
}
Write-Host "  OK" -ForegroundColor Green

# 2. dyslexia-backend venv
$Backend = Join-Path $Root "dyslexia-backend"
$Venv = Join-Path $Backend "venv"
Write-Host "`n[2/6] Creating Python venv in dyslexia-backend..." -ForegroundColor Yellow
if (-not (Test-Path $Venv)) {
    python -m venv $Venv
    if ($LASTEXITCODE -ne 0) { Write-Host "  Python venv failed" -ForegroundColor Red; exit 1 }
}
Write-Host "  OK" -ForegroundColor Green

# 3. Install backend deps
Write-Host "`n[3/6] Installing dyslexia-backend dependencies..." -ForegroundColor Yellow
& "$Venv\Scripts\pip.exe" install -r (Join-Path $Backend "requirements.txt") -q
if ($LASTEXITCODE -ne 0) { Write-Host "  pip install failed" -ForegroundColor Red; exit 1 }
Write-Host "  OK" -ForegroundColor Green

# 4. .env
$EnvExample = Join-Path $Backend ".env.example"
$EnvFile = Join-Path $Backend ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "`n[4/6] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item $EnvExample $EnvFile
    Write-Host "  Edit $EnvFile and add your GROQ_API_KEY" -ForegroundColor DarkYellow
} else {
    Write-Host "`n[4/6] .env exists, skipping" -ForegroundColor Yellow
}
Write-Host "  OK" -ForegroundColor Green

# 5. Seed
Write-Host "`n[5/6] Seeding exercises..." -ForegroundColor Yellow
Push-Location $Backend
& "$Venv\Scripts\python.exe" db/seed.py
if ($LASTEXITCODE -ne 0) { Write-Host "  Seed failed (DB may not be ready - try again)" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "  OK" -ForegroundColor Green

# 6. Frontend deps (dyslexia-backend venv from step 2 serves OCR + exercises)
$Frontend = Join-Path $Root "frontend"
Write-Host "`n[6/6] Installing frontend dependencies..." -ForegroundColor Yellow
$NodePath = Join-Path $Root "tools\node-v24.11.0-win-x64"
if (Test-Path $NodePath) {
    $env:PATH = "$NodePath;$env:PATH"
}
npm install --prefix $Frontend 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  npm install failed" -ForegroundColor Red; exit 1 }
Write-Host "  OK" -ForegroundColor Green

Write-Host "`n=== Setup complete ===" -ForegroundColor Cyan
Write-Host "Run: .\scripts\run.ps1  to start backend and frontend" -ForegroundColor White
