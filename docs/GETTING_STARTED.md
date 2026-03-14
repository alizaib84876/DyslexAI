# Getting Started with DyslexAI

## Prerequisites

- **Python 3.9+**
- **Node.js 18+** (or use bundled Node in `tools/`)
- **Git**
- **Docker Desktop** (optional; use SQLite if unavailable)

---

## Step 1: Clone

```bash
git clone https://github.com/abubakarshahid16/dyslexai-.git
cd dyslexai-
```

---

## Step 2: One-Time Setup

```powershell
.\scripts\setup.ps1
```

This will:
- Start PostgreSQL (Docker) — or skip if Docker unavailable
- Create Python venv in `dyslexia-backend`
- Install backend dependencies (torch, transformers, python-doctr, etc.)
- Install frontend dependencies
- Seed exercises
- Copy `.env.example` to `.env`

**If Docker fails:** Edit `dyslexia-backend/.env` and set:
```
DATABASE_URL=sqlite:///./dyslexia.db
```
Then run seed manually:
```powershell
cd dyslexia-backend
.\venv\Scripts\python.exe db/seed.py
```

**Optional:** Add `GROQ_API_KEY` to `.env` for LLM correction layer (Layer 3).

---

## Step 3: Run the App

**Recommended (no Docker):**
```powershell
.\scripts\run-simple.ps1
```

**With Docker/PostgreSQL:**
```powershell
.\scripts\run.ps1
```

---

## Step 4: Open in Browser

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000

---

## Step 5: Create Account

1. Go to http://localhost:5173/signup
2. Enter name, email, password (min 6 chars)
3. Submit — you'll be logged in and redirected to the dashboard

---

## First OCR Upload

1. Go to **Workspace**
2. Select an image (PNG, JPG)
3. Click **Process Document**
4. Wait 30–90 seconds (first run downloads models)
5. View raw text, corrected text, and correction layers

---

## Troubleshooting

See [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md).
