# DyslexAI Repository Audit Report

**Repository:** https://github.com/abubakarshahid16/dyslexai-  
**Audit Date:** 2026-03-14  
**Source of Truth:** Actual files in repo (no prior reports assumed)

---

## 1. ACTIVE Backend Path

| Component | Path | Evidence |
|-----------|------|----------|
| **Backend** | `dyslexia-backend/` only | `scripts/run.ps1` line 8: `$ExercisesBackend = Join-Path $Root "dyslexia-backend"` |
| **Entry point** | `dyslexia-backend/app/main.py` | `uvicorn app.main:app --port 8000` |
| **Routers** | auth, students, exercises, sessions, ocr, dashboard | `main.py` lines 48–53: all included |
| **backend/ folder** | **Does not exist** | `Test-Path "backend"` → False |

**Verdict:** Single backend = `dyslexia-backend` only. No second backend.

---

## 2. ACTIVE OCR Pipeline Path

| Step | File | Evidence |
|------|------|----------|
| **Router** | `dyslexia-backend/app/routers/ocr.py` | `_get_pipeline()` → `NotebookPipeline()` |
| **Pipeline** | `dyslexia-backend/app/pipeline/notebook_pipeline.py` | `NotebookPipeline` class |
| **OCR engine** | `dyslexia-backend/app/ocr/engines/notebook_engine.py` | `NotebookOCREngine` — DocTR + TrOCR |
| **Correction** | `dyslexia-backend/app/correction/notebook_layers.py` | `layer_1_sanitize`, `layer_2_dyslexia_fix`, `get_groq_correction` |
| **Handwriting sessions** | `dyslexia-backend/app/services/ocr_service.py` | Uses `NotebookPipeline` |

**Flow:** `POST /api/ocr/process` → `ocr.py` → `NotebookPipeline.process_image()` → `NotebookOCREngine.run()` (DocTR detection + TrOCR recognition) → layer1 → layer2 → Groq (optional).

---

## 3. OCR Default: notebook_parity

| Source | Evidence |
|--------|----------|
| **config.py** | `_ocr_mode()` returns `os.getenv("OCR_MODE", "notebook_parity").lower().strip() or "notebook_parity"` |
| **config.py** | `notebook_parity: bool = field(default_factory=lambda: _ocr_mode() == "notebook_parity")` |
| **.env.example** | `OCR_MODE=notebook_parity` |
| **run.ps1** | `$env:OCR_MODE='notebook_parity'` (line 45) |
| **run-simple.ps1** | `$env:OCR_MODE='notebook_parity'` (line 21) |
| **notebook_pipeline.py** | `metadata["ocr_mode"] = "notebook_parity" if self.settings.models.notebook_parity else "production"` |

**Verdict:** `notebook_parity` is the real active default. Scripts override env; config defaults to it.

---

## 4. Dead Legacy OCR / Broken References

### Files that import non-existent `app.pipeline.service.DyslexAIPipelineService`

| File | Status |
|------|--------|
| `dyslexia-backend/verify_handwriting.py` | **DEAD** — ImportError at runtime |
| `dyslexia-backend/verify_routing_only.py` | **DEAD** — ImportError at runtime |
| `scripts/prepare_trocr_dataset.py` | **DEAD** — ImportError at runtime |
| `dyslexia_backend_ocr_integration/app/services/ocr_service.py` | **LEGACY** — Old integration; not used by main app |
| `docs/RUN_CHECKLIST.md` | **STALE** — References non-existent code |
| `docs/BENCHMARK_PROTOCOL.md` | **STALE** — References non-existent code |

### Docs referencing non-existent `backend/` paths

| File | Wrong paths |
|------|------------|
| `OCR_PIPELINE_REFERENCE.md` | `backend/app/ocr/engines/paddle_engine.py`, `backend/app/pipeline/service.py`, etc. — **all wrong** |
| `docs/notebook_audit.md` | `PaddleEngine`, `paddle_engine.py`, `preprocess.py`, `router.py`, `fusion.py` — **none exist** |
| `DEPLOY.md` | `backend/` folder — **does not exist** |

### Actual OCR files in dyslexia-backend (all active or supporting)

| File | Role |
|------|------|
| `app/routers/ocr.py` | Active |
| `app/pipeline/notebook_pipeline.py` | Active |
| `app/ocr/engines/notebook_engine.py` | Active |
| `app/ocr/triage.py` | Active |
| `app/ocr/types.py` | Active |
| `app/correction/notebook_layers.py` | Active |
| `app/correction/byt5_corrector.py` | Active (used by notebook_layers) |
| `app/services/ocr_service.py` | Active (handwriting sessions) |
| `app/utils/diffing.py` | Active |

---

## 5. README vs Reality

| README claim | Reality | Verdict |
|--------------|---------|---------|
| "PaddleOCR primary + TrOCR Large fallback" | **DocTR** detection + TrOCR recognition (no PaddleOCR) | **WRONG** |
| "Single backend: dyslexia-backend" | Correct | ✓ |
| "notebook_parity default" | Correct | ✓ |
| "Clone: YOUR_USERNAME/dyslexai" | Repo is abubakarshahid16/dyslexai- | **STALE** |
| Project structure | No backend/; correct | ✓ |

---

## 6. Frontend Routes — Implemented and Wired

| Route | Page | In App.tsx | Protected |
|-------|------|------------|-----------|
| `/` | LandingPage | ✓ | No |
| `/signup` | SignupPage | ✓ | No |
| `/login` | LoginPage | ✓ | No |
| `/dashboard` | DashboardPage | ✓ | Yes |
| `/workspace` | WorkspacePage | ✓ | Yes |
| `/history` | HistoryPage | ✓ | Yes |
| `/exercises` | ExercisesPage | ✓ | Yes |
| `/game` | GamifiedExercisePage | ✓ | Yes |
| `/students` | StudentPage | ✓ | Yes |
| `/settings` | SettingsPage | ✓ | Yes |
| `/about` | AboutPage | ✓ | Yes |
| `/help` | HelpPage | ✓ | Yes |
| `/privacy` | PrivacyPage | ✓ | Yes |
| `/terms` | TermsPage | ✓ | Yes |
| `/library` | LibraryPage | ✓ | Yes |

**Verdict:** All routes implemented. Web app (React SPA), not mobile.

---

## 7. Auth — Real Implementation

| Component | Evidence |
|-----------|----------|
| **User model** | `dyslexia-backend/app/models/user.py` — id, name, email, password_hash, created_at |
| **Auth router** | `dyslexia-backend/app/routers/auth.py` — signup, login, me, logout |
| **JWT** | `app/core/auth.py` — create_access_token, decode_token, hash_password, verify_password |
| **Token storage** | `frontend/src/lib/auth.ts` — localStorage `dyslexai_token`, `dyslexai_user` |
| **Protected routes** | `get_current_user` in deps.py; used by ocr, dashboard, students, exercises, sessions |
| **ProtectedRoute** | `frontend/src/components/ProtectedRoute.tsx` — redirects to /login if not authenticated |

**Protected backend routes:** dashboard/overview, dashboard/history, dashboard/students/progress, ocr/process, ocr/{id}/review, students/, exercises/, sessions/.

**Verdict:** Auth is real. JWT, password hashing, user-scoped OCR runs.

---

## 8. Dashboard / History — Working

| Endpoint | Implementation |
|----------|----------------|
| `GET /api/dashboard/overview` | `dashboard.py` — user-scoped OCRRun metrics |
| `GET /api/dashboard/history` | `dashboard.py` — user-scoped OCRRun list |
| `GET /api/dashboard/students/progress` | `dashboard.py` — user-scoped run counts per student |

**Verdict:** Dashboard and history routes work and are user-scoped.

---

## 9. Frontend API Wiring

| API | Target |
|-----|--------|
| `API_BASE` | `VITE_API_BASE_URL ?? "http://localhost:8000/api"` |
| `EXERCISES_BASE` | `VITE_EXERCISES_API ?? "http://localhost:8000"` |
| **Both** | Same backend (port 8000) |

`processImage` primary: `${API_BASE}/ocr/process`. Fallback: `${EXERCISES_BASE}/api/ocr/process` — same when both point to 8000.

**Minor:** `api.ts` line 100: `lastIndexOf("/backend/data/")` — legacy path; still works for `/data/` paths.

---

## 10. Files to DELETE (dead / broken)

| File | Reason |
|------|--------|
| `dyslexia-backend/verify_handwriting.py` | Imports non-existent `app.pipeline.service` |
| `dyslexia-backend/verify_routing_only.py` | Imports non-existent `app.pipeline.service` |
| `dyslexia_backend_ocr_integration/` (entire folder) | Legacy; references DyslexAIPipelineService; not used |

**Optional delete (scripts that will fail):**
- `scripts/prepare_trocr_dataset.py` — imports DyslexAIPipelineService

---

## 11. Files to EDIT

| File | Change |
|------|--------|
| `README.md` | Replace "PaddleOCR primary + TrOCR Large fallback" with "DocTR detection + TrOCR Large recognition" |
| `README.md` | Replace `YOUR_USERNAME/dyslexai` with `abubakarshahid16/dyslexai-` |
| `OCR_PIPELINE_REFERENCE.md` | Rewrite to reference `dyslexia-backend/app/...` and `notebook_pipeline`, `notebook_engine` (or mark as deprecated) |
| `docs/notebook_audit.md` | Update mappings: remove PaddleEngine, preprocess, router, fusion; use notebook_engine, notebook_pipeline |
| `DEPLOY.md` | Remove `backend/` from structure; document single dyslexia-backend |
| `docs/RUN_CHECKLIST.md` | Remove/update DyslexAIPipelineService references |
| `docs/BENCHMARK_PROTOCOL.md` | Remove/update DyslexAIPipelineService references |

---

## 12. Final Verdict

### MATCHES FINAL STATE (with caveats)

| Criterion | Status |
|-----------|--------|
| Single backend = dyslexia-backend only | ✓ |
| Frontend fully integrated | ✓ |
| notebook_parity OCR is real active default | ✓ |
| No dead legacy OCR in runtime path | ✓ (NotebookPipeline is active) |
| Auth is real | ✓ |
| Dashboard/history routes work | ✓ |
| Project is web app, not mobile | ✓ |

**Caveats:**
1. **README OCR description wrong** — Says PaddleOCR; actual is DocTR.
2. **Dead files present** — `verify_handwriting.py`, `verify_routing_only.py`, `dyslexia_backend_ocr_integration/` import non-existent code.
3. **Stale docs** — OCR_PIPELINE_REFERENCE.md, DEPLOY.md, docs/notebook_audit.md reference old architecture.

**Recommended actions:**
- Fix README OCR line.
- Delete or fix `verify_handwriting.py`, `verify_routing_only.py`.
- Remove or archive `dyslexia_backend_ocr_integration/`.
- Update or deprecate OCR_PIPELINE_REFERENCE.md and related docs.
