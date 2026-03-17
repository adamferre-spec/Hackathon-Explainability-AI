"""
Audit de biais automatique — CyberGuard AI.
Calcule les métriques de fairness par sous-groupe.
Usage : python model/audit_bias.py --data data/processed
"""
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import f1_score, confusion_matrix

CLASS_NAMES = ["BENIGN", "DDoS", "PortScan", "Bot", "Brute Force", "Web Attack", "Infiltration"]


def audit(data_dir: str = "data/processed"):
    print("📋 Audit de biais CyberGuard AI\n")

    X = pd.read_parquet(f"{data_dir}/X.parquet")
    y = pd.read_parquet(f"{data_dir}/y.parquet")["label"].values
    features = joblib.load(f"{data_dir}/features.pkl")

    rf = joblib.load("model/artifacts/random_forest_v1.0.pkl")
    scaler = joblib.load(f"{data_dir}/scaler.pkl")

    X_scaled = scaler.transform(X.values)
    y_pred = rf.predict(X_scaled)

    results = {}

    # ── 1. Performance globale ─────────────────────────────────────────────
    f1_global = f1_score(y, y_pred, average="macro")
    fpr_global = ((y_pred != 0) & (y == 0)).sum() / (y == 0).sum()
    results["global"] = {
        "f1_macro": round(float(f1_global), 4),
        "false_positive_rate": round(float(fpr_global), 4),
        "n_samples": int(len(y)),
    }
    print(f"Global — F1 macro: {f1_global:.4f} | FPR: {fpr_global:.4f}")

    # ── 2. Biais par durée de flux (proxy de protocole) ───────────────────
    duration_col = "Flow Duration" if "Flow Duration" in features else features[0]
    col_idx = features.index(duration_col)
    durations = X.values[:, col_idx]

    short = durations < np.percentile(durations, 33)
    medium = (durations >= np.percentile(durations, 33)) & (durations < np.percentile(durations, 66))
    long_ = durations >= np.percentile(durations, 66)

    for name, mask in [("flux_courts", short), ("flux_moyens", medium), ("flux_longs", long_)]:
        if mask.sum() < 10:
            continue
        f1 = f1_score(y[mask], y_pred[mask], average="macro", zero_division=0)
        fpr = ((y_pred[mask] != 0) & (y[mask] == 0)).sum() / max((y[mask] == 0).sum(), 1)
        results[name] = {"f1_macro": round(float(f1), 4), "false_positive_rate": round(float(fpr), 4), "n_samples": int(mask.sum())}
        print(f"{name:15s} — F1: {f1:.4f} | FPR: {fpr:.4f} | n={mask.sum()}")

    # ── 3. Stabilité sur 5 sous-ensembles aléatoires ──────────────────────
    rng = np.random.default_rng(42)
    f1_runs = []
    for _ in range(5):
        idx = rng.choice(len(y), size=min(10000, len(y)), replace=False)
        f1_runs.append(f1_score(y[idx], y_pred[idx], average="macro", zero_division=0))

    results["stability"] = {
        "f1_mean": round(float(np.mean(f1_runs)), 4),
        "f1_std":  round(float(np.std(f1_runs)), 4),
        "f1_min":  round(float(np.min(f1_runs)), 4),
        "f1_max":  round(float(np.max(f1_runs)), 4),
    }
    print(f"\nStabilité — F1 mean: {np.mean(f1_runs):.4f} ± {np.std(f1_runs):.4f}")

    # ── 4. Verdict ────────────────────────────────────────────────────────
    f1_vals = [v["f1_macro"] for k, v in results.items() if "f1_macro" in v]
    max_gap = max(f1_vals) - min(f1_vals) if f1_vals else 0
    bias_detected = max_gap > 0.10

    results["verdict"] = {
        "bias_detected": bias_detected,
        "max_f1_gap": round(float(max_gap), 4),
        "recommendation": (
            "⚠️ Biais détecté — revoir la distribution des données d'entraînement"
            if bias_detected else
            "✅ Pas de biais significatif détecté"
        ),
    }

    print(f"\n{'⚠️  BIAIS DÉTECTÉ' if bias_detected else '✅ Pas de biais significatif'} — gap F1 max: {max_gap:.4f}")

    # Sauvegarder
    out = Path("model/artifacts/bias_audit.json")
    with open(out, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n📄 Rapport sauvegardé : {out}")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/processed")
    args = parser.parse_args()
    audit(args.data)
