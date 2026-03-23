import React from "react";

export function ExerciseShell({
  title,
  prompt,
  children
}: {
  title: string;
  prompt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="gm-exercise card" style={{ marginTop: 16 }}>
      <div style={{ fontSize: 16, opacity: 0.85 }}>{title}</div>
      {prompt ? (
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, lineHeight: 1.3 }}>{prompt}</div>
      ) : null}
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

