import streamlit as st

st.set_page_config(
    page_title="HR Attrition — Dashboard",
    page_icon="📈",
    layout="wide",
)

st.title("📈 HR Attrition — Dashboard exécutif")
st.markdown(
    """
Le dashboard a été refait pour mettre en avant les informations utiles:
- performance du modèle (F1, AUC, precision, recall)
- segments RH à risque (OverTime, promotion, satisfaction, département)
- top employés à prioriser avec statut **parti / actif** et horizon estimé
- facteurs globaux de décision (SHAP-like via importance modèle)

➡ Ouvrez la page **0_Dashboard** dans le menu latéral pour la vue principale.
"""
)

st.info("Les autres pages restent disponibles: Conformité, Prédiction SHAP, Suggestions.")
