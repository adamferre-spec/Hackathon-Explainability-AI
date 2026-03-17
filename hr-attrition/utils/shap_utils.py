from __future__ import annotations

import numpy as np
import pandas as pd
import shap


def extract_class1_shap(shap_values_all, expected_value):
    if isinstance(shap_values_all, list):
        shap_values_class1 = np.array(shap_values_all[1])
        base_val = float(expected_value[1])
    elif isinstance(shap_values_all, np.ndarray) and shap_values_all.ndim == 3:
        shap_values_class1 = shap_values_all[:, :, 1]
        base_val = float(expected_value[1])
    else:
        shap_values_class1 = np.array(shap_values_all)
        base_val = float(expected_value)
    return shap_values_class1, base_val


def extract_single_profile_shap(sv_all):
    if isinstance(sv_all, list):
        sv = np.array(sv_all[1][0])
    elif isinstance(sv_all, np.ndarray) and sv_all.ndim == 3:
        sv = np.array(sv_all[0, :, 1])
    else:
        sv = np.array(sv_all[0])
    return sv


def top_shap_features(feature_names: list[str], shap_row: np.ndarray, values_row: np.ndarray | None = None, max_features: int = 12) -> pd.DataFrame:
    abs_idx = np.argsort(np.abs(shap_row))[::-1][:max_features]

    records = []
    for idx in abs_idx:
        record = {
            "feature": feature_names[idx],
            "shap_value": float(shap_row[idx]),
            "abs_shap": float(abs(shap_row[idx])),
        }
        if values_row is not None:
            record["value"] = float(values_row[idx])
        records.append(record)

    return pd.DataFrame(records)


def compute_profile_shap(preprocessor, classifier, profile: dict, raw_feature_order: list[str], encoded_feature_names: list[str]):
    frame = pd.DataFrame([{feature: profile.get(feature) for feature in raw_feature_order}])
    transformed = preprocessor.transform(frame)
    explainer = shap.TreeExplainer(classifier)
    sv_all = explainer.shap_values(transformed)
    sv = extract_single_profile_shap(sv_all)
    return transformed[0], sv, encoded_feature_names
