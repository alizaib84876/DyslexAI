# Prepare DyslexAI for GitHub - run this from project root
# Then create repo on GitHub and push (see instructions below)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Set-Location $Root

# Ensure .env is not committed (already in .gitignore)
if (Test-Path "dyslexia-backend\.env") {
    Write-Host "[OK] .env exists and is gitignored" -ForegroundColor Green
} else {
    Write-Host "[!] Copy dyslexia-backend\.env.example to .env and add GROQ_API_KEY" -ForegroundColor Yellow
}

# Remove API key from fyp.ipynb if present (security)
Write-Host "`n[!] Check fyp.ipynb - remove any hardcoded API keys before pushing" -ForegroundColor Yellow

# Initialize git if not already
if (-not (Test-Path ".git")) {
    git init
    Write-Host "[OK] Git initialized" -ForegroundColor Green
} else {
    Write-Host "[OK] Git already initialized" -ForegroundColor Green
}

# Add all files
git add -A
git status

Write-Host "`n=== Next steps ===" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub: https://github.com/new"
Write-Host "   - Name: dyslexai (or your choice)"
Write-Host "   - Do NOT initialize with README (we have one)"
Write-Host ""
Write-Host "2. Run these commands (replace YOUR_USERNAME with your GitHub username):"
Write-Host ""
Write-Host "   git add -A"
Write-Host "   git commit -m `"Initial commit: DyslexAI OCR and adaptive exercises`""
Write-Host "   git branch -M main"
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/dyslexai.git"
Write-Host "   git push -u origin main"
Write-Host ""
