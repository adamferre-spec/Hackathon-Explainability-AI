"""
Attrition Timeline Prediction Model.
Predicts HOW SOON an employee will leave, not just IF they will leave.

Uses survival analysis concepts: estimates time-to-event (departure) in months/years.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime, timedelta

ARTIFACTS = Path("model/artifacts")


class AttritionTimelineModel:
    """
    ML model to predict when an employee will leave (if they will leave).
    Uses regression to estimate months until departure.
    """

    def __init__(self):
        self.rf_model = None
        self.gb_model = None
        self.scaler = None
        self.features = None
        self.is_trained = False

    def train(self, employees_df: pd.DataFrame):
        """
        Train timeline prediction model on historical data.
        
        Assumptions:
        - Attrition = Yes means employee already left
        - Calculate "tenure at departure" from those who left
        - For active employees, predict time until departure based on similar profiles
        
        Args:
            employees_df: DataFrame with Attrition column and tenure columns
        """
        # Feature engineering
        features_to_use = [
            'Age', 'DistanceFromHome', 'JobLevel', 
            'MonthlyIncome', 'PerformanceRating', 'YearsAtCompany',
            'YearsInCurrentRole', 'YearsSinceLastPromotion', 
            'YearsWithCurrManager', 'EnvironmentSatisfaction',
            'JobInvolvement', 'JobSatisfaction', 'RelationshipSatisfaction',
            'WorkLifeBalance', 'TrainingTimesLastYear'
        ]
        
        # Filter to include only employees who left (Attrition = Yes)
        # Their "target" is YearsAtCompany (how long they stayed)
        departed = employees_df[employees_df['Attrition'].isin(['Yes', 1])].copy()
        
        if len(departed) < 10:
            print("⚠️ Not enough departed employees for timeline model training")
            self.is_trained = False
            return
        
        # Use YearsAtCompany as target (months until departure)
        X = departed[features_to_use].fillna(0)
        y = (departed['YearsAtCompany'] * 12).values  # Convert to months
        
        # Avoid extreme outliers
        y = np.clip(y, 1, 360)  # Between 1 month and 30 years
        
        # Standardize features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train ensemble models
        self.rf_model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
        self.gb_model = GradientBoostingRegressor(n_estimators=50, max_depth=5, learning_rate=0.1, random_state=42)
        
        self.rf_model.fit(X_scaled, y)
        self.gb_model.fit(X_scaled, y)
        
        self.features = features_to_use
        self.is_trained = True
        
        print(f"✅ Timeline model trained on {len(departed)} departed employees")

    def predict_departure_timeline(self, emp_data: Dict) -> Dict:
        """
        Predict when an employee will leave (if they will).
        
        Returns:
        - months_until_departure: predicted months
        - departure_date: estimated date
        - confidence: uncertainty of prediction
        - risk_level: high/medium/low based on timeline
        """
        if not self.is_trained:
            return {
                "error": "Timeline model not trained",
                "months_until_departure": None,
                "departure_date": None,
                "confidence": 0,
                "risk_level": "unknown"
            }
        
        # Build feature vector
        X = np.array([[emp_data.get(f, 0) for f in self.features]])
        X_scaled = self.scaler.transform(X)
        
        # Predictions from both models
        rf_pred = float(self.rf_model.predict(X_scaled)[0])
        gb_pred = float(self.gb_model.predict(X_scaled)[0])
        
        # Ensemble prediction (average with slight GradientBoosting bias)
        months_pred = 0.4 * rf_pred + 0.6 * gb_pred
        months_pred = max(1, min(360, months_pred))  # Clip to reasonable bounds
        
        # Uncertainty (differences between models = lower confidence)
        uncertainty = abs(rf_pred - gb_pred) / max(rf_pred, gb_pred, 1)
        confidence = max(0, 1 - uncertainty)
        
        # Calculate estimated departure date
        departure_date = datetime.now() + timedelta(days=months_pred * 30.44)
        
        # Risk level based on timeline
        if months_pred < 6:
            risk_level = "CRITICAL"
            risk_desc = "High risk of imminent departure"
        elif months_pred < 12:
            risk_level = "HIGH"
            risk_desc = "Significant departure risk within 1 year"
        elif months_pred < 24:
            risk_level = "MEDIUM"
            risk_desc = "Moderate departure risk within 2 years"
        else:
            risk_level = "LOW"
            risk_desc = "Low near-term departure risk"
        
        return {
            "months_until_departure": round(months_pred, 1),
            "years_until_departure": round(months_pred / 12, 2),
            "departure_date": departure_date.strftime("%Y-%m-%d"),
            "departure_quarter": self._get_quarter(departure_date),
            "confidence": round(confidence, 3),
            "risk_level": risk_level,
            "risk_description": risk_desc,
            "uncertainty": round(uncertainty, 3),
        }

    def _get_quarter(self, date: datetime) -> str:
        """Get quarter label from date"""
        quarters = {1: "Q1", 2: "Q1", 3: "Q2", 4: "Q2", 5: "Q2", 6: "Q3", 
                   7: "Q3", 8: "Q3", 9: "Q4", 10: "Q4", 11: "Q4", 12: "Q1"}
        year_offset = 1 if date.month >= 10 else 0
        q = quarters[date.month]
        return f"{q} {date.year + year_offset}"

    def save(self, path: str = "model/artifacts"):
        """Save trained models"""
        if not self.is_trained:
            return
        
        Path(path).mkdir(exist_ok=True)
        joblib.dump(self.rf_model, f"{path}/timeline_rf.pkl")
        joblib.dump(self.gb_model, f"{path}/timeline_gb.pkl")
        joblib.dump(self.scaler, f"{path}/timeline_scaler.pkl")
        joblib.dump(self.features, f"{path}/timeline_features.pkl")

    def load(self, path: str = "model/artifacts"):
        """Load trained models"""
        try:
            self.rf_model = joblib.load(f"{path}/timeline_rf.pkl")
            self.gb_model = joblib.load(f"{path}/timeline_gb.pkl")
            self.scaler = joblib.load(f"{path}/timeline_scaler.pkl")
            self.features = joblib.load(f"{path}/timeline_features.pkl")
            self.is_trained = True
            print("✅ Timeline models loaded")
        except FileNotFoundError:
            print("⚠️ Timeline models not found")
            self.is_trained = False


# Singleton instance
_timeline_model = None


def get_timeline_model() -> AttritionTimelineModel:
    """Get or create timeline model"""
    global _timeline_model
    if _timeline_model is None:
        _timeline_model = AttritionTimelineModel()
    return _timeline_model


def initialize_timeline_model(employees_df: pd.DataFrame):
    """Initialize and train timeline model"""
    global _timeline_model
    _timeline_model = AttritionTimelineModel()
    _timeline_model.train(employees_df)
    _timeline_model.save()
