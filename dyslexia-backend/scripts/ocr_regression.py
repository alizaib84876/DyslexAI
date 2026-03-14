"""
Strict OCR regression — verifies notebook_parity lock-in.

- Enforces OCR_MODE=notebook_parity at runtime
- Runs golden samples through live pipeline
- Compares raw_text to expected notebook_parity outputs
- Fails loudly on any mismatch

Usage:
  cd dyslexia-backend
  python scripts/ocr_regression.py [--samples-dir PATH] [--golden PATH] [--report PATH]

Exit: 0 = pass, 1 = fail
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

# Enforce notebook_parity before any imports that read config
os.environ.setdefault("OCR_MODE", "notebook_parity")
if os.getenv("OCR_MODE", "").lower().strip() != "notebook_parity":
    print("FATAL: OCR_MODE must be notebook_parity. Got:", repr(os.getenv("OCR_MODE")))
    sys.exit(1)

GOLDEN_PATH = BACKEND / "data" / "ocr" / "golden" / "expected_outputs.json"


def main():
    import argparse
    ap = argparse.ArgumentParser(description="OCR regression: verify notebook_parity lock-in")
    ap.add_argument("--samples-dir", default=None, help="Directory containing sample images")
    ap.add_argument("--golden", default=str(GOLDEN_PATH), help="Path to expected_outputs.json")
    ap.add_argument("--report", default=None, help="Write JSON report to path (e.g. FINAL_OCR_REGRESSION_REPORT.json)")
    args = ap.parse_args()

    root = BACKEND.parent
    samples_dir = Path(args.samples_dir) if args.samples_dir else root
    golden_path = Path(args.golden)

    if not golden_path.exists():
        print(f"FATAL: Golden file not found: {golden_path}")
        sys.exit(1)

    with open(golden_path) as f:
        golden = json.load(f)

    if golden.get("ocr_mode") != "notebook_parity":
        print(f"FATAL: Golden ocr_mode must be notebook_parity. Got: {golden.get('ocr_mode')}")
        sys.exit(1)

    from app.core.config import get_settings
    from app.pipeline.notebook_pipeline import NotebookPipeline

    settings = get_settings()
    if not settings.models.notebook_parity:
        print("FATAL: Runtime config has notebook_parity=False. OCR_MODE must be notebook_parity.")
        sys.exit(1)

    print("=" * 70)
    print("OCR REGRESSION — notebook_parity lock-in")
    print("=" * 70)
    print(f"Samples dir: {samples_dir}")
    print(f"Golden: {golden_path}")
    print(f"Runtime OCR_MODE: notebook_parity (verified)")
    print()

    pipeline = NotebookPipeline()
    results = []
    failed = []

    for entry in golden["samples"]:
        sample = entry["sample"]
        expected_raw = entry["expected_raw_text"]
        max_sec = entry.get("max_total_sec", 600)
        path = samples_dir / sample
        if not path.exists():
            path = root / sample
        if not path.exists():
            print(f"[SKIP] {sample} not found")
            results.append({"sample": sample, "status": "SKIP", "reason": "file not found", "raw_text_match": None, "corrected_text": None, "elapsed_sec": None})
            continue

        t0 = time.perf_counter()
        try:
            result = pipeline.process_image(str(path))
            elapsed = time.perf_counter() - t0
        except Exception as e:
            elapsed = time.perf_counter() - t0
            print(f"[FAIL] {sample}: {e}")
            results.append({"sample": sample, "status": "FAIL", "error": str(e), "elapsed_sec": round(elapsed, 2), "raw_text_match": False, "corrected_text": None})
            failed.append(sample)
            continue

        raw = result.raw_text or ""
        corrected = result.corrected_text or ""

        if raw != expected_raw:
            print(f"[FAIL] {sample}: raw_text mismatch")
            print(f"  expected: {expected_raw[:80]}...")
            print(f"  got:      {raw[:80]}...")
            results.append({
                "sample": sample,
                "status": "FAIL",
                "reason": "raw_text_mismatch",
                "expected_raw": expected_raw,
                "got_raw": raw,
                "elapsed_sec": round(elapsed, 2),
                "raw_text_match": False,
                "corrected_text": corrected or None,
            })
            failed.append(sample)
            continue

        if elapsed > max_sec:
            print(f"[WARN] {sample}: slow ({elapsed:.1f}s > {max_sec}s) but raw_text OK")
            results.append({"sample": sample, "status": "PASS", "elapsed_sec": round(elapsed, 2), "slow": True, "raw_text_match": True, "corrected_text": corrected or None})
        else:
            results.append({"sample": sample, "status": "PASS", "elapsed_sec": round(elapsed, 2), "raw_text_match": True, "corrected_text": corrected or None})

        print(f"[PASS] {sample} ({elapsed:.1f}s)")

    print()
    print("=" * 70)
    report = {
        "ocr_mode": "notebook_parity",
        "samples_dir": str(samples_dir),
        "golden_path": str(golden_path),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "passed": sum(1 for r in results if r["status"] == "PASS"),
        "failed": len(failed),
        "skipped": sum(1 for r in results if r["status"] == "SKIP"),
        "results": results,
    }
    if args.report:
        with open(args.report, "w") as f:
            json.dump(report, f, indent=2)
        print(f"Report written to {args.report}")
    if failed:
        print(f"REGRESSION FAILED: {len(failed)} mismatch(es)")
        for s in failed:
            print(f"  - {s}")
        print("=" * 70)
        sys.exit(1)
    else:
        print(f"REGRESSION PASSED: {len(results)} samples")
        print("=" * 70)
        sys.exit(0)


if __name__ == "__main__":
    main()
