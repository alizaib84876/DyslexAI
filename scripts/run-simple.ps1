# Simple mode: Exercises backend only (port 8000)
# Use when Docker/PostgreSQL not running or for quick exercises testing.
# Dashboard, Workspace, History will show errors - Exercises and Game Mode work.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$ExercisesBackend = Join-Path $Root "dyslexia-backend"
$Frontend = Join-Path $Root "frontend"
$Venv = Join-Path $ExercisesBackend "venv"
$NodePath = Join-Path $Root "tools\node-v24.11.0-win-x64"

if (Get-Command docker -ErrorAction SilentlyContinue) { docker start dyslexia-db 2>$null }
if (Test-Path $NodePath) { $env:PATH = "$NodePath;$env:PATH" }

Write-Host "Simple mode: Exercises only on http://localhost:8000" -ForegroundColor Cyan
$env:VITE_API_BASE_URL = "http://localhost:8000/api"
$env:VITE_EXERCISES_API = "http://localhost:8000"

# Use SQLite (works without Docker). Seed then start.
# OCR_MODE=notebook_parity: verified default. TROCR_FAST=1 for faster OCR (TrOCR-base).
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:OCR_MODE='notebook_parity'; `$env:TROCR_FAST='1'; `$env:DATABASE_URL='sqlite:///./dyslexia.db'; cd '$ExercisesBackend'; & '$Venv\Scripts\python.exe' db/seed.py; & '$Venv\Scripts\python.exe' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
Start-Sleep -Seconds 4
Set-Location $Frontend
npm run dev
