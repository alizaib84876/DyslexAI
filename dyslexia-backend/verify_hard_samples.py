"""
OCR quality verification on hardest real samples.
Run from dyslexia-backend with backend running: python verify_hard_samples.py
Or: python verify_hard_samples.py --standalone  (uses pipeline directly, no server)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Samples (relative to project root)
HARD_SAMPLES = [
    "messy_handwriting.png",
    "mixed_print_cursive.png",
    "new_test_sample.png",
    "ruled_notebook.png",
    "signoff_closing.png",
    "test_image.png",
]


def run_via_api(image_path: Path, base_url: str = "http://localhost:8000") -> dict | None:
    try:
        import httpx
    except ImportError:
        print("  Install httpx: pip install httpx")
        return None
    url = f"{base_url}/api/ocr/process"
    try:
        with open(image_path, "rb") as f:
            data = f.read()
        with httpx.Client(timeout=300) as client:
            r = client.post(
                url,
                files={"file": (image_path.name, data, "image/png")},
                data={"quality_mode": "quality_local"},
            )
        if r.status_code != 200:
            print(f"  API error: {r.status_code} {r.text[:200]}")
            return None
        return r.json()
    except Exception as e:
        print(f"  API error: {e}")
        return None


def run_standalone(image_path: Path) -> tuple[dict, float]:
    """Run pipeline directly (no server). Returns (result_dict, latency_seconds)."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from app.pipeline.notebook_pipeline import NotebookPipeline
    pipeline = NotebookPipeline()
    t0 = time.perf_counter()
    result = pipeline.process_image(str(image_path))
    latency = time.perf_counter() - t0
    return {
        "raw_text": result.raw_text or "",
        "corrected_text": result.corrected_text or "",
        "correction_layer1": result.correction_layer1 or "",
        "correction_layer2": result.correction_layer2 or "",
        "correction_layer3": result.correction_layer3 or "",
        "lines": [
            {"raw_text": getattr(l, "raw_text", ""), "confidence": getattr(l, "confidence", 0)}
            for l in result.lines
        ],
        "metadata": result.metadata or {},
    }, latency


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--standalone", action="store_true", help="Run pipeline directly, no API")
    ap.add_argument("--base-url", default="http://localhost:8000")
    ap.add_argument("--samples-dir", default=None, help="Dir containing samples (default: parent of dyslexia-backend)")
    args = ap.parse_args()

    root = Path(__file__).resolve().parents[1]  # project root
    samples_dir = Path(args.samples_dir) if args.samples_dir else root
    backend_dir = Path(__file__).resolve().parent
    os.chdir(backend_dir)
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    print("=" * 70)
    print("OCR Quality Verification — Hard Samples")
    print("=" * 70)
    print(f"Samples dir: {samples_dir}")
    print(f"Mode: {'standalone' if args.standalone else 'API'}")
    print()

    results = []
    for name in HARD_SAMPLES:
        path = samples_dir / name
        if not path.exists():
            path = root / name
        if not path.exists():
            print(f"[SKIP] {name} not found")
            continue

        print(f"\n--- {name} ---")
        latency_sec = None
        if args.standalone:
            out, latency_sec = run_standalone(path)
        else:
            t0 = time.perf_counter()
            out = run_via_api(path, args.base_url)
            if out is not None:
                latency_sec = time.perf_counter() - t0

        if out is None:
            print("  FAILED")
            continue

        raw = out.get("raw_text", "")
        corrected = out.get("corrected_text", "")
        layer1 = out.get("correction_layer1", "")
        layer2 = out.get("correction_layer2", "")
        layer3 = out.get("correction_layer3", "")

        if latency_sec is not None:
            print(f"  latency:  {latency_sec:.2f}s")
        print(f"  raw:      {raw[:120]}{'...' if len(raw) > 120 else ''}")
        print(f"  layer1:   {layer1[:120]}{'...' if len(layer1) > 120 else ''}")
        print(f"  layer2:   {layer2[:120]}{'...' if len(layer2) > 120 else ''}")
        print(f"  final:    {corrected[:120]}{'...' if len(corrected) > 120 else ''}")
        if "lines" in out and out["lines"]:
            print(f"  lines:    {len(out['lines'])}")
        print("  OK")

        meta = out.get("metadata", {})
        # Check: is final worse than raw? (repetition/echo = corruption; similarity drift from sanitization is OK)
        from app.utils.diffing import _has_repetition, _has_echo_or_prompt_leakage
        final_worse_than_raw = _has_repetition(corrected) or _has_echo_or_prompt_leakage(corrected)

        results.append({
            "image": name,
            "raw_text": raw,
            "correction_layer1": layer1,
            "correction_layer2": layer2,
            "correction_layer3": layer3,
            "corrected_text": corrected,
            "line_count": len(out.get("lines", [])),
            "latency_sec": round(latency_sec, 2) if latency_sec is not None else None,
            "gate_rejected_layer2": meta.get("gate_rejected_layer2"),
            "gate_rejected_layer3": meta.get("gate_rejected_layer3"),
            "layer2_rejection_reason": meta.get("layer2_rejection_reason"),
            "layer3_rejection_reason": meta.get("layer3_rejection_reason"),
            "final_worse_than_raw": final_worse_than_raw,
        })

    out_file = root / "OCR_HARD_SAMPLES_VERIFICATION.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n{'='*70}")
    print(f"Results saved to {out_file}")
    print("=" * 70)
    return 0 if results else 1


if __name__ == "__main__":
    sys.exit(main())
