"""
Train CyberGuard AI ensemble model.
Usage: python train.py --data data/processed
"""
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import classification_report, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split

CLASS_NAMES = ["BENIGN", "DDoS", "PortScan", "Bot", "Brute Force", "Web Attack", "Infiltration"]
ARTIFACTS_DIR = Path("model/artifacts")


def train(data_dir: str = "data/processed", seed: int = 42):
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    print("📂 Loading preprocessed data...")
    X = pd.read_parquet(f"{data_dir}/X.parquet").values
    y = pd.read_parquet(f"{data_dir}/y.parquet")["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=seed
    )
    print(f"   Train: {len(X_train):,} | Test: {len(X_test):,}")

    # ── Isolation Forest (détection non supervisée) ──────────────────────────
    print("\n🌲 Training Isolation Forest...")
    iso = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        max_samples="auto",
        random_state=seed,
        n_jobs=-1,
    )
    iso.fit(X_train)
    # Score normalisé [0,1] — plus proche de 1 = plus anormal
    iso_scores_test = -iso.score_samples(X_test)
    iso_scores_test = (iso_scores_test - iso_scores_test.min()) / (
        iso_scores_test.max() - iso_scores_test.min() + 1e-9
    )

    # ── Random Forest (classification supervisée) ────────────────────────────
    print("🌳 Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        class_weight="balanced",
        random_state=seed,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    rf_proba = rf.predict_proba(X_test)
    rf_pred = rf.predict(X_test)

    # ── Ensemble score ────────────────────────────────────────────────────────
    rf_max_proba = rf_proba.max(axis=1)
    ensemble_score = 0.4 * iso_scores_test + 0.6 * rf_max_proba

    # ── Métriques ─────────────────────────────────────────────────────────────
    print("\n📊 Metrics on test set:")
    report = classification_report(y_test, rf_pred, target_names=CLASS_NAMES, output_dict=True)
    print(classification_report(y_test, rf_pred, target_names=CLASS_NAMES))

    # Faux positifs (bénin prédit comme attaque)
    fpr = ((rf_pred != 0) & (y_test == 0)).sum() / (y_test == 0).sum()
    print(f"False Positive Rate: {fpr:.3f}")

    metrics = {
        "accuracy": report["accuracy"],
        "f1_macro": report["macro avg"]["f1-score"],
        "false_positive_rate": float(fpr),
        "per_class": {k: v for k, v in report.items() if k in CLASS_NAMES},
    }

    # ── Sauvegarder ───────────────────────────────────────────────────────────
    joblib.dump(iso, ARTIFACTS_DIR / "isolation_forest_v1.0.pkl")
    joblib.dump(rf,  ARTIFACTS_DIR / "random_forest_v1.0.pkl")
    with open(ARTIFACTS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    # Feature importance
    features = joblib.load(f"{data_dir}/features.pkl")
    importance = pd.DataFrame({
        "feature": features,
        "importance": rf.feature_importances_,
    }).sort_values("importance", ascending=False)
    importance.to_csv(ARTIFACTS_DIR / "feature_importance.csv", index=False)

    print(f"\n✅ Models saved to {ARTIFACTS_DIR}")
    print(f"   Accuracy: {metrics['accuracy']:.3f} | F1 macro: {metrics['f1_macro']:.3f}")
    return iso, rf, metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/processed")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    train(args.data, args.seed)
