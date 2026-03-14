# Phase 1 — Repository Truth Audit

## Internal Checklist (Pre-Edit)

| Item | Value |
|------|-------|
| **ACTIVE backend** | `dyslexia-backend/` |
| **ACTIVE frontend** | `frontend/` |
| **ACTIVE OCR path** | `POST /api/ocr/process` → `ocr.py` → `NotebookPipeline` → `NotebookOCREngine` → `notebook_layers` |
| **ACTIVE OCR mode** | `notebook_parity` |
| **SAFE TO DELETE** | Stale reports (REPO_AUDIT, PROOF_PASS, FRONTEND_INTEGRATION_AUDIT, etc.); move to docs/archive |
| **DOCS TO FIX** | run-simple.ps1 comment (says Dashboard/History show errors — they work); consolidate root reports |

## Verified Sources

- `scripts/run.ps1` — dyslexia-backend, OCR_MODE=notebook_parity
- `scripts/run-simple.ps1` — dyslexia-backend, SQLite, OCR_MODE=notebook_parity
- `dyslexia-backend/app/main.py` — auth, ocr, dashboard, students, exercises, sessions
- `dyslexia-backend/app/core/config.py` — _ocr_mode() defaults to notebook_parity
- `frontend/src/lib/api.ts` — VITE_API_BASE_URL, VITE_EXERCISES_API → localhost:8000
