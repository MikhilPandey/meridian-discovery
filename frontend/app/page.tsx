import Link from "next/link";

const FEATURES = [
  {
    tag: "Real GluFormer",
    title: "HbA1c from a 1024-dim embedding",
    desc: "Real Segal-lab GluFormer embeddings from 113 Shanghai 2023 participants. Ridge regression head reproduces the published methodology (α=80). Predicted HbA1c tracks lab values.",
  },
  {
    tag: "Simulated · Phase 1",
    title: "Same meal, different bodies",
    desc: "Six metabolic archetypes — each anchored to a real Shanghai participant — respond to the same meal. Curves are physiological simulations, not model inference. Phase 2 swaps the simulator for real GluFormer autoregression once weights are available.",
  },
  {
    tag: "Literature-based",
    title: "Genomic overlay",
    desc: "Toggle a TCF7L2, GCK, SLC30A8, MTNR1B, or PPARG risk variant. Modifier sizes come from published GWAS literature (Zeevi 2015, Dupuis 2010, etc.) — not the model.",
  },
];

const TAG_CLASS: Record<string, string> = {
  "Real GluFormer": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Simulated · Phase 1": "bg-amber-50 text-amber-800 border-amber-200",
  "Literature-based": "bg-sky-50 text-sky-800 border-sky-200",
};

export default function LandingPage() {
  return (
    <div className="bg-meridian-green text-meridian-cream">
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24">
        <div className="text-xs uppercase tracking-[0.2em] text-meridian-gold mb-6">
          Meridian Discovery — research demonstration
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight max-w-4xl text-balance">
          See how your body responds to food.
          <br />
          <span className="text-meridian-gold">Same meal. Different biology.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-meridian-cream/80 text-lg leading-relaxed">
          A working demo of the Meridian product loop — CGM signal in, personalized prediction
          out, genome-aware modifiers explaining the gap between people. HbA1c predictions
          come from real GluFormer embeddings. Glucose response curves are physiological
          simulations until the trained GluFormer weights are available (Phase 2).
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-meridian-gold text-meridian-green font-medium hover:bg-meridian-gold-soft transition-colors"
          >
            Try the demo →
          </Link>
          <Link
            href="/profile/P001"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-meridian-cream/30 text-meridian-cream hover:bg-white/5 transition-colors"
          >
            See an example profile
          </Link>
        </div>
      </section>

      <section className="bg-meridian-cream-light text-meridian-body">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-xs uppercase tracking-[0.18em] text-meridian-muted mb-3">
            What&apos;s real today
          </div>
          <h2 className="text-2xl font-semibold text-meridian-green tracking-tight mb-8 max-w-3xl">
            Three layers in this demo, each with a different provenance.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-mono text-meridian-muted">0{i + 1}</div>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${TAG_CLASS[f.tag]}`}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-meridian-green mb-2">{f.title}</h3>
                <p className="text-sm text-meridian-body/80 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-meridian-body">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold text-meridian-green tracking-tight mb-4">
            What we can and can&apos;t claim
          </h2>
          <p className="text-meridian-body/85 leading-relaxed">
            We use real GluFormer outputs in the place they matter most: the HbA1c prediction
            head. That&apos;s the proof point that a foundation model captures metabolic state
            from CGM data alone. You can verify it on any profile page — the lab-measured HbA1c
            and the Ridge-predicted HbA1c sit side by side.
          </p>
          <p className="mt-4 text-meridian-body/85 leading-relaxed">
            We do <em>not</em> use GluFormer for the glucose response curves you see on
            Discover. The published Segal lab repo doesn&apos;t ship trained weights, so we
            generate curves from a pharmacokinetic model parameterised per archetype. The
            curves are clearly labelled as simulations everywhere they appear. The architecture
            is built so the simulator is a one-file drop-in for real model inference once
            weights exist.
          </p>
          <p className="mt-4 text-meridian-body/85 leading-relaxed">
            Genomic modifiers are based on published GWAS literature — TCF7L2 (Zeevi 2015,
            Grant 2006), GCK (Dupuis 2010), SLC30A8 (Sladek 2007), MTNR1B (Bouatia-Naji 2009),
            PPARG (Altshuler 2000). They are illustrative, not learned.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-meridian-green text-white text-sm font-medium hover:bg-meridian-green-soft transition-colors"
            >
              Open the demo →
            </Link>
            <Link
              href="/profile/P001"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-meridian-cream text-meridian-body text-sm hover:border-meridian-muted transition-colors"
            >
              See the GluFormer prediction in action →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
