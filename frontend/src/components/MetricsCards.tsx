import type { DashboardOverview } from "../types";

type Props = {
  overview?: DashboardOverview | null;
};

export function MetricsCards({ overview }: Props) {
  const items = [
    { label: "Students", value: overview?.total_students ?? 0 },
    { label: "Uploads", value: overview?.total_uploads ?? 0 },
    { label: "Runs", value: overview?.total_runs ?? 0 },
    {
      label: "Avg Confidence",
      value: overview ? `${(overview.avg_confidence * 100).toFixed(1)}%` : "0.0%"
    },
    {
      label: "Avg Correction Ratio",
      value: overview ? `${(overview.avg_correction_ratio * 100).toFixed(1)}%` : "0.0%"
    }
  ];

  return (
    <div className="metrics-grid">
      {items.map((item) => (
        <article className="metric-card" key={item.label}>
          <span className="metric-label">{item.label}</span>
          <strong className="metric-value">{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
