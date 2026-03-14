# Research-Backed Design Notes

This file summarizes the research-aligned reasoning behind the major implementation
choices used in the production refactor.

## 1. Hybrid OCR Instead Of One Recognizer

Why:
- Difficult handwriting is highly variable.
- A single OCR model can be fast or strong, but often not both on CPU.
- Hybrid routing lets the system stay efficient while still handling hard lines.

What DyslexAI does (notebook_parity pipeline):
- Uses DocTR for line detection and TrOCR for recognition.
- Layer 1 (sanitize) → Layer 2 (ByT5) → Layer 3 (Groq optional).
- Acceptance gate rejects corrections that worsen similarity.

## 2. Adaptive Preprocessing Instead Of Always-On Aggressive Cleanup

Why:
- OCR research shows deskewing, contrast enhancement, denoising, and thresholding
  can help substantially.
- The same literature also warns that destructive preprocessing can remove useful
  handwritten detail.

What DyslexAI does:
- Measures blur, brightness, contrast, and skew first.
- Applies preprocessing conservatively.
- Generates multiple rescue variants only for difficult line crops.

## 3. Local Byte-Level Post-Correction

Why:
- OCR noise often corrupts characters in ways that hurt token-based models.
- Byte-level models are more robust to misspellings, merged tokens, and strange
  OCR outputs than strict wordpiece approaches.

What DyslexAI does:
- Applies a fast lexical cleanup stage for obvious OCR artifacts.
- Uses ByT5 locally for context-aware correction.
- Uses sentence-aware chunking and a paragraph smoothing pass so correction works at
  word, sentence, and paragraph level.

## 4. Explainability For Students And Teachers

Why:
- Educational assistive tools must show what changed and where confidence is weak.
- Teachers need auditability; students need clarity rather than hidden rewriting.

What DyslexAI does:
- Stores raw OCR and corrected text separately.
- Computes line-level edit operations.
- Surfaces suspicious lines, fallback usage, and uncertainty scores in the UI.

## 5. FastAPI + React + SQLite For Local-First Deployment

Why:
- Python is the natural backend for OCR and NLP models.
- React gives a polished dashboard and comparison workspace.
- SQLite is reliable, simple, and ideal for single-machine local deployments.

What DyslexAI does:
- Runs everything locally by default.
- Stores uploads, OCR runs, lines, corrections, and progress snapshots in SQLite.
- Exposes a clean API for a serious product-style frontend without requiring cloud
  infrastructure for core features.
