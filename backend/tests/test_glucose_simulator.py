from services.glucose_simulator import (
    auc_above_baseline,
    generate_curve,
    peak,
    time_in_range_pct,
)


PROFILE = {
    "id": "P_TEST",
    "baseline_fasting": 90,
    "insulin_sensitivity": 1.0,
    "peak_delay_minutes": 35,
    "clearance_rate": 0.03,
    "carb_sensitivity": 1.0,
    "protein_effect": 1.0,
    "fat_attenuation": 0.5,
}

MEAL = {"name": "test", "carbs_g": 45, "protein_g": 10, "fat_g": 5}


def test_curve_length_default_is_37_points():
    curve = generate_curve(PROFILE, MEAL, seed=42)
    # 0..180 step 5 → 37 points
    assert len(curve) == 37


def test_curve_is_deterministic_with_same_seed():
    a = generate_curve(PROFILE, MEAL, seed=123)
    b = generate_curve(PROFILE, MEAL, seed=123)
    assert a == b


def test_different_seeds_produce_different_curves():
    a = generate_curve(PROFILE, MEAL, seed=1)
    b = generate_curve(PROFILE, MEAL, seed=2)
    # Should differ at least somewhere
    assert any(pa["glucose_mg_dl"] != pb["glucose_mg_dl"] for pa, pb in zip(a, b))


def test_glucose_values_stay_in_plausible_range():
    curve = generate_curve(PROFILE, MEAL, seed=7)
    for p in curve:
        assert 40 <= p["glucose_mg_dl"] <= 400, p


def test_higher_carb_meal_produces_higher_peak():
    low = generate_curve(PROFILE, {"name": "x", "carbs_g": 10, "protein_g": 5, "fat_g": 5}, seed=11)
    high = generate_curve(PROFILE, {"name": "x", "carbs_g": 80, "protein_g": 5, "fat_g": 5}, seed=11)
    assert peak(high)["glucose_mg_dl"] > peak(low)["glucose_mg_dl"]


def test_genomic_amplitude_modifier_raises_peak():
    base = generate_curve(PROFILE, MEAL, seed=4)
    boosted = generate_curve(
        PROFILE,
        MEAL,
        seed=4,
        genomic_modifier={"amplitude": 1.5, "clearance": 1.0, "fasting_offset": 0.0},
    )
    assert peak(boosted)["glucose_mg_dl"] > peak(base)["glucose_mg_dl"]


def test_time_in_range_pct_is_between_0_and_100():
    curve = generate_curve(PROFILE, MEAL, seed=9)
    tir = time_in_range_pct(curve)
    assert 0 <= tir <= 100


def test_auc_above_baseline_is_nonnegative_for_normal_meal():
    curve = generate_curve(PROFILE, MEAL, seed=3)
    assert auc_above_baseline(curve, PROFILE["baseline_fasting"]) >= 0
