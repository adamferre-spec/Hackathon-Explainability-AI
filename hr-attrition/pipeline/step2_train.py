from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MODELS_DIR = ROOT / "models"

ANON_FILE = DATA_DIR / "HR_IBM_anonymised.csv"
PRED_FILE = DATA_DIR / "HR_IBM_predictions.csv"
DEMO_FILE = DATA_DIR / "demo_profiles.json"


CONTINUOUS = [
    "DailyRate",
    "DistanceFromHome",
    "HourlyRate",
    "MonthlyIncome",
    "MonthlyRate",
    "NumCompaniesWorked",
    "PercentSalaryHike",
    "TotalWorkingYears",
    "TrainingTimesLastYear",
    "YearsAtCompany",
    "YearsInCurrentRole",
    "YearsSinceLastPromotion",
    "YearsWithCurrManager",
]

ORDINAL = [
    "Education",
    "EnvironmentSatisfaction",
    "JobInvolvement",
    "JobLevel",
    "JobSatisfaction",
    "PerformanceRating",
    "RelationshipSatisfaction",
    "StockOptionLevel",
    "WorkLifeBalance",
]

CATEGORICAL = [
    "BusinessTravel",
    "Department",
    "EducationField",
    "JobRole",
    "MaritalStatus",
    "AgeGroup",
    "OverTime",
]

SENSITIVE_EXCLUDED = ["Gender"]
TARGET = "Attrition"


def validate_columns(df: pd.DataFrame) -> None:
    required = set(CONTINUOUS + ORDINAL + CATEGORICAL + [TARGET] + SENSITIVE_EXCLUDED)
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes dans le dataset anonymisé: {missing}")


def extract_shap_class1(explainer: shap.TreeExplainer, shap_values_all) -> tuple[np.ndarray, float]:
    if isinstance(shap_values_all, list):
        shap_values_class1 = np.array(shap_values_all[1])
        base_val = float(explainer.expected_value[1])
    elif isinstance(shap_values_all, np.ndarray) and shap_values_all.ndim == 3:
        shap_values_class1 = shap_values_all[:, :, 1]
        base_val = float(explainer.expected_value[1])
    else:
        shap_values_class1 = np.array(shap_values_all)
        base_val = float(explainer.expected_value)
    return shap_values_class1, base_val


def build_demo_profiles(df: pd.DataFrame) -> dict:
    medians = {column: float(df[column].median()) for column in CONTINUOUS + ORDINAL if column in df.columns}
    modes = {column: str(df[column].mode().iloc[0]) for column in CATEGORICAL if column in df.columns}

    base = {**medians, **modes}

    low = {
        **base,
        "JobSatisfaction": 4,
        "OverTime": "No",
        "MonthlyIncome": 8500,
        "WorkLifeBalance": 4,
        "YearsAtCompany": 8,
    }

    ambig = {
        **base,
        "JobSatisfaction": 2,
        "OverTime": "Yes",
        "MonthlyIncome": 3500,
        "WorkLifeBalance": 2,
        "YearsAtCompany": 2,
    }

    high = {
        **base,
        "JobSatisfaction": 1,
        "OverTime": "Yes",
        "MonthlyIncome": 1500,
        "WorkLifeBalance": 1,
        "NumCompaniesWorked": 7,
    }

    return {
        "low_risk": low,
        "ambiguous": ambig,
        "high_risk": high,
    }


def main() -> None:
    if not ANON_FILE.exists():
        raise FileNotFoundError(f"Fichier introuvable: {ANON_FILE}. Lancez d'abord step1_anonymize.py")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(ANON_FILE)
    validate_columns(df)

    feature_columns = CONTINUOUS + ORDINAL + CATEGORICAL
    X = df[feature_columns].copy()
    y = df[TARGET].astype(int).copy()

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", CONTINUOUS + ORDINAL),
            (
                "cat",
                OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False),
                CATEGORICAL,
            ),
        ],
        remainder="drop",
    )

    classifier = RandomForestClassifier(
        n_estimators=400,
        max_depth=15,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier),
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=42,
    )

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    f1 = float(f1_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred)

    X_processed = pipeline.named_steps["preprocessor"].transform(X)
    feature_names = pipeline.named_steps["preprocessor"].get_feature_names_out().tolist()

    fitted_clf = pipeline.named_steps["classifier"]
    explainer = shap.TreeExplainer(fitted_clf)
    shap_values_all = explainer.shap_values(X_processed)
    shap_values_class1, base_val = extract_shap_class1(explainer, shap_values_all)

    if shap_values_class1.ndim != 2:
        raise ValueError(f"shap_values_class1 doit être 2D, obtenu shape={shap_values_class1.shape}")

    predictions_df = df.copy()
    predictions_df["risk_score"] = pipeline.predict_proba(X)[:, 1]
    predictions_df["risk_level"] = pd.cut(
        predictions_df["risk_score"],
        bins=[-np.inf, 0.35, 0.65, np.inf],
        labels=["low", "medium", "high"],
    )
    predictions_df = predictions_df.sort_values("risk_score", ascending=False)

    feature_config = {
        "continuous": CONTINUOUS,
        "ordinal": ORDINAL,
        "categorical": CATEGORICAL,
        "sensitive_excluded": SENSITIVE_EXCLUDED,
        "target": TARGET,
    }

    metrics = {
        "f1": round(f1, 4),
        "auc_roc": round(auc, 4),
        "confusion_matrix": cm.tolist(),
        "test_size": len(X_test),
        "train_size": len(X_train),
        "positive_rate": round(float(y.mean()), 4),
        "model": {
            "name": "RandomForestClassifier",
            "n_estimators": 400,
            "max_depth": 15,
            "min_samples_leaf": 3,
            "class_weight": "balanced",
            "random_state": 42,
        },
    }

    joblib.dump(pipeline, MODELS_DIR / "pipeline.pkl")
    joblib.dump(fitted_clf, MODELS_DIR / "classifier.pkl")
    joblib.dump(pipeline.named_steps["preprocessor"], MODELS_DIR / "preprocessor.pkl")
    joblib.dump(feature_names, MODELS_DIR / "feature_names.pkl")

    np.save(MODELS_DIR / "shap_values.npy", shap_values_class1)
    np.save(MODELS_DIR / "X_processed.npy", np.array(X_processed))
    np.save(MODELS_DIR / "base_value.npy", np.array([base_val]))

    with open(MODELS_DIR / "feature_config.json", "w", encoding="utf-8") as feature_file:
        json.dump(feature_config, feature_file, ensure_ascii=False, indent=2)

    with open(MODELS_DIR / "metrics.json", "w", encoding="utf-8") as metrics_file:
        json.dump(metrics, metrics_file, ensure_ascii=False, indent=2)

    predictions_df.to_csv(PRED_FILE, index=False)

    demo_profiles = build_demo_profiles(df)
    with open(DEMO_FILE, "w", encoding="utf-8") as demo_file:
        json.dump(demo_profiles, demo_file, ensure_ascii=False, indent=2)

    print("✅ Step2 terminé")
    print(f"F1={f1:.4f} | AUC={auc:.4f}")
    print(f"Artifacts saved in: {MODELS_DIR}")


if __name__ == "__main__":
    main()
