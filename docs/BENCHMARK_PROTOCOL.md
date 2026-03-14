# DyslexAI OCR Benchmark Protocol

Use this protocol to tune tier thresholds and measure accuracy/speed tradeoffs.

## Tier Threshold Settings to Test

| Setting | easy_threshold | hard_threshold | Use case |
|---------|----------------|----------------|----------|
| **A (current)** | 0.5 | 1.8 | Default balanced |
| **B (aggressive rescue)** | 0.4 | 1.5 | More TrOCR, better accuracy on hard samples |
| **C (speed-focused)** | 0.7 | 2.0 | Fewer TrOCR calls, faster runtime |

Override via environment variables or config:

```bash
# Setting B (aggressive rescue)
export DYSLEXAI_EASY_THRESHOLD=0.4
export DYSLEXAI_HARD_THRESHOLD=1.5

# Setting C (speed-focused)
export DYSLEXAI_EASY_THRESHOLD=0.7
export DYSLEXAI_HARD_THRESHOLD=2.0
```

Or in code:

```python
settings.routing.difficulty_easy_threshold = 0.4  # Setting B
settings.routing.difficulty_hard_threshold = 1.5
```

## Benchmark Categories

Test on 50–100 samples across:

| Category | Description |
|----------|-------------|
| Neat print | Clear block letters |
| Messy print | Irregular but printed |
| Mixed print + cursive | Body print, signoff cursive |
| Ruled notebook | Horizontal lines |
| Graph paper | Grid background |
| Faint pencil | Low contrast |
| Skewed photos | Camera angle |
| Short signoff lines | "Hope to hear from you soon! XX" |
| Long paragraphs | Multi-line prose |

## Metrics to Collect

From `metadata.run_summary`:

- `total_lines`, `suspicious_lines`
- `lines_sent_to_trocr`, `trocr_skip_count`, `trocr_light_count`, `trocr_full_count`
- `avg_winner_score_gap` – margin between best and second-best candidate
- `primary_vs_winner_gap` – how much TrOCR improved over primary OCR
- `winner_changed_text_rate` – how often the winner differs from primary (0–1)
- `tier_summary` – per-tier breakdown: `easy`, `medium`, `hard` each with `count`, `avg_winner_gap`, `avg_primary_vs_winner`
- `variant_win_counts` – which variants win most often

**Signoff metrics:**
- `signoff_count` – lines detected as signoff
- `signoff_changed_text_count` – signoff lines where TrOCR changed output
- `signoff_avg_primary_vs_winner` – avg TrOCR gain on signoff lines
- `signoff_lexical_changes_count` – lexical corrections on signoff lines

**Interpretation:**
- High `primary_vs_winner_gap` + high `winner_changed_text_rate` = TrOCR rescue is helping
- Near-zero `primary_vs_winner_gap` = primary OCR often sufficient
- Per-tier gaps show whether easy/medium/hard deserve their routing
- Signoff metrics show whether signoff detection and handling improve closing lines

From `metadata`:

- `runtime_seconds`
- `fallback_seconds`

## Evaluation Sheet (Manual Tagging)

For each sample, record:

| Field | Values |
|-------|--------|
| **Sample ID** | e.g. `postcard_01` |
| **Category** | From benchmark categories above |
| **Line accuracy** | % correct lines |
| **Failure type** (if any) | `numeric_garbage`, `missing_words`, `wrong_signoff`, `wrong_order`, `over_correction`, `hallucination`, `other` |
| **Notes** | Free text |

## Failure Type Definitions

- **numeric_garbage**: Digits or junk like `1961 62`, `0 0` in prose
- **missing_words**: Expected words absent
- **wrong_signoff**: Short closing line misread (e.g. `close` vs `Hope`, `tax` vs `XX`)
- **wrong_order**: Lines out of reading order
- **over_correction**: Correction layer changed correct text
- **hallucination**: ByT5 or other model invented unrelated text

## Threshold Tuning Plan

1. Run 100 lines with **Setting A** (current). Record metrics and failure types.
2. Run same set with **Setting B**. Compare line accuracy, runtime, TrOCR calls.
3. Run same set with **Setting C**. Compare.
4. Adjust:
   - If too many bad lines in easy → lower `difficulty_easy_threshold`
   - If full runs barely beat light → raise `difficulty_hard_threshold`
   - Target: easy = high precision skip, medium = cost/benefit zone, hard = truly difficult only

## Quick Run Script

```python
from app.pipeline.notebook_pipeline import NotebookPipeline

pipeline = NotebookPipeline()
result = pipeline.process_image("path/to/sample.png")
print(result.metadata)
print("raw:", result.raw_text[:200])
print("corrected:", result.corrected_text[:200])
```

For tier thresholds (Setting B/C), set env before import: `DYSLEXAI_EASY_THRESHOLD=0.4`, `DYSLEXAI_HARD_THRESHOLD=1.5`.
