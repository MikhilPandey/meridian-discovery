# Meridian Discovery

A research demo of personalized glucose response prediction with a genomic
overlay, built on top of the GluFormer architecture (Segal Lab, Weizmann
Institute, Nature 2025).

> **What it does.** Pick a meal, see how six real metabolic phenotypes respond
> differently. Toggle a TCF7L2 risk variant and watch the curve shift. Optionally
> upload your own 23andMe + CGM data to compare yourself against the archetypes.

## What's real, what's not

Be precise about this before claiming anything publicly:

| Component | Status | Notes |
| --- | --- | --- |
| 113 × 1024-dim **GluFormer embeddings** (Shanghai 2023) | **Real GluFormer output** | Pre-extracted by Segal lab, published in their [demo dir](https://github.com/Guylu/GluFormer/tree/main/demo), used as-is. |
| **HbA1c prediction** on `/profile/[id]` and `/me` | **Real GluFormer-derived** | Ridge regression (α=80) on the real embeddings, mirroring `Pred_Shanghai.py`. Predicted values track lab-measured HbA1c. |
| **Glucose response curves** on `/discover` (the hero visual) | **Pharmacokinetic simulation** | Dual-exponential model parameterised per archetype. Not GluFormer — trained weights are not publicly released. The simulator is a one-file drop-in target for real GluFormer autoregression in Phase 2. |
| **Archetype metabolic profiles** (P001–P006) | **Hand-curated** | Each is anchored to a real Shanghai participant whose lab HbA1c matches the archetype's band, but the simulator parameters (`insulin_sensitivity`, `carb_sensitivity`, etc.) are picked to tell a clear story. |
| **SNP modifiers** (TCF7L2, GCK, SLC30A8, MTNR1B, PPARG) | **Published GWAS literature** | Zeevi 2015, Grant 2006, Dupuis 2010, Sladek 2007, Bouatia-Naji 2009, Altshuler 2000. Illustrative, not learned. |
| **User-uploaded CGM → metabolic profile** (`/me`) | **Heuristic** | Simple rules-based mapping from CGM summary stats (avg, CV, eHbA1c, TIR) to simulator parameters. Not a learned model. |

### What you can and cannot claim

- ✅ "Built on real GluFormer embeddings from the Shanghai 2023 cohort."
- ✅ "Reproduces the GluFormer paper's HbA1c prediction methodology."
- ✅ "Demonstrates that a foundation-model embedding of CGM data predicts clinical glycemic markers."
- ❌ Don't say "glucose response curves are GluFormer predictions" — they aren't.
- ❌ Don't say "built entirely on GluFormer" — the hero visual is a simulation.

The UI labels every screen explicitly with **"Real GluFormer"** (emerald) or
**"Simulated"** (amber) tags so a skeptical viewer can tell at a glance what
they're looking at.

## What's in here

```
meridian-discovery/
├── backend/                      # FastAPI (Python 3.12)
│   ├── routers/                  # /api/compare, /predict, /profile/[id], /me
│   ├── services/                 # embedding store, Ridge, simulator, SNP modifier
│   └── data/                     # Shanghai embeddings + HbA1c + GMI + 6 archetypes
└── frontend/                     # Next.js 14 + Tailwind + Recharts
    ├── app/
    │   ├── page.tsx              # landing
    │   ├── discover/             # same meal, different bodies (hero demo)
    │   ├── profile/[id]/         # per-archetype deep dive
    │   ├── upload/               # drag-drop 23andMe + CGM
    │   └── me/                   # your derived profile + predicted curves
    ├── components/               # chart, meal selector, genomic overlay, file drop
    └── lib/                      # api client, parsers, in-memory user store
```

## Run it locally

```bash
# 1) Backend (terminal 1)
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000

# 2) Frontend (terminal 2)
cd frontend
cp .env.example .env.local         # NEXT_PUBLIC_API_BASE=http://localhost:8000
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Path | What it does |
| --- | --- |
| `/` | Landing — hero, three feature cards, CTAs |
| `/discover` | Pick a meal, see 6 archetypes' glucose curves, toggle SNP genotypes |
| `/profile/P001…P006` | Per-archetype deep dive: predicted vs actual HbA1c, variants, mini curves per meal |
| `/upload` | Drag-drop 23andMe TXT + CGM CSV/PDF |
| `/me` | Your genome panel, CGM summary, derived metabolic profile, predicted responses |

When you have uploaded data, `/discover` adds a **"You"** line to the chart and a
"Show my line" toggle in the header.

## Privacy model for uploads

Uploaded files (23andMe TXT, CGM CSV, CGM PDF) are processed ephemerally:

- **23andMe TXT** is parsed entirely in your browser. Only the 5 SNPs we
  interpret (TCF7L2, GCK, SLC30A8, MTNR1B, PPARG) leave your machine — as a tiny
  JSON `{gene: genotype}` payload.
- **CGM CSV** is parsed entirely in your browser. Summary stats (avg, CV, eHbA1c,
  TIR/TAR/TBR, date range, day count) are derived locally; only those numbers
  are sent to the backend.
- **CGM PDF** is the only path that uploads bytes to the backend, because PDF
  parsing needs `pypdf`. Bytes are read into memory, parsed, and discarded —
  never written to disk.
- The backend never persists user data. Each request is stateless.
- The frontend keeps user data in module-scoped React state. **Refreshing the
  page wipes it.** There is no `localStorage`, `sessionStorage`, cookie, or
  IndexedDB persistence.
- The repo's root `.gitignore` blocks `*.txt`, `*.csv`, `*.pdf`, and common
  vendor file prefixes from being committed even if a file ends up in the tree.

## Deploy

### Frontend → Vercel

```bash
cd frontend
npx vercel        # follow prompts; link to your account
# In Vercel dashboard, set env var NEXT_PUBLIC_API_BASE = https://<your-render-url>
```

### Backend → Render

This repo includes `render.yaml`. From the [Render dashboard](https://render.com/),
choose **New → Blueprint** and point it at this repo. Render will pick up the
config and build `backend/`. After the service is live:

1. Copy the Render URL (e.g. `https://meridian-discovery-api.onrender.com`).
2. Set `NEXT_PUBLIC_API_BASE` in Vercel to that URL.
3. Set `CORS_ORIGINS` in Render to your Vercel URL (e.g. `https://meridian-discovery.vercel.app`).
4. Redeploy frontend.

Free tier on Render sleeps after 15 minutes of inactivity — first request after
sleep takes 30–60s. Upgrade to Starter ($7/mo) to keep it warm.

## The Shanghai data

`backend/data/embeddings.csv`, `hba1c.csv`, and `gmi.csv` are copied from the
public [GluFormer demo dir](https://github.com/Guylu/GluFormer/tree/main/demo).
P001–P006 are mapped to real Shanghai participant IDs that match each archetype's
HbA1c band. Ridge α=80 follows the published methodology (`Pred_Shanghai.py`),
trained on n=105 matched pairs and de-normalized for honest mmol/mol output.

## Phase 2

`services/glucose_simulator.py` is a drop-in replacement target. When trained
GluFormer weights are available:

- Replace it with `glucose_model.py` that loads weights, tokenizes meals as
  dietary tokens, and runs autoregressive 48-step generation.
- The API contracts stay identical. The frontend doesn't change.

## License

MIT — open-source on purpose. Built to be hosted, forked, and extended.
