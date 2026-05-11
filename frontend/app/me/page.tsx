"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GlucoseCurveChart from "@/components/GlucoseCurveChart";
import { api, type MeProfileResponse } from "@/lib/api";
import { useUserData } from "@/lib/userStore";

const VARIANT_COLOR: Record<string, string> = {
  CC: "bg-emerald-50 text-emerald-800 border-emerald-100",
  CT: "bg-amber-50 text-amber-800 border-amber-100",
  TT: "bg-rose-50 text-rose-800 border-rose-100",
  CG: "bg-amber-50 text-amber-800 border-amber-100",
  GG: "bg-rose-50 text-rose-800 border-rose-100",
};

export default function MePage() {
  const user = useUserData();
  const [data, setData] = useState<MeProfileResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setErr(null);
    api
      .meProfile({
        genotypes: user.genotypes,
        cgm_stats: user.cgmStats ?? blankStats(),
        age: user.age,
        sex: user.sex,
      })
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-meridian-muted mb-4">No data uploaded yet.</p>
        <Link
          href="/upload"
          className="inline-block px-5 py-2.5 rounded-full bg-meridian-green text-white text-sm"
        >
          Upload your data
        </Link>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-rose-700 mb-4">{err}</p>
        <Link href="/upload" className="text-meridian-gold underline">
          Try again
        </Link>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-meridian-muted">Computing your profile…</div>;
  }

  const { profile, genomic_variants, sample_responses } = data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <Link href="/upload" className="text-xs text-meridian-gold hover:underline">
          ← Re-upload
        </Link>
        <Link href="/discover" className="text-xs text-meridian-gold hover:underline">
          Compare against archetypes →
        </Link>
      </div>

      <header className="mb-8">
        <div className="text-xs text-meridian-muted font-mono mb-1">YOUR PROFILE</div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-meridian-green tracking-tight">
          {profile.label} · derived from your genome
          {profile.cgm_summary.avg_mg_dl != null && " + CGM data"}
        </h1>
        <p className="text-meridian-body/80 text-sm mt-1 max-w-2xl">{profile.description}</p>
      </header>

      <div className="card p-4 mb-8 bg-amber-50/40 border-amber-200">
        <div className="flex gap-3 items-start">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-100/60 text-amber-900 border-amber-200 whitespace-nowrap mt-0.5">
            Phase 1
          </span>
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Heuristic, not GluFormer.</strong> Your CGM is converted to metabolic
            parameters using a simple heuristic; meal-response curves below are pharmacokinetic
            simulations. The 5-SNP genome panel is real. The Phase 2 build will run your CGM
            through the actual GluFormer model for true personalized prediction.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <Stat
          label="Baseline fasting"
          value={`${profile.baseline_fasting} mg/dL`}
          hint="Estimated from CGM average + variability"
        />
        <Stat
          label="Insulin sensitivity"
          value={`${profile.insulin_sensitivity}`}
          hint="1.0 ≈ average; higher = clears glucose faster"
        />
        <Stat
          label="Carb sensitivity"
          value={`${profile.carb_sensitivity}`}
          hint="Higher = bigger spike per gram of carbs"
        />
      </section>

      {profile.cgm_summary.avg_mg_dl != null && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-meridian-green uppercase tracking-wider mb-3">
            CGM summary
          </h2>
          <div className="card p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <CgmStat label="Average" value={profile.cgm_summary.avg_mg_dl} unit="mg/dL" />
            <CgmStat label="CV" value={profile.cgm_summary.cv_pct} unit="%" />
            <CgmStat label="eHbA1c" value={profile.cgm_summary.ehba1c_pct} unit="%" />
            <CgmStat label="Time in range" value={profile.cgm_summary.tir_pct} unit="%" />
            <CgmStat label="Time above" value={profile.cgm_summary.tar_pct} unit="%" />
            <CgmStat label="Time below" value={profile.cgm_summary.tbr_pct} unit="%" />
          </div>
          {(profile.cgm_summary.session_start || profile.cgm_summary.days_covered) && (
            <div className="mt-3 text-xs text-meridian-muted">
              CGM coverage: {profile.cgm_summary.session_start} → {profile.cgm_summary.session_end}
              {profile.cgm_summary.days_covered != null &&
                ` · ${profile.cgm_summary.days_covered} days`}
            </div>
          )}
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-sm font-medium text-meridian-green uppercase tracking-wider mb-3">
          Your genomic variants
        </h2>
        {Object.keys(genomic_variants).length === 0 ? (
          <p className="text-sm text-meridian-muted">No matching SNPs were extracted.</p>
        ) : (
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
                {Object.entries(genomic_variants).map(([gene, v]) => (
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
        )}
        {missingSnps(genomic_variants).length > 0 && (
          <div className="mt-2 text-xs text-meridian-muted">
            Not found in your file: {missingSnps(genomic_variants).join(", ")}.
          </div>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-medium text-meridian-green uppercase tracking-wider">
            Predicted response across meals
          </h2>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            Simulated
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sample_responses.map((sr, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-baseline justify-between mb-2">
                <div className="font-medium text-meridian-green text-sm">{sr.meal.name}</div>
                <div className="text-xs text-meridian-muted">
                  Peak {sr.peak.glucose_mg_dl} mg/dL · TIR {sr.time_in_range_pct}%
                </div>
              </div>
              <GlucoseCurveChart
                series={[
                  { id: "x", label: sr.meal.name, color: "#163028", curve: sr.curve },
                ]}
                height={160}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="text-[11px] text-meridian-muted">
        Your metabolic profile parameters above (baseline fasting, insulin sensitivity, carb
        sensitivity) are derived heuristically from CGM summary stats — they are not GluFormer
        outputs. Glucose response curves are pharmacokinetic simulations. SNP modifiers are from
        published GWAS literature. When trained GluFormer weights are available, the same UI
        will run real model inference. Not medical advice.
      </div>
    </div>
  );
}

function blankStats() {
  return {
    avg_mg_dl: null,
    cv_pct: null,
    ehba1c_pct: null,
    tir_pct: null,
    tar_pct: null,
    tbr_pct: null,
    session_start: null,
    session_end: null,
    days_covered: null,
  };
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[10px] uppercase tracking-wide text-meridian-muted">{label}</div>
      <div className="text-2xl font-semibold text-meridian-green mt-1">{value}</div>
      {hint && <div className="text-[11px] text-meridian-muted mt-1">{hint}</div>}
    </div>
  );
}

function CgmStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-meridian-muted">{label}</div>
      <div className="text-lg font-semibold text-meridian-green">
        {value != null ? `${value}` : "—"}{" "}
        {value != null && <span className="text-xs font-normal text-meridian-muted">{unit}</span>}
      </div>
    </div>
  );
}

function missingSnps(found: Record<string, unknown>): string[] {
  const all = ["TCF7L2", "GCK", "SLC30A8", "MTNR1B", "PPARG"];
  return all.filter((g) => !(g in found));
}
