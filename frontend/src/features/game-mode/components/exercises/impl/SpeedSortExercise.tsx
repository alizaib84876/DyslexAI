import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function SpeedSortExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Sort words into the right group.";
  const groups: Record<string, string[]> = exercise.content?.groups ?? {};
  const answer: Record<string, string[]> = exercise.content?.answer ?? groups;

  const keys = Object.keys(groups);
  const words = useMemo(() => {
    const flat: string[] = [];
    for (const k of keys) for (const w of groups[k] ?? []) flat.push(w);
    return flat;
  }, [keys, groups]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});

  const done = useMemo(() => words.length > 0 && words.every((w) => placed[w]), [words, placed]);

  function place(k: string) {
    if (!selectedWord) return;
    setPlaced((p) => ({ ...p, [selectedWord]: k }));
    setSelectedWord(null);
  }

  function submit() {
    if (!words.length) return onSubmit(0);
    const truth: Record<string, string> = {};
    for (const k of Object.keys(answer)) {
      for (const w of answer[k] ?? []) truth[w] = k;
    }
    let correct = 0;
    for (const w of words) if ((placed[w] ?? "") === (truth[w] ?? "")) correct += 1;
    onSubmit(correct / words.length);
  }

  return (
    <ExerciseShell title="Speed sort" prompt={prompt}>
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
            {selectedWord ? `Selected: ${selectedWord}. Tap a group.` : "Tap a word, then tap a group."}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 8 }}>Groups</div>
          <div style={{ display: "grid", gap: 10 }}>
            {keys.map((k) => (
              <button
                key={k}
                type="button"
                className="btn"
                style={{ minHeight: 56, padding: "14px 16px", fontSize: 18 }}
                onClick={() => place(k)}
              >
                {k}
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

