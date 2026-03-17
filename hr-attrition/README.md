# HR Attrition (Streamlit multi-page)

Projet conforme au cadrage:
- Python 3.11
- Streamlit multi-page (`pages/`)
- Random Forest + SHAP TreeExplainer
- Suggestions maison (sans DiCE)

## Structure
Voir l'arborescence demandée dans l'énoncé. Les artefacts sont générés dans `models/`.

## Installation
```powershell
py -3.11 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Données
Placer le fichier:
- `data/WA_Fn-UseC_-HR-Employee-Attrition.csv`

## Pipeline
```powershell
python pipeline/step1_anonymize.py
python pipeline/step2_train.py
```

## Lancement app
```powershell
streamlit run app.py
```

## Notes SHAP
Le code gère explicitement:
- format liste `[class0, class1]`
- format 3D `(n_samples, n_features, 2)`
- format 2D `(n_samples, n_features)`

`models/shap_values.npy` est toujours sauvegardé en 2D.

## Documentation conformité prête à usage

- Voir `MODEL_CARD_AI_ACT.md` pour la version complète (objectif, données, performances, limites, AI Act, cyber, frugalité).
