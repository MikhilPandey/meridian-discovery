"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FileDrop from "@/components/FileDrop";
import ModelDisclaimer from "@/components/ModelDisclaimer";
import { api } from "@/lib/api";
import type { CgmStats } from "@/lib/cgmParser";
import { parseCgmCsvFile } from "@/lib/cgmParser";
import { parseGenomeFile, type ParsedGenome } from "@/lib/genomeParser";
import { setUserData } from "@/lib/userStore";

export default function UploadPage() {
  const router = useRouter();
  const [genome, setGenome] = useState<ParsedGenome | null>(null);
  const [cgm, setCgm] = useState<CgmStats | null>(null);
  const [age, setAge] = useState<string>("");
  const [sex, setSex] = useState<string>("");
  const [genomeError, setGenomeError] = useState<string | null>(null);
  const [cgmError, setCgmError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleGenome(file: File) {
    setGenomeError(null);
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error("File too large (>50MB).");
      const parsed = await parseGenomeFile(file);
      const matched = Object.keys(parsed.genotypes).length;
      if (matched === 0) {
        setGenomeError(
          "No matching SNPs found. Make sure this is a 23andMe-style raw data export."
        );
        return;
      }
      setGenome(parsed);
    } catch (e) {
      setGenomeError(String(e));
    }
  }

  async function handleCgm(file: File) {
    setCgmError(null);
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error("File too large (>25MB).");
      const isPdf =
        file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        const { stats } = await api.parseCgmPdf(file);
        setCgm({ ...stats, n_readings: 0 } as CgmStats);
      } else {
        const stats = await parseCgmCsvFile(file);
        if (stats.n_readings === 0)
          throw new Error("No glucose readings found in this CSV.");
        setCgm(stats);
      }
    } catch (e) {
      setCgmError(e instanceof Error ? e.message : String(e));
    }
  }

  function proceed() {
    if (!genome) return;
    setBusy(true);
    setUserData({
      genotypes: genome.genotypes,
      rsids: genome.rsids,
      rawCalls: genome.rawCalls,
      cgmStats: cgm,
      age: age ? Number(age) : null,
      sex: sex || null,
      uploadedAt: Date.now(),
    });
    router.push("/me");
  }

  const ready = !!genome; // CGM is optional; genome is required

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-meridian-green tracking-tight">
          Upload your data
        </h1>
        <p className="text-meridian-muted text-sm mt-1">
          Bring your 23andMe raw genotype file and (optionally) a CGM export. We&apos;ll
          show simulated glucose responses for common meals using your specific genome and
          a heuristic profile derived from your CGM stats.
        </p>
      </div>

      <div className="card p-4 mb-4 bg-emerald-50/30 border-emerald-200">
        <div className="flex gap-3 items-start">
          <span className="text-emerald-700 mt-0.5">●</span>
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong>Your data stays in your browser.</strong> The 23andMe file is parsed
            locally — only the 5 SNPs we care about leave your machine. CSV uploads are also
            parsed in-browser. <strong>PDF uploads are the only path that sends bytes to the
            backend</strong> (PDF parsing requires server-side `pypdf`); the file is parsed
            into memory, never written to disk, and discarded after the response. CSV is
            preferred. Nothing is persisted anywhere. Refreshing wipes it.
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ModelDisclaimer variant="general" />
      </div>

      <div className="space-y-4">
        <FileDrop
          label="1. 23andMe raw data (.txt)"
          hint="Drag the txt file here or click to browse. We extract TCF7L2, GCK, SLC30A8, MTNR1B, and PPARG."
          accept=".txt,.tsv,text/plain"
          onFile={handleGenome}
          done={!!genome}
          doneSummary={
            genome
              ? `${Object.keys(genome.genotypes).length}/5 SNPs parsed · ${genome.source.matched} matched lines`
              : undefined
          }
          error={genomeError}
        />
        <FileDrop
          label="2. CGM export (CSV or PDF) — optional"
          hint="Raw CSV (timestamp, glucose) is preferred. Vendor PDF reports also work; we'll extract the summary stats."
          accept=".csv,.pdf,text/csv,application/pdf"
          onFile={handleCgm}
          done={!!cgm}
          doneSummary={cgm ? cgmSummary(cgm) : undefined}
          error={cgmError}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <label className="flex flex-col text-xs text-meridian-muted">
          Age (optional)
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 border border-meridian-cream rounded-lg px-3 py-2 text-sm text-meridian-body focus:outline-none focus:ring-2 focus:ring-meridian-gold"
          />
        </label>
        <label className="flex flex-col text-xs text-meridian-muted">
          Sex (optional)
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="mt-1 border border-meridian-cream rounded-lg px-3 py-2 text-sm text-meridian-body focus:outline-none focus:ring-2 focus:ring-meridian-gold"
          >
            <option value="">—</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </label>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          disabled={!ready || busy}
          onClick={proceed}
          className="px-6 py-2.5 rounded-full bg-meridian-green text-white text-sm font-medium hover:bg-meridian-green-soft disabled:opacity-40 disabled:cursor-not-allowed"
        >
          See my profile →
        </button>
        {(genome || cgm) && (
          <button
            onClick={() => {
              setGenome(null);
              setCgm(null);
              setGenomeError(null);
              setCgmError(null);
            }}
            className="px-4 py-2.5 rounded-full text-sm text-meridian-muted hover:text-meridian-body"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function cgmSummary(s: CgmStats): string {
  const bits: string[] = [];
  if (s.avg_mg_dl != null) bits.push(`avg ${s.avg_mg_dl} mg/dL`);
  if (s.tir_pct != null) bits.push(`TIR ${s.tir_pct}%`);
  if (s.ehba1c_pct != null) bits.push(`eHbA1c ${s.ehba1c_pct}%`);
  if (s.session_start && s.session_end)
    bits.push(`${s.session_start} → ${s.session_end}`);
  if (s.days_covered != null) bits.push(`${s.days_covered} days`);
  if (s.n_readings) bits.push(`${s.n_readings} readings`);
  return bits.join(" · ");
}
