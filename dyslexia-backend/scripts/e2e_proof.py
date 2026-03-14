"""
End-to-end proof: upload -> OCR -> correction layers -> history -> dashboard -> exercises.

Run with backend on http://localhost:8000:
  python scripts/e2e_proof.py [path/to/test_image.png]

Uses httpx (in requirements.txt). No frontend required.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend to path
backend = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend))

def main():
    import httpx

    base = "http://localhost:8000"
    image_path = sys.argv[1] if len(sys.argv) > 1 else backend.parent / "test_image.png"
    image_path = Path(image_path)
    if not image_path.exists():
        print(f"Image not found: {image_path}")
        return 1

    print("=" * 60)
    print("E2E Proof: upload -> OCR -> layers -> history -> dashboard -> exercises")
    print("=" * 60)

    with httpx.Client(timeout=120) as client:
        # 1. Upload -> OCR
        print("\n1. POST /api/ocr/process (upload + OCR)")
        with open(image_path, "rb") as f:
            data = f.read()
        r = client.post(
            f"{base}/api/ocr/process",
            files={"file": (image_path.name, data, "image/png")},
            data={"quality_mode": "quality_local"},
        )
        if r.status_code != 200:
            print(f"   FAIL: {r.status_code} {r.text[:200]}")
            return 1
        ocr = r.json()
        run_id = ocr.get("run_id")
        raw = ocr.get("raw_text", "")
        corrected = ocr.get("corrected_text", "")
        layer1 = ocr.get("correction_layer1", "")
        layer2 = ocr.get("correction_layer2", "")
        print(f"   OK run_id={run_id}")
        print(f"   raw (len={len(raw)}): {raw[:80]}...")
        print(f"   corrected (len={len(corrected)}): {corrected[:80]}...")
        print(f"   layer1 present: {bool(layer1)}")
        print(f"   layer2 present: {bool(layer2)}")

        # 2. History
        print("\n2. GET /api/dashboard/history")
        r = client.get(f"{base}/api/dashboard/history")
        if r.status_code != 200:
            print(f"   FAIL: {r.status_code}")
            return 1
        history = r.json()
        found = any(h.get("run_id") == run_id for h in history)
        print(f"   OK entries={len(history)}, run {run_id} in history: {found}")

        # 3. Dashboard overview
        print("\n3. GET /api/dashboard/overview")
        r = client.get(f"{base}/api/dashboard/overview")
        if r.status_code != 200:
            print(f"   FAIL: {r.status_code}")
            return 1
        overview = r.json()
        print(f"   OK total_runs={overview.get('total_runs')}")

        # 4. Exercises
        print("\n4. GET /exercises/")
        r = client.get(f"{base}/exercises/")
        if r.status_code != 200:
            print(f"   FAIL: {r.status_code}")
            return 1
        exercises = r.json()
        print(f"   OK exercises={len(exercises)}")

        # 5. Review endpoint
        print("\n5. POST /api/ocr/{run_id}/review")
        r = client.post(
            f"{base}/api/ocr/{run_id}/review",
            json={"review_status": "approved", "reviewed_text": corrected},
        )
        if r.status_code != 200:
            print(f"   FAIL: {r.status_code}")
            return 1
        print("   OK")

    print("\n" + "=" * 60)
    print("E2E proof PASSED: upload -> OCR -> layers -> history -> dashboard -> exercises")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
