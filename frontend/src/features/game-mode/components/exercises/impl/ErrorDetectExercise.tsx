import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function ErrorDetectExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Tap the misspelled word.";
  const sentence: string = String(exercise.content?.sentence ?? "");
  const expected: string = String(exercise.content?.answer ?? "");
  const words = useMemo(() => sentence.split(/\s+/).filter(Boolean), [sentence]);
  const [picked, setPicked] = useState<string | null>(null);

  function submit() {
    onSubmit((picked ?? "").trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0);
  }

  return (
    <ExerciseShell title="Error detect" prompt={prompt}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {words.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            className={`btn ${picked === w ? "primary" : ""}`}
            style={{ minHeight: 48, padding: "12px 16px", fontSize: 18, fontWeight: 900 }}
            onClick={() => setPicked(w)}
          >
            {w}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn primary"
        style={{ marginTop: 16, minHeight: 48, padding: "12px 16px", fontSize: 18 }}
        onClick={submit}
        disabled={!picked}
      >
        Submit
      </button>
    </ExerciseShell>
  );
}

