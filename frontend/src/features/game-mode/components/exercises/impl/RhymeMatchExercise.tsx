import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

type Pair = [string, string];

function rhymes(a: string, b: string) {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  const end1 = s1.slice(-2);
  const end2 = s2.slice(-2);
  return end1 === end2;
}

export function RhymeMatchExercise({ exercise, onSubmit }: ExerciseProps) {
  const pairs: Pair[] = Array.isArray(exercise.content?.pairs) ? exercise.content.pairs : [];
  const prompt = exercise.content?.prompt ?? "Match the words that rhyme.";
  const [picked, setPicked] = useState<Record<number, boolean>>({});

  const done = useMemo(() => pairs.length > 0 && pairs.every((_p, i) => typeof picked[i] === "boolean"), [pairs, picked]);

  function scoreAndSubmit() {
    if (!pairs.length) return onSubmit(0);
    let correct = 0;
    pairs.forEach(([a, b], i) => {
      const truth = rhymes(a, b);
      if (picked[i] === truth) correct += 1;
    });
    onSubmit(correct / pairs.length);
  }

  return (
    <ExerciseShell title="Rhyme match" prompt={prompt}>
      <div style={{ display: "grid", gap: 12 }}>
        {pairs.map(([a, b], i) => (
          <div key={i} className="gm-row">
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {a} — {b}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${picked[i] === true ? "primary" : ""}`}
                style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }}
                onClick={() => setPicked((p) => ({ ...p, [i]: true }))}
              >
                They rhyme
              </button>
              <button
                type="button"
                className={`btn ${picked[i] === false ? "primary" : ""}`}
                style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }}
                onClick={() => setPicked((p) => ({ ...p, [i]: false }))}
              >
                They do not rhyme
              </button>
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

