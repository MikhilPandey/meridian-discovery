"""User-uploaded data endpoints.

Privacy invariants enforced here:
  - Files are read into memory only (UploadFile.read()) and discarded.
  - Nothing is written to disk.
  - No request body content is logged.
  - The endpoint returns a derived profile + interpreted variants — that's it.
"""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from deps import state
from services.cgm_profile import derive_profile
from services.glucose_simulator import (
    auc_above_baseline,
    generate_curve,
    peak,
    time_in_range_pct,
)
from services.pdf_extractor import extract_stats_from_pdf

router = APIRouter()


# Genotypes the frontend has already extracted from the user's 23andMe TXT.
# Format: { "TCF7L2": "CT", "GCK": "CC", ... }
class GenomePayload(BaseModel):
    genotypes: dict[str, str] = Field(default_factory=dict)


class CgmStats(BaseModel):
    avg_mg_dl: float | None = None
    cv_pct: float | None = None
    ehba1c_pct: float | None = None
    tir_pct: float | None = None
    tar_pct: float | None = None
    tbr_pct: float | None = None
    session_start: str | None = None
    session_end: str | None = None
    days_covered: int | None = None


class MePayload(BaseModel):
    genotypes: dict[str, str] = Field(default_factory=dict)
    cgm_stats: CgmStats = Field(default_factory=CgmStats)
    age: int | None = None
    sex: str | None = None
    meal_ids: list[str] | None = None  # which meals to predict against


@router.post("/api/me/cgm-pdf")
async def parse_cgm_pdf(file: UploadFile = File(...)):
    """Parse a vendor PDF report → standardized stats dict. PDF bytes discarded after parse."""
    if file.content_type and "pdf" not in file.content_type.lower():
        raise HTTPException(status_code=400, detail="Expected a PDF file")
    data = await file.read()
    if len(data) > 10_000_000:
        raise HTTPException(status_code=413, detail="PDF too large (>10MB)")
    try:
        stats = extract_stats_from_pdf(data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse PDF: {type(e).__name__}")
    finally:
        del data  # explicit
    return {"stats": stats}


@router.post("/api/me/profile")
def build_me_profile(payload: MePayload):
    """Build a 'You' participant from uploaded genome + CGM stats and return
    predicted curves for the standard meal set. Stateless — nothing persisted."""
    profile = derive_profile(payload.cgm_stats.model_dump(), age=payload.age, sex=payload.sex)
    profile["genomic_variants"] = payload.genotypes

    genomic_mod = state.genomic_modifier.combined_modifier(payload.genotypes or {})

    meals = state.meals
    if payload.meal_ids:
        wanted = set(payload.meal_ids)
        meals = [m for m in meals if m["name"] in wanted]

    sample_responses = []
    for meal in meals:
        curve = generate_curve(profile, meal, genomic_modifier=genomic_mod)
        sample_responses.append(
            {
                "meal": meal,
                "curve": curve,
                "peak": peak(curve),
                "time_in_range_pct": time_in_range_pct(curve),
                "auc_above_baseline": auc_above_baseline(curve, profile["baseline_fasting"]),
            }
        )

    variant_panel = {}
    for gene in state.genomic_modifier.snps:
        gt = payload.genotypes.get(gene)
        if gt is None:
            continue
        snp_def = state.genomic_modifier.snps[gene]
        variant_panel[gene] = {
            "rsid": snp_def.get("rsid"),
            "genotype": gt,
            "effect": snp_def.get("effect"),
            "interpretation": state.genomic_modifier.interpret(gene, gt),
            "risk_allele": snp_def.get("risk_allele"),
        }

    return {
        "profile": profile,
        "genomic_variants": variant_panel,
        "modifier": genomic_mod,
        "sample_responses": sample_responses,
    }


@router.post("/api/me/compare")
def compare_me_to_archetypes(payload: MePayload):
    """Return curves for the 6 archetypes + a 7th 'You' line for the given meal set.
    Caller passes meal_ids = single meal name (or omits to default to first)."""
    profile = derive_profile(payload.cgm_stats.model_dump(), age=payload.age, sex=payload.sex)
    profile["genomic_variants"] = payload.genotypes
    genomic_mod = state.genomic_modifier.combined_modifier(payload.genotypes or {})

    meal_name = (payload.meal_ids or [state.meals[0]["name"]])[0]
    meal = next((m for m in state.meals if m["name"] == meal_name), state.meals[0])

    results = []
    for p in state.participants:
        archetype_mod = state.genomic_modifier.combined_modifier(p.get("genomic_variants", {}))
        curve = generate_curve(p, meal, genomic_modifier=archetype_mod)
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
                "baseline_fasting": p["baseline_fasting"] + archetype_mod["fasting_offset"],
            }
        )

    me_curve = generate_curve(profile, meal, genomic_modifier=genomic_mod)
    results.append(
        {
            "participant": {
                "id": "ME",
                "label": "You",
                "age": profile["age"],
                "description": profile["description"],
                "genomic_variants": payload.genotypes,
            },
            "curve": me_curve,
            "peak": peak(me_curve),
            "time_in_range_pct": time_in_range_pct(me_curve),
            "auc_above_baseline": auc_above_baseline(me_curve, profile["baseline_fasting"]),
            "baseline_fasting": profile["baseline_fasting"] + genomic_mod["fasting_offset"],
        }
    )

    return {"meal": meal, "results": results}
