"""Provenance metadata attached to every model output.

Every API response that returns a glucose curve or a clinical estimate should
also tell the caller (a) what model produced it, (b) whether that model is
real GluFormer inference or a simulation, and (c) whether the output is
intended for clinical use. This makes overclaiming impossible at the API
boundary even if the UI ever drifts.
"""

from __future__ import annotations

CURVE_DISCLAIMER = (
    "Meal-response curves are educational simulations, not clinical predictions."
)

HBA1C_DISCLAIMER = (
    "HbA1c estimates use a Ridge head on real GluFormer embeddings (Segal lab "
    "methodology). Demo only — not validated for clinical use."
)


def curve_model_meta() -> dict:
    """Provenance for any endpoint that returns a glucose curve."""
    return {
        "curve_model": "physiologic_simulator",
        "uses_gluformer_for_curve": False,
        "uses_genomic_overlay": True,
        "genomic_overlay_type": "heuristic_snp_modifier",
        "clinical_use": False,
        "disclaimer": CURVE_DISCLAIMER,
    }


def hba1c_model_meta(alpha: float, n_train: int, real_embedding_used: bool) -> dict:
    """Provenance for the HbA1c Ridge head."""
    return {
        "hba1c_model": "ridge_on_gluformer_embedding",
        "ridge_alpha": alpha,
        "training_n": n_train,
        "real_embedding_used": real_embedding_used,
        "validated_for_demo": False,
        "clinical_use": False,
        "disclaimer": HBA1C_DISCLAIMER,
    }
