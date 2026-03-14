def test_end_to_end_local_flow_updates_dashboard(client, sample_upload_bytes):
    student_response = client.post(
        "/api/students/",
        json={"name": "Ada Student", "grade_level": "Grade 6", "notes": "Needs OCR support"},
    )
    assert student_response.status_code == 200
    student_id = student_response.json()["id"]

    process_response = client.post(
        "/api/ocr/process",
        files={"file": ("sample.png", sample_upload_bytes, "image/png")},
        data={"quality_mode": "best", "student_id": str(student_id)},
    )
    assert process_response.status_code == 200

    overview = client.get("/api/dashboard/overview")
    history = client.get("/api/dashboard/history")
    progress = client.get("/api/dashboard/students/progress")

    assert overview.status_code == 200
    assert history.status_code == 200
    assert progress.status_code == 200
    assert overview.json()["total_runs"] >= 1
    assert history.json()[0]["student_name"] == "Ada Student"
    assert progress.json()[0]["total_runs"] >= 1
