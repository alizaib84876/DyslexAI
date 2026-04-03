import type { ExerciseStats } from "../lib/api";
import { KidIcon } from "./KidIcon";

interface Props {
  stats: ExerciseStats;
}

export function StudentStatsCard({ stats }: Props) {
  const typeLabels: Record<string, string> = {
    word_typing: "Word Typing",
    sentence_typing: "Sentence Typing",
    handwriting: "Handwriting",
    tracing: "Tracing",
  };

  return (
    <div className="stats-grid">
      {/* Summary row */}
      <div className="stats-summary-row">
        <div className="stat-chip">
          <span className="stat-chip-value">Level {stats.current_difficulty}</span>
          <span className="stat-chip-label">Difficulty</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-value">{stats.total_sessions}</span>
          <span className="stat-chip-label">Sessions</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-value">{(stats.average_score * 100).toFixed(0)}%</span>
          <span className="stat-chip-label">Avg Score</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-value">{stats.words_mastered.length}</span>
          <span className="stat-chip-label">Words Mastered</span>
        </div>
        <div className="stat-chip stat-chip-warn">
          <span className="stat-chip-value">{stats.words_struggling.length}</span>
          <span className="stat-chip-label">Struggling</span>
        </div>
      </div>

      {/* Score trend */}
      {stats.score_trend.length > 0 && (
        <div className="card">
          <h4>Score Trend — last {stats.score_trend.length} sessions</h4>
          <ScoreTrendChart scores={stats.score_trend} />
        </div>
      )}

      <div className="stats-two-col">
        {/* Accuracy by type */}
        {Object.keys(stats.accuracy_by_type).length > 0 && (
          <div className="card">
            <h4>Accuracy by Exercise Type</h4>
            <div className="type-accuracy-list">
              {Object.entries(stats.accuracy_by_type).map(([type, acc]) => (
                <div key={type} className="type-accuracy-row">
                  <span className="type-label">{typeLabels[type] ?? type}</span>
                  <div className="type-bar-bg">
                    <div
                      className={`type-bar ${acc >= 0.7 ? "type-bar-good" : acc >= 0.4 ? "type-bar-mid" : "type-bar-low"}`}
                      style={{ width: `${Math.round(acc * 100)}%` }}
                    />
                  </div>
                  <span className="type-pct">{(acc * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top confusion pairs */}
        {stats.top_confusion_pairs.length > 0 && (
          <div className="card">
            <h4>Top Letter Confusions</h4>
            <div className="confusion-list">
              {stats.top_confusion_pairs.map((pair) => (
                <div key={pair.pattern} className="confusion-row">
                  <span className="confusion-pattern">{pair.pattern}</span>
                  <span className="confusion-count">{pair.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Struggling words */}
      {stats.words_struggling.length > 0 && (
        <div className="card">
          <h4>Words Needing Practice</h4>
          <div className="word-chip-row">
            {stats.words_struggling.map((w) => (
              <span key={w} className="word-chip word-chip-warn">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Mastered words */}
      {stats.words_mastered.length > 0 && (
        <div className="card">
          <h4>
            Mastered Words <KidIcon name="check" />
          </h4>
          <div className="word-chip-row">
            {stats.words_mastered.map((w) => (
              <span key={w} className="word-chip word-chip-good">{w}</span>
            ))}
          </div>
        </div>
      )}

      {stats.total_sessions === 0 && (
        <div className="card" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
          <p>
            No exercise sessions yet. Head to Exercises to get started! <KidIcon name="rocket" />
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Premium animated SVG line chart for score trend
───────────────────────────────────────────────────────────────────────────── */
function ScoreTrendChart({ scores }: { scores: number[] }) {
  const W = 560;
  const H = 190;
  const PAD = { top: 24, right: 56, bottom: 40, left: 44 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const n = scores.length;
  const xOf = (i: number) =>
    PAD.left + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yOf = (v: number) => PAD.top + chartH - v * chartH;

  // Build smooth cubic bezier path through points
  const pts = scores.map((s, i) => ({ x: xOf(i), y: yOf(s) }));

  function smoothPath(points: { x: number; y: number }[]): string {
    if (points.length === 1)
      return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const tension = (points[i + 1].x - points[i].x) / 3;
      const cp1x = points[i].x + tension;
      const cp1y = points[i].y;
      const cp2x = points[i + 1].x - tension;
      const cp2y = points[i + 1].y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return d;
  }

  const linePath = smoothPath(pts);
  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1].x} ${PAD.top + chartH}` +
    ` L ${pts[0].x} ${PAD.top + chartH} Z`;

  function dotColor(v: number): string {
    if (v >= 0.9) return "#10b981";
    if (v >= 0.75) return "#308ce8";
    if (v >= 0.5) return "#f59e0b";
    return "#ef4444";
  }

  const yTicks = [0, 25, 50, 75, 100];
  const thresholds = [
    { v: 0.75, label: "Pass", color: "#308ce8" },
    { v: 0.9, label: "Excellent", color: "#10b981" },
  ];

  // Unique IDs to avoid SVG id conflicts if the component mounts twice
  const uid = "sc" + Math.abs((scores[0] * 100) | 0);

  return (
    <div className="score-chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        aria-label="Score trend line chart"
      >
        <defs>
          <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#308ce8" stopOpacity="0.30" />
            <stop offset="85%" stopColor="#308ce8" stopOpacity="0.03" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`${uid}-clip`}>
            <rect
              x={PAD.left}
              y={PAD.top - 4}
              width={chartW}
              height={chartH + 8}
            />
          </clipPath>
        </defs>

        {/* ── Grid lines + Y labels ── */}
        {yTicks.map((t) => {
          const cy = yOf(t / 100);
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                y1={cy}
                x2={PAD.left + chartW}
                y2={cy}
                stroke="#e2e8f0"
                strokeWidth={t === 0 ? 1.5 : 1}
                strokeDasharray={t === 0 ? "none" : "4 3"}
              />
              <text
                x={PAD.left - 8}
                y={cy + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="inherit"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* ── Y-axis label ── */}
        <text
          x={12}
          y={PAD.top + chartH / 2}
          textAnchor="middle"
          fontSize="10"
          fill="#94a3b8"
          fontFamily="inherit"
          transform={`rotate(-90, 12, ${PAD.top + chartH / 2})`}
        >
          Score (%)
        </text>

        {/* ── Threshold reference lines ── */}
        {thresholds.map(({ v, label, color }) => {
          const cy = yOf(v);
          return (
            <g key={label}>
              <line
                x1={PAD.left}
                y1={cy}
                x2={PAD.left + chartW}
                y2={cy}
                stroke={color}
                strokeWidth="1.4"
                strokeDasharray="5 4"
                opacity="0.65"
              />
              <rect
                x={PAD.left + chartW + 4}
                y={cy - 9}
                width={44}
                height={16}
                rx="4"
                fill={color}
                opacity="0.12"
              />
              <text
                x={PAD.left + chartW + 8}
                y={cy + 4}
                fontSize="9"
                fontWeight="700"
                fill={color}
                fontFamily="inherit"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* ── Gradient area fill ── */}
        <path
          d={areaPath}
          fill={`url(#${uid}-grad)`}
          clipPath={`url(#${uid}-clip)`}
        />

        {/* ── Main line ── */}
        <path
          d={linePath}
          fill="none"
          stroke="#308ce8"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${uid}-glow)`}
          clipPath={`url(#${uid}-clip)`}
        />

        {/* ── X-axis session numbers ── */}
        {pts.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={PAD.top + chartH + 18}
            textAnchor="middle"
            fontSize="10"
            fill="#94a3b8"
            fontFamily="inherit"
          >
            {i + 1}
          </text>
        ))}

        {/* ── X-axis label ── */}
        <text
          x={PAD.left + chartW / 2}
          y={H}
          textAnchor="middle"
          fontSize="10"
          fill="#94a3b8"
          fontFamily="inherit"
        >
          Session
        </text>

        {/* ── Interactive data points ─────────────────────────────── */}
        {pts.map((p, i) => {
          const pct = Math.round(scores[i] * 100);
          const color = dotColor(scores[i]);
          // shift tooltip left for last few points so it doesn't clip
          const tipX = i >= n - 2 ? p.x - 44 : p.x - 20;
          return (
            <g key={i} className="score-dot-group">
              {/* Pulse halo */}
              <circle
                cx={p.x}
                cy={p.y}
                r="10"
                fill={color}
                opacity="0.12"
                className="score-dot-halo"
              />
              {/* White border */}
              <circle cx={p.x} cy={p.y} r="5.5" fill="white" />
              {/* Coloured core */}
              <circle cx={p.x} cy={p.y} r="3.5" fill={color} />
              {/* Tolltip bubble */}
              <g className="score-tooltip">
                <rect
                  x={tipX}
                  y={p.y - 34}
                  width="40"
                  height="20"
                  rx="6"
                  fill="#1e293b"
                  opacity="0.9"
                />
                <polygon
                  points={`${p.x - 4},${p.y - 14} ${p.x + 4},${p.y - 14} ${p.x},${p.y - 10}`}
                  fill="#1e293b"
                  opacity="0.9"
                />
                <text
                  x={tipX + 20}
                  y={p.y - 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="white"
                  fontFamily="inherit"
                >
                  {pct}%
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Legend row */}
      <div className="score-chart-legend">
        {[
          { color: "#10b981", label: "Excellent ≥90%" },
          { color: "#308ce8", label: "Good ≥75%" },
          { color: "#f59e0b", label: "Improving ≥50%" },
          { color: "#ef4444", label: "Needs Work" },
        ].map(({ color, label }) => (
          <span key={label} className="score-legend-item">
            <span className="score-legend-dot" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
