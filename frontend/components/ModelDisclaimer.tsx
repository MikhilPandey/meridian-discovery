/**
 * Consistent disclaimer banner. Drop on any page that shows a glucose curve
 * or a clinical estimate so the demo's scope is unmistakable.
 *
 * Pass `variant` to control framing:
 *   "curve"    — emphasises that curves are simulations
 *   "estimate" — emphasises that HbA1c estimates are research-only
 *   "general"  — both
 */
export default function ModelDisclaimer({
  variant = "general",
}: {
  variant?: "curve" | "estimate" | "general";
}) {
  const text =
    variant === "curve"
      ? "Meal-response curves are educational simulations, not GluFormer inference."
      : variant === "estimate"
      ? "HbA1c estimates use a Ridge head on real GluFormer embeddings. Research demo only — not validated for clinical use."
      : "Meal-response curves are educational simulations. HbA1c estimates use GluFormer-derived embeddings where available.";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed flex gap-3 items-start">
      <span className="font-semibold whitespace-nowrap">Demo model note:</span>
      <span>
        {text} Not a medical device — do not use for diagnosis or treatment decisions.
      </span>
    </div>
  );
}
