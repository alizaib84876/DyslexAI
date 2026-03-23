import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { PhasePuzzlePicture } from "../components/PhasePuzzlePicture";
import { useGame } from "../GameContext";
import { phaseDayRange } from "../gamePhase";

export default function GamePuzzlePage() {
  const params = useParams();
  const phase = Math.max(1, Math.min(6, Number(params.phaseId ?? 1) || 1));
  const { puzzleByPhase, loading, error, loadPuzzle } = useGame();

  useEffect(() => {
    void loadPuzzle(phase);
  }, [phase, loadPuzzle]);

  const puzzle = puzzleByPhase[phase];
  const pieces = puzzle?.pieces_earned ?? [];

  const [startDay, endDay] = useMemo(() => {
    if (puzzle?.day_range?.length === 2) return puzzle.day_range;
    return phaseDayRange(phase);
  }, [puzzle?.day_range, phase]);

  const totalSlots = puzzle?.pieces_total ?? endDay - startDay + 1;

  return (
    <div className="page game-mode-kids">
      <div className="card gm-hero-card">
        <h2 style={{ marginTop: 0 }}>Phase {phase} puzzle 🧩</h2>
        <p className="gm-lead">
          Complete each <strong>day</strong> in this phase to reveal a piece of the picture below. The scene is one big image — your progress
          unlocks it piece by piece!
        </p>

        {error ? (
          <div className="error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="card gm-puzzle-board" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              Days {startDay}–{endDay}
            </div>
            <div className="gm-pill">
              Picture: <b>{pieces.length}</b> / {totalSlots} pieces revealed
            </div>
          </div>

          {loading && !puzzle ? (
            <div style={{ marginTop: 16, fontSize: 18, textAlign: "center" }}>Loading your puzzle…</div>
          ) : (
            <PhasePuzzlePicture phase={phase} startDay={startDay} totalSlots={totalSlots} earnedDayNumbers={pieces} />
          )}
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/game" className="btn gm-btn-big">
            ← Game home
          </Link>
        </div>
      </div>
    </div>
  );
}
