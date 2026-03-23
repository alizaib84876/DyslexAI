from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import ROOT_DIR, get_settings
from app.database import engine, Base
import app.models
from app.routers import auth, students, exercises, sessions, ocr, dashboard, assignments, game

app = FastAPI(title="Dyslexia Support API", version="1.0")


@app.on_event("startup")
def _log_ocr_mode():
    """Log active OCR mode at startup — notebook_parity is the verified default."""
    s = get_settings()
    mode = "notebook_parity" if s.models.notebook_parity else "production"
    print(f"[DyslexAI] OCR_MODE={mode} (notebook_parity=verified, production=experimental)")

    # Warm up TrOCR Large handwritten for the adaptive handwriting exercise.
    # When debugging locally, loading on startup makes testing much faster.
    warmup_flag = os.getenv("DYSLEXAI_TROCR_WARMUP", "").lower().strip()
    # Only warm-up when explicitly requested. Loading TrOCR Large can be heavy
    # and may impact local stability depending on the environment.
    if warmup_flag in {"1", "true", "yes"}:
        try:
            from app.services.ocr_service import warmup_simple_trocr
            print("[DyslexAI] Warming up TrOCR Large handwritten (this may take a while)...")
            warmup_simple_trocr()
            print("[DyslexAI] TrOCR warmup complete.")
        except Exception as e:
            print(f"[DyslexAI] TrOCR warmup failed (continuing anyway): {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Auto-seed Game Mode curriculum from seed_data_90_days.html (repo root) if DB is empty
try:
    from app.database import SessionLocal
    from app.services.game_seed_html import ensure_game_seeded

    _gdb = SessionLocal()
    try:
        ensure_game_seeded(_gdb)
    finally:
        _gdb.close()
except Exception as e:
    print(f"[DyslexAI] Game seed skip: {e}")

# Run auth migration (adds user_id to ocr_runs if needed)
try:
    import subprocess
    import sys
    result = subprocess.run(
        [sys.executable, str(ROOT_DIR / "scripts" / "migrate_add_user_id_to_ocr_runs.py")],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result.returncode != 0 and result.stderr:
        print(f"[DyslexAI] Migration warning: {result.stderr.strip()}")
    # Add role column to users table
    result2 = subprocess.run(
        [sys.executable, str(ROOT_DIR / "scripts" / "migrate_add_role_to_users.py")],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result2.returncode != 0 and result2.stderr:
        print(f"[DyslexAI] Role migration warning: {result2.stderr.strip()}")
    # Add user_id column to students table
    result3 = subprocess.run(
        [sys.executable, str(ROOT_DIR / "scripts" / "migrate_add_user_id_to_students.py")],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result3.returncode != 0 and result3.stderr:
        print(f"[DyslexAI] Student user_id migration warning: {result3.stderr.strip()}")
    # Link sessions to assignments (optional)
    result4 = subprocess.run(
        [sys.executable, str(ROOT_DIR / "scripts" / "migrate_add_assignment_id_to_sessions.py")],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result4.returncode != 0 and result4.stderr:
        print(f"[DyslexAI] Sessions assignment migration warning: {result4.stderr.strip()}")
    # Store LLM feedback in sessions table
    result5 = subprocess.run(
        [sys.executable, str(ROOT_DIR / "scripts" / "migrate_add_feedback_to_sessions.py")],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result5.returncode != 0 and result5.stderr:
        print(f"[DyslexAI] Sessions feedback migration warning: {result5.stderr.strip()}")
except Exception as e:
    print(f"[DyslexAI] Migration skip: {e}")

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(exercises.router)
app.include_router(sessions.router)
app.include_router(assignments.router)
app.include_router(game.router)
app.include_router(ocr.router)
app.include_router(dashboard.router)

# Serve OCR artifacts (original, preprocessed, annotated images) for Workspace display
_data_dir = ROOT_DIR / "data"
if _data_dir.exists():
    app.mount("/data", StaticFiles(directory=str(_data_dir)), name="data")

@app.get("/")
def root():
    return {"status": "ok", "message": "Dyslexia Support API is running"}