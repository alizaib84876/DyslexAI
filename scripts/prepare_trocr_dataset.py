"""Prepare a line-level manifest for TrOCR fine-tuning.

This script accepts a JSONL manifest containing either:
1. line-level samples with one `text` label per image, or
2. paragraph-level samples with ordered `line_texts`.

Paragraph samples are segmented into ordered line crops using the same
preprocessing and paragraph-structure logic used by the production OCR service.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.pipeline.service import DyslexAIPipelineService
from app.training.manifest import (
    ManifestError,
    PreparedLineSample,
    ensure_validation_split,
    load_manifest,
    write_prepared_manifest,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare a TrOCR fine-tuning manifest from labeled handwriting data.")
    parser.add_argument("--manifest", required=True, help="Path to the source JSONL manifest.")
    parser.add_argument(
        "--output-dir",
        default=str(Path("backend/data/training/prepared").resolve()),
        help="Directory where prepared line crops and manifest will be written.",
    )
    parser.add_argument(
        "--quality-mode",
        default="hard",
        choices=["hard", "best"],
        help="Use the production handwriting line extraction path from this quality mode.",
    )
    parser.add_argument(
        "--validation-ratio",
        type=float,
        default=0.1,
        help="If no validation split exists, reserve this fraction of train samples.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_path = Path(args.manifest).resolve()
    output_dir = Path(args.output_dir).resolve()
    crops_dir = output_dir / "crops"
    crops_dir.mkdir(parents=True, exist_ok=True)

    settings = get_settings()
    settings.routing.quality_mode = args.quality_mode
    service = DyslexAIPipelineService(settings)

    samples = load_manifest(manifest_path)
    prepared: list[PreparedLineSample] = []
    skipped: list[str] = []

    for sample in samples:
        if sample.is_line_level:
            prepared.append(
                PreparedLineSample(
                    sample_id=sample.sample_id,
                    image_path=sample.image_path,
                    text=sample.text or "",
                    split=sample.split,
                    source_image_path=sample.image_path,
                    line_index=0,
                    metadata={"source": "line_manifest", **(sample.metadata or {})},
                )
            )
            continue

        preprocessed, structured = service.prepare_handwriting_line_crops(str(sample.image_path))
        if len(structured.lines) != len(sample.line_texts):
            skipped.append(
                f"{sample.sample_id}: extracted {len(structured.lines)} lines but manifest has {len(sample.line_texts)} labels"
            )
            continue

        for line_index, (line, text) in enumerate(zip(structured.lines, sample.line_texts), start=1):
            crop = service._crop_line(preprocessed, line.bbox, pad=4)  # Reuse the exact production crop logic.
            crop_path = crops_dir / f"{sample.sample_id}_line_{line_index:02d}.png"
            cv2.imwrite(str(crop_path), crop)
            prepared.append(
                PreparedLineSample(
                    sample_id=f"{sample.sample_id}_line_{line_index:02d}",
                    image_path=crop_path,
                    text=text,
                    split=sample.split,
                    source_image_path=sample.image_path,
                    line_index=line_index,
                    metadata={
                        "source": "paragraph_manifest",
                        "paragraph_structure_engine": structured.engine_name,
                        "paragraph_structure_fallback": structured.used_fallback,
                        "warnings": structured.warnings,
                        **(sample.metadata or {}),
                    },
                )
            )

    if not prepared:
        raise ManifestError("No samples were prepared. Check the manifest and line-label alignment.")

    prepared = ensure_validation_split(prepared, validation_ratio=args.validation_ratio)
    output_manifest = output_dir / "prepared_manifest.jsonl"
    write_prepared_manifest(prepared, output_manifest)

    if skipped:
        skipped_path = output_dir / "skipped_samples.txt"
        skipped_path.write_text("\n".join(skipped), encoding="utf-8")
        print(f"Prepared {len(prepared)} line samples. Skipped {len(skipped)} entries; details in {skipped_path}")
    else:
        print(f"Prepared {len(prepared)} line samples.")
    print(f"Prepared manifest: {output_manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
