#!/usr/bin/env python3
"""Test the complete DyslexAI application - exercises, game mode, API."""
import json
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

BASE = "http://localhost:8000"   # DyslexAI backend (Dashboard, OCR)
EXERCISES = "http://localhost:8001"  # dyslexia-backend (Exercises, Game Mode)

def test(name: str, fn):
    try:
        fn()
        print(f"  [OK] {name}")
        return True
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")
        return False

def main():
    print("=" * 60)
    print("DyslexAI Application Test")
    print("=" * 60)

    ok = 0
    total = 0

    # 1. DyslexAI backend root (Dashboard, OCR)
    total += 1
    def _root():
        r = requests.get(BASE + "/", timeout=5)
        r.raise_for_status()
        assert "status" in r.json() or "ok" in str(r.json()).lower()
    if test("DyslexAI backend (8000)", _root): ok += 1

    # 2. Students list (Exercises backend)
    total += 1
    def _students():
        r = requests.get(EXERCISES + "/students/", timeout=5)
        r.raise_for_status()
        assert isinstance(r.json(), list)
    if test("GET /students/", _students): ok += 1

    # 3. Create student
    total += 1
    student_id = None
    def _create_student():
        nonlocal student_id
        r = requests.post(EXERCISES + "/students/", json={"name": "TestPlayer"}, timeout=5)
        r.raise_for_status()
        data = r.json()
        student_id = data.get("id") or data.get("student_id")
        assert student_id
    if test("POST /students/ (create)", _create_student): ok += 1

    # 4. Get next exercise
    total += 1
    exercise_id = None
    def _next_exercise():
        nonlocal exercise_id, student_id
        sid = student_id
        if not sid:
            r = requests.get(EXERCISES + "/students/", timeout=5)
            students = r.json()
            if students:
                sid = students[0]["id"]
            else:
                raise Exception("No students - create one first")
        r = requests.get(EXERCISES + "/exercises/next", params={"student_id": sid}, timeout=10)
        r.raise_for_status()
        data = r.json()
        exercise_id = data.get("id")
        assert data.get("content") and data.get("expected") and data.get("type")
    if test("GET /exercises/next", _next_exercise): ok += 1

    # 5. Create session
    total += 1
    session_id = None
    def _create_session():
        nonlocal session_id, student_id, exercise_id
        sid = student_id
        if not sid:
            st = requests.get(EXERCISES + "/students/", timeout=5).json()
            sid = st[0]["id"] if st else None
        if not sid or not exercise_id:
            raise Exception("Need student and exercise first")
        r = requests.post(EXERCISES + "/sessions/", json={
            "student_id": student_id,
            "exercise_id": exercise_id,
            "is_handwriting": False
        }, timeout=5)
        r.raise_for_status()
        data = r.json()
        session_id = data.get("session_id")
        assert session_id
    if test("POST /sessions/", _create_session): ok += 1

    # 6. Submit typing (if we have session)
    if session_id:
        total += 1
        def _submit_typing():
            r = requests.post(EXERCISES + f"/sessions/{session_id}/submit",
                json={"student_response": "test answer"}, timeout=5)
            r.raise_for_status()
            data = r.json()
            assert "score" in data and "feedback" in data
        if test("POST /sessions/{id}/submit (typing)", _submit_typing): ok += 1

    # 7. Frontend
    total += 1
    def _frontend():
        r = requests.get("http://localhost:5173/", timeout=5)
        r.raise_for_status()
        assert "html" in r.text.lower() or "react" in r.text.lower() or len(r.text) > 500
    if test("Frontend (port 5173)", _frontend): ok += 1

    # 8. Try 5174 if 5173 fails
    if ok < total and "Frontend" in str(sys.exc_info()):
        def _frontend2():
            r = requests.get("http://localhost:5174/", timeout=5)
            r.raise_for_status()
        if test("Frontend (port 5174)", _frontend2): ok += 1

    print()
    print(f"Result: {ok}/{total} tests passed")
    if ok == total:
        print("All systems operational.")
    else:
        print("Some tests failed. Check backend (PostgreSQL?) and frontend.")
    print("=" * 60)
    return 0 if ok == total else 1

if __name__ == "__main__":
    sys.exit(main())
