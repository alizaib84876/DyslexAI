import { KidIcon } from "./KidIcon";

type Props = {
  rawText?: string;
  correctedText?: string;
  correctionLayer1?: string | null;
  correctionLayer2?: string | null;
  correctionLayer3?: string | null;
};

function weirdCharRatio(text: string): number {
  if (!text.trim()) return 0;
  const weird = text.match(/[^A-Za-z0-9\s.,!?;:'"()-]/g);
  return (weird?.length ?? 0) / text.length;
}

export function ComparisonViewer({
  rawText,
  correctedText,
  correctionLayer1,
  correctionLayer2,
  correctionLayer3,
}: Props) {
  const source = rawText || "";
  const corrected = correctedText || "";
  const hasChanges = source !== corrected && corrected.length > 0;
  const stillNoisy = corrected.length > 0 && weirdCharRatio(corrected) > 0.2;

  const layer1 = correctionLayer1 ?? rawText ?? "";
  const layer2 = correctionLayer2 ?? layer1;
  const layer3 = correctionLayer3 ?? corrected;

  return (
    <section className="comparison-grid comparison-grid-layers">
      <article className="card">
        <div className="card-header">
          <h3>Original OCR Text</h3>
          <p>What the system read from your handwriting.</p>
        </div>
        <pre className="text-panel">{rawText || "Process an image to see OCR output."}</pre>
      </article>

      <article className="card">
        <div className="card-header">
          <h3>Layer 1: Lexical Cleanup</h3>
          <p>Line-level normalization, spacing, and basic fixes.</p>
        </div>
        <pre className="text-panel">{layer1 || "—"}</pre>
      </article>

      <article className="card">
        <div className="card-header">
          <h3>Layer 2: Contextual Repair (ByT5)</h3>
          <p>Paragraph-level correction using context. Skipped when input is too noisy.</p>
        </div>
        <pre className="text-panel">{layer2 || "—"}</pre>
      </article>

      <article className="card">
        <div className="card-header">
          <h3>Layer 3: Final (Spelling Refinement)</h3>
          <p>Spelling, spacing, and punctuation improvements applied.</p>
        </div>
        {stillNoisy && (
          <div className="review-needed-banner" role="alert">
            Output may still contain errors. Please review and edit manually if needed.
          </div>
        )}
        <pre className="text-panel text-panel-corrected">
          {layer3 || "Corrected text will appear here after processing."}
        </pre>
        {hasChanges && !stillNoisy && (
          <p className="change-summary" style={{ marginTop: 14 }}>
            <KidIcon name="check" /> Corrections applied. See the line-by-line breakdown below for details.
          </p>
        )}
      </article>
    </section>
  );
}
