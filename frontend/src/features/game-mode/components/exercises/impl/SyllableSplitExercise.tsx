import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function SyllableSplitExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Tap where the word should split into syllables.";
  const word: string = String(exercise.content?.word ?? "");
  const expected: number = Number(exercise.content?.answer ?? -1);
  const [picked, setPicked] = useState<number | null>(null);

  const slots = useMemo(() => {
    const letters = word.split("");
    const between = [];
    for (let i = 1; i < letters.length; i += 1) between.push(i);
    return { letters, between };
  }, [word]);

  function submit() {
    onSubmit(Number(picked) === Number(expected) ? 1 : 0);
  }

  return (
    <ExerciseShell title="Syllable split" prompt={prompt}>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>
        {slots.letters.map((ch, i) => (
          <span key={i}>
            {ch}
            {i < slots.letters.length - 1 ? (
              <button
                type="button"
                className={`gm-split ${picked === i + 1 ? "gm-split-active" : ""}`}
                aria-label={`Split after ${ch}`}
                onClick={() => setPicked(i + 1)}
              >
                |
              </button>
            ) : null}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="btn primary"
        style={{ marginTop: 16, minHeight: 48, padding: "12px 16px", fontSize: 18 }}
        onClick={submit}
        disabled={picked === null || !word}
      >
        Submit
      </button>
    </ExerciseShell>
  );
}

