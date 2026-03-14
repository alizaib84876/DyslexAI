import { useEffect, useRef, useState } from "react";
import { TracingCanvas } from "../components/TracingCanvas";
import {
  createExerciseStudent,
  createSession,
  fetchExerciseStudents,
  getNextExercise,
  submitHandwriting,
  submitTracing,
  submitTyping
} from "../lib/api";
import type { Exercise, ExerciseStudent } from "../types";

// ─── XP / Level helpers ───────────────────────────────────────────────────────
const XP_PER_LEVEL = 500;
function xpForScore(score: number) { return Math.round(score * 100); }
function levelFromXP(xp: number) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
function xpInCurrentLevel(xp: number) { return xp % XP_PER_LEVEL; }
function starsForScore(score: number) {
  if (score >= 0.9) return 3;
  if (score >= 0.6) return 2;
  return 1;
}

type Phase = "pick" | "playing" | "result";

export function GamifiedExercisePage() {
  const [students, setStudents] = useState<ExerciseStudent[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [phase, setPhase] = useState<Phase>("pick");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [typingAns, setTypingAns] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handwritingFile, setHandwritingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Gamification state (persisted in component lifetime)
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState("");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevel = useRef(1);
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExerciseStudents()
      .then((list) => {
        setStudents(list);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load students");
      });
  }, []);

  // Trigger confetti on perfect score or level up
  useEffect(() => {
    const lvl = levelFromXP(xp);
    if (lvl > prevLevel.current) {
      setShowLevelUp(true);
      prevLevel.current = lvl;
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [xp]);

  async function handleAddStudent() {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const s = await createExerciseStudent({ name: newName.trim() });
      setStudents((p) => [...p, s]);
      setSelectedId(String(s.id));
      setNewName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add student");
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    if (!selectedId) { setError("Select or create a student first."); return; }
    await fetchExercise();
  }

  useEffect(() => {
    if (handwritingFile) {
      const url = URL.createObjectURL(handwritingFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [handwritingFile]);

  async function fetchExercise() {
    setError(null);
    setBusy(true);
    setTypingAns("");
    setHandwritingFile(null);
    try {
      const ex = await getNextExercise(selectedId);
      setExercise(ex);
      const sess = await createSession({
        student_id: selectedId,
        exercise_id: ex.id,
        is_handwriting: ex.type === "handwriting"
      });
      setSessionId(sess.session_id);
      setPhase("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get exercise");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitTyping() {
    if (!sessionId || !typingAns.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitTyping(sessionId, { student_response: typingAns.trim() });
      applyResult(res.score, res.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleTracingDone(
    traceScore: number,
    durationSeconds: number,
    strokeErrors?: Array<{ letter: string; accuracy: number }>
  ) {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitTracing(sessionId, {
        trace_score: traceScore,
        duration_seconds: durationSeconds,
        stroke_errors: strokeErrors
      });
      applyResult(res.score, res.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitHandwriting() {
    if (!sessionId || !handwritingFile) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitHandwriting(sessionId, handwritingFile);
      applyResult(res.score, res.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  function applyResult(score: number, feedback: string) {
    const earned = xpForScore(score);
    const correct = score >= 0.7;
    const bonus = correct ? streak * 10 : 0;

    setXp(prev => prev + earned + bonus);
    setStreak(prev => correct ? prev + 1 : 0);
    setTotalAnswered(prev => prev + 1);
    setLastScore(score);
    setLastFeedback(feedback || (correct ? "Excellent work! Keep it up." : "Good try! Practice makes perfect."));
    setPhase("result");

    if (score >= 0.9 && confettiRef.current) {
      confettiRef.current.classList.add("confetti-burst");
      setTimeout(() => confettiRef.current?.classList.remove("confetti-burst"), 2000);
    }
  }

  const level = levelFromXP(xp);
  const xpInLvl = xpInCurrentLevel(xp);
  const xpPct = (xpInLvl / XP_PER_LEVEL) * 100;
  const stars = starsForScore(lastScore);
  const isTyping = exercise?.type === "word_typing" || exercise?.type === "sentence_typing";
  const isTracing = exercise?.type === "tracing";
  const isHandwriting = exercise?.type === "handwriting";

  return (
    <div className="gx-root">
      {/* ─── Background confetti canvas ─────────── */}
      <div ref={confettiRef} className="gx-confetti" aria-hidden />

      {/* ─── Level-up banner ─────────────────────── */}
      {showLevelUp && (
        <div className="gx-levelup-banner">
          🚀 LEVEL UP! Welcome to Level {level}
        </div>
      )}

      {/* ─── Header HUD ───────────────────────────── */}
      <header className="gx-hud">
        <div className="gx-hud-left">
          <span className="gx-level-badge">LEVEL {level}</span>
          <div className="gx-xp-bar-wrap" title={`${xpInLvl} / ${XP_PER_LEVEL} XP`}>
            <div className="gx-xp-bar" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="gx-xp-label">{xpPct.toFixed(0)}% to next level</span>
        </div>
        <div className="gx-hud-center">
          <span className="gx-title">Processing Studio: Game Mode</span>
        </div>
        <div className="gx-hud-right">
          {streak >= 2 && (
            <span className="gx-streak">🔥 {streak} Streak</span>
          )}
          <span className="gx-stat">🎯 {totalAnswered} Completed</span>
        </div>
      </header>

      {/* ─── Main content ────────────────────────── */}
      <main className="gx-main">
        {error && <div className="gx-error">Oops! {error}</div>}

        {/* ── Student picker ── */}
        {phase === "pick" && (
          <div className="gx-card gx-card-pick">
            <h2 className="gx-card-title">Select Your Player</h2>
            <p className="gx-hint">Choose an existing student profile or create a new one to begin.</p>
            <div className="gx-form-row">
              <select
                className="gx-select"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">Choose Student Profile…</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Lvl {s.difficulty_level})
                  </option>
                ))}
              </select>
            </div>
            <div className="gx-form-row">
              <input
                className="gx-input"
                placeholder="Enter new student name…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddStudent()}
              />
              <button className="gx-btn gx-btn-secondary" onClick={handleAddStudent} disabled={busy || !newName.trim()}>
                Add New
              </button>
            </div>
            <button
              className="gx-btn gx-btn-start"
              onClick={handleStart}
              disabled={busy || !selectedId}
            >
              {busy ? "Loading Studio…" : "Start Practice Session"}
            </button>
          </div>
        )}

        {/* ── Exercise card ── */}
        {phase === "playing" && exercise && (
          <div className="gx-card gx-card-exercise">
            <div className="gx-type-badge">{exercise.type.replace("_", " ").toUpperCase()}</div>
            <p className="gx-prompt">{exercise.content}</p>

            {isTyping && (
              <div className="gx-typing-zone">
                <input
                  className="gx-input gx-input-answer"
                  placeholder="Type exactly what you see above..."
                  value={typingAns}
                  onChange={e => setTypingAns(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmitTyping()}
                  autoFocus
                />
                <button
                  className="gx-btn gx-btn-submit"
                  onClick={handleSubmitTyping}
                  disabled={busy || !typingAns.trim()}
                >
                  {busy ? "Validating..." : "Submit Answer"}
                </button>
              </div>
            )}

            {isTracing && (
              <TracingCanvas
                expected={exercise.expected}
                onComplete={handleTracingDone}
                disabled={busy}
              />
            )}

            {isHandwriting && (
              <div className="gx-handwriting-zone">
                <label className="gx-file-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={e => setHandwritingFile(e.target.files?.[0] ?? null)}
                  />
                  <span>📸</span> Upload Handwriting Photo
                </label>
                {previewUrl && (
                  <div className="gx-preview-wrap">
                    <img src={previewUrl} alt="Preview" className="gx-preview-img" />
                  </div>
                )}
                <button
                  className="gx-btn gx-btn-submit"
                  onClick={handleSubmitHandwriting}
                  disabled={busy || !handwritingFile}
                >
                  {busy ? "Analyzing Handwriting..." : "Finish Upload"}
                </button>
              </div>
            )}

            <button className="gx-btn gx-btn-ghost" onClick={() => setPhase("pick")}>
              Exit Practice
            </button>
          </div>
        )}

        {/* ── Result card ── */}
        {phase === "result" && (
          <div className="gx-card gx-card-result">
            <div className="gx-stars">
              {[1, 2, 3].map(n => (
                <span key={n} className={`gx-star ${n <= stars ? "gx-star-lit" : "gx-star-dim"}`}>
                  ★
                </span>
              ))}
            </div>
            <div
              className="gx-score-ring"
              style={{ "--score": lastScore } as React.CSSProperties}
            >
              <span className="gx-score-number">{Math.round(lastScore * 100)}</span>
              <span className="gx-score-label">SCORE</span>
            </div>
            <p className="gx-feedback">{lastFeedback}</p>
            <div className="gx-xp-award">
              Earned +{xpForScore(lastScore) + (lastScore >= 0.7 ? Math.max(0, streak - 1) * 10 : 0)} XP
              {streak >= 3 && <span className="gx-streak-bonus">🔥 STREAK BONUS!</span>}
            </div>
            <button className="gx-btn gx-btn-next" onClick={fetchExercise} disabled={busy}>
              {busy ? "Fetching Next..." : "Next Challenge →"}
            </button>
            <button className="gx-btn gx-btn-ghost" onClick={() => setPhase("pick")}>
              Return to Selection
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
