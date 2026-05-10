import type { CurvePoint, SnpCatalog, SnpModifier } from "./api";

export function combineModifiers(
  catalog: SnpCatalog,
  genotypes: Record<string, string>
): SnpModifier {
  let amplitude = 1;
  let clearance = 1;
  let fasting_offset = 0;
  for (const [gene, gt] of Object.entries(genotypes)) {
    const def = catalog[gene];
    if (!def) continue;
    const m = def.modifiers[gt];
    if (!m) continue;
    amplitude *= m.amplitude;
    clearance *= m.clearance;
    fasting_offset += m.fasting_offset;
  }
  return { amplitude, clearance, fasting_offset };
}

/**
 * Apply a relative genomic modifier to an existing baseline curve.
 *
 * Both the baseline and the modified curves are produced by the same backend
 * formula. We approximate the modifier locally by:
 *   - shifting the baseline by `delta.fasting_offset`
 *   - scaling the rise above baseline by amplitude_ratio
 *   - stretching/shrinking time decay by 1/clearance_ratio
 *
 * This is illustrative, not model-driven — the spec's "literature-based overlay".
 */
export function applyRelativeModifier(
  baselineCurve: CurvePoint[],
  baselineFasting: number,
  baselineMod: SnpModifier,
  newMod: SnpModifier
): CurvePoint[] {
  const ampRatio = newMod.amplitude / baselineMod.amplitude;
  const clearanceRatio = newMod.clearance / baselineMod.clearance;
  const fastingDelta = newMod.fasting_offset - baselineMod.fasting_offset;
  const newBaseline = baselineFasting + fastingDelta;

  return baselineCurve.map((p) => {
    const aboveBase = p.glucose_mg_dl - baselineFasting;
    const stretchedTime = p.time_minutes / Math.max(clearanceRatio, 0.1);
    const decayFactor =
      stretchedTime <= p.time_minutes
        ? 1
        : Math.exp(-(stretchedTime - p.time_minutes) / 60);
    const newAbove = aboveBase * ampRatio * decayFactor;
    return { time_minutes: p.time_minutes, glucose_mg_dl: round1(newBaseline + newAbove) };
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function timeInRangePct(curve: CurvePoint[], lower = 70, upper = 140) {
  if (!curve.length) return 0;
  const inR = curve.filter((p) => p.glucose_mg_dl >= lower && p.glucose_mg_dl <= upper).length;
  return Math.round((1000 * inR) / curve.length) / 10;
}

export function peakOf(curve: CurvePoint[]) {
  return curve.reduce((a, b) => (b.glucose_mg_dl > a.glucose_mg_dl ? b : a), curve[0]);
}
