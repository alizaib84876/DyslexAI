import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

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

export function LetterSoundMatchExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Match each letter or blend to its sound.";
  const lettersMulti: string[] = Array.isArray(exercise.content?.letters) ? exercise.content.letters.map(String) : [];
  const soundsMulti: string[] = Array.isArray(exercise.content?.sounds) ? exercise.content.sounds.map(String) : [];

  const letter: string = String(exercise.content?.letter ?? "");
  const optionsLegacy: string[] = Array.isArray(exercise.content?.options) ? exercise.content.options : [];
  const expectedLegacy: string = String(exercise.content?.answer ?? "");

  const [picked, setPicked] = useState<string | null>(null);

  const useMulti = lettersMulti.length > 0 && soundsMulti.length > 0 && lettersMulti.length === soundsMulti.length;

  const [step, setStep] = useState(0);
  const [correctSteps, setCorrectSteps] = useState(0);

  const seed = useMemo(() => exercise.id * 17 + step, [exercise.id, step]);

  const shuffledSounds = useMemo(() => shuffle(soundsMulti, seed), [soundsMulti, seed]);

  const currentLetter = useMemo(() => (useMulti ? lettersMulti[step] : letter), [useMulti, lettersMulti, step, letter]);
  const expectedSound = useMemo(() => (useMulti ? soundsMulti[step] : expectedLegacy), [useMulti, soundsMulti, step, expectedLegacy]);

  function submitLegacy() {
    onSubmit((picked ?? "") === expectedLegacy ? 1 : 0);
  }

  function pickSound(sound: string) {
    if (!useMulti) {
      setPicked(sound);
      return;
    }
    const ok = sound === expectedSound;
    const nextCorrect = correctSteps + (ok ? 1 : 0);
    const isLast = step + 1 >= lettersMulti.length;
    if (isLast) {
      onSubmit(nextCorrect / lettersMulti.length);
      return;
    }
    setCorrectSteps(nextCorrect);
    setStep(step + 1);
  }

  if (useMulti) {
    return (
      <ExerciseShell title="Letter–sound match" prompt={prompt}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          Match {step + 1} of {lettersMulti.length}
        </div>
        <div className="card" style={{ marginTop: 10, marginBottom: 0 }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Letter / blend</div>
          <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{currentLetter}</div>
        </div>
        <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {shuffledSounds.map((o) => (
            <button
              key={`${step}-${o}`}
              type="button"
              className="btn"
              style={{ minHeight: 56, padding: "14px 16px", fontSize: 20, fontWeight: 800 }}
              onClick={() => pickSound(o)}
            >
              {o}
            </button>
          ))}
        </div>
      </ExerciseShell>
    );
  }

  return (
    <ExerciseShell title="Letter–sound match" prompt={prompt}>
      <div className="card" style={{ margin: 0 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Letter</div>
        <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{letter}</div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {optionsLegacy.map((o) => (
          <button
            key={o}
            type="button"
            className={`btn ${picked === o ? "primary" : ""}`}
            style={{ minHeight: 56, padding: "14px 16px", fontSize: 20, fontWeight: 800 }}
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
        onClick={submitLegacy}
        disabled={!picked}
      >
        Submit
      </button>
    </ExerciseShell>
  );
}
