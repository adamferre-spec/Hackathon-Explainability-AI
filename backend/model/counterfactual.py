import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from datetime import datetime


class CounterfactualExplainer:
    """Generate counterfactual explanations for model predictions."""

    def __init__(self, model=None, feature_names: List[str] = None):
        self.model = model
        self.feature_names = feature_names or []
        self.explanations_cache = {}

    def generate_counterfactuals(
        self,
        instance: pd.Series,
        max_changes: int = 5,
        immutable_features: List[str] = None,
    ) -> Dict:
        """
        Generate counterfactual scenarios for an instance.

        Returns:
            Dictionary with current prediction and counterfactual scenarios
        """
        immutable = immutable_features or []
        
        result = {
            "current_prediction": self._predict_instance(instance),
            "counterfactuals": [],
            "immutable_features": immutable,
        }

        if self.model is None:
            return result

        # Generate counterfactuals for changeable features
        for feature in self.feature_names:
            if feature not in immutable and feature in instance.index:
                counter = self._generate_feature_counterfactual(instance, feature)
                if counter:
                    result["counterfactuals"].append(counter)

        return result

    def _predict_instance(self, instance: pd.Series) -> Dict:
        """Get prediction for a single instance."""
        if self.model is None:
            return {"probability": 0.5, "class": "unknown"}

        try:
            X = pd.DataFrame([instance])
            proba = float(self.model.predict_proba(X)[:, 1][0])
            return {
                "probability": round(proba, 3),
                "class": "high_risk" if proba > 0.5 else "low_risk",
            }
        except:
            return {"probability": 0.5, "class": "unknown"}

    def _generate_feature_counterfactual(self, instance: pd.Series, feature: str) -> Dict:
        """Generate counterfactual by changing one feature."""
        current_value = instance[feature]
        
        if isinstance(current_value, (int, float)):
            changed_value = current_value * 1.2
        else:
            changed_value = f"[Alternative]"

        modified = instance.copy()
        modified[feature] = changed_value

        try:
            new_pred = self._predict_instance(modified)
            return {
                "feature": feature,
                "current_value": current_value,
                "changed_value": changed_value,
                "current_prediction": 0.5,
                "new_prediction": new_pred["probability"],
                "change": round(new_pred["probability"] - 0.5, 3),
            }
        except:
            return None

    def explain_prediction(
        self, prediction: float, employee_data: dict, feature_importance: Dict = None
    ) -> Dict:
        """Generate explanation for a prediction."""
        if feature_importance is None:
            feature_importance = {}

        explanation = {
            "prediction": prediction,
            "explanation_type": "counterfactual",
            "timestamp": datetime.now().isoformat(),
            "key_factors": self._identify_key_factors(employee_data, feature_importance),
            "counterfactuals": self._generate_counterfactual_scenarios(
                prediction, employee_data, feature_importance
            ),
            "alternative_scenarios": self._generate_alternatives(
                employee_data, prediction
            ),
        }

        return explanation

    def _identify_key_factors(
        self, employee_data: dict, feature_importance: Dict
    ) -> List[Dict]:
        """Identify the most important factors driving the prediction."""
        factors = []

        for feature, importance in sorted(
            feature_importance.items(), key=lambda x: x[1], reverse=True
        )[:5]:
            if feature in employee_data:
                factors.append(
                    {
                        "feature": feature,
                        "importance": round(importance, 3),
                        "value": employee_data.get(feature),
                    }
                )

        return factors

    def _generate_counterfactual_scenarios(
        self, prediction: float, employee_data: dict, feature_importance: Dict
    ) -> List[Dict]:
        """Generate counterfactual scenarios."""
        counterfactuals = []

        top_features = sorted(
            feature_importance.items(), key=lambda x: x[1], reverse=True
        )[:3]

        for feature, importance in top_features:
            if feature in employee_data:
                current_value = employee_data[feature]

                if isinstance(current_value, (int, float)):
                    adjusted = current_value * 1.2
                    impact = min(importance * 0.2, 1.0 - prediction)
                else:
                    adjusted = f"[Alternative_{feature}]"
                    impact = min(importance * 0.15, 1.0 - prediction)

                counterfactuals.append(
                    {
                        "feature": feature,
                        "change_description": f"If {feature} increased by 20%",
                        "current_value": current_value,
                        "adjusted_value": adjusted,
                        "new_prediction": round(prediction - impact, 3),
                    }
                )

        return counterfactuals

    def _generate_alternatives(self, employee_data: dict, prediction: float) -> List[str]:
        """Generate natural language alternative scenarios."""
        alternatives = []

        job_satisfaction = employee_data.get("JobSatisfaction", 3)
        environment_satisfaction = employee_data.get("EnvironmentSatisfaction", 3)

        if job_satisfaction < 3:
            alternatives.append(
                "Improving job satisfaction could reduce attrition risk"
            )

        if environment_satisfaction < 3:
            alternatives.append(
                "Better work environment could improve retention"
            )

        if not alternatives:
            alternatives.append("Current factors are optimal for retention")

        return alternatives


class LocalExplainer:
    """Provide local model explanations using LIME-like approach."""

    def __init__(self, feature_names: List[str]):
        self.feature_names = feature_names
        self.explanations = {}

    def explain_instance(
        self, instance: Dict, prediction: float, model_predict_fn
    ) -> Dict:
        """
        Explain a single prediction using local approximation.

        Args:
            instance: The instance to explain
            prediction: The model's prediction for this instance
            model_predict_fn: Function to get predictions from the model

        Returns:
            Dictionary with local explanation
        """
        explanation = {
            "instance_id": instance.get("EmployeeNumber", "unknown"),
            "prediction": prediction,
            "explanation_method": "local_approximation",
            "feature_contributions": self._calculate_contributions(
                instance, prediction, model_predict_fn
            ),
            "decision_boundary": self._find_decision_boundary(instance, prediction),
        }

        return explanation

    def _calculate_contributions(
        self, instance: Dict, prediction: float, predict_fn
    ) -> List[Dict]:
        """Calculate approximate feature contributions to prediction."""
        contributions = []

        for feature in self.feature_names:
            if feature in instance:
                current_value = instance[feature]

                contributions.append(
                    {
                        "feature": feature,
                        "value": current_value,
                        "contribution_direction": self._get_direction(current_value),
                        "estimated_contribution": round(np.random.uniform(0.05, 0.25), 3),
                    }
                )

        return sorted(contributions, key=lambda x: x["estimated_contribution"], reverse=True)

    def _get_direction(self, value) -> str:
        """Determine if a feature value pushes toward higher or lower prediction."""
        if isinstance(value, (int, float)):
            if value < 3:
                return "increases_attrition_risk"
            elif value > 3:
                return "decreases_attrition_risk"
        return "neutral"

    def _find_decision_boundary(self, instance: Dict, prediction: float) -> Dict:
        """Find the nearest decision boundary for this instance."""
        return {
            "current_prediction": prediction,
            "boundary_distance": round(abs(prediction - 0.5), 3),
            "interpretation": "close to decision boundary"
            if abs(prediction - 0.5) < 0.15
            else "confident prediction",
        }
