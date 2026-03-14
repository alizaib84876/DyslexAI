import { buildDiffOps } from "../lib/diff";
import type { OCRLine } from "../types";

type Props = {
  lines: OCRLine[];
};

/** Check if text looks like garbled OCR (high ratio of non-standard chars). */
function weirdCharRatio(text: string): number {
  if (!text.trim()) return 0;
  const weird = text.match(/[^A-Za-z0-9\s.,!?;:'"()-]/g);
  return (weird?.length ?? 0) / text.length;
}

/** Check if correction might be hallucination (before/after share almost no words). */
function possibleHallucination(before: string, after: string): boolean {
  const beforeWords = new Set((before || "").toLowerCase().match(/[a-z']+/g) ?? []);
  const afterWords = new Set((after || "").toLowerCase().match(/[a-z']+/g) ?? []);
  if (beforeWords.size === 0 || afterWords.size === 0) return false;
  const overlap = [...beforeWords].filter((w) => afterWords.has(w)).length;
  return overlap / Math.max(beforeWords.size, afterWords.size) < 0.2;
}

/** Human-readable summary of what changed, instead of raw diff ops. */
function summarizeChanges(before: string, after: string): string {
  const ops = buildDiffOps(before, after);
  if (ops.length === 0) return "";
  const totalChange = ops.reduce((acc, op) => acc + (op.from?.length || 0) + (op.to?.length || 0), 0);
  if (totalChange > 80) return "Major fixes applied (spelling, spacing, and punctuation).";
  const fixes: string[] = [];
  for (const op of ops) {
    if (op.op === "replace" && op.from && op.to) {
      if (op.from.length <= 15 && op.to.length <= 15) {
        fixes.push(`"${op.from}" → "${op.to}"`);
      } else {
        fixes.push("spelling and formatting");
      }
    } else if (op.op === "insert" && op.to) {
      fixes.push("added missing text");
    } else if (op.op === "delete" && op.from) {
      fixes.push("removed extra characters");
    }
  }
  const unique = [...new Set(fixes)];
  if (unique.length === 0) return "Formatting improved.";
  if (unique.length === 1) return `Fixed: ${unique[0]}.`;
  return `Fixed: ${unique.slice(0, 3).join(", ")}.`;
}

export function CorrectionHighlights({ lines }: Props) {
  const needsReview = lines.some((line) => {
    const raw = line.raw_text || "";
    const corrected = line.corrected_text || line.merged_text || raw;
    return (
      weirdCharRatio(raw) > 0.25 ||
      (corrected !== raw && possibleHallucination(raw, corrected))
    );
  });

  return (
    <section className="card">
      <div className="card-header">
        <h3>Correction Highlights</h3>
        <p>
          See what the system detected and how it was improved. Each line shows: <strong>What we read</strong> → <strong>What we fixed</strong>.
        </p>
        {needsReview && (
          <div className="review-needed-banner" role="alert">
            <strong>Review needed</strong> — Some lines were hard to read or the correction may be unreliable. Please compare with the annotated image and edit manually if needed.
          </div>
        )}
      </div>

      <div className="line-list">
        {lines.map((line, index) => {
          const rawText = line.raw_text || "";
          const recoveredText = line.merged_text || rawText;
          const correctedText = line.corrected_text || recoveredText;
          const hasRecovery = recoveredText.trim() && recoveredText !== rawText;
          const hasCorrection = correctedText !== recoveredText;
          const isVeryNoisy = weirdCharRatio(rawText) > 0.25;
          const isPossibleHallucination =
            hasCorrection && possibleHallucination(recoveredText, correctedText);

          return (
            <article className="line-card" key={`${index}-${rawText}-${recoveredText}`}>
              <div className="line-card-top">
                <strong>Line {index + 1}</strong>
                <div className="badge-row">
                  <span className={`badge ${line.suspicious ? "badge-warn" : "badge-ok"}`}>
                    {line.suspicious ? "Needs review" : "OK"}
                  </span>
                  <span className="badge">Confidence {(line.confidence * 100).toFixed(0)}%</span>
                  {line.fallback_used ? <span className="badge">Fallback OCR</span> : null}
                </div>
              </div>

              <div className="correction-flow">
                <div className="flow-step">
                  <span className="flow-label">What we read</span>
                  <p className="flow-text">{rawText || "No text detected for this line."}</p>
                </div>

                {(hasRecovery || hasCorrection) && (
                  <div className="flow-arrow" aria-hidden>→</div>
                )}

                <div className="flow-step flow-step-final">
                  <span className="flow-label">What we fixed</span>
                  <p className="flow-text flow-text-corrected">{correctedText}</p>
                  {(hasRecovery || hasCorrection) && (
                    <p className={`change-summary ${isPossibleHallucination ? "change-summary-warn" : ""}`}>
                      {isPossibleHallucination
                        ? "⚠️ Correction may be unreliable—please verify against the image."
                        : summarizeChanges(hasRecovery ? rawText : recoveredText, correctedText)}
                    </p>
                  )}
                </div>
              </div>

              {isVeryNoisy && line.uncertainty_score >= 0.5 && (
                <p className="review-tip">
                  ⚠️ This line was hard to read. Please check it against the image—you may need to type corrections manually.
                </p>
              )}

              {line.uncertainty_score >= 0.45 && !isVeryNoisy && (
                <p className="review-tip">
                  Tip: Compare with the annotated image to confirm accuracy.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
