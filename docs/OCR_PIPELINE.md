# OCR Pipeline

## Active Pipeline

**Path:** `POST /api/ocr/process` → `dyslexia-backend/app/routers/ocr.py` → `NotebookPipeline` → `NotebookOCREngine` → `notebook_layers`

---

## Flow

1. **Image triage** — Blur, contrast, skew analysis (`app/ocr/triage.py`)
2. **DocTR** — Line detection
3. **TrOCR** — Per-line recognition (microsoft/trocr-large-handwritten or trocr-base if TROCR_FAST=1)
4. **Layer 1 (Sanitize)** — Lexical cleanup
5. **Layer 2 (ByT5)** — Dyslexia-aware correction
6. **Layer 3 (Optional)** — Groq LLM context fix (if GROQ_API_KEY set)
7. **Acceptance gate** — Rejects layer changes that worsen similarity

---

## Key Files

| File | Role |
|------|------|
| `app/routers/ocr.py` | API endpoint |
| `app/pipeline/notebook_pipeline.py` | NotebookPipeline |
| `app/ocr/engines/notebook_engine.py` | DocTR + TrOCR |
| `app/correction/notebook_layers.py` | Layers 1–3 |
| `app/utils/diffing.py` | Acceptance gate |

---

## Default Mode

**OCR_MODE=notebook_parity** — Locked mode matching research notebook outputs. Verified on 6 golden samples.

**OCR_MODE=production** — Experimental; not verified.
