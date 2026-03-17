"""
Anomaly Detection & Early Warning System for HR.
Identifies unusual employee profiles and flags early warning signs.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from sklearn.ensemble import IsolationForest


class AnomalyDetector:
    """Detects anomalous employee profiles using Isolation Forest"""
    
    def __init__(self, contamination: float = 0.05):
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.scaler_stats = None
        self.features = None
        self.is_fitted = False

    def fit(self, X: pd.DataFrame, feature_names: List[str]):
        """Fit anomaly detector on employee data"""
        self.features = feature_names
        X_clean = X[feature_names].fillna(0).values
        self.model.fit(X_clean)
        self.is_fitted = True
        print(f"✅ Anomaly detector trained on {len(X)} employees")

    def detect(self, emp_data: Dict, features: List[str]) -> Dict:
        """Detect if employee profile is anomalous"""
        if not self.is_fitted:
            return {
                'is_anomalous': False,
                'anomaly_score': 0,
                'anomaly_type': 'unknown',
                'explanation': 'Model not fitted'
            }
        
        try:
            X = np.array([[emp_data.get(f, 0) for f in features]])
            pred = self.model.predict(X)[0]
            score = abs(self.model.score_samples(X)[0])
            
            return {
                'is_anomalous': bool(pred == -1),
                'anomaly_score': float(score),
                'anomaly_type': self._classify_anomaly(emp_data),
                'explanation': self._get_explanation(emp_data, pred == -1)
            }
        except Exception as e:
            return {
                'is_anomalous': False,
                'anomaly_score': 0,
                'anomaly_type': 'error',
                'explanation': str(e)
            }

    def _classify_anomaly(self, emp_data: Dict) -> str:
        """Classify type of anomaly"""
        salary = emp_data.get('MonthlyIncome', 0)
        absences = emp_data.get('Absences', 0)
        satisfaction = emp_data.get('JobSatisfaction', 3)
        
        if absences > 10:
            return 'attendance_issue'
        if satisfaction <= 1:
            return 'satisfaction_crisis'
        if salary > 10000:
            return 'compensation_outlier'
        return 'profile_outlier'

    def _get_explanation(self, emp_data: Dict, is_anomalous: bool) -> str:
        """Generate explanation for anomaly"""
        if not is_anomalous:
            return 'Profile within normal range'
        
        issues = []
        if emp_data.get('Absences', 0) > 10:
            issues.append('high absences')
        if emp_data.get('JobSatisfaction', 3) <= 1:
            issues.append('critical low satisfaction')
        if emp_data.get('EnvironmentSatisfaction', 3) <= 1:
            issues.append('poor environment perception')
        
        return f"Unusual profile detected: {', '.join(issues) if issues else 'pattern mismatch'}"


class EarlyWarningSystem:
    """Identifies early warning signs for attrition"""
    
    @staticmethod
    def check_warning_signs(emp_data: Dict) -> List[Dict]:
        """Check for early warning signs"""
        warnings = []
        
        # Low satisfaction
        if emp_data.get('JobSatisfaction', 3) <= 2:
            warnings.append({
                'sign': 'LOW_JOB_SATISFACTION',
                'severity': 'HIGH',
                'value': emp_data.get('JobSatisfaction', 0),
                'threshold': 2,
                'explanation': 'Job satisfaction critically low - employee likely unhappy'
            })
        
        # Low engagement
        if emp_data.get('JobInvolvement', 3) <= 2:
            warnings.append({
                'sign': 'LOW_ENGAGEMENT',
                'severity': 'HIGH',
                'value': emp_data.get('JobInvolvement', 0),
                'threshold': 2,
                'explanation': 'Job involvement declining - possible disengagement'
            })
        
        # High absences
        if emp_data.get('Absences', 0) > 10:
            warnings.append({
                'sign': 'HIGH_ABSENCES',
                'severity': 'MEDIUM',
                'value': emp_data.get('Absences', 0),
                'threshold': 10,
                'explanation': 'Elevated absence rate - possible health or motivation issues'
            })
        
        # Low environment satisfaction
        if emp_data.get('EnvironmentSatisfaction', 3) <= 2:
            warnings.append({
                'sign': 'ENVIRONMENT_DISSATISFACTION',
                'severity': 'MEDIUM',
                'value': emp_data.get('EnvironmentSatisfaction', 0),
                'threshold': 2,
                'explanation': 'Work environment satisfaction low - consider work conditions'
            })
        
        # Long commute
        if emp_data.get('DistanceFromHome', 0) > 20:
            warnings.append({
                'sign': 'LONG_COMMUTE',
                'severity': 'LOW',
                'value': emp_data.get('DistanceFromHome', 0),
                'threshold': 20,
                'explanation': 'Long commute distance may impact retention'
            })
        
        # Low relationship satisfaction
        if emp_data.get('RelationshipSatisfaction', 3) <= 2:
            warnings.append({
                'sign': 'RELATIONSHIP_SATISFACTION_LOW',
                'severity': 'MEDIUM',
                'value': emp_data.get('RelationshipSatisfaction', 0),
                'threshold': 2,
                'explanation': 'Relationship satisfaction at work is low'
            })
        
        return sorted(warnings, key=lambda x: {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}[x['severity']], reverse=True)
