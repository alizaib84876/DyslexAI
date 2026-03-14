from app.core.config import RoutingSettings
from app.ocr.router import Router
from app.ocr.types import OCRLine


def test_router_marks_low_confidence_line_as_suspicious():
    router = Router(RoutingSettings())
    line = OCRLine(
        bbox=(0, 0, 10, 10),
        raw_text="%%% 99",
        confidence=0.2,
        source="paddle",
    )

    assert router.is_suspicious(line) is True
    assert router.needs_fallback(line) is True


def test_router_accepts_clean_high_confidence_line():
    router = Router(RoutingSettings())
    line = OCRLine(
        bbox=(0, 0, 60, 20),
        raw_text="this is readable text",
        confidence=0.95,
        source="paddle",
    )

    assert router.is_suspicious(line) is False
    assert router.needs_fallback(line) is False
