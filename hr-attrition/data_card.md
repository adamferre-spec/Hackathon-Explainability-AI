# Data Card — IBM HR Attrition

## Source
- Dataset: IBM HR Analytics Employee Attrition (Kaggle / Watson Analytics)
- Fichier attendu: `data/WA_Fn-UseC_-HR-Employee-Attrition.csv`
- Taille: 1 470 lignes, 35 colonnes

## Cible
- `Attrition` (Yes/No)
- Encodage interne pipeline: Yes=1, No=0

## Sensibilité & conformité
- Données synthétiques (pas de vraies personnes)
- Suppression des identifiants directs: `EmployeeNumber`
- Suppression colonnes constantes: `EmployeeCount`, `StandardHours`, `Over18`
- Quasi-identifiant transformé: `Age -> AgeGroup`
- `Gender` conservé pour audit fairness, exclu du modèle

## Limites
- Dataset déséquilibré (~16% départ)
- Résultats destinés à l'aide à la décision RH, pas à l'automatisation
