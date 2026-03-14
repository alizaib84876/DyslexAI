# DyslexAI

**Local-first OCR and adaptive exercises for dyslexic students.**

DyslexAI is a **web app** that combines a research-backed handwriting OCR pipeline with an adaptive exercise backend. It extracts difficult handwriting, corrects OCR noise, and delivers personalized typing, handwriting, and tracing exercises—all designed for dyslexic learners.

**Status:** DEMO READY — suitable for FYP submission and portfolio.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org)

---

## Key Features

| Feature | Description |
|--------|-------------|
| **Hybrid OCR** | DocTR detection + TrOCR recognition via NotebookPipeline (notebook_parity) |
| **Correction pipeline** | Lexical cleanup → ByT5 context repair → optional Groq LLM |
| **Adaptive exercises** | Word typing, sentence typing, handwriting, tracing |
| **Student dashboard** | Track progress, history, and word mastery |
| **Tracing canvas** | On-screen letter/word tracing with stroke capture |
| **Offline-first** | Runs locally; no cloud dependency for OCR |

---

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Backend:** FastAPI, SQLAlchemy, Uvicorn
- **OCR:** DocTR (line detection) + TrOCR (recognition) + ByT5 (correction)
- **Database:** SQLite (default) or PostgreSQL

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite) — port 5173                             │
│  Dashboard | Exercises | Workspace | Students | History | Game   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  dyslexia-backend (FastAPI) — port 8000                          │
│  OCR | Auth | Dashboard | Exercises | Sessions                  │
│  DocTR + TrOCR + ByT5 | Groq LLM (optional)                      │
└─────────────────────────────────────────────────────────────────┘
```

- **Active backend:** `dyslexia-backend/` (single unified API)
- **Active frontend:** `frontend/`
- **Active OCR path:** `POST /api/ocr/process` → NotebookPipeline → NotebookOCREngine → notebook layers
- **Default OCR mode:** `notebook_parity` (verified on 6 golden samples)

---

## Repository Structure

```
dyslexai-/
├── dyslexia-backend/     # Single backend: OCR + auth + exercises (port 8000)
├── frontend/              # React SPA
├── scripts/
│   ├── setup.ps1          # One-time setup
│   ├── run.ps1            # Full stack (PostgreSQL)
│   └── run-simple.ps1     # Simple mode (SQLite, no Docker)
├── docs/                  # Architecture, getting started, troubleshooting
├── tests/
└── README.md
```

---

## Quick Start (Fastest Path)

**Prerequisites:** Python 3.9+, Node.js 18+, Git

```bash
# 1. Clone
git clone https://github.com/abubakarshahid16/dyslexai-.git
cd dyslexai-

# 2. Setup (one-time)
.\scripts\setup.ps1

# 3. Run (no Docker? use run-simple.ps1 or start-demo.ps1)
.\scripts\run-simple.ps1
```

Then open **http://localhost:5173** — sign up, log in, and start using the app.

---

## Full Setup

### 1. Clone

```bash
git clone https://github.com/abubakarshahid16/dyslexai-.git
cd dyslexai-
```

### 2. One-Time Setup

```powershell
.\scripts\setup.ps1
```

This will:
- Start PostgreSQL (Docker) — or use SQLite if Docker unavailable
- Create Python venv in `dyslexia-backend`
- Install backend & frontend dependencies
- Seed exercises
- Create `.env` from `.env.example`

**If Docker fails:** Set `DATABASE_URL=sqlite:///./dyslexia.db` in `dyslexia-backend/.env`, then run `cd dyslexia-backend; .\venv\Scripts\python.exe db/seed.py`

### 3. Run the App

| Command | Use When |
|---------|----------|
| `.\scripts\run-simple.ps1` | **Recommended** — No Docker, SQLite, all features work |
| `.\start-demo.ps1` | Same as run-simple.ps1 (convenience wrapper) |
| `.\scripts\run.ps1` | Docker/PostgreSQL available |

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:5173

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | DB connection | `sqlite:///./dyslexia.db` (run-simple) |
| `GROQ_API_KEY` | Groq API key for LLM feedback | Optional |
| `JWT_SECRET` | JWT signing secret | `change-this-in-production` |
| `OCR_MODE` | `notebook_parity` (verified) or `production` | `notebook_parity` |
| `VITE_API_BASE_URL` | API base for frontend | `http://localhost:8000/api` |
| `VITE_EXERCISES_API` | Exercise backend URL | `http://localhost:8000` |

---

## Demo User / Auth Notes

- **No pre-seeded users** — create an account at `/signup`
- **Any email/password** (min 6 chars) works
- Token persists in `localStorage`; refresh keeps session
- See [DEMO_FLOW.md](DEMO_FLOW.md) for a step-by-step walkthrough

---

## OCR Pipeline Explanation

**Active path:** `/api/ocr/process` → `NotebookPipeline` → `NotebookOCREngine` (DocTR + TrOCR) → layer_1_sanitize → layer_2_dyslexia_fix → Groq (optional)

**Default mode:** `notebook_parity` — locked, matches research notebook outputs. Verified on 6 golden samples.

**First run:** Models download on first OCR upload; expect 30–90 seconds. Subsequent runs are faster.

---

## Frontend Pages / Features

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Welcome; sign up / log in |
| Dashboard | `/dashboard` | Metrics, chart, recent OCR history |
| Workspace | `/workspace` | Upload image, OCR, raw/corrected/layers view |
| History | `/history` | OCR runs; approve/edit/reject |
| Exercises | `/exercises` | Student picker, typing/handwriting/tracing |
| Game Mode | `/game` | Gamified exercise flow |
| Students | `/students` | Manage students |
| Settings | `/settings` | User preferences |

See [docs/FEATURES.md](docs/FEATURES.md) for full list.

---

## Testing / Verification

```bash
cd dyslexia-backend

# OCR regression (notebook_parity lock-in, 6 golden samples)
python scripts/ocr_regression.py --report FINAL_OCR_REGRESSION_REPORT.json

# Auth proof (18 tests)
python scripts/auth_proof.py

# Unit tests
pytest
```

---

## Screenshots

| Page | Description |
|------|-------------|
| Dashboard | Metrics, chart, recent OCR history |
| Workspace | Upload image, OCR, raw/corrected/layers view |
| Exercises | Student picker, typing/handwriting/tracing |

Capture instructions: [frontend/final-demo-screenshots/README.md](frontend/final-demo-screenshots/README.md) | Save to [docs/screenshots/](docs/screenshots/)

---

## Known Limitations

1. **Students shared** — All users see the same student pool
2. **Cloud refinement** — Planned; not implemented
3. **OCR latency** — 30–180 sec per image
4. **Single backend** — No horizontal scaling

---

## Submission / Demo Status

| Item | Status |
|------|--------|
| OCR notebook_parity | ✓ Locked, 6/6 regression pass |
| Auth | ✓ Enforced, 18/18 auth proof pass |
| Frontend | ✓ Complete |
| Demo flow | ✓ Documented |
| **Verdict** | **DEMO READY** |

See [SUBMISSION_MANIFEST.md](SUBMISSION_MANIFEST.md), [RELEASE_READINESS_REPORT.md](RELEASE_READINESS_REPORT.md), [FINAL_EVALUATION.md](FINAL_EVALUATION.md), [FINAL_DEMO_PROOF.md](FINAL_DEMO_PROOF.md).

---

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architecture overview
- [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) — Step-by-step setup
- [docs/RUN_MODES.md](docs/RUN_MODES.md) — run.ps1 vs run-simple.ps1
- [docs/OCR_PIPELINE.md](docs/OCR_PIPELINE.md) — OCR pipeline details
- [docs/FEATURES.md](docs/FEATURES.md) — User-facing pages
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — Common issues
- [docs/FINAL_STATUS.md](docs/FINAL_STATUS.md) — What's complete, what's not

---

## License

MIT

---

## Acknowledgments

- [TrOCR](https://huggingface.co/microsoft/trocr-large-handwritten) for handwriting recognition
- [DocTR](https://github.com/mindee/doctr) for line detection
- [ByT5](https://huggingface.co/google/byt5-small) for byte-level correction
- [dyslexia-backend](https://github.com/alizaib84876/dyslexia-backend) for adaptive exercise logic
