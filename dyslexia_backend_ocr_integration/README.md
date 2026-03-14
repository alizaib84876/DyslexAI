# OCR Integration for dyslexia-backend

Integrates the DyslexAI OCR pipeline (PaddleOCR + TrOCR fallback + correction) into [dyslexia-backend](https://github.com/alizaib84876/dyslexia-backend).

## Prerequisites

- Git (to clone dyslexia-backend)
- Python 3.9+
- Docker (for PostgreSQL)

## Step 1 — Clone dyslexia-backend

```bash
git clone https://github.com/alizaib84876/dyslexia-backend.git
cd dyslexia-backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
```

## Step 2 — Copy integration files

From the DyslexAI project root, run:

```powershell
.\dyslexia_backend_ocr_integration\copy_to_dyslexia_backend.ps1 -Target "C:\path\to\dyslexia-backend"
```

This copies `app/ocr`, `app/correction`, `app/utils`, `app/core`, `app/pipeline`, and `app/services/ocr_service.py` into dyslexia-backend.

Then apply the session router patch (see Step 4).

## Step 3 — Install OCR dependencies

```bash
pip install opencv-python numpy rapidfuzz paddleocr python-doctr
```

Add to `requirements.txt`:

```
opencv-python
numpy
rapidfuzz
paddleocr
python-doctr
```

## Step 4 — Apply manual changes

See **APPLY_MANUAL_CHANGES.md** for exact edits to:
- `app/routers/sessions.py` (import + OCR block + return)
- `app/schemas/session.py` (add `corrected_text`)

## Step 5 — Add .env settings

```
DYSLEXAI_DEBUG=1
DYSLEXAI_EASY_THRESHOLD=0.5
DYSLEXAI_HARD_THRESHOLD=1.8
PADDLE_LANG=en
TROCR_MODEL_NAME=microsoft/trocr-large-handwritten
BYT5_MODEL_NAME=google/byt5-small
```

## Step 6 — Run and test

```bash
docker start dyslexia-db
uvicorn app.main:app --reload
```

Test at http://127.0.0.1:8000/docs → `POST /sessions/{id}/submit-handwriting`

## Frontend (DyslexAI)

The DyslexAI frontend has:
- `HandwritingSessionResult` component for sessions API response
- `submitHandwriting(sessionId, file)` in `lib/api.ts`

Set `VITE_SESSIONS_API=http://localhost:8000` when using dyslexia-backend.

## Response shape (with integration)

```json
{
  "session_id": "...",
  "score": 0.85,
  "feedback": "...",
  "ocr_text": "Hope to hear from you soon XX",
  "ocr_confidence": 0.92,
  "corrected_text": "Hope to hear from you soon! XX"
}
```

## Caution

Do **not** add global spelling replacements like `close` → `Hope`. Use signoff-aware logic only.
