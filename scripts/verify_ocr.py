#!/usr/bin/env python3
"""Run OCR on hard handwriting samples and output structured verification report.

Usage:
  python scripts/verify_ocr.py path/to/image1.png path/to/image2.jpg ...
  python scripts/verify_ocr.py  # uses dyslexia-backend/data/ocr/uploads/*.png if any

Output: JSON to stdout with raw_text, corrected_text, fallback_lines, difficulty_tiers,
chosen_variants, total_latency per image.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

# Add dyslexia-backend to path
ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "dyslexia-backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


def main():
    import os
    os.chdir(BACKEND)
    os.environ.setdefault("DATABASE_URL", "sqlite:///./dyslexia.db")
    os.environ.setdefault("QUALITY_MODE", "quality_local")

    from app.pipeline.notebook_pipeline import NotebookPipeline

    pipeline = NotebookPipeline()

    images: list[Path] = []
    for arg in sys.argv[1:]:
        p = Path(arg)
        if p.exists() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
            images.append(p.resolve())
    if not images:
        uploads = BACKEND / "data" / "ocr" / "uploads"
        if uploads.exists():
            images = list(uploads.glob("*.png")) + list(uploads.glob("*.jpg"))
        if not images:
            print(json.dumps({"error": "No images provided. Usage: python scripts/verify_ocr.py path/to/image.png ..."}), file=sys.stderr)
            sys.exit(1)

    results = []
    for img_path in images:
        t0 = time.perf_counter()
        try:
            result = pipeline.process_image(str(img_path))
            elapsed = time.perf_counter() - t0
        except Exception as e:
            elapsed = time.perf_counter() - t0
            results.append({
                "image_name": img_path.name,
                "error": str(e),
                "total_latency_seconds": round(elapsed, 2),
            })
            continue

        fallback_lines = [i for i, line in enumerate(result.lines) if getattr(line, "fallback_used", False)]
        difficulty_tiers = [getattr(line, "difficulty_tier", None) for line in result.lines]
        chosen_variants = [getattr(line, "chosen_variant", None) for line in result.lines]

        results.append({
            "image_name": img_path.name,
            "raw_text": result.raw_text or "",
            "corrected_text": result.corrected_text or "",
            "fallback_lines": fallback_lines,
            "difficulty_tiers": difficulty_tiers,
            "chosen_variants": chosen_variants,
            "total_latency_seconds": round(elapsed, 2),
            "correction_layer1": result.correction_layer1,
            "correction_layer2": result.correction_layer2,
            "correction_layer3": result.correction_layer3,
            "correction_layer4": result.corrected_text or "",
            "line_count": len(result.lines),
            "metadata": result.metadata or {},
        })

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
