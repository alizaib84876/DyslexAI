# Full OCR lock-in verification — regression + mode proof
# Run from repo root. Requires: dyslexia-backend venv, sample images in root.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "dyslexia-backend"
$Venv = Join-Path $Backend "venv"
$Py = if (Test-Path "$Venv\Scripts\python.exe") { "$Venv\Scripts\python.exe" } else { "python" }

Write-Host "=== OCR Regression Lock-In ===" -ForegroundColor Cyan
$env:OCR_MODE = "notebook_parity"
$env:DATABASE_URL = "sqlite:///./dyslexia.db"
$env:GROQ_API_KEY = ""  # Disable Groq for deterministic regression (optional)

Set-Location $Backend
# Use cmd to avoid PowerShell treating Python INFO logs (stderr) as errors
cmd /c "`"$Py`" scripts/ocr_regression.py --samples-dir `"$Root`""
$exitCode = $LASTEXITCODE
Set-Location $Root
exit $exitCode
