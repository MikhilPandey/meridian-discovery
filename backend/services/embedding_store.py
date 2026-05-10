from pathlib import Path
import pandas as pd
import numpy as np


def normalize_id(x) -> int:
    """Replicates Pred_Shanghai.py: take digits 1-7 of int, skipping prefix digit."""
    return int(str(int(x))[1:7])


class EmbeddingStore:
    """Loads pre-extracted GluFormer embeddings + ground-truth HbA1c/GMI for the Shanghai cohort."""

    def __init__(self, embeddings_path: Path, hba1c_path: Path, gmi_path: Path):
        emb = pd.read_csv(embeddings_path, index_col=0)
        emb.index = emb.index.map(normalize_id)
        self.embeddings = emb.groupby(emb.index).mean()

        hb = pd.read_csv(hba1c_path, index_col=0).iloc[:, 0].dropna()
        hb.index = hb.index.map(normalize_id)
        self.hba1c = hb.groupby(hb.index).mean()

        gmi = pd.read_csv(gmi_path, index_col=0)
        gmi.index = gmi.index.map(normalize_id)
        self.gmi = gmi.groupby(gmi.index).mean()

    def has(self, participant_id: int) -> bool:
        return participant_id in self.embeddings.index

    def get_embedding(self, participant_id: int) -> np.ndarray:
        return self.embeddings.loc[participant_id].values.astype(np.float64)

    def get_hba1c_actual(self, participant_id: int) -> float | None:
        if participant_id in self.hba1c.index:
            return float(self.hba1c.loc[participant_id])
        return None

    def get_gmi(self, participant_id: int) -> float | None:
        if participant_id in self.gmi.index:
            row = self.gmi.loc[participant_id]
            val = row.iloc[0] if hasattr(row, "iloc") else row
            return float(val)
        return None

    def matched_ids(self) -> list[int]:
        return list(self.embeddings.index.intersection(self.hba1c.index))

    def training_matrix(self) -> tuple[np.ndarray, np.ndarray]:
        ids = self.matched_ids()
        X = self.embeddings.loc[ids].values
        y = self.hba1c.loc[ids].values
        return X, y
