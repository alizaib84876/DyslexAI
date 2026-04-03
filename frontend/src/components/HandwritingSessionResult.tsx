/**
 * Result panel for handwriting session (dyslexia-backend submit-handwriting).
 * Use when POST /sessions/{id}/submit-handwriting returns:
 *   recognized_text, corrected_text, score, feedback
 */
interface HandwritingSessionResultProps {
  recognizedText?: string;
  correctedText?: string;
  score?: number;
  feedback?: string;
}

export function HandwritingSessionResult({
  recognizedText,
  correctedText,
  score,
  feedback,
}: HandwritingSessionResultProps) {
  if (!recognizedText && !correctedText && score == null) return null;

  return (
    <div className="card handwriting-result">
      <h3>Handwriting Result</h3>
      {recognizedText != null && (
        <p>
          <strong>Recognized:</strong> {recognizedText}
        </p>
      )}
      {correctedText != null && (
        <p>
          <strong>Corrected:</strong> {correctedText}
        </p>
      )}
      {score != null && (
        <p>
          <strong>Score:</strong> {(score * 100).toFixed(0)}%
        </p>
      )}
      {feedback && (
        <p>
          <strong>Feedback:</strong> {feedback}
        </p>
      )}
    </div>
  );
}
