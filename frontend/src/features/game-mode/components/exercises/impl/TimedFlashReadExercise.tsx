import React, { useEffect, useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";
import { canSpeak, speak } from "../speech";

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TimedFlashReadExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "A word will flash. Tap the word you saw.";
  const words: string[] = Array.isArray(exercise.content?.words) ? exercise.content.words.map(String) : [];
  const meanings: Record<string, string> = exercise.content?.meanings ?? {};
  const answer: Record<string, string> = exercise.content?.answer ?? {};

  const hasMeanings = Object.keys(meanings).length > 0 || Object.keys(answer).length > 0;

  const targetWord = useMemo(() => words[0] ?? "", [words]);

  const correctDef = useMemo(() => answer[targetWord] ?? meanings[targetWord] ?? "", [answer, meanings, targetWord]);

  const [stage, setStage] = useState<"flash" | "choose">("flash");
  const [picked, setPicked] = useState<string | null>(null);

  const seed = exercise.id * 31;

  const optionsMeanings = useMemo(() => {
    const defs = words.map((w) => meanings[w]).filter(Boolean);
    const base = defs.length ? defs : Object.values(meanings);
    const unique = Array.from(new Set(base));
    if (!correctDef) return unique.slice(0, 4);
    const withCorrect = unique.includes(correctDef) ? unique : [correctDef, ...unique];
    return shuffle(withCorrect, seed).slice(0, 4);
  }, [words, meanings, correctDef, seed]);

  const optionsWords = useMemo(() => {
    if (!words.length) return [];
    const pool = Array.from(new Set(words));
    const tw = targetWord || pool[0];
    const rest = pool.filter((w) => w !== tw);
    const pick = shuffle(rest, seed).slice(0, Math.min(3, rest.length));
    const opts = shuffle([tw, ...pick], seed + 1).slice(0, 4);
    return opts;
  }, [words, targetWord, seed]);

  useEffect(() => {
    setStage("flash");
    setPicked(null);
    const ms = hasMeanings ? 900 : 900;
    const t = window.setTimeout(() => setStage("choose"), ms);
    return () => window.clearTimeout(t);
  }, [targetWord, hasMeanings]);

  function submit() {
    if (hasMeanings) {
      onSubmit((picked ?? "") === correctDef ? 1 : 0);
    } else {
      onSubmit((picked ?? "").toLowerCase() === (targetWord || "").toLowerCase() ? 1 : 0);
    }
  }

  return (
    <ExerciseShell title="Timed flash read" prompt={hasMeanings ? exercise.content?.prompt ?? "A word will flash. Tap its meaning." : prompt}>
      {stage === "flash" ? (
        <div className="card" style={{ margin: 0, textAlign: "center" }}>
          <div style={{ fontSize: 44, fontWeight: 900, padding: "18px 0" }}>{targetWord}</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }}
              onClick={() => speak(targetWord)}
              disabled={!canSpeak() || !targetWord}
            >
              Hear word
            </button>
          </div>
          <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {(hasMeanings ? optionsMeanings : optionsWords).map((d) => (
              <button
                key={d}
                type="button"
                className={`btn ${picked === d ? "primary" : ""}`}
                style={{ minHeight: 64, padding: "14px 16px", fontSize: 18, textAlign: "left" }}
                onClick={() => setPicked(d)}
              >
                {d}
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
        </>
      )}
    </ExerciseShell>
  );
}
