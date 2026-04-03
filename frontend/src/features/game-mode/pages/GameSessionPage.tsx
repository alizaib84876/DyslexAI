import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../GameContext";
import { ExerciseRenderer } from "../components/exercises/ExerciseRenderer";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export default function GameSessionPage() {
  const nav = useNavigate();
  const { today, loading, error, loadToday } = useGame();
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  const exercises = today?.exercises ?? [];
  const current = exercises[idx];

  function submitScore(score01: number) {
    const nextScores = [...scores, clamp01(score01)];
    setScores(nextScores);
    const nextIdx = idx + 1;
    if (nextIdx >= exercises.length) nav("/game/complete", { state: { scores: nextScores } });
    else setIdx(nextIdx);
  }

  if (!today) {
    return (
      <div className="page game-mode-kids">
        <div className="card gm-hero-card">
          <h2 style={{ marginTop: 0 }}>Today’s session</h2>
          {error ? <div className="error">{error}</div> : <div style={{ fontSize: 18 }}>{loading ? "Loading…" : "—"}</div>}
          <div style={{ marginTop: 12 }}>
            <Link to="/game" className="btn gm-btn-big">
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="page game-mode-kids">
        <div className="card gm-hero-card">
          <h2 style={{ marginTop: 0 }}>Today’s session</h2>
          <p style={{ fontSize: 18 }}>No exercises found for today.</p>
          <Link to="/game" className="btn" style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }}>
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page game-mode-kids">
      <div className="card gm-hero-card">
        <div className="gm-session-header">
          <div>
            <h2 style={{ marginTop: 0 }}>{today.day.title}</h2>
            <div className="gm-progress-track" aria-hidden>
              {exercises.map((_, i) => (
                <span key={i} className={`gm-progress-dot ${i <= idx ? "gm-progress-dot-done" : ""}`} />
              ))}
            </div>
            <div className="gm-stat-sub" style={{ marginTop: 8 }}>
              Challenge {idx + 1} of {exercises.length} • {current.exercise_type.replace(/_/g, " ")}
            </div>
          </div>
          <Link to="/game" className="btn gm-btn-big">
            Exit
          </Link>
        </div>

        <ExerciseRenderer exercise={current} onSubmit={submitScore} />
      </div>
    </div>
  );
}

