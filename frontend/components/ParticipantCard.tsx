"use client";

import Link from "next/link";
import type { CompareResult } from "@/lib/api";

function tirPill(tir: number) {
  if (tir >= 85) return "pill-low";
  if (tir >= 60) return "pill-mod";
  return "pill-high";
}

export default function ParticipantCard({
  result,
  color,
  onSelectGenomics,
  isGenomicTarget,
}: {
  result: CompareResult;
  color: string;
  onSelectGenomics: (id: string) => void;
  isGenomicTarget: boolean;
}) {
  const p = result.participant;
  const variantBadges = Object.entries(p.genomic_variants ?? {}).slice(0, 3);
  return (
    <div
      className={`card p-4 min-w-[280px] flex flex-col gap-2 ${
        isGenomicTarget ? "ring-2 ring-meridian-gold" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: color }}
              aria-hidden
            />
            <span className="font-semibold text-meridian-green">{p.label}</span>
          </div>
          <div className="text-xs text-meridian-muted mt-0.5">
            {p.id} · age {p.age}
          </div>
        </div>
        <Link
          href={p.id === "ME" ? "/me" : `/profile/${p.id}`}
          className="text-xs text-meridian-gold hover:underline whitespace-nowrap"
        >
          {p.id === "ME" ? "Your profile →" : "Profile →"}
        </Link>
      </div>

      <p className="text-xs text-meridian-body/80 leading-snug min-h-[2.5em]">
        {p.description}
      </p>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="bg-meridian-cream-light rounded-lg p-2">
          <div className="text-[10px] uppercase tracking-wide text-meridian-muted">Peak</div>
          <div className="text-sm font-semibold text-meridian-green">
            {result.peak.glucose_mg_dl} <span className="text-xs font-normal">mg/dL</span>
          </div>
          <div className="text-[10px] text-meridian-muted">@ {result.peak.time_minutes} min</div>
        </div>
        <div className="bg-meridian-cream-light rounded-lg p-2">
          <div className="text-[10px] uppercase tracking-wide text-meridian-muted">
            Time in range
          </div>
          <div className="text-sm font-semibold text-meridian-green">
            {result.time_in_range_pct}%
          </div>
          <div className="mt-0.5">
            <span className={tirPill(result.time_in_range_pct)}>
              {result.time_in_range_pct >= 85
                ? "good"
                : result.time_in_range_pct >= 60
                ? "moderate"
                : "poor"}
            </span>
          </div>
        </div>
      </div>

      {variantBadges.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {variantBadges.map(([gene, gt]) => (
            <span
              key={gene}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-meridian-cream-light text-meridian-body"
              title={`${gene} ${gt}`}
            >
              {gene} {gt}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => onSelectGenomics(p.id)}
        className={`mt-2 text-xs font-medium rounded-lg py-1.5 ${
          isGenomicTarget
            ? "bg-meridian-green text-white"
            : "bg-meridian-cream-light text-meridian-green hover:bg-meridian-cream"
        }`}
      >
        {isGenomicTarget ? "Genome panel active" : "Try genome variants"}
      </button>
    </div>
  );
}
