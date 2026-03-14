# Create GitHub Repository for DyslexAI

## Prerequisites

1. **Install Git** (if not installed): https://git-scm.com/download/win  
2. **GitHub account**: https://github.com/signup

---

## Option A: One-Click Script (Recommended)

1. Open PowerShell in the project folder:
   ```powershell
   cd "c:\Users\abuba\OneDrive\Desktop\New folder"
   ```

2. Run the push script:
   ```powershell
   .\scripts\push-to-github.ps1
   ```

3. When prompted, enter your **GitHub username**.

4. **Before the first push:** Create the repo on GitHub:
   - Go to https://github.com/new
   - Repository name: `dyslexai` (or your choice)
   - Leave "Add a README" **unchecked**
   - Click **Create repository**

5. The script will push your code. If it fails, create the repo first (step 4), then run the script again.

---

## Option B: Manual Steps

### 1. Initialize Git and commit

```powershell
cd "c:\Users\abuba\OneDrive\Desktop\New folder"

git init
git add -A
git commit -m "Initial commit: DyslexAI OCR and adaptive exercises"
git branch -M main
```

### 2. Create repo on GitHub

- Go to https://github.com/new
- Name: `dyslexai`
- **Do not** add README, .gitignore, or license (we have them)
- Click **Create repository**

### 3. Add remote and push

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/dyslexai.git
git push -u origin main
```

---

## After Pushing

1. **Update README clone URL** (optional): Replace `YOUR_USERNAME` in README.md with your actual username.
2. **Add description** on GitHub: Settings → General → Description
3. **Add topics**: `ocr`, `dyslexia`, `education`, `fastapi`, `react`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Git is not recognized" | Install Git from https://git-scm.com/download/win, restart terminal |
| "Repository not found" | Create repo at https://github.com/new first |
| "Authentication failed" | Use GitHub CLI (`gh auth login`) or a Personal Access Token |
| "Permission denied" | Check you own the repo; use HTTPS not SSH if unsure |
