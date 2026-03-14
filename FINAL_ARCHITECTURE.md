# DyslexAI Final Architecture

## Overview

DyslexAI is a local-first OCR and adaptive exercise platform for dyslexic students. It combines a research-backed handwriting OCR pipeline with an adaptive exercise backend.

---

## Frontend

- **Stack:** React 18, Vite, TypeScript
- **Routing:** React Router (landing, login, signup, dashboard, workspace, history, exercises, game mode, students)
- **Auth:** AuthContext with JWT in localStorage; ProtectedRoute for guarded pages
- **API:** `fetchWithAuth` adds `Authorization: Bearer <token>`; 401/403 trigger logout and redirect to `/login`
- **Key pages:** Dashboard, Workspace (OCR upload), History, Exercises, Game Mode, Students

---

## Backend

- **Stack:** FastAPI, SQLAlchemy, Uvicorn
- **Single backend:** `dyslexia-backend` serves all APIs (OCR, auth, dashboard, exercises, sessions)
- **Port:** 8000

---

## Auth

- **Flow:** Signup → JWT; Login → JWT; `/api/auth/me` validates token
- **Storage:** JWT in localStorage; user object cached
- **Protected routes:** Dashboard, OCR, students, exercises, sessions require `get_current_user`
- **Public:** `/`, `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
- **Ownership:** OCRRun has `user_id`; history/dashboard scoped to current user

---

## OCR Pipeline

1. **Image triage:** Blur, contrast, skew analysis
2. **DocTR:** Line detection
3. **TrOCR Large Handwritten:** Per-line recognition → raw text
4. **Layer 1 (Sanitize):** Lexical cleanup
5. **Layer 2 (Dyslexia Fix):** ByT5-based correction
6. **Layer 3 (Optional):** Groq LLM context fix (if `GROQ_API_KEY` set)
7. **Acceptance gate:** Rejects layer changes that worsen similarity

---

## Notebook Parity Mode

- **OCR_MODE=notebook_parity:** Locked mode that matches fyp (1).ipynb outputs exactly
- **Golden samples:** 6 images in `data/ocr/golden/expected_outputs.json`
- **Regression:** `python scripts/ocr_regression.py` verifies raw_text match
- **Why:** Ensures reproducibility; production mode is experimental

---

## Database

- **Engine:** SQLite (default) or PostgreSQL
- **Tables:** users, ocr_runs (user_id), students, exercises, sessions, word_mastery
- **Migration:** `scripts/migrate_add_user_id_to_ocr_runs.py` adds user_id to ocr_runs

---

## Route Flow

```
Public:
  GET  /                    → health
  POST /api/auth/signup     → create user, return JWT
  POST /api/auth/login      → validate, return JWT
  POST /api/auth/logout     → stateless (client discards token)

Protected (require JWT):
  GET  /api/auth/me
  GET  /api/dashboard/overview
  GET  /api/dashboard/history
  GET  /api/dashboard/students/progress
  POST /api/ocr/process
  POST /api/ocr/{run_id}/review
  GET  /students/
  POST /students/
  GET  /students/{id}, /{id}/mastery, /{id}/stats
  GET  /exercises/
  POST /exercises/
  GET  /exercises/next
  POST /exercises/generate
  POST /sessions/
  POST /sessions/{id}/submit
  POST /sessions/{id}/submit-handwriting
  POST /sessions/{id}/submit-tracing
```
