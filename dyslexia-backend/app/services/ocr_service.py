"""
OCR service — notebook pipeline (DocTR + TrOCR + layer1 + layer2 + Groq).

Receives image bytes, returns recognized + corrected text + confidence.
"""

from __future__ import annotations

import tempfile
from pathlib import Path

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from app.pipeline.notebook_pipeline import NotebookPipeline
        _pipeline = NotebookPipeline()
    return _pipeline


def process_handwriting_image(image_bytes: bytes) -> dict:
    """
    Run notebook pipeline (DocTR + TrOCR + layers) on handwriting image bytes.

    Returns
    -------
    dict with keys:
        recognized_text – raw OCR output (before correction)
        corrected_text – after layer1 sanitize + layer2 dyslexia fix (ByT5)
        confidence – 0–1
    """
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        f.write(image_bytes)
        path = f.name
    try:
        pipeline = _get_pipeline()
        result = pipeline.process_image(path)
        corrected = result.corrected_text or ""
        raw = " ".join(
            (line.merged_text or line.raw_text or "")
            for line in result.lines
        ).strip()
        # Average confidence across lines
        confs = [l.confidence for l in result.lines if l.confidence > 0]
        confidence = round(sum(confs) / len(confs), 3) if confs else 0.0
        return {
            "recognized_text": raw,
            "corrected_text": corrected or raw,
            "confidence": confidence,
        }
    finally:
        Path(path).unlink(missing_ok=True)
