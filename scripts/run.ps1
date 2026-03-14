# Start DyslexAI: unified backend + frontend
# - Unified backend (port 8000): Dashboard, OCR, Exercises, Game Mode, Sessions
# Run after setup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$ExercisesBackend = Join-Path $Root "dyslexia-backend"
$Frontend = Join-Path $Root "frontend"
$ExercisesVenv = Join-Path $ExercisesBackend "venv"
$NodePath = Join-Path $Root "tools\node-v24.11.0-win-x64"

# Ensure DB is running (optional)
if (Get-Command docker -ErrorAction SilentlyContinue) { docker start dyslexia-db 2>$null }

# Free port 8000 if occupied by python/uvicorn (e.g. from previous run)
foreach ($port in 8000) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and ($proc.ProcessName -match "python|uvicorn|node")) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
}

# Add Node to PATH if present
if (Test-Path $NodePath) { $env:PATH = "$NodePath;$env:PATH" }

Write-Host "=== DyslexAI Full Stack ===" -ForegroundColor Cyan
Write-Host "Unified backend:  http://localhost:8000" -ForegroundColor White
Write-Host "Frontend:         http://localhost:5173" -ForegroundColor White
Write-Host ""

# --- OCR Configuration ---
# TROCR_FAST: 0 = TrOCR-large (best accuracy), 1 = TrOCR-base (faster, lower accuracy)
# QUALITY_MODE: quality_local (default), fast_local, cloud_refine
# TROCR_WORKERS: parallel TrOCR workers. Default=2 (safe for 8GB RAM).
#   Set =4 for 16GB+, =6 for 32GB+, =1 for low-memory machines.
# DYSLEXAI_ENABLE_L4: 1 = Groq LLM Layer 4 enabled (optional), 0 = disabled

# 1. Start unified backend (port 8000) - OCR, Dashboard, Exercises, Game Mode
# OCR_MODE=notebook_parity: verified default (0 mismatches on 6 hard samples)
$py = if (Test-Path "$ExercisesVenv\Scripts\python.exe") { "$ExercisesVenv\Scripts\python.exe" } else { "python" }
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:OCR_MODE='notebook_parity'; `$env:TROCR_FAST='0'; `$env:QUALITY_MODE='quality_local'; `$env:TROCR_WORKERS='2'; `$env:DYSLEXAI_ENABLE_L4='1'; cd '$ExercisesBackend'; & '$py' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# Give backend time to start
Start-Sleep -Seconds 5

# 2. Start frontend — both API URLs point to unified backend
$env:VITE_API_BASE_URL = "http://localhost:8000/api"
$env:VITE_EXERCISES_API = "http://localhost:8000"
Set-Location $Frontend
npm run dev
