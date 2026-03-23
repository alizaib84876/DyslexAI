import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";
import { canSpeak, speak } from "../speech";

export function SoundBlendExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Listen to the sounds. Pick the word.";
  const phonemes: string[] = Array.isArray(exercise.content?.phonemes) ? exercise.content.phonemes : [];
  const options: string[] = Array.isArray(exercise.content?.options) ? exercise.content.options : [];
  const expected: string = String(exercise.content?.answer ?? "");
  const [picked, setPicked] = useState<string | null>(null);

  const speakText = useMemo(() => (phonemes.length ? phonemes.join(" ") : ""), [phonemes]);

  function submit() {
    const s = (picked ?? "").trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0;
    onSubmit(s);
  }

  return (
    <ExerciseShell title="Sound blend" prompt={prompt}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }}
          onClick={() => speak(speakText)}
          disabled={!canSpeak() || !speakText}
        >
          Play sounds
        </button>
        <div style={{ alignSelf: "center", fontSize: 14, opacity: 0.75 }}>
          {canSpeak() ? "" : "Speech not available in this browser."}
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {options.map((o) => (
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
        onClick={submit}
        disabled={!picked}
      >
        Submit
      </button>
    </ExerciseShell>
  );
}

