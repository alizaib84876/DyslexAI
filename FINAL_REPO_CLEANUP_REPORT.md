# Final Repo Cleanup Report

**Date:** 2026-03-14  
**Source:** Audit-based cleanup and truth-sync pass

---

## 1. Files Deleted

| File / Folder | Reason |
|---------------|--------|
| `dyslexia-backend/verify_handwriting.py` | Imported non-existent `app.pipeline.service.DyslexAIPipelineService` |
| `dyslexia-backend/verify_routing_only.py` | Same |
| `dyslexia_backend_ocr_integration/` (entire folder) | Legacy integration; referenced DyslexAIPipelineService; not used by main app |
| `scripts/prepare_trocr_dataset.py` | Imported DyslexAIPipelineService and `app.training.manifest`; depended on old backend |

---

## 2. Files Edited

| File | Changes |
|------|---------|
| **README.md** | Replaced "PaddleOCR primary + TrOCR fallback" with "DocTR detection + TrOCR recognition via NotebookPipeline (notebook_parity)"; stated project is a web app; fixed clone URL to `abubakarshahid16/dyslexai-`; Acknowledgments: PaddleOCR → DocTR |
| **OCR_PIPELINE_REFERENCE.md** | Rewrote to reference `dyslexia-backend/` and NotebookPipeline; removed all `backend/` and PaddleOCR references |
| **DEPLOY.md** | Removed `backend/` from repository structure; fixed remote URL |
| **docs/notebook_audit.md** | Updated Production Refactor Mapping to notebook_engine.py and notebook_pipeline.py; clarified PaddleOCR as notebook history |
| **docs/RUN_CHECKLIST.md** | Replaced DyslexAIPipelineService with NotebookPipeline in Export section |
| **docs/BENCHMARK_PROTOCOL.md** | Replaced DyslexAIPipelineService with NotebookPipeline in Quick Run Script |
| **docs/research_notes.md** | Updated "What DyslexAI does" to reflect DocTR + TrOCR + notebook layers |
| **frontend/src/components/UploadPanel.tsx** | "PaddleOCR only" → "DocTR + TrOCR-base" |
| **frontend/src/pages/WorkspacePage.tsx** | pip install: `paddleocr` → `python-doctr` |
| **frontend/src/lib/api.ts** | Added `dyslexia-backend/data/` handling; kept `backend/data/` for legacy paths |
| **frontend/src/theme/colors.ts** | "mobile app" → "web app design" |
| **frontend/src/pages/SettingsPage.tsx** | "mobile app" → "web app" |
| **FRONTEND_INTEGRATION_AUDIT.md** | Updated UploadPanel note |
| **.gitignore** | Removed `backend/data/` (backend folder does not exist) |
| **scripts/github_create_and_push.py** | Removed `backend/data` from skip list |
| **OCR_FILES_FOR_CHATGPT.txt** | Added deprecation notice; pointed to OCR_PIPELINE_REFERENCE.md |

---

## 3. Stale References Found and Fixed

| Term | Location | Fix |
|------|----------|-----|
| PaddleOCR primary + TrOCR fallback | README.md | DocTR detection + TrOCR recognition via NotebookPipeline |
| PaddleOCR | README Acknowledgments | DocTR |
| PaddleOCR only | UploadPanel.tsx | DocTR + TrOCR-base |
| paddleocr | WorkspacePage.tsx pip hint | python-doctr |
| PaddleOCR | docs/research_notes.md | DocTR + TrOCR + layers |
| PaddleOCR | docs/notebook_audit.md | Clarified as notebook history |
| backend/ | DEPLOY.md | Removed |
| backend/ | OCR_PIPELINE_REFERENCE.md | Rewrote to dyslexia-backend/ |
| backend/data | .gitignore | Removed |
| backend/data | github_create_and_push.py | Removed |
| backend/data | api.ts | Added dyslexia-backend/data; kept backend/data for legacy |
| DyslexAIPipelineService | docs/RUN_CHECKLIST.md | NotebookPipeline |
| DyslexAIPipelineService | docs/BENCHMARK_PROTOCOL.md | NotebookPipeline |
| app.pipeline.service | verify_handwriting, verify_routing_only, prepare_trocr_dataset | Files deleted |
| mobile app | colors.ts, SettingsPage.tsx | web app |

**Intentional left unchanged:**
- `fyp.ipynb` — Research notebook with historical PaddleOCR experiments; not production code
- `OCR_FILES_FOR_CHATGPT.txt` — Internal content kept as legacy reference; deprecation notice added

---

## 4. Final Active Backend Path

```
dyslexia-backend/
├── app/
│   ├── main.py              # Entry: uvicorn app.main:app --port 8000
│   ├── routers/             # auth, ocr, dashboard, students, exercises, sessions
│   ├── pipeline/
│   │   └── notebook_pipeline.py   # NotebookPipeline
│   ├── ocr/
│   │   └── engines/notebook_engine.py   # DocTR + TrOCR
│   └── correction/notebook_layers.py
```

**Startup:** `.\scripts\run.ps1` or `.\scripts\run-simple.ps1`

---

## 5. Final Active OCR Path

```
POST /api/ocr/process
  → dyslexia-backend/app/routers/ocr.py
  → NotebookPipeline.process_image()
  → NotebookOCREngine.run()  # DocTR detection + TrOCR recognition
  → layer_1_sanitize
  → layer_2_dyslexia_fix
  → get_groq_correction (optional)
  → acceptance_gate
```

---

## 6. Final OCR Default

- **OCR_MODE:** `notebook_parity` (verified default)
- **Config:** `dyslexia-backend/app/core/config.py` — `_ocr_mode()` defaults to `notebook_parity`
- **Scripts:** `run.ps1` and `run-simple.ps1` both set `OCR_MODE='notebook_parity'`

---

## 7. README vs Reality

| README claim | Status |
|--------------|--------|
| DocTR detection + TrOCR recognition | ✓ |
| Single backend = dyslexia-backend | ✓ |
| notebook_parity default | ✓ |
| Web app | ✓ |
| Clone URL abubakarshahid16/dyslexai- | ✓ |

**Verdict:** README now matches reality.

---

## 8. Final Verdict

- **CLEAN**

All dead code removed, stale references fixed, and docs aligned with the active architecture. OCR behavior, auth logic, and frontend routing were not changed. `notebook_parity` remains the default.
