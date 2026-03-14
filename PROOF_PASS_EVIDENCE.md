# Proof Pass Evidence

## 1. Startup Proof

```
Backend:
$ curl -s http://127.0.0.1:8000/
{"status":"ok","message":"Dyslexia Support API is running"}

Frontend: Run .\scripts\run.ps1 or npm run dev from frontend/ (npm in PATH)
```

## 2. Route Proof

| Route | Status | Response |
|-------|--------|----------|
| GET / | 200 | `{"status":"ok","message":"Dyslexia Support API is running"}` |
| GET /api/dashboard/overview | 200 | `{"total_students":8,"total_uploads":1,"total_runs":1,"avg_confidence":0.85,"avg_correction_ratio":1.0}` |
| GET /api/dashboard/history | 200 | `[{"run_id":1,"student_id":null,...}]` |
| GET /students/ | 200 | `[{"id":"7ae74afd-...","name":"TestPlayer",...},...]` |
| POST /api/ocr/process | 200 | (see section 4) |

## 3. OCR Proof (proof_sample.png)

**Image:** `dyslexia-backend/data/ocr/uploads/proof_sample.png` (400×120, "have been learning" / "of morality")

| Field | Value |
|-------|-------|
| raw_text | "have been learning . of morality ." |
| corrected_text | "I have been learning about morality." (with GROQ_API_KEY) |
| total_latency_seconds | 36.98 (direct pipeline) / ~134 s (API, first request with model load) |
| fallback_usage | None — notebook pipeline uses DocTR+TrOCR for all lines |

**Per-line:**
| Line | raw_text | source | fallback_used |
|------|----------|--------|---------------|
| 1 | "have been learning ." | trocr | false |
| 2 | "of morality ." | trocr | false |

## 4. Exact API Response JSON from /api/ocr/process

```json
{
  "run_id": 1,
  "upload_id": 1,
  "student_id": null,
  "raw_text": "have been learning . of morality .",
  "corrected_text": "I have been learning about morality.",
  "metadata": {"pipeline": "notebook", "use_groq": true},
  "original_image_path": "C:\\Users\\abuba\\OneDrive\\Desktop\\New folder\\dyslexia-backend\\data\\ocr\\uploads\\proof_sample_6247986645264136786.png",
  "original_image_url": "/data/ocr/uploads/proof_sample_6247986645264136786.png",
  "annotated_image_path": null,
  "preprocessed_image_path": null,
  "correction_layer1": "have been learning of morality .",
  "correction_layer2": "have been learning of morality .",
  "correction_layer3": "I have been learning about morality.",
  "correction_layer4": "I have been learning about morality.",
  "lines": [
    {
      "bbox": [15, 26, 117, 47],
      "raw_text": "have been learning .",
      "merged_text": "have been learning .",
      "corrected_text": "have been learning .",
      "confidence": 0.85,
      "source": "trocr",
      "difficulty_tier": null,
      "difficulty_score": null,
      "fallback_used": false,
      "suspicious": false,
      "chosen_variant": null,
      "uncertainty_score": 0.0,
      "candidate_scores": [],
      "edit_ops": []
    },
    {
      "bbox": [13, 65, 71, 87],
      "raw_text": "of morality .",
      "merged_text": "of morality .",
      "corrected_text": "of morality .",
      "confidence": 0.85,
      "source": "trocr",
      "difficulty_tier": null,
      "difficulty_score": null,
      "fallback_used": false,
      "suspicious": false,
      "chosen_variant": null,
      "uncertainty_score": 0.0,
      "candidate_scores": [],
      "edit_ops": []
    }
  ],
  "triage": {
    "blur_score": 2412.12,
    "brightness": 253.33,
    "contrast": 18.13,
    "is_low_contrast": true,
    "estimated_skew_angle": 0.0,
    "should_threshold": true,
    "should_deskew": false
  }
}
```

## 5. Deleted Legacy Files

| File |
|------|
| app/ocr/engines/paddle_engine.py |
| app/ocr/engines/van_engine.py |
| app/ocr/fusion.py |
| app/ocr/router.py |
| app/ocr/signoff_detector.py |
| app/ocr/preprocess.py |
| app/pipeline/service.py |
| app/correction/paragraph.py |
| app/correction/spelling_refinement.py |

## 6. Active OCR Files (Runtime)

| File | Role |
|------|------|
| app/ocr/engines/notebook_engine.py | DocTR detection + TrOCR recognition |
| app/correction/notebook_layers.py | layer_1_sanitize, layer_2_dyslexia_fix, get_groq_correction |
| app/pipeline/notebook_pipeline.py | Full pipeline orchestration |
| app/correction/byt5_corrector.py | ByT5 fallback when custom T5 not found |
| app/correction/lexical.py | LexicalCorrector (not used in notebook path; kept for compatibility) |
| app/ocr/triage.py | ImageTriage.analyze |
| app/ocr/types.py | OCRLine, OCRResult, TriageResult |
| app/utils/diffing.py | levenshtein_ops |
| app/services/ocr_service.py | process_handwriting_image (uses NotebookPipeline) |
| app/routers/ocr.py | POST /api/ocr/process, POST /api/ocr/{id}/review |

**Unused in notebook path:** app/services/ocr.py (standalone TrOCR), app/ocr/engines/trocr_engine.py

## 7. No Duplicate OCR Pipeline

Single path: `NotebookPipeline` → `NotebookOCREngine` (DocTR + TrOCR) → `notebook_layers` (layer1, layer2, Groq). Used by both `/api/ocr/process` and `ocr_service.process_handwriting_image` (sessions submit-handwriting).

## 8. Remaining Gaps vs Notebook

| Gap | Why |
|-----|-----|
| Custom T5 from zip | Notebook loads from `DyslexAI_Model_Unzipped` etc. Backend uses ByT5 when path not found. Set `DYSLEXAI_T5_MODEL_PATH` or place model at `DyslexAI_Model_Unzipped`. |
| Groq optional | Notebook always runs Groq. Backend runs only when `GROQ_API_KEY` is set. |
| Per-line matplotlib | Notebook plots each line; backend is headless. |
| DocTR geometry | Notebook assumes `line.geometry` as `((x0,y0),(x1,y1))` relative. Same in backend. |
