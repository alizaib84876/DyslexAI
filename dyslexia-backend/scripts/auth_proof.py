"""
Auth hardening proof — automated verification of DyslexAI auth enforcement.

Runs end-to-end tests:
- Unauthenticated requests -> 401
- Authenticated requests -> 200
- Cross-user ownership -> 403 (review)
- User-scoped data (history, dashboard)

Usage:
  cd dyslexia-backend
  python scripts/auth_proof.py [--output REPORT.json]

Exit: 0 = all pass, 1 = any fail
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import time
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

# Use isolated test DB to avoid polluting main
os.environ["DATABASE_URL"] = "sqlite:///./auth_proof_test.db"


def _make_test_image() -> Path:
    """Create a minimal valid PNG for OCR process test."""
    from PIL import Image
    img = Image.new("RGB", (100, 50), color=(255, 255, 255))
    # Add a few dark pixels so it's not empty
    for x in range(10, 20):
        for y in range(20, 30):
            img.putpixel((x, y), (0, 0, 0))
    path = Path(tempfile.gettempdir()) / f"auth_proof_{int(time.time())}.png"
    img.save(path)
    return path


def main():
    from fastapi.testclient import TestClient

    # Re-import to pick up DATABASE_URL
    import app.database  # noqa: re-init with test DB
    from app.main import app

    client = TestClient(app)
    report: dict = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "tests": [],
        "passed": 0,
        "failed": 0,
        "skipped": 0,
    }

    def add(name: str, status: str, detail: str = "", expected: str = "", got: str = ""):
        report["tests"].append({
            "name": name,
            "status": status,
            "detail": detail,
            "expected": expected,
            "got": got,
        })
        if status == "PASS":
            report["passed"] += 1
        elif status == "FAIL":
            report["failed"] += 1
        else:
            report["skipped"] += 1

    ts = str(int(time.time()))
    email_a = f"auth_proof_a_{ts}@test.local"
    email_b = f"auth_proof_b_{ts}@test.local"
    password = "TestPass123!"

    print("=" * 60)
    print("DyslexAI Auth Proof")
    print("=" * 60)

    # ── 1. Signup user A ─────────────────────────────────────────────────
    r = client.post("/api/auth/signup", json={"name": "User A", "email": email_a, "password": password})
    if r.status_code != 200:
        add("signup_user_a", "FAIL", f"status={r.status_code}", "200", str(r.status_code))
        print(f"[FAIL] signup user A: {r.status_code}")
    else:
        add("signup_user_a", "PASS")
        print("[PASS] signup user A")
    token_a = r.json().get("access_token") if r.status_code == 200 else None

    # ── 2. Signup user B ─────────────────────────────────────────────────
    r = client.post("/api/auth/signup", json={"name": "User B", "email": email_b, "password": password})
    if r.status_code != 200:
        add("signup_user_b", "FAIL", f"status={r.status_code}", "200", str(r.status_code))
        print(f"[FAIL] signup user B: {r.status_code}")
    else:
        add("signup_user_b", "PASS")
        print("[PASS] signup user B")
    token_b = r.json().get("access_token") if r.status_code == 200 else None

    if not token_a or not token_b:
        print("[STOP] Cannot continue without both users")
        report["summary"] = "Aborted: user creation failed"
        _save_report(report)
        sys.exit(1)

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # ── 3. Unauthenticated -> 401 ──────────────────────────────────────
    for endpoint, method, kwargs in [
        ("GET /api/dashboard/overview", "get", {}),
        ("GET /api/dashboard/history", "get", {}),
        ("GET /api/auth/me", "get", {}),
        ("GET /students/", "get", {}),
    ]:
        r = getattr(client, method)(endpoint.split()[1], **kwargs)
        if r.status_code == 401:
            add(f"unauth_401_{endpoint.replace(' ', '_')}", "PASS")
            print(f"[PASS] unauthenticated {endpoint} -> 401")
        else:
            add(f"unauth_401_{endpoint.replace(' ', '_')}", "FAIL", f"status={r.status_code}", "401", str(r.status_code))
            print(f"[FAIL] unauthenticated {endpoint}: expected 401, got {r.status_code}")

    # ── 4. Authenticated -> 200 ─────────────────────────────────────────
    r = client.get("/api/dashboard/overview", headers=headers_a)
    add("auth_dashboard_overview", "PASS" if r.status_code == 200 else "FAIL", f"status={r.status_code}", "200", str(r.status_code))
    print(f"[{'PASS' if r.status_code == 200 else 'FAIL'}] authenticated GET /api/dashboard/overview -> {r.status_code}")

    r = client.get("/api/dashboard/history", headers=headers_a)
    add("auth_dashboard_history", "PASS" if r.status_code == 200 else "FAIL", f"status={r.status_code}", "200", str(r.status_code))
    print(f"[{'PASS' if r.status_code == 200 else 'FAIL'}] authenticated GET /api/dashboard/history -> {r.status_code}")

    r = client.get("/api/auth/me", headers=headers_a)
    add("auth_me", "PASS" if r.status_code == 200 else "FAIL", f"status={r.status_code}", "200", str(r.status_code))
    print(f"[{'PASS' if r.status_code == 200 else 'FAIL'}] authenticated GET /api/auth/me -> {r.status_code}")

    # ── 5. Students (need at least one for exercises/sessions) ───────────
    r = client.get("/students/", headers=headers_a)
    add("auth_students_list", "PASS" if r.status_code == 200 else "FAIL", f"status={r.status_code}", "200", str(r.status_code))
    print(f"[{'PASS' if r.status_code == 200 else 'FAIL'}] authenticated GET /students/ -> {r.status_code}")

    students = r.json() if r.status_code == 200 else []
    student_id = str(students[0]["id"]) if students else None
    if not student_id:
        r = client.post("/students/", headers=headers_a, json={"name": "Test Student", "age": 10})
        if r.status_code == 200:
            student_id = str(r.json()["id"])
            add("auth_create_student", "PASS")
            print("[PASS] create student")
        else:
            add("auth_create_student", "FAIL", f"status={r.status_code}")
            print(f"[FAIL] create student: {r.status_code}")

    # ── 6. Exercises next (needs student_id) ──────────────────────────────
    if student_id:
        r = client.get(f"/exercises/next?student_id={student_id}", headers=headers_a)
        add("auth_exercises_next", "PASS" if r.status_code in (200, 404) else "FAIL",
            f"status={r.status_code}", "200 or 404", str(r.status_code))
        print(f"[{'PASS' if r.status_code in (200, 404) else 'FAIL'}] authenticated GET /exercises/next -> {r.status_code}")
    else:
        add("auth_exercises_next", "SKIP", "no student_id")

    # ── 7. Sessions (needs student + exercise) ─────────────────────────────
    exercise_id = None
    if student_id:
        r = client.get("/exercises/", headers=headers_a)
        if r.status_code == 200 and r.json():
            exercise_id = str(r.json()[0]["id"])
        else:
            # Create exercise
            r = client.post("/exercises/", headers=headers_a, json={
                "type": "word_typing", "content": "hello", "expected": "hello",
                "target_words": ["hello"], "difficulty": 1, "age_group": "all"
            })
            if r.status_code == 200:
                exercise_id = str(r.json()["id"])

    if student_id and exercise_id:
        r = client.post("/sessions/", headers=headers_a, json={
            "student_id": student_id, "exercise_id": exercise_id, "is_handwriting": False
        })
        add("auth_sessions_create", "PASS" if r.status_code == 200 else "FAIL", f"status={r.status_code}", "200", str(r.status_code))
        print(f"[{'PASS' if r.status_code == 200 else 'FAIL'}] authenticated POST /sessions/ -> {r.status_code}")
    else:
        add("auth_sessions_create", "SKIP", "no student or exercise")

    # ── 8. OCR process (authenticated) ───────────────────────────────────
    run_id_a = None
    img_path = _make_test_image()
    try:
        with open(img_path, "rb") as f:
            r = client.post(
                "/api/ocr/process",
                files={"file": ("test.png", f, "image/png")},
                data={"quality_mode": "quality_local"},
                headers=headers_a,
            )
        if r.status_code == 200:
            run_id_a = r.json().get("run_id")
            add("auth_ocr_process", "PASS")
            print("[PASS] authenticated POST /api/ocr/process")
        else:
            add("auth_ocr_process", "FAIL", f"status={r.status_code}", "200", str(r.status_code))
            print(f"[FAIL] authenticated POST /api/ocr/process -> {r.status_code}")
    except Exception as e:
        add("auth_ocr_process", "FAIL", str(e))
        print(f"[FAIL] OCR process: {e}")
    finally:
        img_path.unlink(missing_ok=True)

    # ── 9. OCR process without token -> 401 ───────────────────────────────
    img2 = _make_test_image()
    try:
        with open(img2, "rb") as f:
            r = client.post(
                "/api/ocr/process",
                files={"file": ("test.png", f, "image/png")},
                data={"quality_mode": "quality_local"},
            )
    finally:
        img2.unlink(missing_ok=True)
    add("unauth_ocr_process_401", "PASS" if r.status_code == 401 else "FAIL", f"status={r.status_code}", "401", str(r.status_code))
    print(f"[{'PASS' if r.status_code == 401 else 'FAIL'}] unauthenticated POST /api/ocr/process -> {r.status_code} (expected 401)")

    # ── 10. User-scoped history: A sees run, B sees empty ─────────────────
    r_a = client.get("/api/dashboard/history", headers=headers_a)
    r_b = client.get("/api/dashboard/history", headers=headers_b)
    if r_a.status_code == 200 and r_b.status_code == 200:
        hist_a = r_a.json()
        hist_b = r_b.json()
        a_has_run = run_id_a and any(h.get("run_id") == run_id_a for h in hist_a)
        b_has_run = run_id_a and any(h.get("run_id") == run_id_a for h in hist_b)
        if a_has_run and not b_has_run:
            add("ownership_history_scoped", "PASS")
            print("[PASS] history: A sees run, B does not")
        else:
            add("ownership_history_scoped", "FAIL", f"A has run={a_has_run}, B has run={b_has_run}")
            print(f"[FAIL] history scoping: A has run={a_has_run}, B has run={b_has_run}")
    else:
        add("ownership_history_scoped", "FAIL", f"A={r_a.status_code}, B={r_b.status_code}")

    # ── 11. B tries to review A's run -> 404 (hidden existence) ───────────
    if run_id_a:
        r = client.post(
            f"/api/ocr/{run_id_a}/review",
            json={"review_status": "approved", "reviewed_text": "x"},
            headers=headers_b,
        )
        if r.status_code == 404:
            add("ownership_review_404", "PASS")
            print("[PASS] B cannot review A's run -> 404 (hidden existence)")
        else:
            add("ownership_review_404", "FAIL", f"status={r.status_code}", "404", str(r.status_code))
            print(f"[FAIL] B review A's run: expected 404, got {r.status_code}")
    else:
        add("ownership_review_403", "SKIP", "no run_id from OCR")

    # ── 12. A can review own run -> 200 ───────────────────────────────────
    if run_id_a:
        r = client.post(
            f"/api/ocr/{run_id_a}/review",
            json={"review_status": "approved", "reviewed_text": "ok"},
            headers=headers_a,
        )
        add("ownership_review_own_200", "PASS" if r.status_code == 200 else "FAIL", f"status={r.status_code}", "200", str(r.status_code))
        print(f"[{'PASS' if r.status_code == 200 else 'FAIL'}] A reviews own run -> {r.status_code}")

    # ── Summary ──────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    report["summary"] = f"passed={report['passed']} failed={report['failed']} skipped={report['skipped']}"
    print(report["summary"])
    print("=" * 60)

    _save_report(report)
    sys.exit(0 if report["failed"] == 0 else 1)


def _save_report(report: dict):
    out = os.environ.get("AUTH_PROOF_OUTPUT") or "auth_proof_report.json"
    path = BACKEND / out if not os.path.isabs(out) else Path(out)
    with open(path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Report saved to {path}")


if __name__ == "__main__":
    main()
