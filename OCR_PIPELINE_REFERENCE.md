# OCR Pipeline Files Reference

Use this document with ChatGPT to understand and fix wrong OCR output.

---

## 1. `backend/app/ocr/engines/paddle_engine.py` (226 lines)

**Role:** Primary OCR – line detection and recognition.

- **PaddleOCR** – main engine (lines 86, 114–116)
- **DocTR** – fallback when PaddleOCR fails (lines 117–161)
- **Line ordering:** top-to-bottom, left-to-right (line 223)
- **Output:** List of `OCRLine` with `bbox`, `raw_text`, `confidence`, `source` ("paddle" or "doctr")

**Key functions:**
- `run(img_bgr)` – returns list of OCRLine
- `_call_ocr()` – calls PaddleOCR
- `_run_doctr_fallback()` – uses DocTR when PaddleOCR fails

---

## 2. `backend/app/ocr/engines/trocr_engine.py` (47 lines)

**Role:** Handwriting recognition for individual line crops.

- **Model:** `microsoft/trocr-large-handwritten`
- **Input:** Cropped line image (BGR numpy array)
- **Output:** Recognized text string

**Key function:**
- `recognize_crop(crop_bgr)` – returns text for one line crop

---

## 3. `backend/app/pipeline/service.py` (912 lines)

**Role:** Main pipeline – orchestrates OCR, line ordering, TrOCR, and correction.

**Flow:**
1. Read image → triage → preprocess (lines 764–770)
2. Paddle/DocTR run for line detection (line 773)
3. Merge fragmented lines if DocTR (lines 774–776)
4. **Handwriting mode:** `_extract_handwriting_lines()` – ruled page, projection, or geometry (lines 416–467)
5. Build fallback jobs – which lines go to TrOCR (lines 791–821)
6. TrOCR processes fallback lines in parallel (lines 823–838)
7. Assemble raw_text from all lines (lines 841–843)
8. Correction pipeline (line 845)

**Important functions:**
- `_merge_fragmented_lines()` (189–236) – merges same-row fragments
- `_extract_handwriting_lines()` (416–467) – line ordering for hard mode
- `_extract_ruled_page_lines()` (341–414) – uses notebook rules
- `_extract_projection_line_bands()` (347–408) – ink density
- `_process_fallback_line()` (469–541) – TrOCR + fusion per line
- `process_image()` (759–883) – full pipeline

**Line order:** Determined by `_extract_handwriting_lines` → ruled/projection/geometry. Wrong order = wrong output.

---

## 4. `backend/app/ocr/preprocess.py` (333 lines)

**Role:** Image preprocessing before OCR.

**Steps (in `process()`):**
1. `isolate_document_region()` – crop to main document (avoids UI)
2. `crop_to_dominant_text_block()` – if not preserve_full_page
3. `upscale_for_handwriting()` – scale small images
4. Deskew, denoise, normalize background
5. Remove horizontal rules (ruled paper)
6. Sharpen

**Key:** `build_line_variants()` (301–328) – creates original, soft_gray, adaptive_thresh, clahe, otsu for TrOCR.

---

## 5. `backend/app/correction/paragraph.py` (147 lines)

**Role:** Correction orchestration – 3 layers.

- **Layer 1:** Lexical per line (line 99–106)
- **Layer 2:** ByT5 paragraph repair – skipped if noisy (lines 127–136)
- **Layer 3:** Spelling refinement (line 141)

**ByT5 skip conditions:** `weird_char_ratio < 0.12`, `len(paragraph) <= 220`, `len(lines) <= 5`, `avg_uncertainty < 0.65`, `suspicious_count <= 2`

---

## 6. `backend/app/correction/lexical.py` (93 lines)

**Role:** Layer 1 – punctuation cleanup and token rescue.

- `_cleanup_punctuation()` – strips weird chars, fixes spacing
- `_token_rescue()` – fuzzy match to lexicon (score_cutoff=90)
- **Lexicon:** student, teacher, school, handwriting, etc. (lines 18–40)

**Add words to `DEFAULT_LEXICON`** for token rescue.

---

## 7. `backend/app/correction/byt5_corrector.py` (92 lines)

**Role:** Layer 2 – ByT5 contextual repair.

- **Model:** `google/byt5-small`
- **Prompt:** "Repair OCR noise in this paragraph. Preserve names, topic..."
- **Chunking:** Splits at sentence boundaries, max 220 chars
- Skips if output echoes prompt or starts with "repair ocr noise"

---

## 8. `backend/app/correction/spelling_refinement.py` (121 lines)

**Role:** Layer 3 – whole-word spelling corrections.

- **SPELLING_MAP** (lines 17–95) – `(wrong, right)` pairs
- **Examples:** ("lope", "Hope"), ("tax", "XX"), ("credacted", "REDACTED")
- Applied as whole-word matches, case preserved

**To fix specific errors:** Add entries to `SPELLING_MAP`.

---

## 9. `backend/app/ocr/fusion.py` (87 lines)

**Role:** Choose between primary OCR text and TrOCR text.

- `language_plausibility_score()` – penalizes weird chars, digits; rewards common words
- `choose_text(primary, fallback)` – picks higher-scoring candidate
- **COMMON_WORDS** (lines 16–46) – add words to improve fusion

---

## Common Wrong-Output Causes

| Symptom | Likely cause | File to check |
|---------|--------------|---------------|
| Garbled / wrong order | Line ordering wrong | `pipeline/service.py` – `_extract_handwriting_lines`, `_merge_fragmented_lines` |
| Numbers instead of letters | OCR misread | `paddle_engine.py`, `trocr_engine.py` |
| Specific word wrong | Missing spelling rule | `spelling_refinement.py` – add to SPELLING_MAP |
| Token not rescued | Missing from lexicon | `lexical.py` – DEFAULT_LEXICON |
| ByT5 not helping | Skipped (noisy input) | `paragraph.py` – `_accept_candidate`, ByT5 conditions |
| Wrong candidate chosen | Fusion scoring | `fusion.py` – `language_plausibility_score`, COMMON_WORDS |

---

## File Paths (for ChatGPT)

```
backend/app/ocr/engines/paddle_engine.py
backend/app/ocr/engines/trocr_engine.py
backend/app/pipeline/service.py
backend/app/ocr/preprocess.py
backend/app/correction/paragraph.py
backend/app/correction/lexical.py
backend/app/correction/byt5_corrector.py
backend/app/correction/spelling_refinement.py
backend/app/ocr/fusion.py
```
