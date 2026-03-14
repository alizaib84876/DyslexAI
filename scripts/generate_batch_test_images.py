"""Generate the 4 recommended batch test images for run_batch_test.py.

Creates images in the project root:
  - messy_handwriting.png
  - ruled_notebook.png
  - signoff_closing.png   (tests lope->Hope, tax->XX, signoff detection)
  - mixed_print_cursive.png
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = [
    ROOT / "messy_handwriting.png",
    ROOT / "ruled_notebook.png",
    ROOT / "signoff_closing.png",
    ROOT / "mixed_print_cursive.png",
]


def load_font(size: int = 18):
    for name in ("arial.ttf", "Arial.ttf", "C:\\Windows\\Fonts\\arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except (OSError, TypeError):
            continue
    return ImageFont.load_default()


def draw_ruled_lines(draw: ImageDraw.ImageDraw, w: int, h: int, step: int = 24):
    for y in range(step, h, step):
        draw.line([(0, y), (w, y)], fill=(200, 210, 220), width=1)


def main() -> None:
    font = load_font(18)
    font_small = load_font(14)

    # 1. messy_handwriting.png - irregular, hard-to-read text
    img1 = Image.new("RGB", (800, 300), color=(252, 250, 248))
    d1 = ImageDraw.Draw(img1)
    d1.text((30, 40), "if the threatened counter revolution", fill=(20, 25, 35), font=font)
    d1.text((50, 75), "was not to bring the President back", fill=(25, 30, 40), font=font)
    d1.text((20, 115), "these 13 states of the Commonwealth", fill=(15, 22, 38), font=font)
    d1.text((60, 150), "were an occasion worthy of his presence", fill=(22, 28, 42), font=font)
    img1.save(OUTPUTS[0])
    print(f"Created {OUTPUTS[0].name}")

    # 2. ruled_notebook.png - clean text on ruled lines
    img2 = Image.new("RGB", (800, 320), color=(255, 255, 255))
    d2 = ImageDraw.Draw(img2)
    draw_ruled_lines(d2, 800, 320)
    d2.text((24, 32), "The quick brown fox jumps over the lazy dog.", fill=(10, 15, 25), font=font)
    d2.text((24, 72), "These states of the Commonwealth were worthy.", fill=(12, 18, 28), font=font)
    d2.text((24, 112), "After all it was Mr Nkrumah who led the way.", fill=(14, 20, 30), font=font)
    img2.save(OUTPUTS[1])
    print(f"Created {OUTPUTS[1].name}")

    # 3. signoff_closing.png - body + short signoff with OCR-like errors to test
    # Uses "lope" and "tax" so spelling_refinement fixes: lope->Hope, tax->XX
    img3 = Image.new("RGB", (800, 280), color=(255, 255, 255))
    d3 = ImageDraw.Draw(img3)
    d3.text((24, 30), "Dear Sir, Thank you for your letter.", fill=(20, 25, 35), font=font)
    d3.text((24, 65), "I will reply in full soon.", fill=(22, 28, 40), font=font)
    d3.text((24, 100), "Best regards,", fill=(25, 30, 42), font=font)
    # Signoff line near bottom - intentionally "lope" and "tax" to test spelling fixes
    d3.text((24, 200), "lope to hear from you soon tax", fill=(18, 24, 38), font=font)
    img3.save(OUTPUTS[2])
    print(f"Created {OUTPUTS[2].name}")

    # 4. mixed_print_cursive.png - print body + cursive-like signoff
    img4 = Image.new("RGB", (800, 300), color=(253, 252, 250))
    d4 = ImageDraw.Draw(img4)
    d4.text((24, 30), "The revolution brought change to the nation.", fill=(15, 20, 30), font=font)
    d4.text((24, 70), "These were important days for the Commonwealth.", fill=(18, 24, 34), font=font)
    d4.text((24, 110), "With best wishes,", fill=(20, 26, 36), font=font_small)
    d4.text((24, 200), "Hope to hear from you soon! XX", fill=(22, 28, 40), font=font)
    img4.save(OUTPUTS[3])
    print(f"Created {OUTPUTS[3].name}")

    print("\nAll 4 batch test images created. Run: python run_batch_test.py")


if __name__ == "__main__":
    main()
