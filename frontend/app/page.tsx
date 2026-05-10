import Link from "next/link";

const FEATURES = [
  {
    title: "Same meal, different bodies",
    desc: "Six real metabolic phenotypes respond to the same meal. The pre-diabetic spikes to 195. The athlete barely hits 130.",
  },
  {
    title: "Metabolic health profile",
    desc: "From a 14-day CGM trace, GluFormer extracts a 1024-dim embedding that predicts HbA1c, fasting glucose, and risk tier.",
  },
  {
    title: "Genomic overlay",
    desc: "Toggle a TCF7L2 risk variant and watch the curve shift. The genome explains why two people with identical CGM histories trend apart.",
  },
];

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
          Personalized glucose response prediction, grounded in continuous glucose monitor data
          and genome-aware modifiers. Built on the GluFormer architecture — the first foundation
          model for metabolism.
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
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-6">
                <div className="text-xs font-mono text-meridian-gold mb-3">0{i + 1}</div>
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
            Why this matters
          </h2>
          <p className="text-meridian-body/85 leading-relaxed">
            Personalized nutrition has been gated by tooling. Most products either give everyone
            the same advice or rely on shallow questionnaires. Meridian closes the loop — CGM
            traces feed a foundation model that captures real metabolic state, and a genome
            overlay explains why responses differ between people who look the same on paper.
          </p>
          <p className="mt-4 text-meridian-body/85 leading-relaxed">
            This demo runs on real GluFormer embeddings from the Shanghai 2023 cohort, with a
            Ridge regression head trained per the published methodology. Glucose response curves
            are simulated from physiological pharmacokinetic models. The genomic modifiers come
            from published GWAS literature — TCF7L2, GCK, SLC30A8, MTNR1B, PPARG.
          </p>
          <p className="mt-4 text-meridian-body/85 leading-relaxed">
            What you cannot do here yet: feed in your own raw CGM data and get a personalized
            response. That requires the trained GluFormer weights and a small inference fleet.
            That is Phase 2.
          </p>
          <div className="mt-8">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-meridian-green text-white text-sm font-medium hover:bg-meridian-green-soft transition-colors"
            >
              Open the demo →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
