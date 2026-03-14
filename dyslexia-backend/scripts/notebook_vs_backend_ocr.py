"""
Notebook-vs-Backend OCR parity comparison.

Runs three variants on the 6 hard samples:
1. Notebook (exact fyp.ipynb logic)
2. Backend notebook_parity mode (OCR_MODE=notebook_parity)
3. Backend production mode (OCR_MODE=production)

Reports per-line: detector bbox, recognizer text, timing per stage.
Classifies mismatches: segmentation, crop, recognizer_config, processor_decode, postprocessing.

Usage:
  cd dyslexia-backend
  python scripts/notebook_vs_backend_ocr.py [--samples-dir PATH]

Output: NOTEBOOK_VS_BACKEND_OCR_REPORT.json + NOTEBOOK_PARITY_VERIFICATION.json + console
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)
os.environ["TROCR_FAST"] = "0"

HARD_SAMPLES = [
    "messy_handwriting.png",
    "mixed_print_cursive.png",
    "new_test_sample.png",
    "ruled_notebook.png",
    "signoff_closing.png",
    "test_image.png",
]

MISMATCH_TYPES = [
    "segmentation_mismatch",
    "crop_mismatch",
    "recognizer_config_mismatch",
    "processor_decode_mismatch",
    "postprocessing_mismatch",
]


_NOTEBOOK_CACHE = None


def _get_notebook_models():
    global _NOTEBOOK_CACHE
    if _NOTEBOOK_CACHE is not None:
        return _NOTEBOOK_CACHE
    import torch
    from doctr.models import ocr_predictor
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    detection_model = ocr_predictor(pretrained=True).to(device).eval()
    processor = TrOCRProcessor.from_pretrained("microsoft/trocr-large-handwritten")
    trocr_model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-large-handwritten").to(device).eval()
    _NOTEBOOK_CACHE = (device, detection_model, processor, trocr_model)
    return _NOTEBOOK_CACHE


def run_notebook_ocr(image_path: str) -> dict:
    """Exact notebook run_ocr_inference from fyp.ipynb."""
    import cv2
    import torch
    from statistics import median

    t0 = time.perf_counter()
    device, detection_model, processor, trocr_model = _get_notebook_models()
    load_time = time.perf_counter() - t0

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read: {image_path}")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_gray_rgb = cv2.cvtColor(img_gray, cv2.COLOR_GRAY2RGB)
    height, width = img_rgb.shape[:2]

    t_det = time.perf_counter()
    result = detection_model([img_gray_rgb])
    det_time = time.perf_counter() - t_det

    results = []
    line_count = 0
    rec_times = []

    for page in result.pages:
        for block in page.blocks:
            for line in block.lines:
                (x0, y0), (x1, y1) = line.geometry
                x_min, y_min = int(x0 * width), int(y0 * height)
                x_max, y_max = int(x1 * width), int(y1 * height)
                pad = 5
                x_min = max(0, x_min - pad)
                y_min = max(0, y_min - pad)
                x_max = min(width, x_max + pad)
                y_max = min(height, y_max + pad)

                crop = img_gray_rgb[y_min:y_max, x_min:x_max]
                if crop.shape[0] < 5 or crop.shape[1] < 5:
                    continue

                line_count += 1
                pixel_values = processor(images=crop, return_tensors="pt").pixel_values.to(device)
                t_rec = time.perf_counter()
                with torch.no_grad():
                    generated_ids = trocr_model.generate(pixel_values)
                rec_times.append(time.perf_counter() - t_rec)
                text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

                y_center = (y_min + y_max) / 2.0
                results.append({
                    "line_number": line_count,
                    "bbox": (x_min, y_min, x_max, y_max),
                    "y_center": y_center,
                    "detector_bbox": f"({x_min},{y_min},{x_max},{y_max})",
                    "recognizer_text": text,
                })

    results_sorted = sorted(results, key=lambda r: (r["y_center"], r["bbox"][0]))
    heights = [r["bbox"][3] - r["bbox"][1] for r in results_sorted]
    median_h = median(heights) if heights else 18
    clustered = []
    current_cluster = [results_sorted[0]]
    for r in results_sorted[1:]:
        if abs(r["y_center"] - current_cluster[-1]["y_center"]) <= (median_h * 0.5):
            current_cluster.append(r)
        else:
            clustered.extend(sorted(current_cluster, key=lambda x: x["bbox"][0]))
            current_cluster = [r]
    clustered.extend(sorted(current_cluster, key=lambda x: x["bbox"][0]))

    paragraph = " ".join(r["recognizer_text"].strip() for r in clustered if r["recognizer_text"].strip()).strip()
    total_time = time.perf_counter() - t0

    return {
        "lines": [
            {
                "line_idx": i + 1,
                "detector_bbox": l["detector_bbox"],
                "recognizer_text": l["recognizer_text"],
                "rec_time_sec": rec_times[i] if i < len(rec_times) else None,
            }
            for i, l in enumerate(clustered)
        ],
        "raw_paragraph": paragraph,
        "timing": {
            "load_sec": load_time,
            "detection_sec": det_time,
            "recognition_total_sec": sum(rec_times),
            "total_sec": total_time,
        },
        "config": {
            "model": "microsoft/trocr-large-handwritten",
            "generate_kwargs": "none",
            "decode_strip": False,
            "processor_use_fast": "default",
        },
    }


_BACKEND_ENGINES: dict[str, object] = {}


def run_backend_ocr(image_path: str, mode: str) -> dict:
    """Backend NotebookOCREngine in given mode: notebook_parity | production."""
    from app.core.config import get_settings
    from app.ocr.engines.notebook_engine import NotebookOCREngine

    if mode not in _BACKEND_ENGINES:
        os.environ["OCR_MODE"] = mode
        settings = get_settings()
        settings.models.notebook_parity = mode == "notebook_parity"
        t0 = time.perf_counter()
        _BACKEND_ENGINES[mode] = NotebookOCREngine(settings.models)
        load_time = time.perf_counter() - t0
    else:
        load_time = 0.0

    engine = _BACKEND_ENGINES[mode]
    t_run = time.perf_counter()
    lines, paragraph = engine.run(image_path)
    run_time = time.perf_counter() - t_run

    cfg = engine._parity
    return {
        "lines": [
            {
                "line_idx": i + 1,
                "detector_bbox": str(line.bbox),
                "recognizer_text": line.raw_text or "",
                "rec_time_sec": None,
            }
            for i, line in enumerate(lines)
        ],
        "raw_paragraph": paragraph,
        "timing": {
            "load_sec": load_time,
            "detection_sec": None,
            "recognition_total_sec": None,
            "total_sec": run_time + load_time,
        },
        "config": {
            "model": "microsoft/trocr-large-handwritten" if cfg else "config-driven",
            "generate_kwargs": "none" if cfg else "max_new_tokens=64, num_beams=2, early_stopping=True",
            "decode_strip": not cfg,
            "processor_use_fast": "default" if cfg else "False",
        },
        "mode": mode,
    }


def _bbox_str(b: str | tuple) -> str:
    """Normalize bbox for comparison (remove spaces)."""
    if isinstance(b, tuple):
        s = str(b)
    else:
        s = str(b)
    return s.replace(" ", "")


def _classify_mismatch(nb_lines, be_lines, nb_bbox, be_bbox, nb_text, be_text, line_idx: int) -> list[str]:
    """Classify mismatch into one or more of: segmentation, crop, recognizer_config, processor_decode, postprocessing."""
    kinds = []
    nb_bbox_s = _bbox_str(nb_bbox).replace(" ", "")
    be_bbox_s = _bbox_str(be_bbox).replace(" ", "")

    if nb_bbox_s != be_bbox_s:
        if nb_bbox_s == "" or be_bbox_s == "":
            kinds.append("segmentation_mismatch")
        else:
            kinds.append("crop_mismatch")

    nb_stripped = (nb_text or "").strip()
    be_stripped = (be_text or "").strip()
    nb_raw = nb_text or ""
    be_raw = be_text or ""

    if nb_stripped != be_stripped:
        if nb_raw != be_raw and nb_stripped == be_stripped:
            kinds.append("postprocessing_mismatch")
        elif nb_raw != be_raw:
            kinds.append("recognizer_config_mismatch")
            kinds.append("processor_decode_mismatch")
        else:
            kinds.append("postprocessing_mismatch")

    return kinds if kinds else []


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--samples-dir", default=None)
    ap.add_argument("--sample", default=None, help="Run only this sample (e.g. test_image.png)")
    ap.add_argument("--notebook-only", action="store_true")
    ap.add_argument("--parity-only", action="store_true", help="Run only notebook + backend notebook_parity")
    args = ap.parse_args()

    root = BACKEND.parent
    samples_dir = Path(args.samples_dir) if args.samples_dir else root

    print("=" * 70)
    print("Notebook vs Backend OCR Parity Comparison")
    print("=" * 70)
    print(f"Samples dir: {samples_dir}")
    print("Variants: notebook (ref) | backend notebook_parity | backend production")
    print()

    results = []
    mismatch_table = []
    samples = [args.sample] if args.sample else HARD_SAMPLES
    if args.sample and args.sample not in HARD_SAMPLES:
        samples = [args.sample]

    for name in samples:
        path = samples_dir / name
        if not path.exists():
            path = root / name
        if not path.exists():
            print(f"[SKIP] {name} not found")
            continue

        print(f"\n--- {name} ---")
        entry = {
            "image": name,
            "notebook": None,
            "backend_notebook_parity": None,
            "backend_production": None,
            "parity_vs_notebook": {"line_count_match": None, "bbox_diffs": [], "text_diffs": [], "mismatches": []},
            "production_vs_notebook": {"line_count_match": None, "bbox_diffs": [], "text_diffs": [], "mismatches": []},
        }

        if not args.parity_only:
            try:
                nb = run_notebook_ocr(str(path))
                entry["notebook"] = nb
                print(f"  Notebook: {len(nb['lines'])} lines, {nb['timing']['total_sec']:.2f}s")
                print(f"    raw: {nb['raw_paragraph'][:80]}...")
            except Exception as e:
                entry["notebook"] = {"error": str(e)}
                print(f"  Notebook ERROR: {e}")
        else:
            try:
                nb = run_notebook_ocr(str(path))
                entry["notebook"] = nb
                print(f"  Notebook: {len(nb['lines'])} lines")
            except Exception as e:
                entry["notebook"] = {"error": str(e)}
                print(f"  Notebook ERROR: {e}")

        if not args.notebook_only:
            modes = ["notebook_parity"] if args.parity_only else ["notebook_parity", "production"]
            for mode in modes:
                try:
                    be = run_backend_ocr(str(path), mode)
                    key = "backend_notebook_parity" if mode == "notebook_parity" else "backend_production"
                    entry[key] = be
                    print(f"  Backend {mode}: {len(be['lines'])} lines, {be['timing']['total_sec']:.2f}s")
                    print(f"    raw: {be['raw_paragraph'][:80]}...")
                except Exception as e:
                    key = "backend_notebook_parity" if mode == "notebook_parity" else "backend_production"
                    entry[key] = {"error": str(e)}
                    print(f"  Backend {mode} ERROR: {e}")

        nb = entry.get("notebook")
        parity = entry.get("backend_notebook_parity")
        prod = entry.get("backend_production")

        if nb and "error" not in nb:
            if parity and "error" not in parity:
                pv = entry["parity_vs_notebook"]
                nb_lines = nb["lines"]
                be_lines = parity["lines"]
                pv["line_count_match"] = len(nb_lines) == len(be_lines)
                for i in range(min(len(nb_lines), len(be_lines))):
                    nb_l, be_l = nb_lines[i], be_lines[i]
                    bbox_diff = _bbox_str(nb_l["detector_bbox"]) != _bbox_str(be_l["detector_bbox"])
                    text_diff = nb_l["recognizer_text"] != be_l["recognizer_text"]
                    if bbox_diff:
                        pv["bbox_diffs"].append({
                            "line": i + 1,
                            "notebook": nb_l["detector_bbox"],
                            "backend_parity": be_l["detector_bbox"],
                        })
                    if text_diff:
                        pv["text_diffs"].append({
                            "line": i + 1,
                            "notebook": repr(nb_l["recognizer_text"][:60]),
                            "backend_parity": repr(be_l["recognizer_text"][:60]),
                        })
                        kinds = _classify_mismatch(
                            nb_lines, be_lines,
                            nb_l["detector_bbox"], be_l["detector_bbox"],
                            nb_l["recognizer_text"], be_l["recognizer_text"],
                            i + 1,
                        )
                        for k in kinds:
                            pv["mismatches"].append({"line": i + 1, "type": k})
                            mismatch_table.append({
                                "image": name,
                                "variant": "notebook_parity",
                                "line": i + 1,
                                "type": k,
                                "nb_text": repr(nb_l["recognizer_text"][:40]),
                                "be_text": repr(be_l["recognizer_text"][:40]),
                            })
                if len(nb_lines) != len(be_lines):
                    pv["mismatches"].append({"line": None, "type": "segmentation_mismatch"})
                    mismatch_table.append({
                        "image": name,
                        "variant": "notebook_parity",
                        "line": None,
                        "type": "segmentation_mismatch",
                        "nb_count": len(nb_lines),
                        "be_count": len(be_lines),
                    })

            if prod and "error" not in prod:
                pv = entry["production_vs_notebook"]
                nb_lines = nb["lines"]
                be_lines = prod["lines"]
                pv["line_count_match"] = len(nb_lines) == len(be_lines)
                for i in range(min(len(nb_lines), len(be_lines))):
                    nb_l, be_l = nb_lines[i], be_lines[i]
                    if _bbox_str(nb_l["detector_bbox"]) != _bbox_str(be_l["detector_bbox"]):
                        pv["bbox_diffs"].append({"line": i + 1, "notebook": nb_l["detector_bbox"], "backend_production": be_l["detector_bbox"]})
                    if nb_l["recognizer_text"].strip() != be_l["recognizer_text"].strip():
                        pv["text_diffs"].append({
                            "line": i + 1,
                            "notebook": repr(nb_l["recognizer_text"][:60]),
                            "backend_production": repr(be_l["recognizer_text"][:60]),
                        })
                        kinds = _classify_mismatch(
                            nb_lines, be_lines,
                            nb_l["detector_bbox"], be_l["detector_bbox"],
                            nb_l["recognizer_text"], be_l["recognizer_text"],
                            i + 1,
                        )
                        for k in kinds:
                            pv["mismatches"].append({"line": i + 1, "type": k})
                            mismatch_table.append({
                                "image": name,
                                "variant": "production",
                                "line": i + 1,
                                "type": k,
                                "nb_text": repr(nb_l["recognizer_text"][:40]),
                                "be_text": repr(be_l["recognizer_text"][:40]),
                            })
                if len(nb_lines) != len(be_lines):
                    pv["mismatches"].append({"line": None, "type": "segmentation_mismatch"})
                    mismatch_table.append({
                        "image": name,
                        "variant": "production",
                        "line": None,
                        "type": "segmentation_mismatch",
                        "nb_count": len(nb_lines),
                        "be_count": len(be_lines),
                    })

        results.append(entry)

    parity_fail_count = sum(
        1 for r in results
        for m in (r.get("parity_vs_notebook", {}).get("mismatches") or [])
    )
    parity_pass = parity_fail_count == 0

    verification = {
        "judgment": "PARITY_PASS" if parity_pass else "PARITY_FAIL",
        "parity_mismatch_count": parity_fail_count,
        "mismatch_table": mismatch_table,
        "summary": {
            "samples_run": len([r for r in results if r.get("notebook") and "error" not in r.get("notebook", {})]),
            "parity_pass": parity_pass,
        },
        "per_image": [
            {
                "image": r["image"],
                "notebook_lines": len(r.get("notebook", {}).get("lines", [])) if r.get("notebook") and "error" not in r.get("notebook", {}) else 0,
                "parity_lines": len(r.get("backend_notebook_parity", {}).get("lines", [])) if r.get("backend_notebook_parity") and "error" not in r.get("backend_notebook_parity", {}) else 0,
                "production_lines": len(r.get("backend_production", {}).get("lines", [])) if r.get("backend_production") and "error" not in r.get("backend_production", {}) else 0,
                "parity_mismatches": len(r.get("parity_vs_notebook", {}).get("mismatches", [])),
            }
            for r in results
        ],
    }

    out_report = root / "NOTEBOOK_VS_BACKEND_OCR_REPORT.json"
    out_verification = root / "NOTEBOOK_PARITY_VERIFICATION.json"
    with open(out_report, "w") as f:
        json.dump(results, f, indent=2)
    with open(out_verification, "w") as f:
        json.dump(verification, f, indent=2)

    print(f"\n{'='*70}")
    print("MISMATCH TABLE (concise)")
    print("=" * 70)
    if not mismatch_table:
        print("(none)")
    else:
        for row in mismatch_table:
            print(f"  {row['image']} | {row['variant']} | line {row.get('line')} | {row['type']}")

    print(f"\n{'='*70}")
    print(f"JUDGMENT: {verification['judgment']}")
    print(f"Parity mismatches: {parity_fail_count}")
    print(f"Report: {out_report}")
    print(f"Verification: {out_verification}")
    print("=" * 70)
    return 0 if parity_pass else 1


if __name__ == "__main__":
    sys.exit(main())
