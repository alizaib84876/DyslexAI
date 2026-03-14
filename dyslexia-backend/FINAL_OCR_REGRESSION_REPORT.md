# Final OCR Regression Report

**OCR Mode:** notebook_parity (locked)  
**Timestamp:** 2026-03-14T15:05:34Z  
**Samples Dir:** project root  
**Golden:** `data/ocr/golden/expected_outputs.json`

## Summary

| Metric | Value |
|--------|-------|
| **Passed** | 6 |
| **Failed** | 0 |
| **Skipped** | 0 |
| **Total** | 6 |

**Result: PASS**

---

## Per-Sample Results

| Sample | raw_text match | corrected_text | Latency (s) | Status |
|--------|----------------|----------------|-------------|--------|
| messy_handwriting.png | ✓ | if the threatened counter revolution was not to bring the President back these 13 states of the Commonwealth were an occasion worthy of his presence | 54.56 | PASS |
| mixed_print_cursive.png | ✓ | The revolution brought change to the nation These were important days for the Commonwealth With best wishes , Hope to hear from you soon ! XX | 35.82 | PASS |
| new_test_sample.png | ✓ | o c. K. H. H. H. H. H. H. H. i.s a g rat scoff That nav cl fore dislesey pepos ! i har bih tekhigh m crind 10thmor " I think that little i'mluv't f wen " 7 i abouts if 0 will but it will be asem sp. l che teshis 4th Verenic | 176.32 | PASS |
| ruled_notebook.png | ✓ | The quick brown fox jumps over the lazy dog These states of the Commonwealth were worthy After all it was Mr Nkrumah who led the way . | 48.30 | PASS |
| signoff_closing.png | ✓ | Dear Sir , Thank you for your letter I will reply in full soon Best regards , lope to hear from you soon tax | 46.68 | PASS |
| test_image.png | ✓ | if the threatened , counter , revolution " not to bring the President , backs thes 13 Stakes , of the Commonwealth was an occasion worthy , of his presence after all it was Mr. Nklymuh | 51.55 | PASS |

---

## Run Command

```bash
cd dyslexia-backend
python scripts/ocr_regression.py --report FINAL_OCR_REGRESSION_REPORT.json
```
