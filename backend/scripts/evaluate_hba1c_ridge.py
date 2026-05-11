"""5-fold CV evaluation of the Ridge HbA1c head on real GluFormer embeddings.

This is the credibility artefact. It's not loaded at runtime — run it locally
and paste the output into the README or a pitch deck:

    cd backend
    source .venv/bin/activate
    python scripts/evaluate_hba1c_ridge.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import KFold

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.embedding_store import EmbeddingStore  # noqa: E402

DATA = ROOT / "data"
ALPHA = 80.0
N_SPLITS = 5
SEEDS = list(range(10))


def evaluate() -> None:
    store = EmbeddingStore(
        DATA / "embeddings.csv", DATA / "hba1c.csv", DATA / "gmi.csv"
    )
    X, y = store.training_matrix()
    n = len(y)

    per_seed_metrics: list[dict[str, float]] = []
    for seed in SEEDS:
        kf = KFold(n_splits=N_SPLITS, shuffle=True, random_state=seed)
        preds = np.zeros_like(y, dtype=float)
        for train_idx, test_idx in kf.split(X):
            X_train, X_test = X[train_idx], X[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]
            # Match Pred_Shanghai.py: normalize y for fitting, then de-normalize
            mu, sd = float(y_train.mean()), float(y_train.std())
            y_train_z = (y_train - mu) / sd
            m = Ridge(alpha=ALPHA)
            m.fit(X_train, y_train_z)
            preds[test_idx] = m.predict(X_test) * sd + mu

        mae = float(np.mean(np.abs(preds - y)))
        rmse = float(np.sqrt(np.mean((preds - y) ** 2)))
        pearson = float(np.corrcoef(preds, y)[0, 1])
        per_seed_metrics.append({"mae": mae, "rmse": rmse, "pearson": pearson})

    # Baseline: always predict training mean
    baseline_mae = float(np.mean(np.abs(y.mean() - y)))
    baseline_rmse = float(np.sqrt(np.mean((y.mean() - y) ** 2)))

    print()
    print("Ridge on GluFormer embeddings")
    print(f"  n = {n}")
    print(f"  alpha = {ALPHA}")
    print(f"  {N_SPLITS}-fold CV, {len(SEEDS)} seeds")
    print()
    print(f"  MAE      = {_summary([m['mae'] for m in per_seed_metrics])} mmol/mol")
    print(f"  RMSE     = {_summary([m['rmse'] for m in per_seed_metrics])} mmol/mol")
    print(f"  Pearson  = {_summary([m['pearson'] for m in per_seed_metrics])}")
    print()
    print("Mean-baseline (predict y.mean() for everyone)")
    print(f"  MAE      = {baseline_mae:.2f} mmol/mol")
    print(f"  RMSE     = {baseline_rmse:.2f} mmol/mol")
    print()
    mae_lift = baseline_mae - np.mean([m["mae"] for m in per_seed_metrics])
    print(f"Lift over mean baseline: {mae_lift:.2f} mmol/mol MAE")


def _summary(xs: list[float]) -> str:
    arr = np.array(xs)
    return f"{arr.mean():.2f} ± {arr.std():.2f}"


if __name__ == "__main__":
    evaluate()
