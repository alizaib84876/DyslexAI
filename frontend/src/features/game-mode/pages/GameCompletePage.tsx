import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { GameCompleteDayResponse } from "../../../lib/api";
import { useGame } from "../GameContext";
import { KidIcon } from "../../../components/KidIcon";

export default function GameCompletePage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { today, loading, error, submitDay } = useGame();
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<GameCompleteDayResponse | null>(null);

  const scores: number[] = (loc.state as { scores?: number[] })?.scores ?? [];
  const avg = useMemo(() => {
    if (!scores.length) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [scores]);

  async function onComplete() {
    if (!today) return;
    try {
      const res = await submitDay(today.day.day_number, scores.length ? scores : [avg, avg, avg, avg]);
      setResult(res);
      setSubmitted(true);
    } catch {
      /* error shown via context */
    }
  }

  const alreadyDone = Boolean(result?.already_completed);
  const pieceEarned = Boolean(result?.puzzle_piece_earned);

  return (
    <div className="page game-mode-kids">
      <div className="card gm-hero-card">
        <h2 style={{ marginTop: 0 }}>
          Day complete! <KidIcon name="sparkles" />
        </h2>
        {error ? (
          <div className="error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="card gm-stat-bubble" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 16, opacity: 0.9 }}>Your score today</div>
          <div className="gm-big-score">{Math.round(avg * 100)}%</div>
        </div>

        {submitted && result ? (
          <div className={`gm-feedback ${alreadyDone ? "gm-feedback-muted" : ""}`} role="status">
            {alreadyDone ? (
              <>
                <strong>You already finished this day.</strong>
                <p style={{ margin: "8px 0 0", fontSize: 17, lineHeight: 1.5 }}>
                  Your first completion is saved — including your puzzle piece. You can practise again anytime; only the{" "}
                  <strong>first</strong> submit counts for streaks and the puzzle.
                </p>
              </>
            ) : pieceEarned ? (
              <>
                <div className="gm-piece-earned" aria-hidden>
                  <KidIcon name="puzzle" />
                </div>
                <strong>Puzzle piece unlocked!</strong>
                <p style={{ margin: "8px 0 0", fontSize: 17, lineHeight: 1.5 }}>
                  Check <strong>View puzzle</strong> for this phase to see your piece light up.
                </p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 17 }}>Progress saved.</p>
            )}
          </div>
        ) : (
          <p className="gm-hint" style={{ marginTop: 14, fontSize: 17, lineHeight: 1.5 }}>
            Tap <strong>Save completion</strong> once to save your score and earn today&apos;s puzzle piece. If you play again and save, the
            server keeps your <strong>first</strong> completion only.
          </p>
        )}

        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onComplete}
            className="btn primary gm-btn-big"
            disabled={loading || submitted || !today}
          >
            {submitted ? (alreadyDone ? "Already saved" : "Saved") : "Save completion"}
          </button>
          <button type="button" onClick={() => nav("/game/session")} className="btn gm-btn-big" disabled={loading}>
            Practise again
          </button>
          <Link to="/game" className="btn gm-btn-big">
            Game home
          </Link>
          <Link to={`/game/puzzle/${today?.day.phase_number ?? 1}`} className="btn gm-btn-big">
            View puzzle
          </Link>
        </div>
      </div>
    </div>
  );
}
