import type { OCRRun } from "../types";

type Props = {
  result?: OCRRun | null;
};

type TranscriptEvaluation = {
  raw_cer?: number;
  raw_wer?: number;
  corrected_cer?: number;
  corrected_wer?: number;
};

export function PipelineInsights({ result }: Props) {
  const metadata = result?.metadata ?? {};
  const warnings = Array.isArray(metadata.pipeline_warnings)
    ? metadata.pipeline_warnings.filter((item): item is string => typeof item === "string")
    : [];
  const sourceCounts =
    metadata.line_source_counts && typeof metadata.line_source_counts === "object"
      ? (metadata.line_source_counts as Record<string, unknown>)
      : {};
  const transcriptEvaluation =
    metadata.transcript_evaluation && typeof metadata.transcript_evaluation === "object"
      ? (metadata.transcript_evaluation as TranscriptEvaluation)
      : null;
  const usedStructureFallback = metadata.paragraph_structure_fallback === true;

  if (!result) {
    return null;
  }

  return (
    <section className="comparison-grid">
      <article className="card">
        <div className="card-header">
          <h3>Advanced Pipeline Status</h3>
          <p>
            Shows which paragraph-to-line path was used before final recognition and
            whether any accuracy warnings should be reviewed.
          </p>
        </div>
        <div className="badge-row">
          <span className="badge">
            Structure {String(metadata.paragraph_structure_engine ?? "unknown")}
          </span>
          <span className="badge">
            Lines {String(metadata.ordered_line_count ?? metadata.num_lines ?? 0)}
          </span>
          <span className={`badge ${usedStructureFallback ? "badge-warn" : "badge-ok"}`}>
            {usedStructureFallback ? "Fallback structure path" : "Primary structure path"}
          </span>
        </div>
        {Object.keys(sourceCounts).length > 0 ? (
          <div className="paragraph-visualization">
            <strong>Line Sources</strong>
            <div className="diff-tags">
              {Object.entries(sourceCounts).map(([key, value]) => (
                <span className="diff-tag" key={key}>
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {result?.lines && result.lines.length > 0 ? (
          <div className="paragraph-visualization" style={{ marginTop: "1rem" }}>
            <strong>Document OCR Confidence</strong>
            <div className="badge-row" style={{ marginTop: "0.5rem" }}>
              <span className={`badge ${(result.lines.reduce((a, b) => a + b.confidence, 0) / result.lines.length) > 0.8 ? "badge-ok" : "badge-warn"}`}>
                Avg Confidence: {((result.lines.reduce((a, b) => a + b.confidence, 0) / result.lines.length) * 100).toFixed(1)}%
              </span>
              {(metadata as any)?.run_summary?.tier_summary && (
                <span className="badge">
                  Difficulty Breakdown:
                  Easy: {(metadata as any).run_summary.tier_summary.easy?.count || 0} |
                  Medium: {(metadata as any).run_summary.tier_summary.medium?.count || 0} |
                  Hard: {(metadata as any).run_summary.tier_summary.hard?.count || 0}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className="warning-list">
            {warnings.map((warning, index) => (
              <p className="warning-note" key={`${warning}-${index}`}>
                {warning}
              </p>
            ))}
          </div>
        ) : (
          <p className="muted">No pipeline warnings were raised for this run.</p>
        )}
      </article>

      <article className="card">
        <div className="card-header">
          <h3>Transcript Evaluation</h3>
          <p>
            Optional CER/WER scoring appears here when you provide the correct text for
            a difficult sample.
          </p>
        </div>
        {transcriptEvaluation ? (
          <div className="badge-row">
            <span className="badge">Raw CER {((transcriptEvaluation.raw_cer ?? 0) * 100).toFixed(1)}%</span>
            <span className="badge">Raw WER {((transcriptEvaluation.raw_wer ?? 0) * 100).toFixed(1)}%</span>
            <span className="badge badge-ok">
              Corrected CER {((transcriptEvaluation.corrected_cer ?? 0) * 100).toFixed(1)}%
            </span>
            <span className="badge badge-ok">
              Corrected WER {((transcriptEvaluation.corrected_wer ?? 0) * 100).toFixed(1)}%
            </span>
          </div>
        ) : (
          <p className="muted">
            Paste a reference transcript before processing if you want this run scored.
          </p>
        )}
      </article>
    </section >
  );
}
