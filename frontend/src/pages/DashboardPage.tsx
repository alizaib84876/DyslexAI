import { useEffect, useState } from "react";

import { MetricsCards } from "../components/MetricsCards";
import { PerformanceChart } from "../components/PerformanceChart";
import { fetchHistory, fetchOverview, fetchStudentProgress, submitReview } from "../lib/api";
import type { DashboardOverview, HistoryItem, StudentProgress } from "../types";

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setError(null);
    void Promise.all([
      fetchOverview().catch((e) => { throw e; }),
      fetchHistory().catch((e) => { throw e; }),
      fetchStudentProgress().catch(() => []),
    ])
      .then(([overviewResponse, historyResponse, progressResponse]) => {
        setOverview(overviewResponse);
        setHistory(historyResponse);
        setProgress(progressResponse);
      })
      .catch((err) => {
        setError(
          err?.message?.includes("fetch") || err?.message?.includes("404")
            ? "Dashboard needs the full DyslexAI backend. Run .\\scripts\\run.ps1 for Dashboard, History, and charts."
            : err instanceof Error ? err.message : "Failed to load dashboard"
        );
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (runId: number, status: string, text?: string) => {
    try {
      await submitReview(runId, { review_status: status, reviewed_text: text });
      setEditingId(null);
      loadData(); // Refresh to get updated stats and status
    } catch (err) {
      alert("Failed to update review status");
    }
  };

  return (
    <div className="page-stack">
      {error && <div className="error-banner">{error}</div>}
      <section className="hero">
        <div>
          <span className="hero-badge">Teacher Review Portal</span>
          <h1>Quality & Progress Tracking</h1>
          <p>
            Review AI-corrected handwriting, approve accurate results, or manually override
            difficult cases to improve student profiles.
          </p>
        </div>
      </section>

      <MetricsCards overview={overview} />

      <section className="dashboard-visualization">
        <PerformanceChart data={history} />
      </section>

      <section className="dashboard-grid">
        <article className="card history-container">
          <div className="card-header">
            <h3>Recent OCR History & Reviews</h3>
            <p>Approve or edit AI results to verify accuracy.</p>
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
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Student Progress</h3>
            <p>Simple improvement view for teachers and supervisors.</p>
          </div>
          <div className="progress-list">
            {progress.map((item) => (
              <div className="progress-row" key={item.student_id}>
                <div>
                  <strong>{item.student_name}</strong>
                  <p>{item.total_runs} processed runs</p>
                </div>
                <div className="progress-meters">
                  <span>Confidence {(item.avg_confidence * 100).toFixed(1)}%</span>
                  <span>Correction {(item.avg_correction_ratio * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
