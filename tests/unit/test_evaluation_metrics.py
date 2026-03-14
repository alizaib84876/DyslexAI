from app.evaluation.metrics import build_transcript_metrics, character_error_rate, word_error_rate


def test_error_rates_drop_when_text_matches_reference_better():
    reference = "the student likes reading books"
    raw = "the studant likes readng books"
    corrected = "the student likes reading books"

    assert character_error_rate(reference, corrected) < character_error_rate(reference, raw)
    assert word_error_rate(reference, corrected) < word_error_rate(reference, raw)


def test_build_transcript_metrics_returns_scored_summary():
    metrics = build_transcript_metrics(
        reference_text="this is a test",
        raw_text="thes is a test",
        corrected_text="this is a test",
    )

    assert metrics["raw_cer"] > 0.0
    assert metrics["corrected_cer"] == 0.0
