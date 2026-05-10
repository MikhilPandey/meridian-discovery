import numpy as np
from sklearn.linear_model import Ridge

from .embedding_store import EmbeddingStore


class HealthPredictor:
    """Ridge regression: 1024-dim GluFormer embedding -> HbA1c (mmol/mol).

    Mirrors Pred_Shanghai.py (alpha=80) but trains on the full matched set
    so we can predict for any embedding at inference time. Targets are
    z-score normalized during training; predictions are de-normalized so
    the API returns real-world mmol/mol values.
    """

    def __init__(self, store: EmbeddingStore, alpha: float = 80.0):
        self.store = store
        self.alpha = alpha
        X, y = store.training_matrix()
        self._y_mean = float(y.mean())
        self._y_std = float(y.std())
        y_norm = (y - self._y_mean) / self._y_std
        self.model = Ridge(alpha=alpha)
        self.model.fit(X, y_norm)
        self.n_train = len(y)

    def predict_hba1c(self, embedding: np.ndarray) -> float:
        z = self.model.predict(embedding.reshape(1, -1))[0]
        return float(z * self._y_std + self._y_mean)

    @staticmethod
    def mmol_to_pct(mmol: float) -> float:
        return round(mmol * 0.0915 + 2.15, 2)

    @staticmethod
    def risk_tier(hba1c_mmol: float) -> str:
        if hba1c_mmol < 39:
            return "low"
        if hba1c_mmol < 48:
            return "moderate"
        return "high"

    def metabolic_score(self, hba1c_mmol: float) -> int:
        score = 95 - (hba1c_mmol - 30) * (75 / 40)
        return int(max(10, min(99, round(score))))
