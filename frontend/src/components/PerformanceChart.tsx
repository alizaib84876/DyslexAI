import type { HistoryItem } from "../types";

type PerformanceChartProps = {
    data: HistoryItem[];
};

export function PerformanceChart({ data }: PerformanceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="chart-placeholder">
                <p>No historical data available for visualization.</p>
            </div>
        );
    }

    // Sort and take last 10 runs
    const recentData = data
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-10);

    const width = 600;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = 1; // Confidence is 0 to 1
    const minVal = 0;

    const getX = (index: number) => padding + (index * chartWidth) / (recentData.length - 1 || 1);
    const getY = (val: number) => padding + chartHeight - (val * chartHeight);

    // Build path strings
    const points = recentData.map((d, i) => `${getX(i)},${getY(d.avg_confidence)}`).join(" ");
    const linePath = `M ${points}`;

    // Area path (closes the shape at the bottom)
    const areaPath = `${linePath} L ${getX(recentData.length - 1)},${padding + chartHeight} L ${getX(0)},${padding + chartHeight} Z`;

    return (
        <div className="performance-chart-container">
            <div className="chart-header">
                <h4>OCR Confidence Trend</h4>
                <p>Tracking the average confidence across last {recentData.length} runs</p>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="performance-chart">
                {/* Gradients */}
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#308ce8" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#308ce8" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                    <line
                        key={v}
                        x1={padding}
                        y1={getY(v)}
                        x2={width - padding}
                        y2={getY(v)}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Area fill */}
                <path d={areaPath} fill="url(#chartGradient)" />

                {/* Main Line */}
                <polyline
                    fill="none"
                    stroke="#308ce8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    className="chart-line-anim"
                />

                {/* Data points */}
                {recentData.map((d, i) => (
                    <circle
                        key={i}
                        cx={getX(i)}
                        cy={getY(d.avg_confidence)}
                        r="4"
                        fill="#ffffff"
                        stroke="#308ce8"
                        strokeWidth="2"
                    >
                        <title>{(d.avg_confidence * 100).toFixed(1)}%</title>
                    </circle>
                ))}

                {/* X-axis labels (Dates) */}
                {recentData.length > 1 && (
                    <>
                        <text x={getX(0)} y={height - 10} fontSize="10" fill="#94a3b8" textAnchor="start">
                            {new Date(recentData[0].created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </text>
                        <text x={getX(recentData.length - 1)} y={height - 10} fontSize="10" fill="#94a3b8" textAnchor="end">
                            {new Date(recentData[recentData.length - 1].created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </text>
                    </>
                )}
            </svg>

            <style>{`
        .performance-chart-container {
          padding: 24px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .chart-header {
          margin-bottom: 20px;
        }
        .chart-header h4 {
          margin: 0;
          color: #1e293b;
          font-size: 16px;
        }
        .chart-header p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }
        .performance-chart {
          width: 100%;
          height: auto;
          overflow: visible;
        }
        .chart-line-anim {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 2s forwards;
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        .chart-placeholder {
          height: 200px;
          display: grid;
          place-items: center;
          color: #94a3b8;
          background: #f8fafc;
          border-radius: 20px;
          border: 2px dashed #e2e8f0;
        }
      `}</style>
        </div>
    );
}
