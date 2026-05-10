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


class CompareRequest(BaseModel):
    meal: Meal
    participant_ids: list[str] | None = None


@router.post("/api/compare")
def compare(req: CompareRequest):
    ids = req.participant_ids or [p["id"] for p in state.participants]
    results = []
    for pid in ids:
        p = state.participants_by_id.get(pid)
        if not p:
            raise HTTPException(status_code=404, detail=f"Unknown participant_id: {pid}")
        genomic_mod = state.genomic_modifier.combined_modifier(p.get("genomic_variants", {}))
        curve = generate_curve(p, req.meal.model_dump(), genomic_modifier=genomic_mod)
        results.append(
            {
                "participant": {
                    "id": p["id"],
                    "label": p["label"],
                    "age": p["age"],
                    "description": p.get("description", ""),
                    "genomic_variants": p.get("genomic_variants", {}),
                },
                "curve": curve,
                "peak": peak(curve),
                "time_in_range_pct": time_in_range_pct(curve),
                "auc_above_baseline": auc_above_baseline(curve, p["baseline_fasting"]),
                "baseline_fasting": p["baseline_fasting"] + genomic_mod["fasting_offset"],
            }
        )
    return {"meal": req.meal.model_dump(), "results": results}
