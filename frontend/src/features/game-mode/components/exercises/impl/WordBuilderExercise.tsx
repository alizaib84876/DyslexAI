import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function WordBuilderExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Build the word by dragging the letters.";
  const tiles: string[] = Array.isArray(exercise.content?.tiles) ? exercise.content.tiles : [];
  const expected: string = String(exercise.content?.answer ?? "");
  const expectedLen = expected.trim().length;

  const [built, setBuilt] = useState<string>("");
  const remaining = useMemo(() => {
    const used = built.split("");
    const left: string[] = [];
    const copy = [...tiles];
    for (const u of used) {
      const idx = copy.indexOf(u);
      if (idx >= 0) copy.splice(idx, 1);
    }
    for (const t of copy) left.push(t);
    return left;
  }, [tiles, built]);

  function addLetter(ch: string) {
    setBuilt((b) => b + ch);
  }

  function backspace() {
    setBuilt((b) => b.slice(0, -1));
  }

  function reset() {
    setBuilt("");
  }

  function multisetOverlap(a: string, b: string) {
    const aFreq: Record<string, number> = {};
    const bFreq: Record<string, number> = {};
    const aChars = a.toLowerCase().split("");
    const bChars = b.toLowerCase().split("");
    for (const ch of aChars) aFreq[ch] = (aFreq[ch] ?? 0) + 1;
    for (const ch of bChars) bFreq[ch] = (bFreq[ch] ?? 0) + 1;
    let overlap = 0;
    for (const k of Object.keys(aFreq)) {
      overlap += Math.min(aFreq[k] ?? 0, bFreq[k] ?? 0);
    }
    return overlap;
  }

  function submit() {
    const b = built.trim().toLowerCase();
    const e = expected.trim().toLowerCase();
    if (!b || !e) return onSubmit(0);
    if (b === e) return onSubmit(1);
    if (b.length !== expectedLen) return onSubmit(0);

    // Edge-case friendly scoring:
    // If the learner built a different *real* word using the available tiles
    // (e.g. expected "pin" but user built "tip"), we don't want to deduct just
    // because it's not the exact expected string.
    // We treat words as acceptable when they share nearly all letters.
    const overlap = multisetOverlap(e, b);
    const acceptable = overlap >= Math.max(1, expectedLen - 1);
    onSubmit(acceptable ? 1 : 0);
  }

  return (
    <ExerciseShell title="Word builder" prompt={prompt}>
      <div className="card" style={{ margin: 0 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Built</div>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 2, minHeight: 48 }}>{built || "—"}</div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {remaining.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            className="btn"
            style={{ minHeight: 56, minWidth: 56, fontSize: 22, fontWeight: 900 }}
            onClick={() => {
              if (expectedLen && built.length >= expectedLen) return;
              addLetter(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn" style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }} onClick={backspace}>
          Backspace
        </button>
        <button type="button" className="btn" style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }} onClick={reset}>
          Reset
        </button>
        <button
          type="button"
          className="btn primary"
          style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }}
          onClick={submit}
          disabled={!built.trim()}
        >
          Submit
        </button>
      </div>
    </ExerciseShell>
  );
}

