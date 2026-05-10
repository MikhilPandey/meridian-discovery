/**
 * Parses a 23andMe-style raw genotype TXT file.
 *
 * Privacy: this runs entirely in the browser. The full file never leaves the
 * user's machine — we extract only the 5 SNPs we care about and discard the
 * rest. The File object is read once and then dropped.
 */

const TARGET_SNPS: Record<string, { gene: string; rsid: string }> = {
  rs7903146: { gene: "TCF7L2", rsid: "rs7903146" },
  rs1799884: { gene: "GCK", rsid: "rs1799884" },
  rs13266634: { gene: "SLC30A8", rsid: "rs13266634" },
  rs10830963: { gene: "MTNR1B", rsid: "rs10830963" },
  rs1801282: { gene: "PPARG", rsid: "rs1801282" },
};

const VALID_BY_GENE: Record<string, Set<string>> = {
  TCF7L2: new Set(["CC", "CT", "TT"]),
  GCK: new Set(["CC", "CT", "TT"]),
  SLC30A8: new Set(["CC", "CT", "TT"]),
  MTNR1B: new Set(["CC", "CG", "GG"]),
  PPARG: new Set(["CC", "CG", "GG"]),
};

export type ParsedGenome = {
  genotypes: Record<string, string>;     // { "TCF7L2": "CT", ... }
  rsids: Record<string, string>;         // { "TCF7L2": "rs7903146", ... }
  rawCalls: Record<string, string>;      // { "TCF7L2": "CT" } — exactly what file said
  source: { totalLines: number; matched: number; nocalls: number };
};

export async function parseGenomeFile(file: File): Promise<ParsedGenome> {
  const text = await file.text();
  return parseGenomeText(text);
}

export function parseGenomeText(text: string): ParsedGenome {
  const lines = text.split(/\r?\n/);
  const genotypes: Record<string, string> = {};
  const rsids: Record<string, string> = {};
  const rawCalls: Record<string, string> = {};
  let matched = 0;
  let nocalls = 0;

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 4) continue;
    const [rsid, , , raw] = parts;
    if (!(rsid in TARGET_SNPS)) continue;
    matched++;
    const { gene } = TARGET_SNPS[rsid];
    if (!raw || raw === "--" || raw === "00") {
      nocalls++;
      continue;
    }
    const normalized = normalizeGenotype(raw, gene);
    if (normalized) {
      genotypes[gene] = normalized;
      rsids[gene] = rsid;
      rawCalls[gene] = raw;
    }
  }

  return {
    genotypes,
    rsids,
    rawCalls,
    source: { totalLines: lines.length, matched, nocalls },
  };
}

/** Normalize a 2-letter genotype like "TC" → "CT" (alphabetical), and clamp to the
 *  valid genotype set our SNP catalog knows about. Returns null if not parseable. */
function normalizeGenotype(raw: string, gene: string): string | null {
  if (!raw || raw.length !== 2) return null;
  const sorted = [raw[0], raw[1]].sort().join("");
  const valid = VALID_BY_GENE[gene];
  if (valid.has(sorted)) return sorted;
  // Maybe the strand is flipped — try complement.
  const comp = sorted.split("").map(complement).sort().join("");
  if (valid.has(comp)) return comp;
  return null;
}

function complement(b: string): string {
  switch (b.toUpperCase()) {
    case "A":
      return "T";
    case "T":
      return "A";
    case "G":
      return "C";
    case "C":
      return "G";
    default:
      return b;
  }
}
