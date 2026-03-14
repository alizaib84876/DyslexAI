from __future__ import annotations

import numpy as np

from app.ocr.triage import ImageTriage


def test_triage_returns_expected_flags():
    image = np.full((120, 240, 3), 255, dtype=np.uint8)
    image[:, 100:140] = 0

    result = ImageTriage.analyze(image)

    assert result.brightness >= 0
    assert result.contrast >= 0
    assert isinstance(result.should_threshold, bool)
    assert isinstance(result.should_deskew, bool)
