"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { CurvePoint } from "@/lib/api";

export type Series = {
  id: string;
  label: string;
  color: string;
  curve: CurvePoint[];
  dashed?: boolean;
};

const PALETTE = [
  "#2E7D5B", // P001 emerald
  "#C0392B", // P002 red
  "#1F77B4", // P003 blue
  "#BE9B5C", // P004 gold
  "#8E44AD", // P005 purple
  "#E67E22", // P006 orange
];

export function colorFor(idx: number) {
  return PALETTE[idx % PALETTE.length];
}

export default function GlucoseCurveChart({
  series,
  height = 400,
}: {
  series: Series[];
  height?: number;
}) {
  // Merge into single data array indexed by time_minutes
  const timeKeys = new Set<number>();
  series.forEach((s) => s.curve.forEach((p) => timeKeys.add(p.time_minutes)));
  const sortedTimes = Array.from(timeKeys).sort((a, b) => a - b);
  const data = sortedTimes.map((t) => {
    const row: Record<string, number> = { time_minutes: t };
    series.forEach((s) => {
      const pt = s.curve.find((p) => p.time_minutes === t);
      if (pt) row[s.id] = pt.glucose_mg_dl;
    });
    return row;
  });

  const allValues = series.flatMap((s) => s.curve.map((p) => p.glucose_mg_dl));
  const minY = Math.min(60, Math.min(...allValues) - 5);
  const maxY = Math.max(220, Math.max(...allValues) + 10);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DACE" />
          <XAxis
            dataKey="time_minutes"
            type="number"
            domain={[0, 180]}
            ticks={[0, 30, 60, 90, 120, 150, 180]}
            tickFormatter={(t) => `${t}m`}
            stroke="#8A9088"
            fontSize={12}
          />
          <YAxis
            domain={[minY, maxY]}
            stroke="#8A9088"
            fontSize={12}
            label={{
              value: "Glucose (mg/dL)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#8A9088", fontSize: 12 },
            }}
          />
          <ReferenceArea y1={70} y2={140} fill="#10b981" fillOpacity={0.06} />
          <ReferenceLine y={140} stroke="#16a34a" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E2DACE",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(t) => `t = ${t} min`}
            formatter={(value: number, name: string) => {
              const s = series.find((x) => x.id === name);
              return [`${value} mg/dL`, s?.label ?? name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => series.find((s) => s.id === value)?.label ?? value}
          />
          {series.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              stroke={s.color}
              strokeWidth={2.25}
              strokeDasharray={s.dashed ? "6 4" : undefined}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={900}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
