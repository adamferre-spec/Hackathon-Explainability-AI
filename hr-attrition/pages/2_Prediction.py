import numpy as np
import pandas as pd
import streamlit as st
import plotly.graph_objects as go

from utils.loader import (
    load_anonymized_data,
    load_classifier,
    load_demo_profiles,
    load_feature_config,
    load_feature_names,
    load_pipeline,
    load_predictions_data,
    load_preprocessor,
    load_shap_values,
)
from utils.shap_utils import compute_profile_shap, top_shap_features

st.title("📊 Prédiction & Explication SHAP")

pipeline = load_pipeline()
classifier = load_classifier()
preprocessor = load_preprocessor()
feature_config = load_feature_config()
encoded_feature_names = load_feature_names()

anon_df = load_anonymized_data()
pred_df = load_predictions_data()
saved_shap = load_shap_values()
demo_profiles = load_demo_profiles()

if "selected_profile" not in st.session_state:
    st.session_state.selected_profile = None
if "selected_score" not in st.session_state:
    st.session_state.selected_score = None

mode = st.radio("Mode", ["Employé dataset", "Profil libre", "Profil démo"], horizontal=True)

selected_profile = None
selected_score = None
shap_row = None
values_row = None

if mode == "Employé dataset":
    departments = ["Tous"] + sorted(pred_df["Department"].dropna().unique().tolist())
    risk_levels = ["Tous", "high", "medium", "low"]

    c1, c2 = st.columns(2)
    with c1:
        dept_filter = st.selectbox("Filtre département", departments)
    with c2:
        risk_filter = st.selectbox("Filtre niveau de risque", risk_levels)

    filtered = pred_df.copy()
    if dept_filter != "Tous":
        filtered = filtered[filtered["Department"] == dept_filter]
    if risk_filter != "Tous":
        filtered = filtered[filtered["risk_level"] == risk_filter]

    filtered = filtered.sort_values("risk_score", ascending=False)

    show = filtered[["Department", "JobRole", "risk_score", "risk_level", "Attrition"]].copy()
    show.insert(0, "EmployeeIdx", filtered.index)
    st.dataframe(show, use_container_width=True, height=350)

    if len(filtered) > 0:
        selected_idx = st.selectbox("Sélectionner un employé (index)", filtered.index.tolist())
        selected_profile = anon_df.loc[selected_idx, feature_config["continuous"] + feature_config["ordinal"] + feature_config["categorical"]].to_dict()
        selected_score = float(filtered.loc[selected_idx, "risk_score"])

        if selected_idx < saved_shap.shape[0]:
            shap_row = saved_shap[selected_idx]
            transformed = preprocessor.transform(pd.DataFrame([selected_profile]))
            values_row = transformed[0]

elif mode == "Profil libre":
    st.caption("Saisissez les variables utiles, les autres prendront des valeurs médianes/modes.")

    defaults = {}
    for col in feature_config["continuous"] + feature_config["ordinal"]:
        defaults[col] = float(anon_df[col].median())
    for col in feature_config["categorical"]:
        defaults[col] = str(anon_df[col].mode().iloc[0])

    selected_profile = defaults.copy()

    with st.expander("Variables numériques", expanded=True):
        for col in feature_config["continuous"] + feature_config["ordinal"]:
            selected_profile[col] = st.number_input(col, value=float(defaults[col]))

    with st.expander("Variables catégorielles", expanded=True):
        for col in feature_config["categorical"]:
            options = sorted(anon_df[col].dropna().astype(str).unique().tolist())
            selected_profile[col] = st.selectbox(col, options, index=options.index(str(defaults[col])) if str(defaults[col]) in options else 0)

    selected_score = float(pipeline.predict_proba(pd.DataFrame([selected_profile]))[:, 1][0])
    values_row, shap_row, _ = compute_profile_shap(
        preprocessor,
        classifier,
        selected_profile,
        feature_config["continuous"] + feature_config["ordinal"] + feature_config["categorical"],
        encoded_feature_names,
    )

else:
    profile_name = st.selectbox("Profil démo", ["low_risk", "ambiguous", "high_risk"])
    selected_profile = demo_profiles[profile_name]
    selected_score = float(pipeline.predict_proba(pd.DataFrame([selected_profile]))[:, 1][0])
    values_row, shap_row, _ = compute_profile_shap(
        preprocessor,
        classifier,
        selected_profile,
        feature_config["continuous"] + feature_config["ordinal"] + feature_config["categorical"],
        encoded_feature_names,
    )

if selected_profile is not None and selected_score is not None:
    st.session_state.selected_profile = selected_profile
    st.session_state.selected_score = selected_score

    risk_color = "#E63946" if selected_score >= 0.65 else "#FF9F1C" if selected_score >= 0.35 else "#00C9A7"
    st.markdown(f"### Score de risque: <span style='color:{risk_color}'>{selected_score*100:.1f}%</span>", unsafe_allow_html=True)

    if shap_row is not None:
        top_df = top_shap_features(encoded_feature_names, np.array(shap_row), np.array(values_row), max_features=12)

        fig = go.Figure()
        fig.add_trace(
            go.Bar(
                x=top_df["shap_value"],
                y=top_df["feature"],
                orientation="h",
                marker_color=["#E63946" if value > 0 else "#378ADD" for value in top_df["shap_value"]],
                text=[f"{value:+.3f}" for value in top_df["shap_value"]],
                textposition="outside",
            )
        )
        fig.update_layout(
            title="Waterfall SHAP (Top 12)",
            xaxis_title="Contribution au risque de départ",
            yaxis_title="Feature encodée",
            template="plotly_dark",
            height=520,
        )
        st.plotly_chart(fig, use_container_width=True)

        st.caption("🔴 contribution positive = augmente le risque | 🔵 contribution négative = diminue le risque")

st.info("Disclaimer AI Act: le système fournit une aide à la décision RH et exige une supervision humaine.")
