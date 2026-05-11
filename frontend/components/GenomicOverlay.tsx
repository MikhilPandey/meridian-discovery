"use client";

import type { CompareResult, SnpCatalog } from "@/lib/api";

export default function GenomicOverlay({
  catalog,
  baseResult,
  overrides,
  setOverrides,
}: {
  catalog: SnpCatalog;
  baseResult: CompareResult;
  overrides: Record<string, string>;
  setOverrides: (next: Record<string, string>) => void;
}) {
  const baseGenotypes = baseResult.participant.genomic_variants ?? {};
  const genes = Object.keys(catalog);
  const isModified = genes.some((g) => (overrides[g] ?? baseGenotypes[g]) !== baseGenotypes[g]);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold text-meridian-green">
            What if their genome was different?
          </h3>
          <p className="text-xs text-meridian-muted mt-0.5 max-w-2xl leading-relaxed">
            Adjusting these toggles updates the dashed curve on the chart in real time.
            Variant effects come from published GWAS associations. The quantitative curve
            changes are <strong>heuristic</strong> — they are not clinically validated and
            should be read as educational overlays.
          </p>
        </div>
        {isModified && (
          <button
            onClick={() => setOverrides({})}
            className="text-xs text-meridian-gold hover:underline whitespace-nowrap"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {genes.map((gene) => {
          const def = catalog[gene];
          const baseGt = baseGenotypes[gene];
          const currentGt = overrides[gene] ?? baseGt;
          return (
            <div key={gene} className="border border-meridian-cream rounded-xl p-3 bg-white">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="font-medium text-meridian-green text-sm">{gene}</div>
                  <div className="text-[10px] font-mono text-meridian-muted">{def.rsid}</div>
                </div>
                {currentGt !== baseGt && (
                  <span className="text-[10px] text-meridian-gold">modified</span>
                )}
              </div>
              <p className="text-[11px] text-meridian-body/80 mt-1.5 leading-snug min-h-[2.5em]">
                {def.effect}
              </p>
              <div className="mt-2 flex gap-1.5">
                {def.genotypes.map((gt) => {
                  const active = currentGt === gt;
                  return (
                    <button
                      key={gt}
                      onClick={() => {
                        const next = { ...overrides };
                        if (gt === baseGt) delete next[gene];
                        else next[gene] = gt;
                        setOverrides(next);
                      }}
                      className={`flex-1 text-xs py-1 rounded-md font-mono border transition-colors ${
                        active
                          ? "bg-meridian-green text-white border-meridian-green"
                          : "bg-white text-meridian-body border-meridian-cream hover:border-meridian-muted"
                      }`}
                      title={def.interpretations[gt]}
                    >
                      {gt}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 text-[10px] text-meridian-muted leading-snug">
                {def.interpretations[currentGt]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
