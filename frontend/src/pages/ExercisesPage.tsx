import { useEffect, useState } from "react";

import { HandwritingSessionResult } from "../components/HandwritingSessionResult";
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
import type { Exercise, ExerciseStudent, HandwritingSubmitResponse } from "../types";

export function ExercisesPage() {
  const [students, setStudents] = useState<ExerciseStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<HandwritingSubmitResponse | { score: number; feedback: string } | null>(null);
  const [typingResponse, setTypingResponse] = useState("");
  const [handwritingFile, setHandwritingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState("");

  useEffect(() => {
    fetchExerciseStudents()
      .then(setStudents)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (handwritingFile) {
      const url = URL.createObjectURL(handwritingFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [handwritingFile]);

  async function handleCreateStudent() {
    if (!newStudentName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const s = await createExerciseStudent({ name: newStudentName.trim() });
      setStudents((prev) => [...prev, s]);
      setSelectedStudentId(String(s.id));
      setNewStudentName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setBusy(false);
    }
  }

  async function handleGetNextExercise(type?: "handwriting" | "word_typing" | "sentence_typing" | "tracing") {
    if (!selectedStudentId) {
      setError("Select a student first");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setExercise(null);
    setSessionId(null);
    setTypingResponse("");
    setHandwritingFile(null);
    try {
      const ex = await getNextExercise(selectedStudentId, type);
      setExercise(ex);
      const sess = await createSession({
        student_id: selectedStudentId,
        exercise_id: ex.id,
        is_handwriting: ex.type === "handwriting"
      });
      setSessionId(sess.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get exercise");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitTyping() {
    if (!sessionId || !typingResponse.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitTyping(sessionId, { student_response: typingResponse.trim() });
      setResult({ score: res.score, feedback: res.feedback });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
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
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  const isHandwriting = exercise?.type === "handwriting";
  const isTyping = exercise?.type === "word_typing" || exercise?.type === "sentence_typing";
  const isTracing = exercise?.type === "tracing";

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="hero-badge">Adaptive Exercises</span>
          <h1>Practice Exercises</h1>
          <p>
            Get adaptive exercises based on your progress. Supports typing, handwriting, and tracing.
          </p>
        </div>
      </section>

      <div className="card">
        <h3>Student</h3>
        <div className="form-row">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={busy}
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (level {s.difficulty_level})
              </option>
            ))}
          </select>
          <div className="form-row">
            <input
              type="text"
              placeholder="New student name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateStudent()}
            />
            <button onClick={handleCreateStudent} disabled={busy || !newStudentName.trim()}>
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Get Exercise</h3>
        <div className="form-row">
          <button
            onClick={() => handleGetNextExercise()}
            disabled={busy || !selectedStudentId}
          >
            Next (any type)
          </button>
          <button
            onClick={() => handleGetNextExercise("handwriting")}
            disabled={busy || !selectedStudentId}
          >
            Handwriting
          </button>
          <button
            onClick={() => handleGetNextExercise("word_typing")}
            disabled={busy || !selectedStudentId}
          >
            Word typing
          </button>
          <button
            onClick={() => handleGetNextExercise("sentence_typing")}
            disabled={busy || !selectedStudentId}
          >
            Sentence typing
          </button>
          <button
            onClick={() => handleGetNextExercise("tracing")}
            disabled={busy || !selectedStudentId}
          >
            Tracing
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {exercise && (
        <div className="card">
          <h3>Exercise ({exercise.type})</h3>
          <p className="exercise-content">{exercise.content}</p>
          <p className="exercise-expected">
            <strong>Expected:</strong> {exercise.expected}
          </p>

          {isTyping && (
            <div className="form-row">
              <input
                type="text"
                placeholder="Type your answer…"
                value={typingResponse}
                onChange={(e) => setTypingResponse(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitTyping()}
              />
              <button onClick={handleSubmitTyping} disabled={busy || !typingResponse.trim()}>
                Submit
              </button>
            </div>
          )}

          {isHandwriting && (
            <div>
              <label className="file-label">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setHandwritingFile(e.target.files?.[0] ?? null)}
                />
                Choose photo
              </label>
              {previewUrl && (
                <div className="preview-wrap">
                  <img src={previewUrl} alt="Preview" className="preview-img" />
                </div>
              )}
              <button
                onClick={handleSubmitHandwriting}
                disabled={busy || !handwritingFile}
              >
                Submit handwriting
              </button>
            </div>
          )}

          {isTracing && exercise && (
            <TracingCanvas
              expected={exercise.expected}
              onComplete={async (traceScore, durationSeconds, strokeErrors) => {
                if (!sessionId) return;
                setBusy(true);
                setError(null);
                try {
                  const res = await submitTracing(sessionId, {
                    trace_score: traceScore,
                    duration_seconds: durationSeconds,
                    stroke_errors: strokeErrors
                  });
                  setResult(res);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Submit failed");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            />
          )}
        </div>
      )}

      {result && (
        <>
          {"ocr_text" in result ? (
            <HandwritingSessionResult
              recognizedText={result.ocr_text}
              correctedText={result.corrected_text}
              score={result.score}
              feedback={result.feedback}
            />
          ) : (
            <div className="card">
              <h3>Result</h3>
              <p><strong>Score:</strong> {((result as { score: number }).score * 100).toFixed(0)}%</p>
              <p><strong>Feedback:</strong> {(result as { feedback: string }).feedback}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
