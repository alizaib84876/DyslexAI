import React, { useMemo, useState } from "react";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseProps } from "../types";

export function MorphemeBuilderExercise({ exercise, onSubmit }: ExerciseProps) {
  const prompt = exercise.content?.prompt ?? "Pick the correct word.";
  const root: string = String(exercise.content?.root ?? "");
  const optionsMcq: string[] = Array.isArray(exercise.content?.options) ? exercise.content.options.map(String) : [];
  const expectedMcq: string = String(exercise.content?.answer ?? "");

  const prefixes: string[] = Array.isArray(exercise.content?.prefixes) ? exercise.content.prefixes : [];
  const suffixes: string[] = Array.isArray(exercise.content?.suffixes) ? exercise.content.suffixes : [];
  const expectedBuild: string = String(exercise.content?.answer ?? "");

  const [picked, setPicked] = useState<string | null>(null);
  const [prefix, setPrefix] = useState(prefixes[0] ?? "");
  const [suffix, setSuffix] = useState(suffixes[0] ?? "");

  const built = useMemo(() => `${prefix}${root}${suffix}`, [prefix, root, suffix]);

  const useMcq = optionsMcq.length > 0;

  function submitMcq() {
    onSubmit((picked ?? "").trim().toLowerCase() === expectedMcq.trim().toLowerCase() ? 1 : 0);
  }

  function submitBuild() {
    onSubmit(built.trim().toLowerCase() === expectedBuild.trim().toLowerCase() ? 1 : 0);
  }

  if (useMcq) {
    return (
      <ExerciseShell title="Word building" prompt={prompt}>
        {root ? (
          <div className="card" style={{ margin: 0 }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Root</div>
            <div style={{ fontSize: 32, fontWeight: 900 }}>{root}</div>
          </div>
        ) : null}
        <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {optionsMcq.map((o) => (
            <button
              key={o}
              type="button"
              className={`btn ${picked === o ? "primary" : ""}`}
              style={{ minHeight: 56, padding: "14px 16px", fontSize: 20, fontWeight: 800, textAlign: "left" }}
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
          onClick={submitMcq}
          disabled={!picked}
        >
          Submit
        </button>
      </ExerciseShell>
    );
  }

  return (
    <ExerciseShell title="Morpheme builder" prompt={prompt}>
      <div className="gm-row">
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 16, marginBottom: 6 }}>Prefix</label>
          <select
            className="input"
            style={{ minHeight: 48, fontSize: 18, width: "100%" }}
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          >
            {prefixes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 16, marginBottom: 6 }}>Root</label>
          <div className="card" style={{ margin: 0, minHeight: 48, display: "flex", alignItems: "center", fontSize: 22, fontWeight: 900 }}>
            {root}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 16, marginBottom: 6 }}>Suffix</label>
          <select
            className="input"
            style={{ minHeight: 48, fontSize: 18, width: "100%" }}
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
          >
            {suffixes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Built word</div>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{built}</div>
      </div>

      <button
        type="button"
        className="btn primary"
        style={{ marginTop: 16, minHeight: 48, padding: "12px 16px", fontSize: 18 }}
        onClick={submitBuild}
        disabled={!root}
      >
        Submit
      </button>
    </ExerciseShell>
  );
}
