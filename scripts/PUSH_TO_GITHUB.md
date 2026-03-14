# Push DyslexAI to GitHub (No Git Required)

This script creates the repo and uploads all code via the GitHub API.

## Step 1: Create a GitHub token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name it: `DyslexAI push`
4. Check scope: **repo** (full control)
5. Generate and **copy the token**

## Step 2: Run the script

**PowerShell:**
```powershell
cd "c:\Users\abuba\OneDrive\Desktop\New folder"
$env:GITHUB_TOKEN = "ghp_your_token_here"
python scripts\github_create_and_push.py
```

**Or in one line:**
```powershell
$env:GITHUB_TOKEN = "ghp_xxx"; python "c:\Users\abuba\OneDrive\Desktop\New folder\scripts\github_create_and_push.py"
```

Replace `ghp_xxx` with your actual token.

## Result

- Creates `https://github.com/YOUR_USERNAME/dyslexai`
- Uploads all project files (excluding .env, venv, node_modules)
- No Git installation needed
