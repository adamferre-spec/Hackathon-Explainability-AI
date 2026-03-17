# HR Attrition Predictor — Model Card & AI Act Documentation

## 1) Objectif du modèle

- **Nom** : HR Attrition Predictor
- **Cas d'usage visé** : classification pour prédire le risque de démission d'un employé et aider les équipes RH à prioriser des actions de rétention.
- **Périmètre d'usage** : **aide à la décision uniquement**, avec supervision humaine obligatoire ; aucune décision automatique.
- **Entrées** : 29 variables RH structurées par employé :
  - continues (ex. `MonthlyIncome`, `YearsAtCompany`)
  - ordinales (ex. `JobSatisfaction` 1-4, `WorkLifeBalance` 1-4)
  - catégorielles (ex. `OverTime`, `JobRole`, `MaritalStatus`, `AgeGroup`)
  - `Gender` présent en brut mais **exclu du modèle** (Art. 9 RGPD)
- **Sorties** : probabilité d'attrition entre 0 et 1 (affichée en %)
  - >= 65% : risque élevé
  - 35-65% : risque modéré
  - < 35% : risque faible
- **Explicabilité** : chaque prédiction est accompagnée d'une explication SHAP individuelle (waterfall, top 12 features).

---

## 2) Données d'entraînement

- **Dataset** : IBM HR Analytics Employee Attrition and Performance (Watson Analytics Sample Data)
- **Source** : https://www.kaggle.com/datasets/pavansubhasht/ibm-hr-analytics-attrition-dataset

### Taille et diversité

| Caractéristique | Valeur |
|---|---|
| Nombre total d'échantillons | 1 470 lignes |
| Features brutes | 35 colonnes |
| Features utilisées | 29 (après exclusions RGPD) |
| Split entraînement / test | 80% / 20% (stratifié Attrition) |
| Attrition = Yes | 237 (16,1%) |
| Attrition = No | 1 233 (83,9%) |

### Limites connues

- Déséquilibre de classes (16/84), géré par `class_weight='balanced'`.
- Dataset synthétique, non représentatif de tous les secteurs/régions.
- Pas de texte RH (feedbacks/entretiens) dans les features.
- Pas de vraie dimension temporelle exploitable.

---

## 3) Performances

### Métriques utilisées

- **F1-score** (métrique principale, adaptée au déséquilibre)
- **AUC-ROC** (capacité discriminante globale)
- **Matrice de confusion** (faux positifs/faux négatifs)

### Résultats sur le jeu de test (20%)

| Métrique | Score |
|---|---|
| F1-score (classe Attrition = 1) | 0,39 |
| AUC-ROC | 0,79 |

### Interprétation

- Un F1 de 0,39 est acceptable sur un dataset à 16% de positifs.
- Une AUC de 0,79 indique une bonne discrimination globale.
- Le système est conçu pour **priorisation RH**, pas pour automatiser des décisions.

### Fairness

- `Gender` exclu du modèle.
- Audit post-hoc possible sur les prédictions par genre, sans utiliser le genre en entrée du modèle.

---

## 4) Limites

### Risques d'erreur connus

- Faux négatifs non négligeables sur des profils à risque.
- Dégradation potentielle hors distribution (profils atypiques).
- Instabilité possible autour des seuils (35-50%).

### Situations non couvertes

- Entreprises / contextes éloignés du dataset IBM.
- Facteurs extra-professionnels non observés.
- Évolutions temporelles non modélisées dynamiquement.

### Risques de biais

- Reproduction possible de biais historiques.
- Biais de déclaration sur variables de satisfaction.
- Proxies indirects via `JobRole` et `Department`.

---

## 5) Risques et mitigation

- **AI Act** : classification **Haut Risque**, Annexe III §4 (emploi/gestion travailleurs).

### Risques de mauvaise utilisation

- Interpréter un score comme verdict définitif.
- Utiliser le modèle sans revue humaine.
- Comparer des employés sans contextualisation.
- Utiliser des données non anonymisées.

### Contrôles mis en place

| Contrôle | Implémentation |
|---|---|
| Supervision humaine obligatoire | Validation humaine + workflow RH |
| Disclaimer AI Act | Affiché dans les pages de prédiction |
| Seuils explicites | Vert / Orange / Rouge |
| Exclusion de Gender | Hard-coded dans le pipeline |
| Anonymisation RGPD | Suppression ID + Age -> AgeGroup |
| Explication SHAP individuelle | Waterfall systématique |
| Suggestions actionnables | Logique maison, actions non destructives |

---

## 6) Énergie et frugalité

- Architecture : Random Forest tabulaire (sobre, CPU-friendly)
- Taille modèle estimée : 5-15 Mo
- Temps d'entraînement : < 30 s (CPU)
- Temps d'inférence : < 10 ms par prédiction (CPU)
- Énergie entraînement estimée : < 0,001 kWh (ordre de grandeur)
- Pas de GPU requis, pas d'API externe, empreinte infra limitée.

---

## 7) Cyber & RGPD

### Anonymisation RGPD

| Colonne | Traitement | Base légale |
|---|---|---|
| EmployeeNumber | Supprimée (identifiant direct) | Art. 4 RGPD |
| Age | Transformée en AgeGroup | Art. 5(1)(c) minimisation |
| Gender | Conservée pour audit, exclue du modèle | Art. 9 RGPD |
| EmployeeCount | Supprimée (constante) | Art. 5(1)(c) |
| StandardHours | Supprimée (constante) | Art. 5(1)(c) |
| Over18 | Supprimée (constante) | Art. 5(1)(c) |

### Sécurisation des entrées

- Validation des types/plages.
- Pas de texte libre dans le modèle.
- `handle_unknown='ignore'` sur OneHotEncoder.
- Pas d'appel API externe pour l'inférence.

### Secrets et stockage

- Aucune clé API dans le code.
- CSV source à exclure du dépôt via `.gitignore`.
- Artefacts (`.pkl`, `.npy`) stockés localement.

### Vecteurs résiduels

- Model inversion théorique (risque faible sur données synthétiques).
- Inputs adversariaux extrêmes (mitigation via supervision humaine).
