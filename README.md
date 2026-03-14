# DyslexAI

**Local-first OCR and adaptive exercises for dyslexic students.**

DyslexAI combines a research-backed handwriting OCR pipeline with an adaptive exercise backend. It extracts difficult handwriting, corrects OCR noise, and delivers personalized typing, handwriting, and tracing exercises—all designed for dyslexic learners.

**Status:** DEMO READY — suitable for FYP submission and evaluation.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org)

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| **Hybrid OCR** | PaddleOCR primary + TrOCR Large fallback for difficult handwriting |
| **Correction pipeline** | Lexical cleanup → ByT5 context repair → spelling refinement |
| **Adaptive exercises** | Word typing, sentence typing, handwriting, tracing |
| **Student dashboard** | Track progress, history, and word mastery |
| **Tracing canvas** | On-screen letter/word tracing with stroke capture |
| **Offline-first** | Runs locally; no cloud dependency for OCR |

---

## 📸 Screenshots

- **Dashboard** – Performance overview, metrics, recent OCR history
- **Exercises** – Student picker, handwriting/typing/tracing flows
- **Workspace** – OCR upload, quality modes, raw vs corrected comparison

See [frontend/final-demo-screenshots/README.md](frontend/final-demo-screenshots/README.md) for FYP submission capture instructions.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                         │
│  Dashboard | Exercises | Workspace | Students | History | Game   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  dyslexia-backend (FastAPI, port 8000)                           │
│  OCR | Auth | Dashboard | Exercises | Sessions                  │
│  SQLite/PostgreSQL | DocTR + TrOCR + ByT5 | Groq LLM             │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend**: React SPA with auth, dark theme, student picker, exercise flows, tracing canvas
- **Backend**: Single unified API (OCR, auth, exercises, sessions); notebook_parity OCR mode

See [FINAL_ARCHITECTURE.md](FINAL_ARCHITECTURE.md) for full details.

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+**
- **Node.js 18+** (or use bundled Node in `tools/`)
- **Docker Desktop** (optional, for PostgreSQL; SQLite works for local dev)
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/dyslexai.git
cd dyslexai
```

### 2. One-time setup

```powershell
# Windows
.\scripts\setup.ps1
```

This will:
- Start PostgreSQL (Docker) — or use SQLite by setting `DATABASE_URL=sqlite:///./dyslexia.db` in `.env`
- Create Python venv in `dyslexia-backend`
- Install backend & frontend dependencies
- Seed exercises
- Create `.env` from `.env.example` (add your `GROQ_API_KEY`)

### 3. Run the application

**Full stack** (Dashboard, Workspace, Exercises, Game Mode):

```powershell
.\scripts\run.ps1
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

**Simple mode** (single backend, no separate services):

```powershell
.\scripts\run-simple.ps1
```

### 4. Auth / demo setup

- **No pre-seeded users** — create an account at `/signup` to access protected routes
- **Demo credentials:** Use any email/password (min 6 chars); no shared demo account
- Token persists in `localStorage`; refresh keeps session

See [DEMO_FLOW.md](DEMO_FLOW.md) for a step-by-step demo walkthrough.

---

## 📐 Notebook Parity

- **OCR_MODE=notebook_parity** (default): Locked mode that matches research notebook outputs exactly
- **Golden samples:** 6 images verified; regression runs in ~7 min
- **Regression:** `python scripts/ocr_regression.py --report FINAL_OCR_REGRESSION_REPORT.json`
- **Production mode:** `OCR_MODE=production` — experimental; not verified

---

## ⚡ TrOCR Speed Options

For faster OCR on difficult handwriting, set these before starting the backend:

| Variable | Effect | Default |
|----------|--------|---------|
| `TROCR_FAST=1` | 1 beam, 48 tokens, fewer variants | `0` |
| `TROCR_WORKERS` | Parallel TrOCR workers (e.g. `6`) | `4` |

With a CUDA GPU, TrOCR uses it automatically for faster inference.

---

## 📁 Project Structure

```
dyslexai/
├── dyslexia-backend/        # Single backend: OCR + exercises + auth (port 8000)
├── frontend/                # React SPA
├── scripts/
│   ├── setup.ps1            # One-time setup
│   ├── run.ps1              # Full stack (backend + frontend)
│   └── run-simple.ps1       # Simple mode (SQLite, no Docker)
├── screenshots/             # App screenshots for README
├── tests/
└── docs/
```

---

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | DB connection (PostgreSQL or SQLite) | `sqlite:///./dyslexia.db` |
| `GROQ_API_KEY` | Groq API key for LLM feedback | Required for LLM |
| `JWT_SECRET` | JWT signing secret | `change-this-in-production` |
| `OCR_MODE` | `notebook_parity` (verified) or `production` | `notebook_parity` |
| `QUALITY_MODE` | OCR: `quality_local`, `fast_local`, `cloud_refine` | `quality_local` |
| `VITE_API_BASE_URL` | API base for frontend | `http://localhost:8000/api` |
| `VITE_EXERCISES_API` | Exercise backend URL | `http://localhost:8000` |

---

## 📋 Final Project Status

| Item | Status |
|------|--------|
| OCR notebook_parity | ✓ Locked, 6/6 regression pass |
| Auth | ✓ Enforced, 18/18 auth proof pass |
| Frontend | ✓ Complete |
| Demo flow | ✓ Documented |
| **Verdict** | **DEMO READY** |

See [SUBMISSION_MANIFEST.md](SUBMISSION_MANIFEST.md), [RELEASE_READINESS_REPORT.md](RELEASE_READINESS_REPORT.md), [FINAL_EVALUATION.md](FINAL_EVALUATION.md), [FINAL_DEMO_PROOF.md](FINAL_DEMO_PROOF.md).

---

## 🧪 Testing

```bash
cd dyslexia-backend

# OCR regression (notebook_parity lock-in, 6 golden samples)
python scripts/ocr_regression.py --report FINAL_OCR_REGRESSION_REPORT.json

# Auth proof (18 tests: signup, 401, ownership, etc.)
python scripts/auth_proof.py

# Backend unit tests
pytest
```

---

## 📜 License

MIT

---

## 🙏 Acknowledgments

- [TrOCR](https://huggingface.co/microsoft/trocr-large-handwritten) for handwriting recognition
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) for text detection
- [ByT5](https://huggingface.co/google/byt5-small) for byte-level correction
- [dyslexia-backend](https://github.com/alizaib84876/dyslexia-backend) for adaptive exercise logic
