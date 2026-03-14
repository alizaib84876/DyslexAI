"""Generate a lightweight handwriting-like sample image for tests and demos.

This replaces the old root-level helper script so generated fixtures live in a
dedicated scripts area instead of cluttering the project root.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUTPUT_PATH = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "images" / "sample_fixture.png"


def load_font():
    try:
        return ImageFont.truetype("arial.ttf", 18)
    except OSError:
        return ImageFont.load_default()


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", (900, 260), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    font = load_font()

    text = (
        "if the threatened counter revolution was not to bring the President back\n"
        "these 13 states of the Commonwealth were an occasion worthy of his presence\n"
        "after all it was Mr Nkrumah"
    )
    draw.text((24, 32), text, fill=(15, 23, 42), font=font)
    image.save(OUTPUT_PATH)
    print(f"Sample fixture written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
