"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type CompareResponse, type Meal, type SnpCatalog } from "@/lib/api";
import { applyRelativeModifier, combineModifiers, peakOf, timeInRangePct } from "@/lib/genomics";
import GlucoseCurveChart, { colorFor, type Series } from "@/components/GlucoseCurveChart";
import MealSelector from "@/components/MealSelector";
import ParticipantCard from "@/components/ParticipantCard";
import GenomicOverlay from "@/components/GenomicOverlay";
import { useUserData } from "@/lib/userStore";

const DEFAULT_MEAL: Meal = {
  name: "White Rice (1 cup)",
  carbs_g: 45,
  protein_g: 4,
  fat_g: 0,
  category: "staple",
  region: "universal",
};

export default function DiscoverPage() {
  const user = useUserData();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [snps, setSnps] = useState<SnpCatalog | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal>(DEFAULT_MEAL);
  const [compare, setCompare] = useState<CompareResponse | null>(null);
  const [genomicTargetId, setGenomicTargetId] = useState<string>("P004");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [includeMe, setIncludeMe] = useState<boolean>(true);

  // Load static data once
  useEffect(() => {
    Promise.all([api.meals(), api.snps()])
      .then(([m, s]) => {
        setMeals(m);
        setSnps(s);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  // Recompute compare when meal or user data changes.
  // If we have uploaded user data and they want to include themselves, use /api/me/compare
  // (which returns the 6 archetypes + a "You" line). Otherwise the standard /api/compare.
  useEffect(() => {
    setLoading(true);
    setErr(null);
    const promise =
      user && includeMe
        ? api.meCompare({
            genotypes: user.genotypes,
            cgm_stats: user.cgmStats ?? blankStats(),
            age: user.age,
            sex: user.sex,
            meal_ids: [selectedMeal.name],
          })
        : api.compare(selectedMeal);
    promise
      .then((r) => setCompare(r))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [selectedMeal, user, includeMe]);

  const targetResult = useMemo(
    () => compare?.results.find((r) => r.participant.id === genomicTargetId) ?? null,
    [compare, genomicTargetId]
  );

  // Compute modified curve client-side from overrides
  const modifiedSeries = useMemo(() => {
    if (!targetResult || !snps) return null;
    if (Object.keys(overrides).length === 0) return null;
    const baseGenotypes = targetResult.participant.genomic_variants ?? {};
    const baseMod = combineModifiers(snps, baseGenotypes);
    const newGenotypes = { ...baseGenotypes, ...overrides };
    const newMod = combineModifiers(snps, newGenotypes);
    const newCurve = applyRelativeModifier(
      targetResult.curve,
      targetResult.baseline_fasting,
      baseMod,
      newMod
    );
    return {
      curve: newCurve,
      peak: peakOf(newCurve),
      tir: timeInRangePct(newCurve),
    };
  }, [targetResult, snps, overrides]);

  const series: Series[] = useMemo(() => {
    if (!compare) return [];
    const base: Series[] = compare.results.map((r, i) => ({
      id: r.participant.id,
      label: r.participant.label,
      color: colorFor(i),
      curve: r.curve,
    }));
    if (modifiedSeries && targetResult) {
      const idx = compare.results.findIndex((r) => r.participant.id === targetResult.participant.id);
      base.push({
        id: `${targetResult.participant.id}__mod`,
        label: `${targetResult.participant.label} (modified genome)`,
        color: colorFor(idx),
        curve: modifiedSeries.curve,
        dashed: true,
      });
    }
    return base;
  }, [compare, modifiedSeries, targetResult]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-meridian-green tracking-tight">
            Same meal, different bodies.
          </h1>
          <p className="text-meridian-muted mt-1 text-sm">
            Pick a meal. See six real metabolic phenotypes respond differently. Toggle a genome
            variant and watch the curve shift.
          </p>
        </div>
        {user ? (
          <label className="card px-4 py-2.5 flex items-center gap-2 text-xs cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={includeMe}
              onChange={(e) => setIncludeMe(e.target.checked)}
              className="accent-meridian-green"
            />
            Show my line
          </label>
        ) : (
          <Link
            href="/upload"
            className="text-xs px-4 py-2.5 rounded-full border border-meridian-cream hover:border-meridian-muted text-meridian-body whitespace-nowrap"
          >
            Add your own data →
          </Link>
        )}
      </div>

      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium text-meridian-green uppercase tracking-wider">
            1. Choose a meal
          </h2>
          {selectedMeal && (
            <div className="text-xs text-meridian-muted">
              Selected: <span className="text-meridian-green font-medium">{selectedMeal.name}</span>
              {" · "}
              C {selectedMeal.carbs_g}g / P {selectedMeal.protein_g}g / F {selectedMeal.fat_g}g
            </div>
          )}
        </div>
        <MealSelector meals={meals} selected={selectedMeal} onSelect={setSelectedMeal} />
      </section>

      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium text-meridian-green uppercase tracking-wider">
            2. Predicted glucose response
          </h2>
          <div className="text-xs text-meridian-muted">
            {loading ? "computing…" : "180-minute postprandial window"}
          </div>
        </div>
        <div className="card p-5">
          {err && <div className="text-sm text-rose-700">{err}</div>}
          {!err && series.length > 0 && <GlucoseCurveChart series={series} height={420} />}
          <div className="mt-2 text-[11px] text-meridian-muted">
            Simulated response based on metabolic profile and published pharmacokinetic models.
            Shaded band = healthy 70–140 mg/dL range.
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium text-meridian-green uppercase tracking-wider">
            3. Per-participant detail
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {compare?.results.map((r, i) => (
            <ParticipantCard
              key={r.participant.id}
              result={r}
              color={colorFor(i)}
              onSelectGenomics={(id) => {
                setGenomicTargetId(id);
                setOverrides({});
              }}
              isGenomicTarget={genomicTargetId === r.participant.id}
            />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium text-meridian-green uppercase tracking-wider">
            4. Genomic overlay
          </h2>
          {targetResult && (
            <div className="text-xs text-meridian-muted">
              Editing variants for{" "}
              <span className="text-meridian-green font-medium">
                {targetResult.participant.label}
              </span>
            </div>
          )}
        </div>
        {snps && targetResult && (
          <GenomicOverlay
            catalog={snps}
            baseResult={targetResult}
            overrides={overrides}
            setOverrides={setOverrides}
          />
        )}
        {modifiedSeries && targetResult && (
          <div className="mt-3 text-xs text-meridian-body bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
            With the modified genome, peak glucose moves from{" "}
            <span className="font-semibold">{targetResult.peak.glucose_mg_dl} mg/dL</span> to{" "}
            <span className="font-semibold">{modifiedSeries.peak.glucose_mg_dl} mg/dL</span>; time
            in range goes from{" "}
            <span className="font-semibold">{targetResult.time_in_range_pct}%</span> to{" "}
            <span className="font-semibold">{modifiedSeries.tir}%</span>.
          </div>
        )}
      </section>
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
