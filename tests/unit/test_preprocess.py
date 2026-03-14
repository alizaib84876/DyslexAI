from __future__ import annotations

import numpy as np

from app.core.config import PreprocessSettings
from app.ocr.preprocess import Preprocessor
from app.ocr.types import TriageResult


def test_preprocess_keeps_image_non_empty():
    image = np.full((80, 160, 3), 240, dtype=np.uint8)
    triage = TriageResult(
        blur_score=8.0,
        brightness=200.0,
        contrast=20.0,
        is_low_contrast=True,
        estimated_skew_angle=0.0,
        should_threshold=True,
        should_deskew=False,
    )

    processed = Preprocessor(PreprocessSettings()).process(image, triage)

    assert processed.shape[0] > 0
    assert processed.shape[1] > 0


def test_line_variants_include_original_and_rescue_variants():
    image = np.full((40, 100, 3), 220, dtype=np.uint8)
    variants = Preprocessor(PreprocessSettings()).build_line_variants(image)

    assert "original" in variants
    assert len(variants) >= 2


def test_isolate_document_region_crops_dark_screenshot_frame():
    image = np.full((220, 220, 3), 15, dtype=np.uint8)
    image[40:190, 30:200] = 245

    isolated = Preprocessor(PreprocessSettings()).isolate_document_region(image)

    assert isolated.shape[0] < image.shape[0]
    assert isolated.shape[1] < image.shape[1]
    assert isolated.mean() > image.mean()


def test_crop_to_dominant_text_block_prefers_large_lower_content():
    image = np.full((260, 220, 3), 245, dtype=np.uint8)
    image[20:40, 20:140] = 40
    image[80:200, 30:200] = 245
    image[90:190, 40:195] = 40

    cropped = Preprocessor(PreprocessSettings()).crop_to_dominant_text_block(image)

    assert cropped.shape[0] <= image.shape[0]
    assert cropped.shape[1] <= image.shape[1]
    assert cropped.shape[0] > 80
