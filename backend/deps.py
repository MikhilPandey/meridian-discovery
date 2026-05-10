"""Singletons loaded once at startup and injected into routers."""
import json
from pathlib import Path
from typing import Any

from services.embedding_store import EmbeddingStore
from services.genomic_modifier import GenomicModifier
from services.health_predictor import HealthPredictor

DATA_DIR = Path(__file__).parent / "data"


class AppState:
    embedding_store: EmbeddingStore
    health_predictor: HealthPredictor
    genomic_modifier: GenomicModifier
    participants: list[dict[str, Any]]
    participants_by_id: dict[str, dict[str, Any]]
    meals: list[dict[str, Any]]


state = AppState()


def initialize() -> None:
    state.embedding_store = EmbeddingStore(
        DATA_DIR / "embeddings.csv",
        DATA_DIR / "hba1c.csv",
        DATA_DIR / "gmi.csv",
    )
    state.health_predictor = HealthPredictor(state.embedding_store)
    state.genomic_modifier = GenomicModifier(DATA_DIR / "snp_effects.json")
    state.participants = json.loads((DATA_DIR / "participant_profiles.json").read_text())
    state.participants_by_id = {p["id"]: p for p in state.participants}
    state.meals = json.loads((DATA_DIR / "meals.json").read_text())
