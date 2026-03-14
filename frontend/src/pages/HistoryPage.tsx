import { useEffect, useState } from "react";

import { fetchHistory, submitReview } from "../lib/api";
import type { HistoryItem } from "../types";

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadHistory = () => {
    setError(null);
    fetchHistory()
      .then(setHistory)
      .catch((err) => {
        setHistory([]);
        setError(
          err?.message?.includes("fetch") || err?.message?.includes("404")
            ? "History needs the full DyslexAI backend. Run .\\scripts\\run.ps1"
            : err instanceof Error ? err.message : "Failed to load history"
        );
      });
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleReview = async (runId: number, status: string, text?: string) => {
    try {
      await submitReview(runId, { review_status: status, reviewed_text: text });
      setEditingId(null);
      loadHistory();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="page-stack">
      {error && <div className="error-banner">{error}</div>}
      <section className="hero">
        <div>
          <span className="hero-badge">Archive</span>
          <h1>Full OCR Run History</h1>
          <p>Review and audit every handwriting process executed on this device.</p>
        </div>
      </section>

      <section className="card history-container">
        <div className="card-header">
          <h3>Local Database Archive</h3>
          <p>Filtered by recent activity. Review status is persisted for teacher oversight.</p>
        </div>
        <div className="history-list">
          {history.map((item) => (
            <div className={`history-item status-${item.review_status}`} key={item.run_id}>
              <div className="history-main">
                <div className="history-meta">
                  <strong>{item.student_name || "Unassigned"}</strong>
                  <span className={`badge badge-${item.review_status}`}>
                    {item.review_status?.toUpperCase()}
                  </span>
                  <p>{new Date(item.created_at).toLocaleString()}</p>
                </div>

                <div className="history-content">
                  {editingId === item.run_id ? (
                    <textarea
                      className="edit-area"
                      value={editBuffer}
                      onChange={(e) => setEditBuffer(e.target.value)}
                    />
                  ) : (
                    <p className="text-display">
                      {item.reviewed_text || item.corrected_text}
                    </p>
                  )}
                  {item.reviewed_text && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                      ✓ Teacher Overridden
                    </div>
                  )}
                </div>

                <div className="history-actions">
                  {editingId === item.run_id ? (
                    <>
                      <button className="small-button save" onClick={() => handleReview(item.run_id, "accepted", editBuffer)}>Save & Approve</button>
                      <button className="small-button cancel" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="small-button approve" onClick={() => handleReview(item.run_id, "accepted")}>Approve</button>
                      <button className="small-button edit" onClick={() => {
                        setEditingId(item.run_id);
                        setEditBuffer(item.reviewed_text || item.corrected_text);
                      }}>Edit</button>
                      <button className="small-button reject" onClick={() => handleReview(item.run_id, "rejected")}>Reject</button>
                    </>
                  )}
                </div>
              </div>

              <div className="history-stats">
                <span className="mode-tag">{item.quality_mode}</span>
                <span className="score-tag">{(item.avg_confidence * 100).toFixed(1)}% Conf.</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{item.suspicious_lines} flagged</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
