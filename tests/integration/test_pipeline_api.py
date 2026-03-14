def test_process_endpoint_returns_structured_result(client, sample_upload_bytes):
    response = client.post(
        "/api/ocr/process",
        files={"file": ("sample.png", sample_upload_bytes, "image/png")},
        data={"quality_mode": "balanced", "reference_text": "this is a test"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["raw_text"] == "thes is a test"
    assert payload["corrected_text"] == "this is a test"
    assert payload["lines"][0]["fallback_used"] is True
    assert payload["lines"][0]["edit_ops"]
    assert payload["metadata"]["paragraph_structure_engine"] == "van_inspired_structure"
    assert payload["metadata"]["transcript_evaluation"]["corrected_wer"] == 0.0
