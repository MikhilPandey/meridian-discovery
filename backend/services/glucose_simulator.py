import math
import random
from typing import Iterable


def generate_curve(
    profile: dict,
    meal: dict,
    duration_minutes: int = 180,
    interval_minutes: int = 5,
    genomic_modifier: dict | None = None,
    seed: int | None = None,
) -> list[dict]:
    """Postprandial glucose response curve using a smoothed dual-exponential.

    Returns: list of {"time_minutes": int, "glucose_mg_dl": float}.
    """
    rng = random.Random(seed if seed is not None else hash((profile.get("id"), meal.get("name"))) & 0xFFFFFFFF)

    carbs = float(meal.get("carbs_g") or 0)
    protein = float(meal.get("protein_g") or 0)
    fat = float(meal.get("fat_g") or 0)

    insulin_sens = profile["insulin_sensitivity"]
    fat_attenuation = profile["fat_attenuation"]
    peak_delay = profile["peak_delay_minutes"]
    baseline = profile["baseline_fasting"]

    if genomic_modifier:
        amp_mod = float(genomic_modifier.get("amplitude", 1.0))
        clearance_mod = float(genomic_modifier.get("clearance", 1.0))
        fasting_offset = float(genomic_modifier.get("fasting_offset", 0.0))
    else:
        amp_mod = 1.0
        clearance_mod = 1.0
        fasting_offset = 0.0

    baseline = baseline + fasting_offset

    effective_carbs = carbs * profile["carb_sensitivity"]
    protein_contribution = protein * profile["protein_effect"] * 0.15
    fat_delay = 1.0 + (fat * fat_attenuation * 0.02)

    amplitude = (effective_carbs + protein_contribution) / max(insulin_sens, 0.1)
    amplitude *= amp_mod

    tau_rise = peak_delay * fat_delay
    tau_fall = tau_rise * (2.0 + (1.0 / max(insulin_sens, 0.1))) / max(clearance_mod, 0.1)
    rise_sigma = max(tau_rise * 0.4, 5.0)

    points: list[dict] = []
    drift = 0.0
    for t in range(0, duration_minutes + 1, interval_minutes):
        rise = math.exp(-((t - tau_rise) ** 2) / (2 * rise_sigma ** 2))
        fall = math.exp(-(t - tau_rise) / tau_fall) if t > tau_rise else 0.0
        glucose = baseline + amplitude * (rise - fall * 0.3)
        drift += rng.gauss(0, 0.6)
        drift = max(min(drift, 3.0), -3.0)
        glucose += rng.gauss(0, 1.2) + drift * 0.3
        points.append({"time_minutes": t, "glucose_mg_dl": round(glucose, 1)})

    return points


def time_in_range_pct(curve: Iterable[dict], lower: float = 70.0, upper: float = 140.0) -> float:
    pts = list(curve)
    if not pts:
        return 0.0
    in_range = sum(1 for p in pts if lower <= p["glucose_mg_dl"] <= upper)
    return round(100.0 * in_range / len(pts), 1)


def auc_above_baseline(curve: list[dict], baseline: float) -> float:
    if len(curve) < 2:
        return 0.0
    auc = 0.0
    for i in range(1, len(curve)):
        dt = curve[i]["time_minutes"] - curve[i - 1]["time_minutes"]
        h1 = max(0.0, curve[i - 1]["glucose_mg_dl"] - baseline)
        h2 = max(0.0, curve[i]["glucose_mg_dl"] - baseline)
        auc += (h1 + h2) / 2.0 * dt
    return round(auc, 1)


def peak(curve: list[dict]) -> dict:
    p = max(curve, key=lambda x: x["glucose_mg_dl"])
    return {"time_minutes": p["time_minutes"], "glucose_mg_dl": p["glucose_mg_dl"]}
