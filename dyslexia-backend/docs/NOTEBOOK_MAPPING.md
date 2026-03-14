# Notebook-to-Backend Mapping

Every notebook cell/function from `fyp (1).ipynb` mapped to backend file/function.

## 1. Model Loading

| Notebook | Backend |
|----------|---------|
| `load_models()` cell — DocTR ocr_predictor | `app/ocr/engines/notebook_engine.py` — `NotebookOCREngine.__init__` |
| `load_models()` — TrOCR Large Handwritten | `app/ocr/engines/notebook_engine.py` — `NotebookOCREngine.__init__` |

## 2. OCR Inference

| Notebook | Backend |
|----------|---------|
| `run_inference()` — DocTR line detection | `app/ocr/engines/notebook_engine.py` — `NotebookOCREngine.run` |
| `run_inference()` — crop per line, TrOCR | `app/ocr/engines/notebook_engine.py` — `NotebookOCREngine.run` |
| `run_inference()` — sort by y_center, cluster | `app/ocr/engines/notebook_engine.py` — `NotebookOCREngine.run` |
| `run_inference()` — build paragraph | `app/ocr/engines/notebook_engine.py` — `NotebookOCREngine.run` |

## 3. Correction Layers

| Notebook | Backend |
|----------|---------|
| `layer_1_sanitize(text)` | `app/correction/notebook_layers.py` — `layer_1_sanitize` |
| `layer_2_dyslexia_fix(text)` — custom T5 | `app/correction/notebook_layers.py` — `layer_2_dyslexia_fix` (custom T5 if path exists) |
| `layer_2_dyslexia_fix(text)` — fallback | `app/correction/notebook_layers.py` — `layer_2_dyslexia_fix` (ByT5 if no custom T5) |
| `get_groq_correction(text)` | `app/correction/notebook_layers.py` — `get_groq_correction` |

## 4. Full Pipeline

| Notebook | Backend |
|----------|---------|
| `run_full_pipeline()` | `app/pipeline/notebook_pipeline.py` — `NotebookPipeline.process_image` |


## Custom T5 Paths

Notebook checks: `DyslexAI_Model_Unzipped`, `DyslexAI_Best_Model (1)`, `/content/DyslexAI_Model_Unzipped`

Backend checks: `DYSLEXAI_T5_MODEL_PATH` env, then `DyslexAI_Model_Unzipped`, `DyslexAI_Best_Model (1)`, `DyslexAI_Best_Best_Model_unzipped`, `dyslexia-backend/DyslexAI_Model_Unzipped`

## Groq

Notebook: hardcoded key (removed in production). Backend: `GROQ_API_KEY` env. When set, Groq runs automatically after layer 2.
