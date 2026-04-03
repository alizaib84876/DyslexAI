import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";
import { canSpeak, speak } from "../speech";

export function DecodeWordExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Choose the correct word you hear.";
  const word: string = String(exercise.content?.word ?? "");
  const options: string[] = Array.isArray(exercise.content?.options) ? exercise.content.options : [];
  const expected: string = String(exercise.content?.answer ?? word);
  const [picked, setPicked] = useState<string | null>(null);

  const speakText = useMemo(() => (word ? word : expected), [word, expected]);

  function submit() {
    onSubmit((picked ?? "").trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0);
  }

  return (
    <ExerciseShell title="Decode word" prompt={prompt}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }}
          onClick={() => speak(speakText)}
          disabled={!canSpeak() || !speakText}
        >
          Play word
        </button>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
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

