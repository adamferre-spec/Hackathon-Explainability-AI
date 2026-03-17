import streamlit as st

from utils.loader import load_feature_config, load_pipeline
from utils.suggestion_engine import RISK_THRESHOLD, generate_suggestions

st.title("💡 Suggestions de rétention")

pipeline = load_pipeline()
feature_config = load_feature_config()
feature_order = feature_config["continuous"] + feature_config["ordinal"] + feature_config["categorical"]

profile = st.session_state.get("selected_profile")
score = st.session_state.get("selected_score")

if profile is None or score is None:
    st.warning("Aucun profil sélectionné. Allez sur la page 2 pour choisir un employé/profil.")
    st.stop()

st.subheader("Contexte actuel")
st.write(f"Score de risque courant: **{score*100:.1f}%**")

if score < RISK_THRESHOLD:
    st.success("🟢 Risque < 35% — aucune action urgente")
    st.stop()

suggestions = generate_suggestions(profile, pipeline, feature_order)

st.subheader("Top 3 scénarios actionnables")

if st.session_state.get("treated") is None:
    st.session_state.treated = {}

for idx, suggestion in enumerate(suggestions, start=1):
    before = suggestion.get("before")
    after = suggestion.get("after")
    delta = suggestion.get("delta", 0.0)

    with st.container(border=True):
        st.markdown(f"### {idx}. {suggestion.get('label')}")
        if before is not None or after is not None:
            st.write(f"**{suggestion.get('feature')}**: `{before}` → `{after}`")
        st.write(
            f"Score risque: **{suggestion.get('score_before', score)*100:.1f}%** → "
            f"**{suggestion.get('score_after', score)*100:.1f}%** "
            f"({delta*100:+.1f} pts)"
        )
        treated_key = f"treated_{idx}"
        if st.button(f"Marquer comme traité #{idx}", key=treated_key):
            st.session_state.treated[treated_key] = True

        if st.session_state.treated.get(treated_key):
            st.success("✅ Action marquée comme traitée (supervision humaine IA Act)")
