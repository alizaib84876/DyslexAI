import React, { useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function OddOneOutExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Which option is the odd one out?";
  const options: string[] = Array.isArray(exercise.content?.options) ? exercise.content.options : [];
  const expected: string = String(exercise.content?.answer ?? "");
  const [picked, setPicked] = useState<string | null>(null);

  function submit() {
    onSubmit((picked ?? "").trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0);
  }

  return (
    <ExerciseShell title="Odd one out" prompt={prompt}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`btn ${picked === o ? "primary" : ""}`}
            style={{ minHeight: 56, padding: "14px 16px", fontSize: 20, fontWeight: 900 }}
            onClick={() => setPicked(o)}
          >
            {o}
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

