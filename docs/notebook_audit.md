# Notebook Audit: `fyp.ipynb`

This document captures what already exists in the original notebook, what is valuable,
what is broken, and how the production codebase reuses the strongest parts without
discarding the project's prior work.

## Executive Summary

`fyp.ipynb` is not a trivial prototype. It contains two major generations of work:

1. A simple but working OCR pipeline using DocTR for line detection, TrOCR for line
   recognition, an optional local T5 model, and a Groq-based final correction step.
2. A stronger modular offline-first design using a primary OCR engine, adaptive image
   preprocessing, suspicious-line routing, TrOCR fallback, local text correction,
   and JSON export with edit diffs.

The second design is the better long-term foundation for a serious Final Year Project,
so the production refactor preserves its architecture and data flow.

## What Exists In The Notebook

### Reusable strengths

- `AppConfig`, `ModelConfig`, `RoutingConfig`, and `PreprocessConfig`
  provide a good starting point for a configurable local OCR system.
- `ImageTriage` already estimates skew, blur, contrast, and thresholding need.
- `Preprocessor` already performs several OCR-helpful steps:
  border cropping, deskewing, denoising, CLAHE contrast enhancement, adaptive
  thresholding, and line-level rescue variants.
- `Router` already identifies suspicious lines so the expensive fallback recognizer
  only runs where quality is poor.
- `FusionEngine` already compares candidate outputs conservatively instead of blindly
  replacing one recognizer with another.
- `levenshtein_ops()` already creates the exact diff information needed for
  UI correction highlighting and teacher/student comparison views.
- `OCRResult` and line-level metadata are already close to what a backend API and
  dashboard need to persist.

### Valuable experimental path

The early notebook pipeline using DocTR and TrOCR is worth keeping as project history
because it proves the concept, demonstrates baseline behaviour, and shows how the
project evolved from a direct OCR demo into a more serious hybrid pipeline.

### Problems and weaknesses

- The notebook contains duplicate implementations of the modular pipeline.
- The older PaddleOCR integration is version fragile and fails on newer releases
  because it passes deprecated or removed keyword arguments such as `use_gpu`.
- The early pipeline embeds a Groq API key directly in source code, which is not safe
  for a production or research repository.
- The early pipeline depends on an online correction layer, which conflicts with the
  final offline-first requirement.
- Several cells are experimental, outdated, or superseded by later code.
- The notebook mixes product logic, model loading, experiments, and environment setup
  in one place, which makes maintenance difficult.

## Keep / Improve / Remove

### Keep

- Adaptive preprocessing and image triage.
- Suspicious-line routing.
- TrOCR fallback for hard handwriting cases.
- Local correction stage as a separate module.
- Edit diff generation and metadata export.
- Quality modes to trade off speed and accuracy on normal PCs.

### Improve

- Replace notebook-only runtime code with a reusable backend package.
- Make OCR engine loading lazy, cached, and version safe.
- Add paragraph-level correction with chunking and guardrails.
- Add persistence for uploads, OCR runs, corrections, and progress tracking.
- Add a polished frontend that surfaces raw OCR, corrected text, uncertainty,
  and student history.
- Add serious automated tests instead of only notebook self-checks.

### Remove

- Hardcoded secrets.
- Duplicate notebook code blocks.
- The old online-first correction step as a default path.
- Temporary cleanup tooling such as `clean_notebook.py`.

## Production Refactor Mapping

Notebook concept -> Production module

- `ImageTriage` -> `dyslexia-backend/app/ocr/triage.py`
- `Preprocessor` -> `dyslexia-backend/app/ocr/preprocess.py`
- `PaddleEngine` -> `dyslexia-backend/app/ocr/engines/paddle_engine.py`
- `TrOCREngine` -> `dyslexia-backend/app/ocr/engines/trocr_engine.py`
- `Router` -> `dyslexia-backend/app/ocr/router.py`
- `FusionEngine` -> `dyslexia-backend/app/ocr/fusion.py`
- `ByT5Corrector` -> `dyslexia-backend/app/correction/byt5_corrector.py`
- `levenshtein_ops()` -> `dyslexia-backend/app/utils/diffing.py`
- `DyslexiaOCRApp.process_image()` -> `dyslexia-backend/app/pipeline/service.py`

## Security Note

The notebook contains a hardcoded Groq API key in one of the early cells. The
production system removes online correction by default and does not preserve that key.

## Research Alignment

The preserved architecture matches practical OCR research and engineering guidance:

- difficult handwriting benefits from hybrid OCR rather than a single recognizer,
- preprocessing should be adaptive and conservative rather than destructive,
- post-correction should be separated from recognition so it can use contextual
  signals while keeping OCR outputs transparent,
- line-level metadata and uncertainty are important for explainability in
  educational tools used by students and teachers.
