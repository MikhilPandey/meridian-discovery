from services.cgm_profile import derive_profile


def test_empty_stats_returns_defaults():
    p = derive_profile({})
    assert p["id"] == "ME"
    assert p["baseline_fasting"] == 95.0
    assert p["insulin_sensitivity"] == 1.0
    assert p["carb_sensitivity"] == 1.0


def test_high_ehba1c_lowers_insulin_sensitivity():
    healthy = derive_profile({"avg_mg_dl": 95, "cv_pct": 15, "ehba1c_pct": 5.0, "tir_pct": 95})
    pre_diabetic = derive_profile({"avg_mg_dl": 130, "cv_pct": 25, "ehba1c_pct": 6.5, "tir_pct": 60})
    assert healthy["insulin_sensitivity"] > pre_diabetic["insulin_sensitivity"]


def test_high_cv_raises_carb_sensitivity():
    low_var = derive_profile({"cv_pct": 14})
    high_var = derive_profile({"cv_pct": 35})
    assert high_var["carb_sensitivity"] > low_var["carb_sensitivity"]


def test_age_and_sex_passthrough():
    p = derive_profile({}, age=42, sex="F")
    assert p["age"] == 42
    assert p["sex"] == "F"


def test_cgm_summary_preserves_input():
    p = derive_profile({"avg_mg_dl": 101, "tir_pct": 97, "days_covered": 15})
    assert p["cgm_summary"]["avg_mg_dl"] == 101.0
    assert p["cgm_summary"]["tir_pct"] == 97.0
    assert p["cgm_summary"]["days_covered"] == 15


def test_dashes_treated_as_missing():
    p = derive_profile({"avg_mg_dl": "--", "tir_pct": "--"})
    assert p["cgm_summary"]["avg_mg_dl"] is None
    assert p["cgm_summary"]["tir_pct"] is None
