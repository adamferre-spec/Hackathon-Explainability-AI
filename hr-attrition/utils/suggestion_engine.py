from __future__ import annotations

from copy import deepcopy

import pandas as pd


RISK_THRESHOLD = 0.35


def _predict_score(pipeline, profile: dict, feature_order: list[str]) -> float:
    frame = pd.DataFrame([{feature: profile.get(feature) for feature in feature_order}])
    return float(pipeline.predict_proba(frame)[:, 1][0])


def _scenario(feature: str, before, after, score_before: float, score_after: float, effort: float, label: str) -> dict:
    return {
        "feature": feature,
        "before": before,
        "after": after,
        "score_before": score_before,
        "score_after": score_after,
        "delta": score_after - score_before,
        "effort": effort,
        "label": label,
    }


def generate_suggestions(profile: dict, pipeline, feature_order: list[str]) -> list[dict]:
    base_score = _predict_score(pipeline, profile, feature_order)
    candidates = []

    def try_values(feature, values, label_builder, effort_builder):
        for value in values:
            modified = deepcopy(profile)
            before = modified.get(feature)
            if before == value:
                continue
            modified[feature] = value
            score_after = _predict_score(pipeline, modified, feature_order)
            if score_after < RISK_THRESHOLD:
                candidates.append(
                    _scenario(
                        feature=feature,
                        before=before,
                        after=value,
                        score_before=base_score,
                        score_after=score_after,
                        effort=effort_builder(before, value),
                        label=label_builder(before, value),
                    )
                )
                break

    # OverTime: Yes -> No
    if profile.get("OverTime") == "Yes":
        try_values(
            "OverTime",
            ["No"],
            lambda _before, _after: "Supprimer les heures supplémentaires",
            lambda _before, _after: 0.10,
        )

    # Integer increments up to cap
    for feature, cap in [
        ("JobSatisfaction", 4),
        ("EnvironmentSatisfaction", 4),
        ("WorkLifeBalance", 4),
        ("TrainingTimesLastYear", 6),
        ("StockOptionLevel", 3),
    ]:
        current = int(profile.get(feature, 0))
        values = [value for value in [current + 1, current + 2, current + 3] if value <= cap]
        if not values:
            continue

        try_values(
            feature,
            values,
            lambda before, after, ft=feature: f"Améliorer {ft}: {before} → {after}",
            lambda before, after: abs(after - before) / max(cap, 1),
        )

    # MonthlyIncome percentage increases
    current_income = float(profile.get("MonthlyIncome", 0))
    if current_income > 0:
        income_values = [round(current_income * factor, 2) for factor in [1.1, 1.2, 1.3, 1.5]]
        try_values(
            "MonthlyIncome",
            income_values,
            lambda before, after: f"Augmenter MonthlyIncome de {before:.0f} → {after:.0f}",
            lambda before, after: (after - before) / max(before, 1),
        )

    candidates = sorted(candidates, key=lambda item: item["effort"])

    if not candidates:
        return [
            {
                "label": "Intervention RH directe recommandée",
                "feature": "multi",
                "before": None,
                "after": None,
                "score_before": base_score,
                "score_after": base_score,
                "delta": 0.0,
                "effort": 1.0,
            }
        ]

    return candidates[:3]
