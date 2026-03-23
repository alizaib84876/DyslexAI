import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function SpellingRuleSortExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Sort each word into the right spelling rule.";
  const bins: string[] = Array.isArray(exercise.content?.bins) ? exercise.content.bins : [];
  const words: string[] = Array.isArray(exercise.content?.words) ? exercise.content.words : [];
  const answer: Record<string, string> = exercise.content?.answer ?? {};

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});

  const done = useMemo(() => words.length > 0 && words.every((w) => placed[w]), [words, placed]);

  function place(bin: string) {
    if (!selectedWord) return;
    setPlaced((p) => ({ ...p, [selectedWord]: bin }));
    setSelectedWord(null);
  }

  function submit() {
    if (!words.length) return onSubmit(0);
    let correct = 0;
    for (const w of words) if ((placed[w] ?? "") === (answer[w] ?? "")) correct += 1;
    onSubmit(correct / words.length);
  }

  return (
    <ExerciseShell title="Spelling rule sort" prompt={prompt}>
      <div className="gm-row" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 8 }}>Words</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {words.map((w) => (
              <button
                key={w}
                type="button"
                className={`btn ${selectedWord === w ? "primary" : ""}`}
                style={{ minHeight: 48, padding: "12px 16px", fontSize: 18, fontWeight: 900 }}
                onClick={() => setSelectedWord(w)}
              >
                {w}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.75 }}>
            {selectedWord ? `Selected: ${selectedWord}. Tap a bin to place it.` : "Tap a word, then tap a bin."}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 8 }}>Bins</div>
          <div style={{ display: "grid", gap: 10 }}>
            {bins.map((b) => (
              <button
                key={b}
                type="button"
                className="btn"
                style={{ minHeight: 56, padding: "14px 16px", fontSize: 18 }}
                onClick={() => place(b)}
              >
                {b}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>
            Placed: <b>{Object.keys(placed).length}</b> / {words.length}
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

