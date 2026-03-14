#!/usr/bin/env python3
"""Full pipeline verification on a real handwriting sample.

Usage: python verify_handwriting.py <image_path>

Outputs per-line evidence, timing, and before/after comparison.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.config import get_settings
from app.pipeline.service import DyslexAIPipelineService
from app.utils.diffing import lexical_suspicion_score


def main():
    if len(sys.argv) < 2:
        print("Usage: python verify_handwriting.py <image_path>")
        sys.exit(1)
    image_path = sys.argv[1]
    if not Path(image_path).exists():
        print(f"File not found: {image_path}")
        sys.exit(1)

    settings = get_settings()
    settings.routing.quality_mode = "adaptive"
    pipeline = DyslexAIPipelineService(settings)
    result = pipeline.process_image(image_path)

    meta = result.metadata or {}
    stage_times = {k: v for k, v in meta.items() if "seconds" in k}

    lines_out = []
    for i, line in enumerate(result.lines, 1):
        raw = line.raw_text or ""
        merged = line.merged_text or line.raw_text or ""
        final = (line.corrected_text or line.merged_text or line.raw_text or "").strip()
        lines_out.append({
            "index": i,
            "raw_text": raw,
            "lexical_suspicion_score": round(lexical_suspicion_score(raw), 3),
            "difficulty_score": round(getattr(line, "difficulty_score", 0.0), 4),
            "difficulty_tier": getattr(line, "difficulty_tier", "?"),
            "fallback_used": line.fallback_used,
            "chosen_variant": getattr(line, "chosen_variant", "?"),
            "merged_text": merged,
            "final_text": final,
            "suspicious": line.suspicious,
            "source": line.source,
        })
        scores = getattr(line, "candidate_scores", []) or []
        for s in scores:
            if s.get("won_by_rule"):
                lines_out[-1]["won_by_rule"] = s["won_by_rule"]
                break

    out = {
        "image_path": image_path,
        "corrected_text": result.corrected_text,
        "raw_text": result.raw_text,
        "timing": {
            "total_latency_seconds": meta.get("runtime_seconds"),
            "primary_ocr_seconds": stage_times.get("primary_ocr_seconds"),
            "fallback_seconds": stage_times.get("fallback_seconds"),
            "correction_seconds": stage_times.get("correction_seconds"),
        },
        "stage_times": stage_times,
        "lines": lines_out,
    }
    json_str = json.dumps(out, indent=2, ensure_ascii=False)
    print(json_str)
    # Also save to file for reliability
    out_path = Path(image_path).parent / "verify_output.json"
    Path(out_path).write_text(json_str, encoding="utf-8")
    print(f"\nSaved to {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
