import { useEffect, useState } from "react";
import { fetchHistory } from "../lib/api";
import type { HistoryItem } from "../types";
import { useAuth } from "../contexts/AuthContext";

export function OcrHistoryPanel({ limit = 8 }: { limit?: number }) {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchHistory()
      .then((items) => {
        if (cancelled) return;
        setHistory(items.slice(0, limit));
      })
      .catch((e) => {
        if (cancelled) return;
        setHistory([]);
        setError(e instanceof Error ? e.message : "Failed to load OCR history");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>OCR History</h3>
      <p style={{ color: "var(--color-text-secondary)", marginTop: 0, marginBottom: 12 }}>
        {isTeacher ? "Review and audit your OCR runs." : "Your recent OCR runs on this device."}
      </p>
      {loading ? <div style={{ textAlign: "center" }}>Loading history…</div> : null}
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      {!loading && !error && history.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>No OCR runs yet.</p>
      ) : null}

      {!loading && !error ? (
        <div style={{ display: "grid", gap: 10 }}>
          {history.map((item) => (
            <div
              key={item.run_id}
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid var(--color-divider)",
                background: "var(--color-surface-soft)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 800 }}>
                  {item.student_name || "Unassigned"}
                  {item.review_status ? (
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 11,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "rgba(16,185,129,0.12)",
                        border: "1px solid rgba(16,185,129,0.25)",
                        color: "#065f46",
                        fontWeight: 800
                      }}
                    >
                      {item.review_status.toUpperCase()}
                    </span>
                  ) : null}
                </div>
                <div style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</div>
              </div>

              <div style={{ marginTop: 8, color: "var(--color-text-secondary)", fontSize: 12 }}>
                Mode: {item.quality_mode} • Confidence: {(item.avg_confidence * 100).toFixed(1)}%
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>Raw</div>
                <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{(item.raw_text || "").slice(0, 160) || "—"}</div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>Corrected</div>
                <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{(item.corrected_text || "").slice(0, 160) || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

