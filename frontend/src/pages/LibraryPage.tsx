import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHistory } from "../lib/api";
import type { HistoryItem } from "../types";

export function LibraryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load library"));
  }, []);

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="hero-badge">Library</span>
          <h1>Saved Scans & Documents</h1>
          <p>Your OCR runs and corrected documents. Review and manage your saved scans.</p>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="card">
        <div className="card-header">
          <h3>Recent Scans</h3>
          <p>Scans from your OCR history. Click to view details.</p>
        </div>
        {items.length === 0 && !error ? (
          <p className="muted">No saved scans yet. <Link to="/workspace">Upload a document</Link> to get started.</p>
        ) : (
          <div className="history-list">
            {items.map((item) => (
              <Link
                key={item.run_id}
                to="/history"
                className="library-item"
              >
                <div className="library-item-main">
                  <strong>{item.student_name || "Unassigned"}</strong>
                  <span className={`badge badge-${item.review_status}`}>
                    {item.review_status?.toUpperCase()}
                  </span>
                  <p>{new Date(item.created_at).toLocaleString()}</p>
                  <p className="text-display library-preview">
                    {(item.reviewed_text || item.corrected_text || "").slice(0, 120)}
                    {(item.reviewed_text || item.corrected_text || "").length > 120 ? "…" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
