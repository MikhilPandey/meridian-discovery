"""End-to-end route tests via FastAPI TestClient.

We do not start a real server. The app's lifespan handler initializes the
embedding store, Ridge model, etc., so TestClient triggers the same path
as production.
"""
import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_list_meals(client):
    r = client.get("/api/meals")
    assert r.status_code == 200
    meals = r.json()
    assert len(meals) >= 6
    assert all("carbs_g" in m for m in meals)


def test_list_participants_returns_six(client):
    r = client.get("/api/participants")
    assert r.status_code == 200
    ids = [p["id"] for p in r.json()]
    assert ids == ["P001", "P002", "P003", "P004", "P005", "P006"]


def test_snps_catalog(client):
    r = client.get("/api/snps")
    assert r.status_code == 200
    snps = r.json()
    assert set(snps.keys()) == {"TCF7L2", "GCK", "SLC30A8", "MTNR1B", "PPARG"}


def test_compare_returns_curves_and_meta(client):
    r = client.post(
        "/api/compare",
        json={"meal": {"name": "test", "carbs_g": 45, "protein_g": 4, "fat_g": 0}},
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body["results"]) == 6
    assert body["model_meta"]["uses_gluformer_for_curve"] is False
    assert body["model_meta"]["clinical_use"] is False


def test_profile_returns_real_gluformer_metadata(client):
    r = client.get("/api/profile/P001")
    assert r.status_code == 200
    body = r.json()
    meta = body["model_meta"]
    assert meta["hba1c_model"] == "ridge_on_gluformer_embedding"
    assert meta["real_embedding_used"] is True
    # Per-meal curves are still simulations even on the profile page
    assert meta["curves"]["uses_gluformer_for_curve"] is False


def test_unknown_participant_404(client):
    r = client.get("/api/profile/P999")
    assert r.status_code == 404


def test_me_profile_minimal_payload(client):
    r = client.post(
        "/api/me/profile",
        json={
            "genotypes": {"TCF7L2": "CT"},
            "cgm_stats": {"avg_mg_dl": 100, "cv_pct": 18, "ehba1c_pct": 5.2, "tir_pct": 90},
            "age": 35,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["profile"]["id"] == "ME"
    assert "TCF7L2" in body["genomic_variants"]
    assert body["model_meta"]["uses_gluformer_for_curve"] is False
