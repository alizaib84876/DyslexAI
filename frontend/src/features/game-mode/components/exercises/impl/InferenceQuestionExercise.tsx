import React, { useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function InferenceQuestionExercise({ exercise, onSubmit }: ExerciseProps) {
  const passage: string = String(exercise.content?.passage ?? "");
  const question: string = String(exercise.content?.question ?? "");
  const options: string[] = Array.isArray(exercise.content?.options) ? exercise.content.options : [];
  const expected: string = String(exercise.content?.answer ?? "");
  const [picked, setPicked] = useState<string | null>(null);

  function submit() {
    onSubmit((picked ?? "") === expected ? 1 : 0);
  }

  return (
    <ExerciseShell title="Inference" prompt={question || "Answer the question"}>
      <div className="card" style={{ margin: 0 }}>
        <div style={{ fontSize: 18, lineHeight: 1.6 }}>{passage}</div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`btn ${picked === o ? "primary" : ""}`}
            style={{ minHeight: 64, padding: "14px 16px", fontSize: 18, textAlign: "left" }}
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

