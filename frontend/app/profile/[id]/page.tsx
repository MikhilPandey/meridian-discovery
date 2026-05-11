"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type ProfileResponse } from "@/lib/api";
import GlucoseCurveChart from "@/components/GlucoseCurveChart";
import MetabolicScore from "@/components/MetabolicScore";
import ModelDisclaimer from "@/components/ModelDisclaimer";

const TIER_PILL: Record<string, string> = {
  low: "pill-low",
  moderate: "pill-mod",
  high: "pill-high",
};

const VARIANT_COLOR: Record<string, string> = {
  CC: "bg-emerald-50 text-emerald-800 border-emerald-100",
  CT: "bg-amber-50 text-amber-800 border-amber-100",
  TT: "bg-rose-50 text-rose-800 border-rose-100",
  CG: "bg-amber-50 text-amber-800 border-amber-100",
  GG: "bg-rose-50 text-rose-800 border-rose-100",
};

export default function ProfilePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .profile(params.id)
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, [params.id]);

  if (err) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-rose-700">{err}</p>
        <Link href="/discover" className="text-meridian-gold underline">
          Back to Discover
        </Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-meridian-muted">Loading profile…</div>
    );
  }

  const { participant, hba1c, risk_tier, metabolic_score, fasting_glucose_estimate, gmi } = data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-2">
        <Link
          href="/discover"
          className="text-xs text-meridian-gold hover:underline"
        >
          ← Back to Discover
        </Link>
      </div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs text-meridian-muted font-mono mb-1">{participant.id}</div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-meridian-green tracking-tight">
            {participant.label}
          </h1>
          <p className="text-meridian-body/80 text-sm mt-1 max-w-2xl">
            {participant.description}
          </p>
          <div className="mt-2 text-xs text-meridian-muted">
            Age {participant.age}
            {participant.sex ? ` · ${participant.sex}` : ""}
            {participant.shanghai_id != null && (
              <> · GluFormer embedding from Shanghai cohort #{participant.shanghai_id}</>
            )}
          </div>
        </div>
        <div className={TIER_PILL[risk_tier]}>{risk_tier} risk</div>
      </header>

      <div className="mb-8">
        <ModelDisclaimer variant="general" />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mb-10">
        <div className="card p-6 flex items-center justify-center">
          <MetabolicScore score={metabolic_score} />
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-meridian-green uppercase tracking-wider mb-4">
            Predicted clinical markers
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-1.5">
                <div className="text-[10px] uppercase tracking-wide text-meridian-muted">
                  HbA1c (predicted)
                </div>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  Real GluFormer
                </span>
              </div>
              <div className="text-xl font-semibold text-meridian-green">
                {hba1c.predicted_pct}%{" "}
                <span className="text-sm font-normal text-meridian-muted">
                  ({hba1c.predicted_mmol_mol} mmol/mol)
                </span>
              </div>
              <div className="text-[10px] text-meridian-muted mt-0.5">
                Ridge regression on a real 1024-dim GluFormer embedding
              </div>
            </div>
            {hba1c.actual_pct != null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-meridian-muted">
                  HbA1c (actual)
                </div>
                <div className="text-xl font-semibold text-meridian-green">
                  {hba1c.actual_pct}%{" "}
                  <span className="text-sm font-normal text-meridian-muted">
                    ({hba1c.actual_mmol_mol} mmol/mol)
                  </span>
                </div>
                <div className="text-[10px] text-meridian-muted mt-0.5">
                  Lab measurement, Shanghai cohort
                </div>
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-meridian-muted">
                Fasting glucose
              </div>
              <div className="text-xl font-semibold text-meridian-green">
                {Math.round(fasting_glucose_estimate)}{" "}
                <span className="text-sm font-normal text-meridian-muted">mg/dL</span>
              </div>
              <div className="text-[10px] text-meridian-muted mt-0.5">
                Estimated from metabolic profile
              </div>
            </div>
            {gmi != null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-meridian-muted">GMI</div>
                <div className="text-xl font-semibold text-meridian-green">
                  {gmi}
                  <span className="text-sm font-normal text-meridian-muted"> %</span>
                </div>
                <div className="text-[10px] text-meridian-muted mt-0.5">
                  Glucose Management Indicator (CGM-derived)
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-meridian-green uppercase tracking-wider">
            Genomic variants
          </h3>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-medium">
            Literature-based · heuristic
          </span>
        </div>
        <div className="card p-1 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-meridian-muted bg-meridian-cream-light">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Gene</th>
                <th className="text-left px-4 py-2 font-medium">rsID</th>
                <th className="text-left px-4 py-2 font-medium">Genotype</th>
                <th className="text-left px-4 py-2 font-medium">Effect</th>
                <th className="text-left px-4 py-2 font-medium">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.genomic_variants).map(([gene, v]) => (
                <tr key={gene} className="border-t border-meridian-cream">
                  <td className="px-4 py-3 font-medium text-meridian-green">{gene}</td>
                  <td className="px-4 py-3 font-mono text-xs text-meridian-muted">{v.rsid}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-xs border ${
                        VARIANT_COLOR[v.genotype] ?? "bg-meridian-cream-light text-meridian-body"
                      }`}
                    >
                      {v.genotype}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-meridian-body/80 text-xs leading-snug">
                    {v.effect}
                  </td>
                  <td className="px-4 py-3 text-meridian-body/80 text-xs leading-snug">
                    {v.interpretation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[11px] text-meridian-muted leading-relaxed">
          Variant effects are educational overlays based on published GWAS associations. The
          quantitative curve modifiers (amplitude, clearance, fasting offset) are heuristic
          and not clinically validated.
        </div>
      </section>

      <section className="mb-10">
        <h3 className="text-sm font-medium text-meridian-green uppercase tracking-wider mb-3">
          Insights
        </h3>
        <div className="card p-5">
          <ul className="space-y-2">
            {data.insights.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-meridian-body/90">
                <span className="text-meridian-gold mt-1">●</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-meridian-green uppercase tracking-wider">
            Predicted response across meals
          </h3>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            Simulated
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.sample_responses.map((sr, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-baseline justify-between mb-2">
                <div className="font-medium text-meridian-green text-sm">{sr.meal.name}</div>
                <div className="text-xs text-meridian-muted">
                  Peak {sr.peak.glucose_mg_dl} mg/dL · TIR {sr.time_in_range_pct}%
                </div>
              </div>
              <GlucoseCurveChart
                series={[
                  {
                    id: "x",
                    label: sr.meal.name,
                    color: "#163028",
                    curve: sr.curve,
                  },
                ]}
                height={180}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="text-[11px] text-meridian-muted">
        Ridge α={data.model_meta.ridge_alpha} · trained on n={data.model_meta.training_n} Shanghai
        participants ·{" "}
        {data.model_meta.real_embedding_used
          ? "real GluFormer embedding"
          : "synthetic fallback (no embedding match)"}
        .
      </div>
    </div>
  );
}
