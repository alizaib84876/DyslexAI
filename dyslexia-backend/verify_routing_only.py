#!/usr/bin/env python3
"""Verify lexical_suspicion_score and routing on target strings (no OCR)."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.config import get_settings
from app.ocr.types import OCRLine
from app.pipeline.service import DyslexAIPipelineService
from app.utils.diffing import lexical_suspicion_score


def main():
    settings = get_settings()
    settings.routing.quality_mode = "adaptive"
    pipeline = DyslexAIPipelineService(settings)

    # Target strings from Task 3 failure sample
    target_strings = [
        "hav bih lerhigh of moratle-i",
        "iWil de 100 be p",
        "e feshisyrvereni",
    ]

    lines_out = []
    for i, raw in enumerate(target_strings, 1):
        line = OCRLine(
            bbox=(50, 50 + i * 80, 400, 120 + i * 80),
            raw_text=raw,
            confidence=0.65,
            source="doctr",
        )
        line.suspicious = pipeline.router.is_suspicious(line)
        lex_susp = lexical_suspicion_score(raw)
        tier = pipeline._line_difficulty_tier(line, image_height=400, all_lines=[])
        score = pipeline._line_difficulty_score(line, image_height=400, all_lines=[])

        lines_out.append({
            "index": i,
            "raw_text": raw,
            "lexical_suspicion_score": round(lex_susp, 3),
            "difficulty_tier": tier,
            "difficulty_score": round(score, 3),
            "suspicious": line.suspicious,
            "would_route_to_fallback": tier != "easy",
        })

    out = {
        "verification_type": "routing_only (no OCR - target strings)",
        "lines": lines_out,
        "summary": {
            "malformed_routed": sum(1 for l in lines_out if l["would_route_to_fallback"]),
            "lex_susp_no_longer_zero": all(l["lexical_suspicion_score"] > 0.1 for l in lines_out),
        },
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
