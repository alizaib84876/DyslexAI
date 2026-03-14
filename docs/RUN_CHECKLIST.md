# DyslexAI Final Run Checklist

Use this checklist to validate the pipeline before benchmark tuning.

> **Current OCR regression:** Run `.\scripts\run-regression.ps1` to verify notebook_parity lock-in on 6 golden samples. This is the authoritative regression test.

## Prerequisites

- Backend dependencies installed
- Test images ready (see categories below)

## 1. Start Backend with Debug

```bash
# Windows PowerShell
$env:DYSLEXAI_DEBUG="1"
cd dyslexia-backend
uvicorn app.main:app --reload

# Or add to .env:
# DYSLEXAI_DEBUG=1
```

## 2. Test Image Set

### Minimum 4-image validation (run these first)

| File | Description | What to check |
|------|-------------|---------------|
| `messy_handwriting.png` | Messy handwritten paragraph | medium/hard tiers, TrOCR triggers |
| `ruled_notebook.png` | Ruled notebook page | line extraction, TrOCR on handwriting |
| `signoff_closing.png` | Short bottom line e.g. "Hope to hear from you soon! XX" | `is_signoff=True`, signoff metrics |
| `mixed_print_cursive.png` | Mixed print body + cursive signoff | tier mix, signoff on last line |

```bash
python run_batch_test.py messy_handwriting.png ruled_notebook.png signoff_closing.png mixed_print_cursive.png
```

### Full 15-image benchmark

| Category | Count | Description |
|----------|-------|-------------|
| **Easy** | 5 | Neat print, high contrast, clear lines |
| **Medium** | 5 | Messy print, ruled paper, mixed quality |
| **Hard/Signoff** | 5 | Cursive signoff, short bottom lines, faint pencil |

## 3. Per-Image Checks

For each test image, verify:

### A. Final OCR Text
- [ ] Output is readable
- [ ] No obvious numeric garbage (e.g. `1961 62`, `0 0`)
- [ ] Signoff lines (if any) look correct

### B. `run_summary` (from API response or export JSON)

| Field | What to check |
|-------|---------------|
| `total_lines` | Matches expected line count |
| `trocr_skip_count` | Easy lines skipped TrOCR |
| `trocr_light_count` | Medium lines got 3 variants |
| `trocr_full_count` | Hard lines got 6 variants |
| `primary_vs_winner_gap` | Positive = TrOCR helping |
| `winner_changed_text_rate` | Reasonable (not 0, not 1) |
| `signoff_count` | Signoff lines detected |
| `signoff_changed_text_count` | Signoff lines improved by TrOCR |

### C. `tier_summary`
- [ ] `easy.avg_primary_vs_winner` low or 0 (skipped lines)
- [ ] `hard.avg_primary_vs_winner` ≥ `medium.avg_primary_vs_winner`

### D. `variant_win_counts`
- [ ] Which variants win most often
- [ ] No single variant dominating everything

### E. Signoff Flags (for bottom/closing lines)
- [ ] `is_signoff` true on expected signoff lines
- [ ] `signoff_reasons` make sense
- [ ] `signoff_score` ≥ 0.65 when detected

## 4. A/B/C Threshold Benchmark

Run the same 15 images with each setting:

### Setting A (current)
```bash
# Default: easy < 0.5, hard >= 1.8
# No env override needed
```

### Setting B (aggressive rescue)
```bash
$env:DYSLEXAI_EASY_THRESHOLD="0.4"
$env:DYSLEXAI_HARD_THRESHOLD="1.5"
```

### Setting C (speed-focused)
```bash
$env:DYSLEXAI_EASY_THRESHOLD="0.7"
$env:DYSLEXAI_HARD_THRESHOLD="2.0"
```

### Compare
| Metric | Setting A | Setting B | Setting C |
|--------|-----------|-----------|-----------|
| Line accuracy | | | |
| Runtime (s) | | | |
| TrOCR calls | | | |
| primary_vs_winner_gap | | | |
| Errors on hard samples | | | |

## 5. Quick API Test

```bash
# Upload image
curl -X POST "http://localhost:8000/api/ocr/upload" \
  -F "file=@path/to/test_image.png"

# Get result (use upload_id from response)
curl "http://localhost:8000/api/ocr/result/{upload_id}"
```

Check `metadata.run_summary` and `metadata.run_summary.tier_summary` in the response.

## 6. Export for Analysis

```python
from app.pipeline.notebook_pipeline import NotebookPipeline

pipeline = NotebookPipeline()
result = pipeline.process_image("path/to/image.png")

# Inspect metadata (ocr_mode, gate_rejected_*, etc.)
print(result.metadata)
print("raw:", result.raw_text)
print("corrected:", result.corrected_text)
```

## 7. Debug Logs (when DYSLEXAI_DEBUG=1)

Look for:
- `OCR lines before/after merge`
- `Handwriting lines after extraction`
- `Fallback: tier_counts=...`
- `Line N: X variants (full=True/False)`
- `Signoff line N: score=... reasons=[...]`
- `Final assembled: ...`

## 8. Success Criteria

- [ ] No crashes on 15 test images
- [ ] Tier distribution looks sensible (easy > medium > hard typically)
- [ ] Signoff lines detected where expected
- [ ] primary_vs_winner_gap positive on medium/hard lines
- [ ] Runtime acceptable (< 30s per image for hard mode)

## 9. Next Steps After Run

| Outcome | Action |
|---------|--------|
| Output good, tiers sensible | Proceed to full benchmark |
| Too many wrong lines in easy | Lower `DYSLEXAI_EASY_THRESHOLD` |
| Full rescue rarely helps | Raise `DYSLEXAI_HARD_THRESHOLD` |
| Signoff precision low | Tune signoff detector threshold |
| Signoff lines still wrong | Consider signoff-aware fusion bonus |
