import { useEffect, useState } from "react";

import { AnnotatedImageViewer } from "../components/AnnotatedImageViewer";
import { ComparisonViewer } from "../components/ComparisonViewer";
import { CorrectionHighlights } from "../components/CorrectionHighlights";
import { PipelineInsights } from "../components/PipelineInsights";
import { UploadPanel } from "../components/UploadPanel";
import { fetchExerciseStudents, processImage } from "../lib/api";
import type { ExerciseStudent, OCRRun } from "../types";

export function WorkspacePage() {
  const [students, setStudents] = useState<ExerciseStudent[]>([]);
  const [result, setResult] = useState<OCRRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchExerciseStudents()
      .then(setStudents)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleUpload(payload: {
    file: File;
    studentId?: number | string;
    qualityMode: string;
    referenceText?: string;
  }) {
    setBusy(true);
    setError(null);
    setStatus(
      payload.qualityMode === "fast_local"
        ? "Processing in Fast mode… (optimized for speed)"
        : payload.qualityMode === "quality_local" || payload.qualityMode === "cloud_refine"
          ? "Processing in Quality mode… TrOCR may take 30–90 seconds for handwriting. Please wait…"
          : "Processing…"
    );
    try {
      const studentIdNum =
        payload.studentId != null && !Number.isNaN(Number(payload.studentId))
          ? Number(payload.studentId)
          : undefined;
      const response = await processImage({
        ...payload,
        studentId: studentIdNum
      });
      setResult(response);
      setStatus(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      let displayMsg = msg;
      if (msg.includes("abort") || msg.includes("AbortError")) {
        displayMsg = "OCR timed out. Try Fast mode or a smaller image.";
      } else if (msg.includes("fetch") || msg.includes("Failed to fetch")) {
        displayMsg = "Could not reach OCR service. Make sure the backend is running on port 8000.";
      } else if (msg.includes("Not Found") || msg.includes('"detail":"Not Found"')) {
        displayMsg =
          "OCR endpoint not found. Run the app with .\\scripts\\run.ps1 (full) or .\\scripts\\run-simple.ps1 (simple) so the backend is ready.";
      } else if (msg.includes("extra dependencies") || msg.includes("503")) {
        displayMsg =
          "OCR needs setup. In dyslexia-backend folder run: pip install torch transformers opencv-python paddleocr";
      }
      setError(displayMsg);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="hero-badge">Local-First OCR Workspace</span>
          <h1>DyslexAI Processing Studio</h1>
          <p>
            Upload handwriting, inspect OCR confidence, compare raw and corrected
            text, and review every correction with transparent evidence.
          </p>
        </div>
      </section>

      <UploadPanel students={students} onSubmit={handleUpload} busy={busy} />

      {error ? <div className="error-banner">{error}</div> : null}
      {status ? <div className="card"><p>{status}</p></div> : null}

      <PipelineInsights result={result} />
      <AnnotatedImageViewer
        originalImagePath={result?.original_image_path}
        originalImageUrl={result?.original_image_url}
        annotatedImagePath={result?.annotated_image_path}
        preprocessedImagePath={result?.preprocessed_image_path}
      />
      <ComparisonViewer
        rawText={result?.raw_text}
        correctedText={result?.corrected_text}
        correctionLayer1={result?.correction_layer1}
        correctionLayer2={result?.correction_layer2}
        correctionLayer3={result?.correction_layer3}
      />
      <CorrectionHighlights lines={result?.lines ?? []} />
    </div>
  );
}
