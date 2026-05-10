from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from deps import state
from services.glucose_simulator import (
    auc_above_baseline,
    generate_curve,
    peak,
    time_in_range_pct,
)

router = APIRouter()


class Meal(BaseModel):
    name: str = "Custom Meal"
    carbs_g: float = Field(0, ge=0, le=300)
    protein_g: float = Field(0, ge=0, le=300)
    fat_g: float = Field(0, ge=0, le=300)


class PredictRequest(BaseModel):
    participant_id: str
    meal: Meal
    genomic_overrides: dict[str, str] | None = None


def _apply_genomics(profile: dict, overrides: dict[str, str] | None) -> dict | None:
    base = dict(profile.get("genomic_variants", {}))
    if overrides:
        base.update(overrides)
    if not base:
        return None
    return state.genomic_modifier.combined_modifier(base)


def _participant_summary(p: dict) -> dict:
    return {"id": p["id"], "label": p["label"], "age": p["age"], "description": p.get("description", "")}


@router.post("/api/predict")
def predict(req: PredictRequest):
    p = state.participants_by_id.get(req.participant_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Unknown participant_id: {req.participant_id}")

    genomic_mod = _apply_genomics(p, req.genomic_overrides)
    profile = {**p, "id": p["id"]}
    curve = generate_curve(profile, req.meal.model_dump(), genomic_modifier=genomic_mod)
    pk = peak(curve)
    return {
        "participant": _participant_summary(p),
        "meal": req.meal.model_dump(),
        "curve": curve,
        "peak": pk,
        "time_in_range_pct": time_in_range_pct(curve),
        "auc_above_baseline": auc_above_baseline(curve, p["baseline_fasting"]),
        "baseline_fasting": p["baseline_fasting"] + (genomic_mod["fasting_offset"] if genomic_mod else 0),
    }
