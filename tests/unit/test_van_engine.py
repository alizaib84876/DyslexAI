from __future__ import annotations

import cv2
import numpy as np

from app.ocr.engines.van_engine import VANParagraphEngine
from app.ocr.types import OCRLine


def test_van_engine_extracts_ordered_lines_from_paragraph_like_input():
    image = np.full((220, 360, 3), 245, dtype=np.uint8)
    cv2.putText(image, "First line", (35, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (30, 30, 30), 2, cv2.LINE_AA)
    cv2.putText(image, "Second line", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (30, 30, 30), 2, cv2.LINE_AA)

    detected = [
        OCRLine(bbox=(28, 48, 220, 88), raw_text="First line", confidence=0.8, source="paddle"),
        OCRLine(bbox=(26, 118, 248, 160), raw_text="Second line", confidence=0.82, source="paddle"),
    ]

    result = VANParagraphEngine().extract_ordered_lines(image, detected)

    assert result.lines
    assert result.engine_name == "van_inspired_structure"
    assert result.lines[0].bbox[1] <= result.lines[-1].bbox[1]
    assert result.lines[0].source == "van"
    assert any("paragraph_structure" == item.get("stage") for item in result.lines[0].candidate_scores)
