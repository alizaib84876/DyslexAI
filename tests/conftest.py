from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.db.session import get_session
from app.main import app
from app.ocr.types import OCRLine, OCRResult, TriageResult


@pytest.fixture()
def temp_engine(tmp_path: Path):
    engine = create_engine(
        f"sqlite:///{(tmp_path / 'test.db').as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture()
def client(temp_engine, tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    def override_get_session():
        with Session(temp_engine) as session:
            yield session

    class FakePipeline:
        def process_image(self, image_path: str) -> OCRResult:
            return OCRResult(
                image_path=image_path,
                raw_text="thes is a test",
                corrected_text="this is a test",
                lines=[
                    OCRLine(
                        bbox=(10, 10, 120, 40),
                        raw_text="thes is a test",
                        merged_text="thes is a test",
                        corrected_text="this is a test",
                        confidence=0.72,
                        source="paddle",
                        fallback_used=True,
                        suspicious=True,
                        uncertainty_score=0.28,
                        candidate_scores=[{"variant": "soft_gray", "score": 1.5}],
                    )
                ],
                triage=TriageResult(
                    blur_score=10.0,
                    brightness=150.0,
                    contrast=30.0,
                    is_low_contrast=True,
                    estimated_skew_angle=2.2,
                    should_threshold=True,
                    should_deskew=True,
                ),
                metadata={
                    "runtime_seconds": 0.3,
                    "num_lines": 1,
                    "fallback_lines": 1,
                    "suspicious_lines": 1,
                    "avg_confidence": 0.72,
                    "quality_mode": "balanced",
                    "paragraph_structure_engine": "van_inspired_structure",
                    "paragraph_structure_fallback": False,
                    "ordered_line_count": 1,
                    "line_source_counts": {"van": 1},
                    "pipeline_warnings": [],
                },
                annotated_image_path=str(tmp_path / "annotated.png"),
                preprocessed_image_path=str(tmp_path / "preprocessed.png"),
            )

    def fake_get_pipeline_service(_quality_mode: str):
        return FakePipeline()

    def fake_save_upload(file):
        file_path = tmp_path / file.filename
        file_path.write_bytes(file.file.read())
        return file.filename, str(file_path)

    from app.api.routes import ocr as ocr_routes

    monkeypatch.setattr(ocr_routes, "get_pipeline_service", fake_get_pipeline_service)
    monkeypatch.setattr(ocr_routes, "save_upload", fake_save_upload)
    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def sample_upload_bytes() -> bytes:
    # A tiny valid PNG header plus some bytes is enough for the mocked API tests
    # because the upload is intercepted before real OCR is attempted.
    return (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00"
        b"\x90wS\xde"
        b"\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01"
        b"\x0b\xe7\x02\x9d"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def decode_json(text: str):
    return json.loads(text)
