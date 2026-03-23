import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function WordFamilySortExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Select all words in the same family.";
  const words: string[] = Array.isArray(exercise.content?.words) ? exercise.content.words : [];
  const expected: string[] = Array.isArray(exercise.content?.answer) ? exercise.content.answer : [];

  const [picked, setPicked] = useState<Record<string, boolean>>({});

  const done = useMemo(() => words.length > 0 && Object.keys(picked).length > 0, [words, picked]);

  function toggle(w: string) {
    setPicked((p) => ({ ...p, [w]: !p[w] }));
  }

  function submit() {
    const expectedSet = new Set(expected);
    let correct = 0;
    for (const w of words) {
      const truth = expectedSet.has(w);
      if (Boolean(picked[w]) === truth) correct += 1;
    }
    onSubmit(words.length ? correct / words.length : 0);
  }

  return (
    <ExerciseShell title="Word family" prompt={prompt}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {words.map((w) => (
          <button
            key={w}
            type="button"
            className={`btn ${picked[w] ? "primary" : ""}`}
            style={{ minHeight: 56, padding: "14px 16px", fontSize: 20, fontWeight: 900 }}
            onClick={() => toggle(w)}
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
        disabled={!done}
      >
        Submit
      </button>
    </ExerciseShell>
  );
}

