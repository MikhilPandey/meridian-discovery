/**
 * Parses a raw CGM CSV (timestamp, glucose) into summary stats.
 *
 * Privacy: runs in the browser, file content is discarded after parse.
 * Accepts common vendor exports — Ottai, Dexcom, FreeStyle Libre — by
 * detecting timestamp + glucose columns heuristically.
 */

export type CgmStats = {
  avg_mg_dl: number | null;
  cv_pct: number | null;
  ehba1c_pct: number | null;
  tir_pct: number | null;
  tar_pct: number | null;
  tbr_pct: number | null;
  session_start: string | null;
  session_end: string | null;
  days_covered: number | null;
  n_readings: number;
};

type Row = { ts: Date; glucose: number };

const TS_HEADERS = ["timestamp", "datetime", "device timestamp", "time", "date time", "ts"];
const GLU_HEADERS = ["glucose", "glucose (mg/dl)", "historic glucose mg/dl", "value", "mg/dl"];

export async function parseCgmCsvFile(file: File): Promise<CgmStats> {
  const text = await file.text();
  return parseCgmCsvText(text);
}

export function parseCgmCsvText(text: string): CgmStats {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return emptyStats();

  // Try each row as the header until we find one we can lock onto.
  let headerIdx = 0;
  let tsCol = -1;
  let gluCol = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cells = splitCsv(lines[i]).map((c) => c.trim().toLowerCase());
    const tsIdx = cells.findIndex((c) => TS_HEADERS.some((h) => c.includes(h)));
    const gluIdx = cells.findIndex((c) =>
      GLU_HEADERS.some((h) => c === h || c.includes("glucose"))
    );
    if (tsIdx >= 0 && gluIdx >= 0) {
      headerIdx = i;
      tsCol = tsIdx;
      gluCol = gluIdx;
      break;
    }
  }

  if (tsCol < 0 || gluCol < 0) {
    // Fall back: assume first column is timestamp, second is glucose
    tsCol = 0;
    gluCol = 1;
    headerIdx = 0;
  }

  const rows: Row[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = splitCsv(lines[i]);
    const ts = parseTimestamp(cells[tsCol]);
    const g = parseFloat(cells[gluCol]);
    if (ts && Number.isFinite(g) && g > 20 && g < 600) {
      rows.push({ ts, glucose: g });
    }
  }

  if (rows.length === 0) return emptyStats();

  rows.sort((a, b) => a.ts.getTime() - b.ts.getTime());
  const values = rows.map((r) => r.glucose);
  const avg = mean(values);
  const sd = stddev(values, avg);
  const cv = (sd / avg) * 100;
  const ehba1c = (avg + 46.7) / 28.7; // Nathan 2008 formula
  const inRange = values.filter((g) => g >= 70 && g <= 140).length;
  const above = values.filter((g) => g > 140).length;
  const below = values.filter((g) => g < 70).length;

  const daySet = new Set(rows.map((r) => r.ts.toISOString().slice(0, 10)));
  const start = rows[0].ts;
  const end = rows[rows.length - 1].ts;

  return {
    avg_mg_dl: round1(avg),
    cv_pct: round1(cv),
    ehba1c_pct: round2(ehba1c),
    tir_pct: round1((100 * inRange) / values.length),
    tar_pct: round1((100 * above) / values.length),
    tbr_pct: round1((100 * below) / values.length),
    session_start: formatDate(start),
    session_end: formatDate(end),
    days_covered: daySet.size,
    n_readings: values.length,
  };
}

function emptyStats(): CgmStats {
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
    n_readings: 0,
  };
}

/** Minimal CSV split that handles quoted fields. */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        q = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') q = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseTimestamp(s: string | undefined): Date | null {
  if (!s) return null;
  const trimmed = s.trim().replace(/^"|"$/g, "");
  // Try ISO + native parser first
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;
  // Try DD/MM/YYYY HH:mm format
  const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})[\sT]+(\d{1,2}):(\d{2})/);
  if (m) {
    const [_, d, mo, y, h, mi] = m;
    const yr = y.length === 2 ? 2000 + Number(y) : Number(y);
    const dt = new Date(yr, Number(mo) - 1, Number(d), Number(h), Number(mi));
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[], mu: number): number {
  return Math.sqrt(xs.reduce((s, x) => s + (x - mu) ** 2, 0) / xs.length);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
