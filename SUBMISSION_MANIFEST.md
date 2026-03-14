# DyslexAI — Submission Manifest

**Project Title:** DyslexAI — Local-first OCR and Adaptive Exercises for Dyslexic Students  
**Final Status:** SUBMISSION READY (FROZEN)  
**Date:** 2026-03-14

---

## Main Folders

| Folder | Purpose |
|--------|---------|
| `dyslexia-backend/` | Single unified backend: OCR, auth, dashboard, exercises, sessions (port 8000) |
| `frontend/` | React SPA (Vite, TypeScript) — Dashboard, Workspace, Exercises, Game Mode |
| `scripts/` | `setup.ps1`, `run.ps1`, `run-simple.ps1` |
| `docs/` | Architecture, notebook mapping, fine-tuning |
| `tests/` | Backend tests |

---

## Startup Commands

| Command | Purpose |
|---------|---------|
| `.\scripts\setup.ps1` | One-time setup (venv, deps, seed, .env) |
| `.\scripts\run.ps1` | **Full stack** — backend + frontend (PostgreSQL or SQLite) |
| `.\scripts\run-simple.ps1` | **Simple mode** — SQLite, no Docker required |

**URLs after startup:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## Demo Flow (5 min)

1. **Signup** → Create account at `/signup`
2. **Login** → Auto-login after signup; redirect to dashboard
3. **Dashboard** → Metrics, chart, recent history
4. **Workspace** → Upload one image → Process Document → OCR result
5. **Exercises** → Create student → Do one typing/handwriting/tracing exercise
6. **History** → View user-scoped OCR runs

See [DEMO_FLOW.md](DEMO_FLOW.md) for full walkthrough.

---

## Key Proof Files

| File | Purpose |
|------|---------|
| [FINAL_DEMO_PROOF.md](FINAL_DEMO_PROOF.md) | End-to-end demo verification |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture overview |
| [FINAL_EVALUATION.md](FINAL_EVALUATION.md) | OCR regression 6/6, auth 18/18 |
| [RELEASE_READINESS_REPORT.md](RELEASE_READINESS_REPORT.md) | Release checklist |
| `dyslexia-backend/FINAL_OCR_REGRESSION_REPORT.md` | Golden sample regression results |

---

## What Examiner Should Run First

1. **Setup** (one-time):
   ```powershell
   .\scripts\setup.ps1
   ```
   - Requires: Python 3.9+, Node.js 18+, Docker (for PostgreSQL) or use SQLite
   - Add `GROQ_API_KEY` to `dyslexia-backend/.env` for LLM feedback (optional)

2. **Start app**:
   ```powershell
   .\scripts\run.ps1
   ```
   Or for SQLite (no Docker): `.\scripts\run-simple.ps1`

3. **Verify**:
   - Open http://localhost:5173
   - Signup → Login → Dashboard → Workspace (upload image) → Exercises

4. **Optional verification scripts** (from `dyslexia-backend/`):
   ```bash
   python scripts/auth_proof.py          # 18/18 auth tests
   python scripts/ocr_regression.py --report FINAL_OCR_REGRESSION_REPORT.json  # 6/6 OCR
   ```

---

## OCR Mode

- **Default:** `OCR_MODE=notebook_parity` — locked, matches research notebook exactly
- **Regression:** 6 golden samples pass
- **Production:** `OCR_MODE=production` — experimental, not verified

---

## Auth

- No pre-seeded users — create account at `/signup`
- JWT in localStorage; protected routes require token
- User-scoped OCR runs, dashboard, history

---

## Known Limitations

1. **Students shared** — All users see same student pool; per-user students not implemented
2. **Cloud refinement** — Planned; not implemented
3. **OCR latency** — 30–180 sec per image depending on model and image size
4. **Single backend** — No horizontal scaling; no multi-tenant isolation beyond OCR runs

---

## Screenshots

Screenshots for FYP submission: see [frontend/final-demo-screenshots/README.md](frontend/final-demo-screenshots/README.md) for capture instructions and checklist.

---

## Verdict

**FROZEN AND READY** — Suitable for FYP submission and evaluation.
