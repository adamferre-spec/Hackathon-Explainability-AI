from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import streamlit as st


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MODELS_DIR = ROOT / "models"

RAW_PATH = DATA_DIR / "WA_Fn-UseC_-HR-Employee-Attrition.csv"
ANON_PATH = DATA_DIR / "HR_IBM_anonymised.csv"
PRED_PATH = DATA_DIR / "HR_IBM_predictions.csv"
DEMO_PATH = DATA_DIR / "demo_profiles.json"


@st.cache_data(show_spinner=False)
def load_raw_data() -> pd.DataFrame:
    if not RAW_PATH.exists():
        return pd.DataFrame()
    return pd.read_csv(RAW_PATH)


@st.cache_data(show_spinner=False)
def load_anonymized_data() -> pd.DataFrame:
    if not ANON_PATH.exists():
        raise FileNotFoundError(f"Fichier manquant: {ANON_PATH}")
    return pd.read_csv(ANON_PATH)


@st.cache_data(show_spinner=False)
def load_predictions_data() -> pd.DataFrame:
    if not PRED_PATH.exists():
        raise FileNotFoundError(f"Fichier manquant: {PRED_PATH}. Lancez step2_train.py")
    return pd.read_csv(PRED_PATH)


@st.cache_resource(show_spinner=False)
def load_pipeline():
    return joblib.load(MODELS_DIR / "pipeline.pkl")


@st.cache_resource(show_spinner=False)
def load_classifier():
    return joblib.load(MODELS_DIR / "classifier.pkl")


@st.cache_resource(show_spinner=False)
def load_preprocessor():
    return joblib.load(MODELS_DIR / "preprocessor.pkl")


@st.cache_data(show_spinner=False)
def load_feature_names() -> list[str]:
    return joblib.load(MODELS_DIR / "feature_names.pkl")


@st.cache_data(show_spinner=False)
def load_feature_config() -> dict:
    with open(MODELS_DIR / "feature_config.json", "r", encoding="utf-8") as file:
        return json.load(file)


@st.cache_data(show_spinner=False)
def load_metrics() -> dict:
    with open(MODELS_DIR / "metrics.json", "r", encoding="utf-8") as file:
        return json.load(file)


@st.cache_data(show_spinner=False)
def load_shap_values() -> np.ndarray:
    return np.load(MODELS_DIR / "shap_values.npy")


@st.cache_data(show_spinner=False)
def load_x_processed() -> np.ndarray:
    return np.load(MODELS_DIR / "X_processed.npy")


@st.cache_data(show_spinner=False)
def load_base_value() -> float:
    return float(np.load(MODELS_DIR / "base_value.npy")[0])


@st.cache_data(show_spinner=False)
def load_demo_profiles() -> dict:
    with open(DEMO_PATH, "r", encoding="utf-8") as file:
        return json.load(file)
