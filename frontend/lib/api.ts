const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type Meal = {
  name: string;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  category?: string;
  region?: string;
};

export type CurvePoint = { time_minutes: number; glucose_mg_dl: number };

export type Participant = {
  id: string;
  label: string;
  age: number;
  sex?: string;
  description: string;
  genomic_variants?: Record<string, string>;
};

export type CompareResult = {
  participant: Participant & { genomic_variants: Record<string, string> };
  curve: CurvePoint[];
  peak: { time_minutes: number; glucose_mg_dl: number };
  time_in_range_pct: number;
  auc_above_baseline: number;
  baseline_fasting: number;
};

export type CompareResponse = {
  meal: Meal;
  results: CompareResult[];
};

export type ProfileResponse = {
  participant: Participant & { shanghai_id?: number | null };
  metabolic_score: number;
  hba1c: {
    predicted_mmol_mol: number;
    predicted_pct: number;
    actual_mmol_mol: number | null;
    actual_pct: number | null;
  };
  gmi: number | null;
  risk_tier: "low" | "moderate" | "high";
  fasting_glucose_estimate: number;
  genomic_variants: Record<
    string,
    { rsid: string; genotype: string; effect: string; interpretation: string; risk_allele: string }
  >;
  insights: string[];
  sample_responses: {
    meal: Meal;
    curve: CurvePoint[];
    peak: { time_minutes: number; glucose_mg_dl: number };
    time_in_range_pct: number;
    auc_above_baseline: number;
  }[];
  model_meta: { ridge_alpha: number; training_n: number; real_embedding_used: boolean };
};

export type SnpModifier = { amplitude: number; clearance: number; fasting_offset: number };

export type SnpDefinition = {
  rsid: string;
  risk_allele: string;
  effect: string;
  genotypes: string[];
  modifiers: Record<string, SnpModifier>;
  interpretations: Record<string, string>;
  source?: string;
  population_frequency?: string;
};

export type SnpCatalog = Record<string, SnpDefinition>;

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

export type MeProfileResponse = {
  profile: {
    id: string;
    label: string;
    age: number;
    sex: string | null;
    description: string;
    baseline_fasting: number;
    insulin_sensitivity: number;
    peak_delay_minutes: number;
    clearance_rate: number;
    carb_sensitivity: number;
    protein_effect: number;
    fat_attenuation: number;
    genomic_variants: Record<string, string>;
    cgm_summary: {
      avg_mg_dl: number | null;
      cv_pct: number | null;
      ehba1c_pct: number | null;
      tir_pct: number | null;
      tar_pct: number | null;
      tbr_pct: number | null;
      session_start: string | null;
      session_end: string | null;
      days_covered: number | null;
    };
  };
  genomic_variants: Record<
    string,
    { rsid: string; genotype: string; effect: string; interpretation: string; risk_allele: string }
  >;
  modifier: { amplitude: number; clearance: number; fasting_offset: number };
  sample_responses: {
    meal: Meal;
    curve: CurvePoint[];
    peak: { time_minutes: number; glucose_mg_dl: number };
    time_in_range_pct: number;
    auc_above_baseline: number;
  }[];
};

export type MePayload = {
  genotypes: Record<string, string>;
  cgm_stats: {
    avg_mg_dl: number | null;
    cv_pct: number | null;
    ehba1c_pct: number | null;
    tir_pct: number | null;
    tar_pct: number | null;
    tbr_pct: number | null;
    session_start: string | null;
    session_end: string | null;
    days_covered: number | null;
  };
  age?: number | null;
  sex?: string | null;
  meal_ids?: string[];
};

export const api = {
  meals: () => getJson<Meal[]>("/api/meals"),
  participants: () => getJson<Participant[]>("/api/participants"),
  snps: () => getJson<SnpCatalog>("/api/snps"),
  compare: (meal: Meal, participantIds?: string[]) =>
    postJson<CompareResponse>("/api/compare", { meal, participant_ids: participantIds }),
  profile: (id: string) => getJson<ProfileResponse>(`/api/profile/${id}`),
  meProfile: (payload: MePayload) => postJson<MeProfileResponse>("/api/me/profile", payload),
  meCompare: (payload: MePayload) =>
    postJson<CompareResponse>("/api/me/compare", payload),
  parseCgmPdf: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API_BASE}/api/me/cgm-pdf`, { method: "POST", body: fd });
    if (!r.ok) throw new Error(`PDF parse failed: ${r.status}`);
    return (await r.json()) as { stats: MePayload["cgm_stats"] };
  },
};
