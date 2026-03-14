# Manual Changes After Copy

## 1. app/routers/sessions.py

**Line ~16:** Change import
```python
# FROM:
from app.services.ocr import run_ocr

# TO:
from app.services.ocr_service import process_handwriting_image
```

**In submit_handwriting, replace the OCR block (~line 198):**
```python
# FROM:
image_bytes = await file.read()
ocr_result = run_ocr(image_bytes)
ocr_text = ocr_result["text"]
ocr_confidence = ocr_result["confidence"]

# TO:
image_bytes = await file.read()
ocr_result = process_handwriting_image(image_bytes)
ocr_text = ocr_result["corrected_text"]
ocr_confidence = ocr_result["confidence"]
recognized_text = ocr_result.get("recognized_text", ocr_text)
```

**In the return statement (~line 254):**
```python
# Change ocr_text=ocr_text to:
ocr_text=recognized_text,
# Add:
corrected_text=ocr_text,
```

## 2. app/schemas/session.py

**In HandwritingSubmitResponse class, add:**
```python
corrected_text: Optional[str] = None
```

## 3. requirements.txt

Append:
```
opencv-python
numpy
rapidfuzz
paddleocr
python-doctr
```

## 4. .env

Add:
```
DYSLEXAI_DEBUG=1
DYSLEXAI_EASY_THRESHOLD=0.5
DYSLEXAI_HARD_THRESHOLD=1.8
PADDLE_LANG=en
TROCR_MODEL_NAME=microsoft/trocr-large-handwritten
BYT5_MODEL_NAME=google/byt5-small
```
