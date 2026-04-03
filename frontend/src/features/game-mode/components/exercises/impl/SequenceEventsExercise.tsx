import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function SequenceEventsExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Put the events in the correct order.";
  const tiles: string[] = Array.isArray(exercise.content?.tiles) ? exercise.content.tiles : [];
  const expected: string[] = Array.isArray(exercise.content?.answer) ? exercise.content.answer : [];

  const [pickedIdx, setPickedIdx] = useState<number[]>([]);
  const built = useMemo(() => pickedIdx.map((i) => tiles[i]), [pickedIdx, tiles]);
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
    const ok = built.length === expected.length && built.every((t, i) => t === expected[i]);
    onSubmit(ok ? 1 : 0);
  }

  return (
    <ExerciseShell title="Sequence events" prompt={prompt}>
      <div className="card" style={{ margin: 0 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Your order</div>
        <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
          {built.length ? (
            built.map((t, i) => (
              <div key={i} className="card" style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>
                <b>{i + 1}.</b> {t}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 18, opacity: 0.75 }}>Tap the tiles below in order.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {remaining.map((i) => (
          <button
            key={i}
            type="button"
            className="btn"
            style={{ minHeight: 64, padding: "14px 16px", fontSize: 18, textAlign: "left" }}
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

