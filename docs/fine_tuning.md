# TrOCR Fine-Tuning

This project now includes a local fine-tuning path for `microsoft/trocr-large-handwritten`.
It is designed for your own labeled handwriting samples so the OCR stack can adapt to the
writing style of your students instead of relying only on generic handwriting checkpoints.

## Workflow

1. Create a JSONL manifest describing your labeled samples.
2. Prepare a line-level dataset using the production paragraph/line extraction path.
3. Fine-tune `TrOCR-large` on the prepared line crops.
4. Point the production app to the resulting checkpoint when you are ready to use it.

## Source Manifest Format

Each line in the source manifest is one JSON object.

### Option A: line-level labeled samples

```json
{"sample_id":"line_001","image_path":"data/my_labels/line_001.png","text":"The student likes reading.","split":"train"}
```

Use this when each image already contains exactly one handwriting line.

### Option B: paragraph image with ordered line labels

```json
{"sample_id":"paragraph_001","image_path":"data/my_labels/page_001.jpg","line_texts":["The student likes reading.","They practise writing every day."],"split":"train"}
```

Use this when one image contains multiple ordered lines and you know the correct text for
each line in reading order.

An example manifest is included in `docs/examples/handwriting_manifest.sample.jsonl`.

## Prepare The Dataset

Run:

```bash
python scripts/prepare_trocr_dataset.py --manifest docs/examples/handwriting_manifest.sample.jsonl
```

The script will:

- keep line-level samples as-is
- segment paragraph samples using the same production preprocessing and paragraph-aware
  line extraction path used by the app
- save line crops into `dyslexia-backend/data/training/prepared/crops/`
- write `dyslexia-backend/data/training/prepared/prepared_manifest.jsonl`
- write `skipped_samples.txt` when a paragraph image does not produce the same number of
  extracted lines as provided labels

## Fine-Tune TrOCR-large

Run:

```bash
python scripts/fine_tune_trocr.py ^
  --manifest dyslexia-backend/data/training/prepared/prepared_manifest.jsonl ^
  --output-dir dyslexia-backend/data/training/checkpoints/trocr_large_custom
```

Useful flags:

- `--epochs 5`
- `--train-batch-size 1`
- `--gradient-accumulation-steps 4`
- `--learning-rate 3e-5`
- `--use-cpu`

## Notes

- `accelerate` is required for training through Hugging Face `Seq2SeqTrainer`.
- The preparation step intentionally reuses the production OCR line extraction path so the
  model sees crops similar to real deployment.
- If you later collect enough data, a true paragraph-level model can be trained separately,
  but fine-tuning `TrOCR-large` on your line crops is the strongest practical next step.
