from fastapi import APIRouter, HTTPException

from deps import state
from services.glucose_simulator import (
    auc_above_baseline,
    generate_curve,
    peak,
    time_in_range_pct,
)
from services.model_meta import curve_model_meta, hba1c_model_meta

router = APIRouter()


SAMPLE_MEALS = [
    {"name": "White Rice (1 cup)", "carbs_g": 45, "protein_g": 4, "fat_g": 0},
    {"name": "Margherita Pizza (2 slices)", "carbs_g": 52, "protein_g": 18, "fat_g": 22},
    {"name": "Grilled Chicken Salad", "carbs_g": 12, "protein_g": 35, "fat_g": 15},
    {"name": "Banana", "carbs_g": 27, "protein_g": 1, "fat_g": 0},
]


def _build_insights(profile: dict, hba1c_mmol: float, risk_tier: str) -> list[str]:
    insights = []
    sens = profile["insulin_sensitivity"]
    if sens >= 1.2:
        insights.append("Strong insulin sensitivity -- glucose clears quickly after meals.")
    elif sens >= 0.85:
        insights.append("Average insulin sensitivity -- typical post-meal glucose dynamics.")
    else:
        insights.append("Reduced insulin sensitivity -- post-meal glucose stays elevated longer than average.")

    if profile["fat_attenuation"] >= 0.8:
        insights.append("High-fat meals delay your glucose response, producing prolonged elevations rather than sharp spikes.")

    if profile["carb_sensitivity"] >= 1.2:
        insights.append("High carbohydrate sensitivity -- starchy foods produce larger spikes than average.")
    elif profile["carb_sensitivity"] <= 0.7:
        insights.append("Low carbohydrate sensitivity -- you tolerate moderate carb loads well.")

    variants = profile.get("genomic_variants", {})
    if variants.get("TCF7L2") in {"CT", "TT"}:
        insights.append(
            "TCF7L2 risk allele present -- known to impair beta-cell insulin secretion. Glucose spikes may be elevated relative to phenotype alone."
        )
    if variants.get("GCK") in {"CT", "TT"}:
        insights.append("GCK variant present -- baseline fasting glucose set-point is elevated.")

    if risk_tier == "high":
        insights.append("Predicted HbA1c is in the diabetic range -- clinical follow-up is recommended.")
    elif risk_tier == "moderate":
        insights.append("Predicted HbA1c is in the pre-diabetic range -- lifestyle intervention can be highly effective at this stage.")
    else:
        insights.append("Predicted HbA1c is in the healthy range.")

    return insights


@router.get("/api/profile/{participant_id}")
def get_profile(participant_id: str):
    p = state.participants_by_id.get(participant_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Unknown participant_id: {participant_id}")

    store = state.embedding_store
    predictor = state.health_predictor

    shanghai_id = p.get("shanghai_id")
    has_real_embedding = shanghai_id is not None and store.has(int(shanghai_id))

    if has_real_embedding:
        emb = store.get_embedding(int(shanghai_id))
        hba1c_predicted = predictor.predict_hba1c(emb)
        hba1c_actual = store.get_hba1c_actual(int(shanghai_id))
        gmi_actual = store.get_gmi(int(shanghai_id))
    else:
        hba1c_predicted = 36.0
        hba1c_actual = None
        gmi_actual = None

    risk_tier = predictor.risk_tier(hba1c_predicted)
    score = predictor.metabolic_score(hba1c_predicted)

    variant_panel = {}
    for gene, genotype in p.get("genomic_variants", {}).items():
        snp_def = state.genomic_modifier.snps.get(gene, {})
        variant_panel[gene] = {
            "rsid": snp_def.get("rsid"),
            "genotype": genotype,
            "effect": snp_def.get("effect"),
            "interpretation": state.genomic_modifier.interpret(gene, genotype),
            "risk_allele": snp_def.get("risk_allele"),
            "evidence_level": snp_def.get("evidence_level"),
            "modifier_status": snp_def.get("modifier_status"),
            "clinical_use": snp_def.get("clinical_use"),
        }

    sample_responses = []
    genomic_mod = state.genomic_modifier.combined_modifier(p.get("genomic_variants", {}))
    for meal in SAMPLE_MEALS:
        curve = generate_curve(p, meal, genomic_modifier=genomic_mod)
        sample_responses.append(
            {
                "meal": meal,
                "curve": curve,
                "peak": peak(curve),
                "time_in_range_pct": time_in_range_pct(curve),
                "auc_above_baseline": auc_above_baseline(curve, p["baseline_fasting"]),
            }
        )

    return {
        "participant": {
            "id": p["id"],
            "label": p["label"],
            "age": p["age"],
            "sex": p.get("sex"),
            "description": p.get("description", ""),
            "shanghai_id": shanghai_id if has_real_embedding else None,
        },
        "metabolic_score": score,
        "hba1c": {
            "predicted_mmol_mol": round(hba1c_predicted, 1),
            "predicted_pct": predictor.mmol_to_pct(hba1c_predicted),
            "actual_mmol_mol": round(hba1c_actual, 1) if hba1c_actual is not None else None,
            "actual_pct": predictor.mmol_to_pct(hba1c_actual) if hba1c_actual is not None else None,
        },
        "gmi": round(gmi_actual, 2) if gmi_actual is not None else None,
        "risk_tier": risk_tier,
        "fasting_glucose_estimate": p["baseline_fasting"] + genomic_mod["fasting_offset"],
        "genomic_variants": variant_panel,
        "insights": _build_insights(p, hba1c_predicted, risk_tier),
        "sample_responses": sample_responses,
        "model_meta": {
            **hba1c_model_meta(
                alpha=predictor.alpha,
                n_train=predictor.n_train,
                real_embedding_used=has_real_embedding,
            ),
            "curves": curve_model_meta(),
        },
    }


@router.get("/api/participants")
def list_participants():
    return [
        {
            "id": p["id"],
            "label": p["label"],
            "age": p["age"],
            "sex": p.get("sex"),
            "description": p.get("description", ""),
            "genomic_variants": p.get("genomic_variants", {}),
        }
        for p in state.participants
    ]
