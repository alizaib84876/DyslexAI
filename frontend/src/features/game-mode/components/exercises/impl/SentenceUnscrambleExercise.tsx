import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function SentenceUnscrambleExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Put the words in order to make a sentence.";
  const tiles: string[] = Array.isArray(exercise.content?.tiles) ? exercise.content.tiles : [];
  const expected: string = String(exercise.content?.answer ?? "");

  const [pickedIdx, setPickedIdx] = useState<number[]>([]);

  const built = useMemo(() => pickedIdx.map((i) => tiles[i]).join(" "), [pickedIdx, tiles]);
  const remaining = useMemo(() => tiles.map((_t, i) => i).filter((i) => !pickedIdx.includes(i)), [tiles, pickedIdx]);

  function pick(i: number) {
    setPickedIdx((p) => [...p, i]);
  }

  function undo() {
    setPickedIdx((p) => p.slice(0, -1));
  }

  function reset() {
    setPickedIdx([]);
  }

  function submit() {
    onSubmit(built.trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0);
  }

  return (
    <ExerciseShell title="Sentence unscramble" prompt={prompt}>
      <div className="card" style={{ margin: 0 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Your sentence</div>
        <div style={{ fontSize: 24, fontWeight: 900, minHeight: 56 }}>{built || "—"}</div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {remaining.map((i) => (
          <button
            key={i}
            type="button"
            className="btn"
            style={{ minHeight: 48, padding: "12px 16px", fontSize: 18, fontWeight: 900 }}
            onClick={() => pick(i)}
          >
            {tiles[i]}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn" style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }} onClick={undo} disabled={!pickedIdx.length}>
          Undo
        </button>
        <button type="button" className="btn" style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }} onClick={reset} disabled={!pickedIdx.length}>
          Reset
        </button>
        <button type="button" className="btn primary" style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }} onClick={submit} disabled={!pickedIdx.length}>
          Submit
        </button>
      </div>
    </ExerciseShell>
  );
}

