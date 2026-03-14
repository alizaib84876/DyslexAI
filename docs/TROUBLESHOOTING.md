# Troubleshooting

## Ports in Use

**Symptom:** "Address already in use" or port 8000/5173 occupied.

**Fix:**
- Close any existing DyslexAI processes
- Or run: `Get-Process -Name python,node | Stop-Process -Force` (PowerShell)
- Restart the app

---

## Docker Unavailable

**Symptom:** setup.ps1 fails at "Starting PostgreSQL" or "Docker not available".

**Fix:** Use SQLite instead:
1. Edit `dyslexia-backend/.env`: `DATABASE_URL=sqlite:///./dyslexia.db`
2. Run `cd dyslexia-backend; .\venv\Scripts\python.exe db/seed.py`
3. Use `.\scripts\run-simple.ps1` (it uses SQLite by default)

---

## Models Taking Time to Download

**Symptom:** First OCR upload is very slow (minutes).

**Fix:** Normal. TrOCR and DocTR download on first use. Subsequent runs are faster.

---

## Auth Issues

**Symptom:** 401 on protected routes, redirect to login.

**Fix:**
- Ensure you're logged in (check localStorage for `dyslexai_token`)
- Create account at `/signup` if none exists
- Clear localStorage and sign up again if token is corrupted

---

## OCR Slow on CPU

**Symptom:** OCR takes 1–3 minutes per image.

**Fix:**
- Set `TROCR_FAST=1` for faster (TrOCR-base) mode
- Use a smaller test image
- GPU: TrOCR uses CUDA automatically if available

---

## Missing Env Vars

**Symptom:** Backend fails to start or OCR errors.

**Fix:**
- Ensure `dyslexia-backend/.env` exists (copy from `.env.example`)
- `GROQ_API_KEY` is optional (Layer 3 correction); leave placeholder if not using
- `DATABASE_URL` must be set for run.ps1 (PostgreSQL) or run-simple.ps1 (SQLite)

---

## Frontend Can't Reach Backend

**Symptom:** "Could not reach OCR service" or fetch errors.

**Fix:**
- Ensure backend is running on port 8000
- Check `VITE_API_BASE_URL` and `VITE_EXERCISES_API` (run scripts set these to http://localhost:8000)
- If running frontend separately, set env: `VITE_API_BASE_URL=http://localhost:8000/api` and `VITE_EXERCISES_API=http://localhost:8000`
