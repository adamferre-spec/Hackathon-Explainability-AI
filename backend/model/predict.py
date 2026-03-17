"""
Inference + SHAP explanations for CyberGuard AI.
"""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import shap

CLASS_NAMES = ["BENIGN", "DDoS", "PortScan", "Bot", "Brute Force", "Web Attack", "Infiltration"]
ARTIFACTS = Path("model/artifacts")
DATA_PROCESSED = Path("data/processed")

_iso = None
_rf = None
_scaler = None
_features = None
_explainer = None


def _load_models():
    global _iso, _rf, _scaler, _features, _explainer
    if _rf is not None:
        return
    _iso     = joblib.load(ARTIFACTS / "isolation_forest_v1.0.pkl")
    _rf      = joblib.load(ARTIFACTS / "random_forest_v1.0.pkl")
    _scaler  = joblib.load(DATA_PROCESSED / "scaler.pkl")
    _features = joblib.load(DATA_PROCESSED / "features.pkl")
    _explainer = shap.TreeExplainer(_rf)
    print("✅ Models loaded")


def predict(flow: dict, alert_threshold: float = 0.65) -> dict:
    """
    Predict anomaly from a network flow dict.
    Returns prediction label, confidence, alert flag, and top SHAP features.
    """
    _load_models()

    # Build feature vector in correct order
    x_raw = np.array([[flow.get(f, 0.0) for f in _features]])
    x_scaled = _scaler.transform(x_raw)

    # Isolation Forest score (normalized to [0,1])
    iso_score = float(-_iso.score_samples(x_scaled)[0])

    # Random Forest
    rf_proba = _rf.predict_proba(x_scaled)[0]
    rf_pred  = int(np.argmax(rf_proba))
    rf_conf  = float(rf_proba[rf_pred])

    ensemble_score = 0.4 * iso_score + 0.6 * rf_conf
    is_alert = bool(ensemble_score > alert_threshold and rf_pred != 0)

    # SHAP explanation
    shap_vals = _explainer.shap_values(x_scaled)
    if isinstance(shap_vals, list):
        class_shap = shap_vals[rf_pred][0]
    else:
        class_shap = shap_vals[0]

    top_indices = np.argsort(np.abs(class_shap))[::-1][:5]
    shap_top = [
        {
            "feature": _features[i],
            "value": float(x_raw[0][i]),
            "shap": float(class_shap[i]),
        }
        for i in top_indices
    ]

    return {
        "alert_id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "prediction": CLASS_NAMES[rf_pred],
        "confidence": round(rf_conf, 4),
        "ensemble_score": round(ensemble_score, 4),
        "is_alert": is_alert,
        "requires_human_review": bool(rf_conf < 0.80),
        "shap_top_features": shap_top,
        "model_version": "1.0.0",
    }


def explain(flow: dict) -> dict:
    """Return full SHAP explanation for a flow."""
    _load_models()
    x_raw = np.array([[flow.get(f, 0.0) for f in _features]])
    x_scaled = _scaler.transform(x_raw)

    shap_vals = _explainer.shap_values(x_scaled)
    rf_pred = int(np.argmax(_rf.predict_proba(x_scaled)[0]))

    if isinstance(shap_vals, list):
        class_shap = shap_vals[rf_pred][0]
    else:
        class_shap = shap_vals[0]

    return {
        "features": _features,
        "values": [float(v) for v in x_raw[0]],
        "shap_values": [float(v) for v in class_shap],
        "expected_value": float(
            _explainer.expected_value[rf_pred]
            if isinstance(_explainer.expected_value, (list, np.ndarray))
            else _explainer.expected_value
        ),
        "predicted_class": CLASS_NAMES[rf_pred],
    }
