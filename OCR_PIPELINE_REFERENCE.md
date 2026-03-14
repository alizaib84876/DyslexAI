# OCR Pipeline Reference

Use this document to understand and debug OCR output. The active pipeline is **NotebookPipeline** in `dyslexia-backend/`.

---

## Active Pipeline: NotebookPipeline (notebook_parity)

**Entry:** `POST /api/ocr/process` → `dyslexia-backend/app/routers/ocr.py` → `NotebookPipeline`

**Flow:**
1. Image triage (`ImageTriage`)
2. DocTR line detection + TrOCR recognition (`NotebookOCREngine`)
3. Layer 1: Sanitize (`layer_1_sanitize`)
4. Layer 2: ByT5 dyslexia fix (`layer_2_dyslexia_fix`)
5. Layer 3: Groq context fix (optional, if `GROQ_API_KEY` set)
6. Acceptance gate: rejects layer changes that worsen similarity

---

## Key Files (dyslexia-backend/)

| File | Role |
|------|------|
| `app/routers/ocr.py` | OCR API endpoint; calls `NotebookPipeline` |
| `app/pipeline/notebook_pipeline.py` | Main pipeline — DocTR + TrOCR + layers |
| `app/ocr/engines/notebook_engine.py` | DocTR detection + TrOCR recognition |
| `app/ocr/triage.py` | Image triage (blur, contrast, skew) |
| `app/ocr/types.py` | `OCRLine`, `OCRResult`, `TriageResult` |
| `app/correction/notebook_layers.py` | Layer 1 (sanitize), Layer 2 (ByT5), Layer 3 (Groq) |
| `app/correction/byt5_corrector.py` | ByT5 contextual repair |
| `app/utils/diffing.py` | `acceptance_gate`, `levenshtein_ops` |

---

## OCR Mode

- **notebook_parity** (default): Matches research notebook outputs exactly. Verified on 6 golden samples.
- **production**: Experimental; not verified.

Set via `OCR_MODE` env or scripts (`run.ps1`, `run-simple.ps1`).

---

## Common Wrong-Output Causes

| Symptom | Likely cause | File to check |
|---------|--------------|---------------|
| Garbled / wrong order | Line ordering | `notebook_engine.py` — DocTR detection, y_center sort |
| Numbers instead of letters | OCR misread | `notebook_engine.py` — TrOCR |
| Specific word wrong | Missing spelling | `notebook_layers.py` — layer 2 |
| ByT5 not helping | Gate rejected | `diffing.py` — `acceptance_gate` |
