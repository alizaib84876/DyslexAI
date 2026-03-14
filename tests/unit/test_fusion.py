from app.ocr.fusion import FusionEngine


def test_fusion_prefers_more_plausible_text():
    noisy = "%%% 9999 ???"
    clean = "this is a clean sentence"

    assert FusionEngine.language_plausibility_score(clean) > FusionEngine.language_plausibility_score(noisy)
    assert FusionEngine.choose_text(noisy, clean) == clean
