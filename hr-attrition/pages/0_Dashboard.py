from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from utils.loader import (
    load_classifier,
    load_feature_names,
    load_metrics,
    load_predictions_data,
)


st.set_page_config(page_title="Dashboard RH", page_icon="📈", layout="wide")
st.title("📈 Dashboard RH — Attrition Intelligence")
st.caption("Vue exécutive : performance du modèle, segments à risque, facteurs clés et priorités d'action")


@st.cache_data(show_spinner=False)
def _build_base_tables(pred_df: pd.DataFrame):
    df = pred_df.copy()
    df["AttritionLabel"] = df["Attrition"].map({1: "Parti", 0: "Actif"})
    df["RiskPct"] = (df["risk_score"] * 100).round(1)
    df["RiskBand"] = pd.cut(
        df["risk_score"],
        bins=[-np.inf, 0.35, 0.65, np.inf],
        labels=["🟢 Bas", "🟠 Moyen", "🔴 Élevé"],
    )

    def horizon(row):
        if int(row["Attrition"]) == 1:
            return "Déjà parti"
        score = float(row["risk_score"])
        if score >= 0.8:
            return "0-3 mois"
        if score >= 0.65:
            return "3-6 mois"
        if score >= 0.5:
            return "6-12 mois"
        if score >= 0.35:
            return "12-18 mois"
        return ">18 mois"

    df["EstimatedDeparture"] = df.apply(horizon, axis=1)
    return df


@st.cache_data(show_spinner=False)
def _aggregate_feature_importance(encoded_feature_names: list[str], importances: np.ndarray):
    known_prefixes = [
        "BusinessTravel",
        "Department",
        "EducationField",
        "JobRole",
        "MaritalStatus",
        "AgeGroup",
        "OverTime",
    ]

    agg: dict[str, float] = {}
    for name, imp in zip(encoded_feature_names, importances):
        raw_name = name
        if raw_name.startswith("num__"):
            raw_name = raw_name.replace("num__", "")
        if raw_name.startswith("cat__"):
            raw_name = raw_name.replace("cat__", "")

        for pref in known_prefixes:
            if raw_name.startswith(f"{pref}_"):
                raw_name = pref
                break

        agg[raw_name] = agg.get(raw_name, 0.0) + float(imp)

    out = pd.DataFrame(
        [{"feature": k, "importance": v, "percentage": v * 100} for k, v in agg.items()]
    ).sort_values("importance", ascending=False)
    return out


try:
    metrics = load_metrics()
    pred_df = load_predictions_data()
    classifier = load_classifier()
    encoded_names = load_feature_names()
except Exception as exc:
    st.error(f"Impossible de charger les artefacts : {exc}")
    st.stop()

if pred_df.empty:
    st.warning("Le fichier de prédictions est vide.")
    st.stop()

df = _build_base_tables(pred_df)

cm = metrics.get("confusion_matrix", [[0, 0], [0, 0]])
tn, fp = cm[0]
fn, tp = cm[1]
precision = tp / max(tp + fp, 1)
recall = tp / max(tp + fn, 1)

c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("F1-score", f"{metrics.get('f1', 0):.3f}")
c2.metric("AUC-ROC", f"{metrics.get('auc_roc', 0):.3f}")
c3.metric("Precision", f"{precision:.3f}")
c4.metric("Recall", f"{recall:.3f}")
c5.metric("Attrition réelle", f"{(df['Attrition'].mean() * 100):.1f}%")

left, right = st.columns([1.2, 1])
with left:
    st.subheader("Qualité modèle & distribution des risques")

    risk_hist = px.histogram(
        df,
        x="risk_score",
        nbins=25,
        color="AttritionLabel",
        barmode="overlay",
        title="Distribution des scores de risque",
        labels={"risk_score": "Score de risque"},
    )
    risk_hist.update_layout(template="plotly_dark", height=320)
    st.plotly_chart(risk_hist, use_container_width=True)

    cm_fig = go.Figure(
        data=go.Heatmap(
            z=cm,
            x=["Prédit: Actif", "Prédit: Parti"],
            y=["Réel: Actif", "Réel: Parti"],
            text=cm,
            texttemplate="%{text}",
            colorscale="Blues",
        )
    )
    cm_fig.update_layout(title="Matrice de confusion", template="plotly_dark", height=320)
    st.plotly_chart(cm_fig, use_container_width=True)

with right:
    st.subheader("Population & segments critiques")
    st.metric("Employés", len(df))
    st.metric("Actifs", int((df["Attrition"] == 0).sum()))
    st.metric("Partis", int((df["Attrition"] == 1).sum()))

    overtime = (
        df.groupby("OverTime")
        .agg(
            total=("Attrition", "count"),
            attrition_rate=("Attrition", "mean"),
            avg_risk=("risk_score", "mean"),
        )
        .reset_index()
    )
    overtime["attrition_rate"] = (overtime["attrition_rate"] * 100).round(1)
    overtime["avg_risk"] = (overtime["avg_risk"] * 100).round(1)
    st.dataframe(overtime, use_container_width=True, hide_index=True)

st.subheader("Insights RH actionnables")
seg1, seg2, seg3 = st.columns(3)

with seg1:
    promo = df.copy()
    promo["PromotionBand"] = pd.cut(
        promo["YearsSinceLastPromotion"],
        bins=[-np.inf, 1, 3, np.inf],
        labels=["0-1 an", "2-3 ans", ">3 ans"],
    )
    promo_g = promo.groupby("PromotionBand").agg(
        attrition_rate=("Attrition", "mean"),
        avg_risk=("risk_score", "mean"),
        total=("Attrition", "count"),
    )
    fig = px.bar(
        promo_g.reset_index(),
        x="PromotionBand",
        y="avg_risk",
        color="attrition_rate",
        title="Stagnation promotion vs risque",
        labels={"avg_risk": "Risque moyen", "attrition_rate": "Attrition"},
    )
    fig.update_layout(template="plotly_dark", height=300)
    st.plotly_chart(fig, use_container_width=True)

with seg2:
    sat_g = (
        df.groupby("JobSatisfaction")
        .agg(attrition_rate=("Attrition", "mean"), avg_risk=("risk_score", "mean"), total=("Attrition", "count"))
        .reset_index()
    )
    fig = px.line(
        sat_g,
        x="JobSatisfaction",
        y=["attrition_rate", "avg_risk"],
        markers=True,
        title="Satisfaction vs attrition/risque",
    )
    fig.update_layout(template="plotly_dark", height=300)
    st.plotly_chart(fig, use_container_width=True)

with seg3:
    dept_g = (
        df.groupby("Department")
        .agg(attrition_rate=("Attrition", "mean"), avg_risk=("risk_score", "mean"), total=("Attrition", "count"))
        .sort_values("avg_risk", ascending=False)
        .reset_index()
    )
    fig = px.bar(
        dept_g,
        x="Department",
        y="avg_risk",
        color="attrition_rate",
        title="Départements prioritaires",
        labels={"avg_risk": "Risque moyen"},
    )
    fig.update_layout(template="plotly_dark", height=300)
    st.plotly_chart(fig, use_container_width=True)

st.subheader("SHAP-like global (importance modèle)")
importance_df = _aggregate_feature_importance(encoded_names, classifier.feature_importances_)
fig_imp = px.bar(
    importance_df.head(15).sort_values("importance"),
    x="importance",
    y="feature",
    orientation="h",
    title="Top features globales",
)
fig_imp.update_layout(template="plotly_dark", height=420)
st.plotly_chart(fig_imp, use_container_width=True)

st.subheader("Top employés à risque (avec statut + horizon)")
active_only = st.toggle("Afficher uniquement les actifs", value=True)
out = df.copy()
if active_only:
    out = out[out["Attrition"] == 0]
out = out.sort_values("risk_score", ascending=False)

show_cols = [
    "Department",
    "JobRole",
    "risk_score",
    "RiskBand",
    "AttritionLabel",
    "EstimatedDeparture",
    "OverTime",
    "YearsSinceLastPromotion",
    "JobSatisfaction",
    "WorkLifeBalance",
]

st.dataframe(out[show_cols].head(30), use_container_width=True, height=480)

st.caption(
    "Estimation de départ = heuristique de priorisation basée sur score de risque; ce n'est pas une date contractuelle."
)
