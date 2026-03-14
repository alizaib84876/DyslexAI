from __future__ import annotations

import json
from pathlib import Path

from app.training.manifest import (
    ManifestError,
    PreparedLineSample,
    ensure_validation_split,
    load_manifest,
    parse_manifest_record,
)


def test_parse_manifest_record_accepts_line_level_sample(tmp_path: Path):
    image_path = tmp_path / "line.png"
    image_path.write_bytes(b"placeholder")
    record = {"sample_id": "line_001", "image_path": str(image_path), "text": "Hello world", "split": "train"}

    sample = parse_manifest_record(record, base_dir=tmp_path, index=1)

    assert sample.is_line_level is True
    assert sample.text == "Hello world"
    assert sample.line_texts == ()


def test_parse_manifest_record_accepts_paragraph_sample(tmp_path: Path):
    image_path = tmp_path / "page.png"
    image_path.write_bytes(b"placeholder")
    record = {
        "sample_id": "page_001",
        "image_path": str(image_path),
        "line_texts": ["First line", "Second line"],
        "split": "validation",
    }

    sample = parse_manifest_record(record, base_dir=tmp_path, index=1)

    assert sample.is_paragraph_level is True
    assert sample.text is None
    assert sample.line_texts == ("First line", "Second line")


def test_load_manifest_rejects_rows_without_labels(tmp_path: Path):
    manifest = tmp_path / "manifest.jsonl"
    manifest.write_text(json.dumps({"image_path": "missing.png", "split": "train"}) + "\n", encoding="utf-8")

    try:
        load_manifest(manifest)
    except ManifestError as exc:
        assert "exactly one of 'text' or 'line_texts'" in str(exc)
    else:
        raise AssertionError("Expected ManifestError")


def test_ensure_validation_split_promotes_some_train_samples():
    samples = [
        PreparedLineSample(
            sample_id=f"sample_{index}",
            image_path=Path(f"sample_{index}.png"),
            text="hello",
            split="train",
            source_image_path=Path(f"sample_{index}.png"),
            line_index=index,
        )
        for index in range(6)
    ]

    updated = ensure_validation_split(samples, validation_ratio=0.2, seed=7)

    assert any(sample.split == "validation" for sample in updated)
    assert sum(1 for sample in updated if sample.split == "train") < len(updated)
