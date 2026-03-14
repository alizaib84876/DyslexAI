import { useCallback, useEffect, useRef, useState } from "react";

interface TracingCanvasProps {
  expected: string;
  onComplete: (traceScore: number, durationSeconds: number, strokeErrors?: Array<{ letter: string; accuracy: number }>) => void;
  disabled?: boolean;
}

export function TracingCanvas({ expected, onComplete, disabled }: TracingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const strokesRef = useRef<number[][]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const drawGuide = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(30, 41, 59, 0.5)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = "min(24vw, 180px) sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(expected, width / 2, height / 2);
    },
    [expected]
  );

  const drawStrokes = useCallback((ctx: CanvasRenderingContext2D) => {
    const points = strokesRef.current;
    if (points.length < 2) return;
    ctx.strokeStyle = "#308ce8";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGuide(ctx);
    drawStrokes(ctx);
  }, [drawGuide, drawStrokes]);

  useEffect(() => {
    redraw();
  }, [redraw, strokeCount]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return [
        (e.touches[0].clientX - rect.left) * scaleX,
        (e.touches[0].clientY - rect.top) * scaleY
      ];
    }
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (disabled) return;
    const coords = getCoords(e);
    if (coords) {
      strokesRef.current.push(coords);
      setStrokeCount((c) => c + 1);
      setIsDrawing(true);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || disabled) return;
    const coords = getCoords(e);
    if (coords) {
      strokesRef.current.push(coords);
      setStrokeCount((c) => c + 1);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const handleSubmit = () => {
    const points = strokesRef.current;
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    if (points.length < 5) {
      onComplete(0.3, durationSeconds, expected.split("").map((ch) => ({ letter: ch, accuracy: 0.3 })));
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const avgX = points.reduce((s, p) => s + p[0], 0) / points.length;
    const avgY = points.reduce((s, p) => s + p[1], 0) / points.length;
    const distFromCenter = Math.hypot(avgX - centerX, avgY - centerY);
    const maxDist = Math.min(canvas.width, canvas.height) / 2;
    const proximityScore = Math.max(0, 1 - distFromCenter / maxDist);

    const strokeLength = points.reduce((sum, p, i) => {
      if (i === 0) return 0;
      return sum + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
    }, 0);
    const minExpected = expected.length * 40;
    const effortScore = Math.min(1, strokeLength / minExpected);

    const traceScore = Math.round((0.5 * proximityScore + 0.5 * effortScore) * 100) / 100;
    const clamped = Math.max(0.2, Math.min(1, traceScore));

    const perLetter = expected.split("").map((ch) => ({
      letter: ch,
      accuracy: clamped
    }));

    onComplete(clamped, durationSeconds, perLetter);
  };

  const handleClear = () => {
    strokesRef.current = [];
    setStrokeCount(0);
    redraw();
  };

  return (
    <div className="tracing-canvas-wrap">
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="tracing-canvas"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{ touchAction: "none", cursor: disabled ? "not-allowed" : "crosshair" }}
      />
      <div className="form-row" style={{ marginTop: 12 }}>
        <button onClick={handleClear} disabled={disabled}>
          Clear
        </button>
        <button onClick={handleSubmit} disabled={disabled || strokeCount < 3}>
          Submit trace
        </button>
      </div>
    </div>
  );
}
