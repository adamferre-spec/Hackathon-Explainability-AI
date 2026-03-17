import streamlit as st
import pandas as pd

from utils.loader import load_anonymized_data, load_metrics, load_raw_data

st.title("🔒 Conformité RGPD & AI Act")

raw_df = load_raw_data()
anon_df = load_anonymized_data()
metrics = load_metrics()

col1, col2, col3, col4 = st.columns(4)
col1.metric("Nb lignes", len(anon_df))
col2.metric("Nb features", anon_df.shape[1] - 1)
col3.metric("F1-score", f"{metrics.get('f1', 0):.2f}")
col4.metric("AUC-ROC", f"{metrics.get('auc_roc', 0):.2f}")

st.error("🔴 AI Act: Haut Risque — Annexe III §4 (emploi)")
st.markdown("""
Obligations clés:
1. Supervision humaine obligatoire
2. Transparence et explicabilité
3. Gestion des risques et biais
4. Traçabilité et auditabilité
""")

st.subheader("Avant / Après anonymisation (10 premières lignes)")
left, right = st.columns(2)
with left:
    st.caption("Dataset source")
    st.dataframe(raw_df.head(10), use_container_width=True)
with right:
    st.caption("Dataset anonymisé")
    st.dataframe(anon_df.head(10), use_container_width=True)

st.subheader("Traitements RGPD appliqués")
rgpd_table = pd.DataFrame(
    [
        ["EmployeeNumber", "Supprimé", "Identifiant direct (Art.4)"],
        ["EmployeeCount", "Supprimé", "Colonne constante"],
        ["StandardHours", "Supprimé", "Colonne constante"],
        ["Over18", "Supprimé", "Colonne constante"],
        ["Age", "Transformé en AgeGroup", "Quasi-identifiant"],
        ["Attrition", "Yes/No -> 1/0", "Cible modèle"],
        ["Gender", "Conservé CSV, exclu modèle", "Audit fairness"],
    ],
    columns=["Colonne", "Traitement", "Motif"],
)
st.dataframe(rgpd_table, use_container_width=True)
