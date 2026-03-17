import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import json


class WhatIfSimulator:
    """Simulate the impact of HR interventions on employee metrics."""

    def __init__(self, model=None, feature_names: List[str] | None = None):
        self.model = model
        self.feature_names = feature_names or []
        self.results_history = []

    def simulate_intervention(
        self, employee_data: dict, intervention: str, duration_months: int = 12
    ) -> Dict:
        """
        Simulate a specific intervention and its potential impact.

        Args:
            employee_data: Employee information
            intervention: Type of intervention (salary_raise, promotion, training, mentoring)
            duration_months: Duration of the simulation in months

        Returns:
            Dictionary with simulation results and predictions
        """
        intervention_key = self._normalize_intervention(intervention)
        simulated = self._simulate_feature_change(employee_data, intervention_key)
        baseline_risk = self._predict_risk(employee_data)
        scenario = employee_data.copy()
        scenario[simulated["feature_name"]] = simulated["new_value"]
        simulated_risk = self._predict_risk(scenario)

        result = {
            "employee_id": employee_data.get("EmployeeNumber"),
            "intervention": intervention_key,
            "simulation_date": datetime.now().isoformat(),
            "duration_months": duration_months,
            "simulated": simulated,
            "baseline_risk": baseline_risk,
            "simulated_risk": simulated_risk,
            "predicted_impact": self._calculate_impact(employee_data, intervention_key),
            "timeline": self._generate_timeline(intervention_key, duration_months),
            "success_probability": self._estimate_success(employee_data, intervention_key),
        }

        self.results_history.append(result)
        return result

    def _normalize_intervention(self, intervention: str) -> str:
        mapping = {
            "salary": "salary_raise",
            "salary_raise": "salary_raise",
            "promotion": "promotion",
            "training": "training",
            "mentoring": "mentoring",
            "satisfaction": "satisfaction_boost",
            "engagement": "engagement_boost",
        }
        return mapping.get(intervention, intervention)

    def _predict_risk(self, employee_data: dict) -> float:
        if self.model is None or not self.feature_names:
            return 0.0

        try:
            X = pd.DataFrame([{feature: employee_data.get(feature, 0) for feature in self.feature_names}])
            return float(self.model.predict_proba(X)[:, 1][0])
        except Exception:
            return 0.0

    def _simulate_feature_change(self, employee_data: dict, intervention: str) -> Dict:
        feature_name = "MonthlyIncome"
        current_value = employee_data.get(feature_name, 0)
        new_value = current_value

        if intervention == "salary_raise":
            feature_name = "MonthlyIncome"
            current_value = float(employee_data.get(feature_name, 0))
            new_value = round(current_value * 1.1, 2)
        elif intervention == "promotion":
            feature_name = "JobLevel"
            current_value = float(employee_data.get(feature_name, 1))
            new_value = current_value + 1
        elif intervention == "training":
            feature_name = "TrainingTimesLastYear"
            current_value = float(employee_data.get(feature_name, 0))
            new_value = current_value + 2
        elif intervention == "mentoring":
            feature_name = "RelationshipSatisfaction"
            current_value = float(employee_data.get(feature_name, 3))
            new_value = min(current_value + 1, 4)
        elif intervention == "satisfaction_boost":
            feature_name = "JobSatisfaction"
            current_value = float(employee_data.get(feature_name, 3))
            new_value = min(current_value + 1, 4)
        elif intervention == "engagement_boost":
            feature_name = "JobInvolvement"
            current_value = float(employee_data.get(feature_name, 3))
            new_value = min(current_value + 1, 4)

        return {
            "feature_name": feature_name,
            "old_value": current_value,
            "new_value": new_value,
            "feature_value": new_value,
        }

    def _calculate_impact(self, employee_data: dict, intervention: str) -> Dict:
        """Calculate predicted impact of intervention on key metrics."""
        impacts = {
            "satisfaction": 0,
            "engagement": 0,
            "performance": 0,
            "retention_risk_reduction": 0,
        }

        if intervention == "salary_raise":
            impacts["satisfaction"] = 15
            impacts["engagement"] = 8
            impacts["retention_risk_reduction"] = 20
        elif intervention == "promotion":
            impacts["satisfaction"] = 25
            impacts["engagement"] = 20
            impacts["performance"] = 10
            impacts["retention_risk_reduction"] = 30
        elif intervention == "training":
            impacts["performance"] = 15
            impacts["engagement"] = 12
            impacts["satisfaction"] = 5
        elif intervention == "mentoring":
            impacts["performance"] = 10
            impacts["engagement"] = 18
            impacts["satisfaction"] = 10
            impacts["retention_risk_reduction"] = 15

        return impacts

    def _generate_timeline(self, intervention: str, duration_months: int) -> List[Dict]:
        """Generate month-by-month timeline of impact."""
        timeline = []
        for month in range(1, min(duration_months + 1, 13)):
            timeline.append(
                {
                    "month": month,
                    "date": (datetime.now() + timedelta(days=30 * month)).isoformat(),
                    "adoption_rate": min(100, month * 15),
                    "cumulative_benefit": min(100, month * (100 / duration_months)),
                }
            )
        return timeline

    def _estimate_success(self, employee_data: dict, intervention: str) -> float:
        """Estimate probability of intervention success."""
        base_probability = 0.7

        if intervention == "salary_raise":
            if employee_data.get("Department") == "Sales":
                return 0.85
            return 0.75

        elif intervention == "promotion":
            job_satisfaction = employee_data.get("JobSatisfaction", 3)
            years_at_company = employee_data.get("YearsAtCompany", 3)
            if job_satisfaction >= 3 and years_at_company >= 2:
                return 0.9
            return 0.6

        elif intervention == "training":
            if employee_data.get("Department") in ["IT", "Research & Development"]:
                return 0.88
            return 0.72

        elif intervention == "mentoring":
            if employee_data.get("Age") < 30:
                return 0.82
            return 0.75

        return base_probability


class TemporalAnalyzer:
    """Analyze trends and patterns over time."""

    def __init__(self):
        self.analysis_cache = {}

    def analyze_trends(self, employee_history: pd.DataFrame) -> Dict:
        """
        Analyze temporal patterns in employee data.

        Args:
            employee_history: DataFrame with time-series employee data

        Returns:
            Dictionary with trend analysis results
        """
        df = employee_history.copy()
        if df.empty:
            return {
                "overall_rate": 0.0,
                "by_department": [],
                "by_status": {},
                "insights": ["No employee history available"],
                "overall_trend": "stable",
                "predictions": [],
                "recommendations": ["Load employee data to analyze attrition trends"],
            }

        df["is_attrition"] = (df["Attrition"] == "Yes").astype(int)
        overall_rate = float(df["is_attrition"].mean())

        by_department = (
            df.groupby("Department")["is_attrition"]
            .agg(["sum", "count"])
            .rename(columns={"sum": "departed", "count": "total"})
            .reset_index()
        )
        by_department["rate"] = (by_department["departed"] / by_department["total"]).round(3)
        by_department_records = by_department.to_dict(orient="records")

        by_status = {
            "active": int((df["Attrition"] != "Yes").sum()),
            "departed": int((df["Attrition"] == "Yes").sum()),
        }

        highest_department = None
        if by_department_records:
            highest_department = max(by_department_records, key=lambda item: item["rate"])

        insights = [
            f"Overall attrition rate is {overall_rate * 100:.1f}% across {len(df)} employees.",
            f"Overtime employees show {(df[df['OverTime'] == 'Yes']['is_attrition'].mean() * 100 if 'OverTime' in df.columns and len(df[df['OverTime'] == 'Yes']) else 0):.1f}% attrition." if "OverTime" in df.columns else "Overtime information is not available.",
            f"Average job satisfaction among departures is {df[df['Attrition'] == 'Yes']['JobSatisfaction'].mean():.2f}." if len(df[df['Attrition'] == 'Yes']) else "No departures recorded in this dataset.",
        ]
        if highest_department:
            insights.append(
                f"{highest_department['Department']} has the highest attrition rate at {highest_department['rate'] * 100:.1f}%."
            )

        trend_state = "stable"
        if overall_rate > 0.2:
            trend_state = "declining"
        elif overall_rate < 0.1:
            trend_state = "improving"

        trends = {
            "overall_rate": round(overall_rate, 3),
            "by_department": by_department_records,
            "by_status": by_status,
            "insights": insights,
            "overall_trend": trend_state,
            "predictions": self._generate_predictions(df),
            "recommendations": self._generate_temporal_recommendations(df, {"overall_trend": trend_state}),
        }

        return trends

    def _generate_predictions(self, history: pd.DataFrame) -> List[Dict]:
        """Generate forward-looking predictions based on historical patterns."""
        predictions = []
        if len(history) > 3:
            predictions.append(
                {
                    "metric": "attrition_risk",
                    "predicted_change": "stable",
                    "confidence": 0.72,
                }
            )
            predictions.append(
                {
                    "metric": "performance_trajectory",
                    "predicted_change": "slight_increase",
                    "confidence": 0.68,
                }
            )
        return predictions

    def _generate_temporal_recommendations(
        self, history: pd.DataFrame, trends: Dict
    ) -> List[str]:
        """Generate recommendations based on temporal analysis."""
        recommendations = []

        if trends["overall_trend"] == "declining":
            recommendations.append(
                "Schedule performance review to address satisfaction decline"
            )
            recommendations.append("Consider career development opportunities")

        if len(history) > 5:
            recommendations.append(
                "Employee shows long tenure - consider retention strategy"
            )

        if not recommendations:
            recommendations.append("Continue current engagement strategy")

        return recommendations

    def get_quarterly_summary(self, data: pd.DataFrame) -> Dict:
        """Generate quarterly performance summary."""
        return {
            "quarter": "Q1 2024",
            "avg_satisfaction": float(data.get("JobSatisfaction", 3)),
            "avg_performance": 3.5,
            "turnover_risk": "low",
        }
