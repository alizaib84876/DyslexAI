import React, { useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";
import { canSpeak, speak } from "../speech";

export function SpellItExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Listen and type the word.";
  const ttsText: string = String(exercise.content?.tts_text ?? exercise.content?.answer ?? "");
  const expected: string = String(exercise.content?.answer ?? "");
  const hint: string = String(exercise.content?.hint ?? "");
  const [val, setVal] = useState("");

  function submit() {
    onSubmit(val.trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0);
  }

  return (
    <ExerciseShell title="Spell it" prompt={prompt}>
      {hint ? (
        <div className="card" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
          <strong>Hint:</strong> {hint}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: hint ? 12 : 0 }}>
        <button
          type="button"
          className="btn"
          style={{ minHeight: 48, padding: "12px 16px", fontSize: 18 }}
          onClick={() => speak(ttsText)}
          disabled={!canSpeak() || !ttsText}
        >
          Hear word
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", fontSize: 16, marginBottom: 6 }}>Type the word</label>
        <input
          className="input"
          style={{ minHeight: 48, fontSize: 18, width: "100%" }}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Type here…"
        />
      </div>
      <button
        type="button"
        className="btn primary"
        style={{ marginTop: 16, minHeight: 48, padding: "12px 16px", fontSize: 18 }}
        onClick={submit}
        disabled={!val.trim()}
      >
        Submit
      </button>
    </ExerciseShell>
  );
}

