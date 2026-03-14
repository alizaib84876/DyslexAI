# One-click push to GitHub
# Run this from project root. Requires Git and GitHub login.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Find Git
$git = $null
if (Get-Command git -ErrorAction SilentlyContinue) { $git = "git" }
elseif (Test-Path "C:\Program Files\Git\bin\git.exe") { $git = "C:\Program Files\Git\bin\git.exe" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Git\bin\git.exe") { $git = "$env:LOCALAPPDATA\Programs\Git\bin\git.exe" }

if (-not $git) {
    Write-Host "Git is not installed." -ForegroundColor Red
    Write-Host "Install from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Pushing DyslexAI to GitHub ===" -ForegroundColor Cyan

# Init and commit
if (-not (Test-Path ".git")) {
    & $git init
    Write-Host "[OK] Git initialized" -ForegroundColor Green
}

& $git add -A
$status = & $git status --porcelain
if (-not $status) {
    Write-Host "Nothing to commit (already up to date)" -ForegroundColor Yellow
} else {
    & $git commit -m "Initial commit: DyslexAI OCR and adaptive exercises"
    Write-Host "[OK] Committed" -ForegroundColor Green
}

& $git branch -M main 2>$null

# Check remote
$remote = & $git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host ""
    Write-Host "No GitHub remote set. Enter your GitHub username:" -ForegroundColor Yellow
    $username = Read-Host
    if ($username) {
        & $git remote add origin "https://github.com/$username/dyslexai.git"
        Write-Host "[OK] Remote added" -ForegroundColor Green
    }
}

# Push
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
& $git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Done! ===" -ForegroundColor Green
    Write-Host "If the repo didn't exist, create it first: https://github.com/new (name: dyslexai)"
} else {
    Write-Host ""
    Write-Host "Push failed. Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Create repo at https://github.com/new (name: dyslexai, leave empty)"
    Write-Host "2. Sign in: git config --global user.name 'Your Name'"
    Write-Host "3. Use GitHub CLI: winget install GitHub.cli"
}
