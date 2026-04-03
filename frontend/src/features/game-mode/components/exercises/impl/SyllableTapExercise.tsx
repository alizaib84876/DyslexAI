import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function SyllableTapExercise({ exercise, onSubmit }: ExerciseProps) {
  const words: string[] = Array.isArray(exercise.content?.words) ? exercise.content.words : [];
  const answerMap: Record<string, number> = exercise.content?.answer ?? {};
  const prompt = exercise.content?.prompt ?? "Tap once for each syllable.";

  const maxCount = 5;
  const [picked, setPicked] = useState<Record<string, number>>({});

  const done = useMemo(() => words.length > 0 && words.every((w) => typeof picked[w] === "number"), [words, picked]);

  function scoreAndSubmit() {
    if (!words.length) return onSubmit(0);
    let correct = 0;
    for (const w of words) {
      if (Number(picked[w]) === Number(answerMap[w])) correct += 1;
    }
    onSubmit(correct / words.length);
  }

  return (
    <ExerciseShell title="Syllable tap" prompt={prompt}>
      <div style={{ display: "grid", gap: 12 }}>
        {words.map((w) => (
          <div key={w} className="gm-row">
            <div style={{ fontSize: 22, fontWeight: 800, minWidth: 140 }}>{w}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Array.from({ length: maxCount }).map((_, i) => {
                const n = i + 1;
                const active = picked[w] === n;
                return (
                  <button
                    key={n}
                    className={`btn ${active ? "primary" : ""}`}
                    style={{ minHeight: 48, minWidth: 48, fontSize: 18 }}
                    onClick={() => setPicked((p) => ({ ...p, [w]: n }))}
                    type="button"
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn primary"
        style={{ marginTop: 16, minHeight: 48, padding: "12px 16px", fontSize: 18 }}
        onClick={scoreAndSubmit}
        disabled={!done}
        type="button"
      >
        Submit
      </button>
    </ExerciseShell>
  );
}

