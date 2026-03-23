import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function SoundIdentifyExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Identify the sound.";
  const word: string = exercise.content?.word ?? "";
  const position: "first" | "last" = exercise.content?.position === "last" ? "last" : "first";
  const expected: string = String(exercise.content?.answer ?? "");
  const options: string[] = Array.isArray(exercise.content?.options) ? exercise.content.options.map(String) : [];

  const [val, setVal] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  const hint = useMemo(() => {
    if (!word) return "";
    return position === "first" ? `First sound in “${word}”` : `Last sound in “${word}”`;
  }, [word, position]);

  const useOptions = options.length > 0;

  function submitTyped() {
    const s = val.trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0;
    onSubmit(s);
  }

  function submitChoice() {
    onSubmit((picked ?? "").trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0);
  }

  if (useOptions) {
    return (
      <ExerciseShell title="Sound identify" prompt={prompt}>
        <div style={{ fontSize: 18, opacity: 0.85 }}>{hint}</div>
        <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              className={`btn ${picked === o ? "primary" : ""}`}
              style={{ minHeight: 56, padding: "14px 16px", fontSize: 22, fontWeight: 900 }}
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
          onClick={submitChoice}
          disabled={picked === null}
        >
          Submit
        </button>
      </ExerciseShell>
    );
  }

  return (
    <ExerciseShell title="Sound identify" prompt={prompt}>
      <div style={{ fontSize: 18, opacity: 0.85 }}>{hint}</div>
      <div style={{ marginTop: 10 }}>
        <label style={{ display: "block", fontSize: 16, marginBottom: 6 }}>Your answer</label>
        <input
          className="input"
          style={{ minHeight: 48, fontSize: 18, width: "100%" }}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Type one letter…"
        />
      </div>
      <button
        type="button"
        className="btn primary"
        style={{ marginTop: 16, minHeight: 48, padding: "12px 16px", fontSize: 18 }}
        onClick={submitTyped}
        disabled={!val.trim()}
      >
        Submit
      </button>
    </ExerciseShell>
  );
}
