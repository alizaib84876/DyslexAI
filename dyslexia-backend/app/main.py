from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import ROOT_DIR, get_settings
from app.database import engine, Base
import app.models
from app.routers import auth, students, exercises, sessions, ocr, dashboard

app = FastAPI(title="Dyslexia Support API", version="1.0")


@app.on_event("startup")
def _log_ocr_mode():
    """Log active OCR mode at startup — notebook_parity is the verified default."""
    s = get_settings()
    mode = "notebook_parity" if s.models.notebook_parity else "production"
    print(f"[DyslexAI] OCR_MODE={mode} (notebook_parity=verified, production=experimental)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

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
except Exception as e:
    print(f"[DyslexAI] Migration skip: {e}")

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(exercises.router)
app.include_router(sessions.router)
app.include_router(ocr.router)
app.include_router(dashboard.router)

# Serve OCR artifacts (original, preprocessed, annotated images) for Workspace display
_data_dir = ROOT_DIR / "data"
if _data_dir.exists():
    app.mount("/data", StaticFiles(directory=str(_data_dir)), name="data")

@app.get("/")
def root():
    return {"status": "ok", "message": "Dyslexia Support API is running"}