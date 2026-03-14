from app.correction.lexical import LexicalCorrector
from app.correction.paragraph import ParagraphCorrector
from app.correction.spelling_refinement import refine_spelling
from app.ocr.types import OCRLine
from app.utils.diffing import correction_ratio, levenshtein_ops, normalize_spaces


def test_spelling_refinement_signoff_fixes():
    """Verify lope->Hope, tax->XX, credacted->REDACTED (safe whole-word fixes)."""
    assert refine_spelling("lope to hear from you soon") == "Hope to hear from you soon"
    assert refine_spelling("lope to hear from you soon tax") == "Hope to hear from you soon XX"
    assert refine_spelling("credacted information") == "REDACTED information"
    # close is NOT globally replaced (would break "close the door")
    assert refine_spelling("close the door") == "close the door"


def test_lexical_corrector_cleans_spacing_and_punctuation():
    corrected = LexicalCorrector().correct('thes . 13 Stakes . of the Commonwealth')

    assert " . " not in corrected.text
    assert isinstance(corrected.changed_tokens, list)


def test_diff_helpers_capture_changes():
    assert normalize_spaces("a   b\n c") == "a b c"
    ops = levenshtein_ops("thes", "these")
    assert ops
    assert correction_ratio("thes", "these") > 0


class StubByT5:
    def __init__(self, response: str):
        self.response = response
        self.calls = 0

    def correct(self, text: str) -> str:
        self.calls += 1
        return self.response


def test_line_correction_stays_conservative_without_transformer_rewrite():
    byt5 = StubByT5("Completely unrelated sentence.")
    corrector = ParagraphCorrector(LexicalCorrector(), byt5)
    line = OCRLine(bbox=(0, 0, 10, 10), raw_text="Thes is a sentense", confidence=0.9, source="test")

    corrected = corrector.correct_line(line)

    assert corrected.corrected_text == "Thes is a sentense"
    assert byt5.calls == 0


def test_paragraph_transformer_candidate_is_rejected_when_unrelated():
    byt5 = StubByT5("This paragraph talks about planets and astronomy instead.")
    corrector = ParagraphCorrector(LexicalCorrector(), byt5)
    lines = [
        OCRLine(bbox=(0, 0, 10, 10), raw_text="Thes is a sentense about school", confidence=0.9, source="test"),
        OCRLine(bbox=(0, 0, 10, 10), raw_text="The studant likes reading", confidence=0.9, source="test"),
    ]

    final_text, _, _, _ = corrector.correct_paragraph(lines)

    assert "planets" not in final_text.lower()
    assert "school" in final_text.lower()
