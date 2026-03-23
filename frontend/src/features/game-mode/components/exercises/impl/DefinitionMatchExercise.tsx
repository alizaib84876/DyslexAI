import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

type Pair = [string, string];

export function DefinitionMatchExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Match each word to its meaning.";
  const pairs: Pair[] = Array.isArray(exercise.content?.pairs) ? exercise.content.pairs : [];
  const answerMap: Record<string, string> = exercise.content?.answer ?? Object.fromEntries(pairs);

  const words = useMemo(() => pairs.map((p) => p[0]), [pairs]);
  const defs = useMemo(() => pairs.map((p) => p[1]), [pairs]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});

  const done = useMemo(() => words.length > 0 && words.every((w) => matched[w]), [words, matched]);

  function pickDef(d: string) {
    if (!selectedWord) return;
    setMatched((m) => ({ ...m, [selectedWord]: d }));
    setSelectedWord(null);
  }

  function submit() {
    if (!words.length) return onSubmit(0);
    let correct = 0;
    for (const w of words) if ((matched[w] ?? "") === (answerMap[w] ?? "")) correct += 1;
    onSubmit(correct / words.length);
  }

  return (
    <ExerciseShell title="Definition match" prompt={prompt}>
      <div className="gm-row" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 8 }}>Words</div>
          <div style={{ display: "grid", gap: 10 }}>
            {words.map((w) => (
              <button
                key={w}
                type="button"
                className={`btn ${selectedWord === w ? "primary" : ""}`}
                style={{ minHeight: 56, padding: "14px 16px", fontSize: 20, fontWeight: 900, textAlign: "left" }}
                onClick={() => setSelectedWord(w)}
              >
                {w}
                {matched[w] ? <span style={{ display: "block", fontSize: 14, opacity: 0.75, marginTop: 6 }}>Matched</span> : null}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.75 }}>
            {selectedWord ? `Selected: ${selectedWord}. Tap a definition.` : "Tap a word, then tap a definition."}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 8 }}>Definitions</div>
          <div style={{ display: "grid", gap: 10 }}>
            {defs.map((d) => (
              <button
                key={d}
                type="button"
                className="btn"
                style={{ minHeight: 64, padding: "14px 16px", fontSize: 18, textAlign: "left" }}
                onClick={() => pickDef(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
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

