# OCR Notebook-vs-Backend Parity Gaps

Identified differences that can cause recognition gaps between fyp.ipynb and dyslexia-backend.

---

## 1. TrOCR Model

| Aspect | Notebook (fyp.ipynb) | Backend |
|--------|---------------------|---------|
| Model | `microsoft/trocr-large-handwritten` | `trocr-large` when TROCR_FAST=0; `trocr-base` when TROCR_FAST=1 |
| File | — | `app/ocr/engines/notebook_engine.py` L36-38, `app/core/config.py` L22-27 |

**Gap:** Backend uses trocr-base when TROCR_FAST=1 (default in verify scripts), which is smaller and may have lower recognition quality.

---

## 2. TrOCR generate() Parameters

| Aspect | Notebook | Backend |
|--------|----------|---------|
| Call | `trocr_model.generate(pixel_values)` | `trocr_model.generate(pixel_values, max_new_tokens=64, num_beams=2, early_stopping=True)` |
| Effective max_length | 21 (transformers default) | 64 tokens |
| File | fyp.ipynb run_ocr_inference | `app/ocr/engines/notebook_engine.py` L80 |

**Gap:** Notebook uses default generation; transformers warns "Using the model-agnostic default `max_length` (=21)". So notebook may truncate long lines to ~21 tokens. Backend uses max_new_tokens=64, allowing longer output. Backend also uses num_beams=2, early_stopping=True. Different decoding yields different text; notebook truncation can lose content.

---

## 3. Decode / Postprocess

| Aspect | Notebook | Backend |
|--------|----------|---------|
| Decode | `processor.batch_decode(...)[0]` (no strip) | `processor.batch_decode(...)[0].strip()` |
| File | fyp.ipynb | `app/ocr/engines/notebook_engine.py` L81 |

**Gap:** Backend strips trailing/leading whitespace. Minor; usually does not affect content.

---

## 4. TrOCRProcessor

| Aspect | Notebook | Backend |
|--------|----------|---------|
| use_fast | Not specified (default) | `use_fast=False` |
| File | — | `app/ocr/engines/notebook_engine.py` L43 |

**Gap:** HuggingFace may use fast processor by default. Backend explicitly uses slow processor. Can affect preprocessing and outputs.

---

## 5. Inference Context

| Aspect | Notebook | Backend |
|--------|----------|---------|
| Context | `torch.no_grad()` | `torch.inference_mode()` |
| File | fyp.ipynb | `app/ocr/engines/notebook_engine.py` L79 |

**Gap:** Both disable gradients. `inference_mode` is stricter but should not change recognition results.

---

## 6. Line Segmentation (DocTR)

| Aspect | Notebook | Backend |
|--------|----------|---------|
| Detector | `ocr_predictor(pretrained=True)` | Same |
| Input | `img_gray_rgb` (grayscale→RGB) | Same |
| Crop pad | 5 | 5 |
| Min crop size | 5×5 | 5×5 |
| File | fyp.ipynb | `app/ocr/engines/notebook_engine.py` L56-76 |

**Gap:** Detection and crop logic match. No expected segmentation difference.

---

## 7. Ordering / Clustering

| Aspect | Notebook | Backend |
|--------|----------|---------|
| Sort | `(y_center, bbox[0])` | Same |
| Cluster threshold | `median_h * 0.5` | Same |
| File | fyp.ipynb | `app/ocr/engines/notebook_engine.py` L95-107 |

**Gap:** Ordering and clustering logic match.

---

## 8. Paragraph Build

| Aspect | Notebook | Backend |
|--------|----------|---------|
| Join | `" ".join([r["text"].strip() for r in results_sorted if r["text"].strip()]).strip()` | `" ".join(r["text"].strip() for r in clustered if r["text"].strip()).strip()` |
| File | fyp.ipynb | `app/ocr/engines/notebook_engine.py` L115 |

**Gap:** Equivalent.

---

## Summary: Likely Recognition Gaps

1. **TrOCR model** — trocr-base vs trocr-large when TROCR_FAST=1
2. **generate() kwargs** — backend adds max_new_tokens=64, num_beams=2, early_stopping=True
3. **TrOCRProcessor use_fast** — backend uses use_fast=False
4. **decode .strip()** — backend strips; notebook does not (minor)

---

## Recommended Parity Fixes

1. For parity testing: run backend with `TROCR_FAST=0` (trocr-large).
2. Add optional notebook-style generate (no kwargs) for A/B comparison.
3. Align TrOCRProcessor use_fast with notebook if needed.
4. Document and keep decode .strip() for consistency.
