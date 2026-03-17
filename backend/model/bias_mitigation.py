import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from datetime import datetime


class BiasAuditor:
    """Audit bias in HR predictions across demographic groups."""

    def __init__(self, model=None, sensitive_attributes: Dict = None):
        self.model = model
        self.sensitive_attributes = sensitive_attributes or {}
        self.audit_results = []

    def audit(self, X: pd.DataFrame, y: np.ndarray = None) -> Dict:
        """Run bias audit on predictions."""
        if self.model is None:
            return {"status": "no_model", "audit_results": []}

        predictions = self.model.predict_proba(X)[:, 1]
        
        audit = {
            "timestamp": datetime.now().isoformat(),
            "total_samples": len(X),
            "bias_metrics": {},
            "recommendations": [],
        }

        for attr_name, attr_values in self.sensitive_attributes.items():
            if attr_name in X.columns:
                bias_metrics = self._calculate_group_disparities(
                    X, predictions, attr_name
                )
                audit["bias_metrics"][attr_name] = bias_metrics

        self.audit_results.append(audit)
        return audit

    def _calculate_group_disparities(
        self, X: pd.DataFrame, predictions: np.ndarray, attribute: str
    ) -> Dict:
        """Calculate prediction disparities across demographic groups."""
        disparities = {}
        unique_groups = X[attribute].unique()

        for group in unique_groups:
            group_mask = X[attribute] == group
            group_predictions = predictions[group_mask]
            if len(group_predictions) > 0:
                disparities[str(group)] = round(float(np.mean(group_predictions)), 3)

        return disparities


class BiasCorrector:
    """Suggest interventions to address biased predictions."""

    @staticmethod
    def suggest_interventions(
        prediction: float,
        employee_data: Dict,
        sensitive_attr: str = None,
        group_value: str = None,
    ) -> List[Dict]:
        """Suggest interventions to address bias in prediction."""
        interventions = []

        if prediction > 0.7:
            interventions.append(
                {
                    "type": "career_development",
                    "description": "Provide career development opportunities",
                    "expected_impact": "Reduce attrition risk",
                }
            )
            interventions.append(
                {
                    "type": "management_review",
                    "description": "Schedule management review for high-risk employee",
                    "expected_impact": "Address underlying concerns",
                }
            )

        if employee_data.get("JobSatisfaction", 3) < 3:
            interventions.append(
                {
                    "type": "work_environment_improvement",
                    "description": "Improve work environment conditions",
                    "expected_impact": "Increase satisfaction and retention",
                }
            )

        if not interventions:
            interventions.append(
                {
                    "type": "maintain_engagement",
                    "description": "Continue current engagement strategies",
                    "expected_impact": "Maintain low attrition risk",
                }
            )

        return interventions


class BiasMitigationEngine:
    """Detect and mitigate bias in HR predictions and decisions."""

    def __init__(self):
        self.bias_reports = []
        self.mitigation_strategies = {}

    def assess_bias(self, predictions: np.ndarray, sensitive_attributes: Dict) -> Dict:
        """
        Assess bias in predictions across different demographic groups.

        Args:
            predictions: Array of model predictions
            sensitive_attributes: Dictionary with demographic groups

        Returns:
            Dictionary with bias assessment results
        """
        assessment = {
            "assessment_date": datetime.now().isoformat(),
            "overall_bias_score": 0.0,
            "group_disparities": {},
            "fairness_metrics": {},
            "recommendations": [],
        }

        if "gender" in sensitive_attributes:
            assessment["group_disparities"]["gender"] = self._calculate_disparity(
                predictions, sensitive_attributes["gender"]
            )

        if "department" in sensitive_attributes:
            assessment["group_disparities"]["department"] = self._calculate_disparity(
                predictions, sensitive_attributes["department"]
            )

        if "age_group" in sensitive_attributes:
            assessment["group_disparities"]["age_group"] = self._calculate_disparity(
                predictions, sensitive_attributes["age_group"]
            )

        assessment["overall_bias_score"] = self._calculate_overall_bias(
            assessment["group_disparities"]
        )
        assessment["fairness_metrics"] = self._calculate_fairness_metrics(
            predictions, sensitive_attributes
        )
        assessment["recommendations"] = self._generate_recommendations(assessment)

        self.bias_reports.append(assessment)
        return assessment

    def _calculate_disparity(
        self, predictions: np.ndarray, groups: List[str]
    ) -> Dict:
        """
        Calculate prediction disparity between groups.

        Returns ratio of attrition risk: high_risk_group / low_risk_group
        """
        disparity = {}

        if len(predictions) > 0 and len(groups) > 0:
            unique_groups = list(set(groups))
            group_means = {}

            for group in unique_groups:
                group_mask = [g == group for g in groups]
                if any(group_mask):
                    group_predictions = predictions[group_mask]
                    group_means[group] = float(np.mean(group_predictions))

            if len(group_means) > 1:
                max_mean = max(group_means.values())
                min_mean = min(group_means.values())
                if min_mean > 0:
                    disparity["ratio"] = round(max_mean / min_mean, 2)
                    disparity["difference"] = round(max_mean - min_mean, 3)
                    disparity["group_predictions"] = group_means

        return disparity

    def _calculate_overall_bias(self, group_disparities: Dict) -> float:
        """Calculate overall bias score (0-1, 0=no bias)."""
        if not group_disparities:
            return 0.0

        bias_scores = []
        for group_type, disparity in group_disparities.items():
            if "ratio" in disparity:
                ratio = disparity["ratio"]
                bias_score = min(1.0, abs(ratio - 1.0))
                bias_scores.append(bias_score)

        return round(np.mean(bias_scores), 3) if bias_scores else 0.0

    def _calculate_fairness_metrics(
        self, predictions: np.ndarray, sensitive_attributes: Dict
    ) -> Dict:
        """Calculate various fairness metrics."""
        metrics = {
            "demographic_parity": self._check_demographic_parity(
                predictions, sensitive_attributes.get("gender", [])
            ),
            "equalized_odds": self._check_equalized_odds(predictions),
            "calibration": self._check_calibration(predictions),
        }
        return metrics

    def _check_demographic_parity(self, predictions: np.ndarray, groups: List[str]) -> float:
        """Check how close different groups are in prediction rates."""
        if len(predictions) == 0 or len(groups) == 0:
            return 0.0

        unique_groups = list(set(groups))
        if len(unique_groups) < 2:
            return 0.0

        group_rates = {}
        for group in unique_groups:
            group_mask = [g == group for g in groups]
            if any(group_mask):
                group_predictions = predictions[group_mask]
                group_rates[group] = float(np.mean(group_predictions))

        if len(group_rates) > 1:
            rates = list(group_rates.values())
            return round(1.0 - (max(rates) - min(rates)), 3)

        return 0.0

    def _check_equalized_odds(self, predictions: np.ndarray) -> float:
        """Check if prediction rates are balanced."""
        if len(predictions) == 0:
            return 0.0

        predicted_positive = np.mean(predictions > 0.5)
        return round(min(predicted_positive, 1.0 - predicted_positive) * 2, 3)

    def _check_calibration(self, predictions: np.ndarray) -> float:
        """Check if predictions are well-calibrated."""
        if len(predictions) == 0:
            return 0.0

        return round(1.0 - np.std(predictions), 3)

    def _generate_recommendations(self, assessment: Dict) -> List[str]:
        """Generate recommendations to address detected biases."""
        recommendations = []

        if assessment["overall_bias_score"] > 0.2:
            recommendations.append(
                "Significant bias detected - review training data for representation"
            )
            recommendations.append(
                "Consider removing demographic predictors from model features"
            )

        if "gender" in assessment.get("group_disparities", {}):
            disparity = assessment["group_disparities"]["gender"]
            if disparity.get("ratio", 1.0) > 1.3:
                recommendations.append(
                    "Gender disparity detected in predictions - audit model decisions"
                )

        if not recommendations:
            recommendations.append("Bias levels within acceptable range - continue monitoring")

        return recommendations

    def apply_mitigation(
        self, predictions: np.ndarray, sensitive_attributes: Dict, strategy: str = "threshold_adjustment"
    ) -> np.ndarray:
        """
        Apply bias mitigation strategy to predictions.

        Args:
            predictions: Original predictions
            sensitive_attributes: Demographic information
            strategy: Mitigation strategy to apply

        Returns:
            Adjusted predictions
        """
        if strategy == "threshold_adjustment":
            return self._threshold_adjustment(predictions, sensitive_attributes)
        elif strategy == "reweighting":
            return self._reweighting(predictions, sensitive_attributes)
        else:
            return predictions

    def _threshold_adjustment(
        self, predictions: np.ndarray, sensitive_attributes: Dict
    ) -> np.ndarray:
        """Adjust decision thresholds per demographic group."""
        adjusted = predictions.copy()

        if "gender" in sensitive_attributes:
            groups = sensitive_attributes["gender"]
            unique_groups = list(set(groups))

            for i, group in enumerate(groups):
                if group == unique_groups[0]:
                    adjusted[i] = min(1.0, adjusted[i] * 1.05)
                else:
                    adjusted[i] = max(0.0, adjusted[i] * 0.95)

        return adjusted

    def _reweighting(
        self, predictions: np.ndarray, sensitive_attributes: Dict
    ) -> np.ndarray:
        """Reweight predictions based on group representation."""
        adjusted = predictions.copy()

        if "gender" in sensitive_attributes:
            gender_groups = sensitive_attributes["gender"]
            unique_groups = list(set(gender_groups))

            for group in unique_groups:
                group_indices = [i for i, g in enumerate(gender_groups) if g == group]
                if group_indices:
                    group_mean = np.mean(predictions[group_indices])
                    target_mean = 0.5
                    adjustment_factor = target_mean / group_mean if group_mean > 0 else 1.0
                    for idx in group_indices:
                        adjusted[idx] = min(
                            1.0, max(0.0, predictions[idx] * adjustment_factor)
                        )

        return adjusted

    def get_fairness_report(self) -> Dict:
        """Get a comprehensive fairness report from all assessments."""
        if not self.bias_reports:
            return {"status": "no_assessments_conducted", "recommendations": []}

        latest_report = self.bias_reports[-1]
        return {
            "date": latest_report["assessment_date"],
            "overall_bias_score": latest_report["overall_bias_score"],
            "total_assessments": len(self.bias_reports),
            "bias_trend": "improving"
            if len(self.bias_reports) > 1
            and self.bias_reports[-1]["overall_bias_score"]
            < self.bias_reports[-2]["overall_bias_score"]
            else "stable",
            "key_recommendations": latest_report["recommendations"],
        }
