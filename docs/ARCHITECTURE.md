# DyslexAI Architecture

## Overview

DyslexAI is a **web app** with a React frontend and a single FastAPI backend. All features (OCR, auth, dashboard, exercises) run through `dyslexia-backend/`.

---

## Frontend Flow

- **Stack:** React 18, Vite, TypeScript
- **Entry:** `frontend/index.html` → `frontend/src/main.tsx`
- **Routing:** React Router — `/` (landing), `/login`, `/signup`, `/dashboard`, `/workspace`, `/history`, `/exercises`, `/game`, `/students`, `/settings`, `/about`, `/help`, `/privacy`, `/terms`, `/library`
- **Auth:** `AuthContext` + JWT in `localStorage`; `ProtectedRoute` guards app pages
- **API:** `fetchWithAuth` adds `Authorization: Bearer <token>`; 401/403 → logout + redirect to `/login`

---

## Backend Flow

- **Entry:** `dyslexia-backend/app/main.py` → `uvicorn app.main:app --port 8000`
- **Routers:** auth, ocr, dashboard, students, exercises, sessions
- **Database:** SQLite (default) or PostgreSQL via `DATABASE_URL`

---

## Auth Flow

1. **Signup:** `POST /api/auth/signup` → create user, return JWT
2. **Login:** `POST /api/auth/login` → validate credentials, return JWT
3. **Me:** `GET /api/auth/me` → validate token, return user
4. **Protected routes:** Require `Authorization: Bearer <token>`; use `get_current_user` dependency

---

## OCR Flow

1. **Upload:** `POST /api/ocr/process` (multipart: file, quality_mode)
2. **Pipeline:** `NotebookPipeline.process_image()` → `NotebookOCREngine.run()` (DocTR + TrOCR) → layer_1_sanitize → layer_2_dyslexia_fix → Groq (optional)
3. **Response:** raw_text, corrected_text, correction_layer1–4, metadata.ocr_mode
4. **Storage:** OCRRun saved with user_id for history/dashboard

---

## Dashboard / History Flow

- **Overview:** `GET /api/dashboard/overview` — user-scoped metrics (total_uploads, avg_confidence, etc.)
- **History:** `GET /api/dashboard/history` — user-scoped OCR runs
- **Review:** `POST /api/ocr/{run_id}/review` — update review_status, reviewed_text

---

## Exercises / Game Flow

- **Students:** `GET /students/`, `POST /students/`
- **Next exercise:** `GET /exercises/next?student_id=...`
- **Session:** `POST /sessions/` → `POST /sessions/{id}/submit` (typing) or `submit-handwriting` or `submit-tracing`

---

## Database Entities

- **users** — id, name, email, password_hash, created_at
- **ocr_runs** — id, user_id, student_id, raw_text, corrected_text, quality_mode, etc.
- **students** — id, name, age, difficulty_level
- **exercises** — id, type, content, expected, difficulty
- **sessions** — id, student_id, exercise_id, student_response, score
- **word_mastery** — student_id, word, score

---

## Request/Response Path Overview

```
Browser → http://localhost:5173 (Vite dev server)
       → http://localhost:8000/api/* (FastAPI backend)

Frontend uses:
  VITE_API_BASE_URL = http://localhost:8000/api
  VITE_EXERCISES_API = http://localhost:8000
```
