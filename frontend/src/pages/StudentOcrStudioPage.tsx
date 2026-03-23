import { useMemo, useState } from "react";

import { processImage } from "../lib/api";
import { toAssetUrl } from "../lib/api";
import type { OCRRun } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { OcrHistoryPanel } from "../components/OcrHistoryPanel";

export default function StudentOcrStudioPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const [result, setResult] = useState<OCRRun | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const canSubmit = useMemo(() => !!file && !busy, [file, busy]);

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setStatus("Processing… DocTR segmentation + TrOCR Large handwritten + correction.");
    try {
      const response = await processImage({
        file,
        qualityMode: "quality_local"
      });
      setResult(response);
      setStatus(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      let displayMsg = msg;
      if (msg.includes("AbortError") || msg.includes("abort")) displayMsg = "OCR timed out. Try a clearer/cropped image.";
      setError(displayMsg);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  if (!isStudent) {
    return (
      <div className="page-stack">
        <section className="hero">
          <div>
            <span className="hero-badge">OCR Studio</span>
            <h1>Handwriting OCR</h1>
            <p>This page is for students.</p>
          </div>
        </section>
        <div className="error-banner">Please switch to a student account.</div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="hero-badge">OCR Studio</span>
          <h1>Handwriting OCR</h1>
          <p>Upload a handwriting photo. You will see raw OCR text and corrected text.</p>
        </div>
      </section>

      <div className="card">
        <h3>Upload handwriting image</h3>
        <div className="form-row" style={{ alignItems: "center" }}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setResult(null);
              setError(null);
              setStatus(null);
            }}
          />
          <button onClick={handleUpload} disabled={!canSubmit}>
            {busy ? "Processing…" : "Convert to text"}
          </button>
        </div>
        <p style={{ color: "var(--color-text-secondary)", marginTop: 10 }}>
          Tip: crop tightly around the handwriting and keep the photo bright.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {status ? (
        <div className="card">
          <p>{status}</p>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="card">
            <h3>Original image</h3>
            {toAssetUrl(result.original_image_path, result.original_image_url) ? (
              <img
                src={toAssetUrl(result.original_image_path, result.original_image_url) ?? undefined}
                alt="Original handwriting upload"
                style={{ width: "100%", maxWidth: 820, borderRadius: 14, border: "1px solid var(--color-divider)" }}
              />
            ) : (
              <p style={{ color: "var(--color-text-secondary)" }}>Original image not available.</p>
            )}
          </div>

          <div className="card">
            <h3>Raw OCR text</h3>
            <textarea className="text-area" value={result.raw_text || ""} readOnly rows={10} style={{ width: "100%", resize: "vertical" }} />
          </div>

          <div className="card">
            <h3>Corrected text</h3>
            <textarea
              className="text-area"
              value={result.corrected_text || ""}
              readOnly
              rows={10}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>
        </>
      ) : null}

      <OcrHistoryPanel />
    </div>
  );
}

