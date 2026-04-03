# DyslexAI

Local-first OCR + adaptive literacy exercises for dyslexic learners.

This repo contains:
- **Frontend** (React + TypeScript + Vite)
- **Backend** (FastAPI + SQLAlchemy) with:
  - OCR Studio (DocTR + TrOCR + correction layers, optional Groq)
  - Adaptive exercises (typing, handwriting, tracing)
  - Teacher assignments (custom + optional LLM-generated)
  - 90-day **Game Mode (Curriculum)** with streaks and puzzle pieces

---

## Features
- **OCR Studio**
  - `/api/ocr/process` runs DocTR line detection, TrOCR recognition, and correction layers.
  - Returns raw OCR text, corrected text, confidence, and image references for the UI.
- **Adaptive Exercises**
  - `/api/exercises/next` chooses exercises using word mastery + confused-letter signals.
  - `/api/sessions/*/submit-*` scores attempts and updates mastery + difficulty.
- **Game Mode (Curriculum)**
  - Auto-loads the 90-day curriculum from `seed_data_90_days.html`.
  - Enforces “one new day per calendar day” logic based on recorded completions.
  - Puzzle pieces unlock by day completion.
- **Tracing Canvas Scoring**
  - Captures strokes and computes a numeric trace score on the frontend.
- **Teacher Assignments**
  - Teachers can create assignments manually or generate them with Groq (LLM).

---

## Repo Layout
- `frontend/` — React app (routes like `/dashboard`, `/exercises`, `/ocr-studio`, `/game`)
- `dyslexia-backend/` — FastAPI app (routers under `app/routers/`)
- `seed_data_90_days.html` — Game Mode curriculum data (required)

---

## Setup (Local)

### 1) Backend
```bash
cd "/Users/alizaib/Desktop/dyslexai-/dyslexia-backend"
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies (adjust as needed for your environment)
pip install -r requirements.txt 2>/dev/null || true
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic \
  python-dotenv python-Levenshtein pytest httpx pydantic groq \
  transformers torch Pillow python-multipart doctr opencv-python
```

Create `dyslexia-backend/.env`:
```env
DATABASE_URL=sqlite:///./dyslexia.db
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=dev-secret-change-in-production
OCR_MODE=notebook_parity
QUALITY_MODE=hard
```

Seed exercises:
```bash
python db/seed.py
```

Start server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2) Frontend
```bash
cd "/Users/alizaib/Desktop/dyslexai-/frontend"
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:
- http://127.0.0.1:5173

---

## Supabase (PostgreSQL)

The backend uses SQLAlchemy with `DATABASE_URL`. Supabase provides a managed Postgres instance for the same schema as local `dyslexia.db`. You do **not** need Supabase’s Data API or row-level security if the browser only talks to **FastAPI** (not `supabase-js` directly).

1. In the Supabase dashboard open **Project Settings → Database**.
2. Under **Connection string**, select **URI**, insert your **database password**, and copy the string.
3. For a normal `uvicorn` process, use the **direct** connection (**port 5432**, host like `db.<project-ref>.supabase.co`).
4. In `dyslexia-backend/.env` set (one line, your values):
   - `DATABASE_URL=postgresql://postgres.[ref]:YOUR_PASSWORD@db.[ref].supabase.co:5432/postgres`
   - Ensure the URL includes `sslmode=require` (Supabase often appends it in the copy box; if not, add `?sslmode=require`).
5. Start the API from `dyslexia-backend`: tables are created from models on startup. If the **`exercises`** table is empty, **kid-friendly adaptive exercises** are seeded automatically (same pool as `db/seed.py`). The **90-day Daily Exercises curriculum** is seeded from `seed_data_90_days.html` when `game_days` is empty. On startup the server logs a line like `PostgreSQL @ db....supabase.co | adaptive_exercises=54 | game_curriculum_days=90` so you can confirm Supabase and counts. You can still run `python db/seed.py` manually for a full reset (clears sessions/exercises and re-seeds).

A **new** Supabase database has no users yet—sign up again, or migrate data from SQLite separately. **Do not commit** `.env`.

---

## Environment Variables (Summary)

Backend (`dyslexia-backend/.env`)
- `DATABASE_URL`
- `GROQ_API_KEY` (optional but needed for LLM feedback/exercise generation)
- `JWT_SECRET`
- `OCR_MODE` (`notebook_parity` recommended for parity with the research notebook)
- `QUALITY_MODE`

Frontend (`frontend/.env` if you use it)
- `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api`)

---

## Frontend Modules

Main routes (see `frontend/src/App.tsx`):
- `/` — `LandingPage`
- `/login`, `/signup` — auth
- `/dashboard` — `DashboardPage`
- `/exercises` — `ExercisesPage` (typing/handwriting/tracing)
- `/ocr-studio` — student OCR studio (`StudentOcrStudioPage`)
- `/workspace` — teacher OCR studio (`WorkspacePage`)
- `/assignments` — assignments (`AssignmentsPage`)
- `/game` — Game Mode (`GameHomePage`, `GameSessionPage`, `GameCompletePage`, `GamePuzzlePage`)

Key components:
- `frontend/src/components/TracingCanvas.tsx` — stroke capture + trace scoring
- `frontend/src/components/OcrHistoryPanel.tsx` — OCR run history

---

## Backend Modules

Routers under `dyslexia-backend/app/routers/`:
- `auth.py`
  - `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- `students.py`
  - `/api/students/*` (student profiles and stats)
- `exercises.py`
  - `GET /api/exercises/next` (adaptive exercise selection)
  - `POST /api/exercises/generate` (LLM generation for weak words)
- `sessions.py`
  - `POST /api/sessions/` (create a session)
  - `POST /api/sessions/{id}/submit` (typing)
  - `POST /api/sessions/{id}/submit-handwriting` (TrOCR-only handwriting exercise OCR)
  - `POST /api/sessions/{id}/submit-tracing` (trace scoring, frontend-computed)
- `ocr.py`
  - `POST /api/ocr/process` (full OCR Studio pipeline)
- `game.py`
  - `GET /api/game/today` (what to play today)
  - `POST /api/game/complete-day` (complete day)
  - `GET /api/game/puzzle/{phase}` (puzzle pieces by phase)
- `assignments.py`
  - teacher assignment creation + listing

---

## Game Mode (Curriculum)

Data:
- Uses `seed_data_90_days.html` to populate `game_days` / `game_exercises`.

Play flow:
1. `GET /api/game/today` → day number + exercises
2. Student completes exercises and calls `POST /api/game/complete-day`
3. `GET /api/game/puzzle/{phase}` to view unlocked pieces

---

## Notes
- The first OCR / handwriting run can take a while because models download and load.
- LLM features require `GROQ_API_KEY`.

