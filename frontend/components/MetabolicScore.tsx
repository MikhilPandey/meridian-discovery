"use client";

export default function MetabolicScore({
  score,
  size = 160,
}: {
  score: number;
  size?: number;
}) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  const color = score >= 80 ? "#10b981" : score >= 55 ? "#BE9B5C" : "#dc2626";
  const tier = score >= 80 ? "Excellent" : score >= 55 ? "Moderate" : "Needs attention";

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2DACE" strokeWidth={10} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: "stroke-dasharray 600ms ease" }}
        />
      </svg>
      <div className="-mt-[105px] text-center" style={{ height: 90 }}>
        <div className="text-3xl font-semibold text-meridian-green">{score}</div>
        <div className="text-[10px] uppercase tracking-wider text-meridian-muted">
          metabolic score
        </div>
      </div>
      <div className="mt-[15px] text-xs font-medium" style={{ color }}>
        {tier}
      </div>
    </div>
  );
}
