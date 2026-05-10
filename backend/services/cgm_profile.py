"""Derive a metabolic profile (the same shape used for P001-P006) from CGM summary stats.

Inputs are aggregate stats — average glucose, CV, eHbA1c, TIR — from either a
raw CSV summary or a parsed PDF report. We map them onto the same parameter
space the simulator uses so user curves render with the same primitives.

Nothing about the source CGM data is persisted. Inputs are passed by value.
"""

from __future__ import annotations

from typing import Any


def derive_profile(stats: dict[str, Any], age: int | None = None, sex: str | None = None) -> dict:
    """Map CGM summary stats to the metabolic-profile shape used by the simulator.

    Required keys in `stats` (any may be None):
      avg_mg_dl, cv_pct, ehba1c_pct, tir_pct, tar_pct, tbr_pct,
      session_start (ISO date), session_end (ISO date), days_covered (int)

    Returns dict with same keys as participant_profiles.json items, minus
    shanghai_id and genomic_variants (those come from the user's genome upload).
    """
    avg = _coerce_float(stats.get("avg_mg_dl"))
    cv = _coerce_float(stats.get("cv_pct"))
    ehba1c = _coerce_float(stats.get("ehba1c_pct"))
    tir = _coerce_float(stats.get("tir_pct"))

    # Baseline fasting: lower-bounded by avg minus contribution of post-prandial
    # excursions. Approximation: fasting ≈ avg − 0.4 · CV/100 · avg, clipped.
    if avg is not None and cv is not None:
        baseline_fasting = max(70.0, avg - 0.4 * (cv / 100.0) * avg)
    elif avg is not None:
        baseline_fasting = max(70.0, avg - 8.0)
    else:
        baseline_fasting = 95.0

    # Insulin sensitivity inversely tracks eHbA1c. 5.0%→1.4, 6.5%→0.7, 8%→0.5.
    if ehba1c is not None:
        sens = _clip(2.4 - 0.25 * ehba1c, 0.45, 1.55)
    elif tir is not None:
        sens = _clip(0.5 + (tir / 100.0), 0.45, 1.55)
    else:
        sens = 1.0

    # Carb sensitivity tracks CV (more variable → bigger spikes).
    if cv is not None:
        carb_sens = _clip(0.6 + cv / 30.0, 0.5, 1.6)
    else:
        carb_sens = 1.0

    # Peak delay weakly tracks insulin sensitivity (slower = later peak).
    peak_delay = _clip(35 + (1.0 - sens) * 25, 30, 60)

    return {
        "id": "ME",
        "label": "You",
        "age": age or 35,
        "sex": sex,
        "description": _describe(avg, ehba1c, tir, cv),
        "baseline_fasting": round(baseline_fasting, 1),
        "insulin_sensitivity": round(sens, 2),
        "peak_delay_minutes": round(peak_delay, 1),
        "clearance_rate": round(_clip(0.06 - (1.0 - sens) * 0.04, 0.015, 0.06), 3),
        "carb_sensitivity": round(carb_sens, 2),
        "protein_effect": 1.0,
        "fat_attenuation": 0.5,
        "cgm_summary": {
            "avg_mg_dl": _round_or_none(avg, 1),
            "cv_pct": _round_or_none(cv, 1),
            "ehba1c_pct": _round_or_none(ehba1c, 2),
            "tir_pct": _round_or_none(tir, 1),
            "tar_pct": _round_or_none(_coerce_float(stats.get("tar_pct")), 1),
            "tbr_pct": _round_or_none(_coerce_float(stats.get("tbr_pct")), 1),
            "session_start": stats.get("session_start"),
            "session_end": stats.get("session_end"),
            "days_covered": stats.get("days_covered"),
        },
    }


def _coerce_float(v: Any) -> float | None:
    if v is None or v == "" or v == "--":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _clip(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _round_or_none(v: float | None, n: int) -> float | None:
    return None if v is None else round(v, n)


def _describe(avg, ehba1c, tir, cv) -> str:
    if avg is None and ehba1c is None:
        return "Profile derived from your uploaded CGM data."
    bits = []
    if ehba1c is not None:
        if ehba1c < 5.7:
            bits.append("estimated HbA1c in healthy range")
        elif ehba1c < 6.5:
            bits.append("estimated HbA1c in pre-diabetic range")
        else:
            bits.append("estimated HbA1c in diabetic range")
    if tir is not None:
        if tir >= 90:
            bits.append("excellent time-in-range")
        elif tir >= 70:
            bits.append("good time-in-range")
        else:
            bits.append("low time-in-range")
    if cv is not None:
        bits.append("low glucose variability" if cv < 20 else "moderate glucose variability" if cv < 33 else "high glucose variability")
    return "Your CGM shows " + ", ".join(bits) + "."
