# Deploy DyslexAI to GitHub

## Prerequisites

1. **Install Git**: https://git-scm.com/download/win
2. **Create GitHub account**: https://github.com

---

## Step 1: Create repository on GitHub

1. Go to https://github.com/new
2. **Repository name**: `dyslexai` (or your choice)
3. **Description**: `Local-first OCR and adaptive exercises for dyslexic students`
4. **Public**
5. **Do NOT** check "Add a README" (we already have one)
6. Click **Create repository**

---

## Step 2: Push your code

Open PowerShell in the project folder and run:

```powershell
# Initialize git (if not already)
git init

# Add all files
git add -A

# Commit
git commit -m "Initial commit: DyslexAI OCR and adaptive exercises"

# Create main branch
git branch -M main

# Add your GitHub repo (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/dyslexai.git

# Push
git push -u origin main
```

---

## Step 3: Security checklist before pushing

- [ ] **Remove API keys from `fyp.ipynb`** – replace with `os.getenv("GROQ_API_KEY")` or similar
- [ ] **Ensure `.env` is gitignored** – it should not be committed (contains `GROQ_API_KEY`)
- [ ] **Verify `.gitignore`** – excludes `venv/`, `node_modules/`, `.env`, `*.db`

---

## Step 4: Add screenshots (optional)

1. Run the app: `.\scripts\run.ps1`
2. Open http://localhost:5173
3. Take screenshots of Dashboard, Exercises, Workspace
4. Save as `screenshots/screenshot-dashboard.png`, etc.
5. Commit and push:

```powershell
git add screenshots/
git commit -m "Add app screenshots"
git push
```

---

## Optional: Deploy frontend to GitHub Pages

To host the frontend publicly:

1. Create `frontend/.github/workflows/deploy.yml` (or use Vercel/Netlify)
2. Set `VITE_EXERCISES_API` to your backend URL (or use a backend proxy)
3. For full app deployment, you'll need a backend host (e.g. Railway, Render)

---

## Repository structure (what gets pushed)

```
dyslexai/
├── backend/           # DyslexAI OCR API
├── dyslexia-backend/  # Exercise backend (no .env, no venv)
├── frontend/          # React app (no node_modules)
├── scripts/
├── screenshots/
├── tests/
├── docs/
├── README.md
├── DEPLOY.md
└── .gitignore
```
