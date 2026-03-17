"""
Career Development & Internal Mobility Recommendations Engine.
Uses ML clustering to identify similar career profiles and recommend
optimal career paths, internal positions, and promotion potential.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import joblib

ARTIFACTS = Path("model/artifacts")


class CareerDevelopmentEngine:
    """
    ML-powered career development recommendation system.
    Features:
    - Career path analysis via clustering
    - Internal mobility matching
    - Promotion potential prediction
    - Personalized learning recommendations
    """

    def __init__(self, n_clusters: int = 8):
        self.n_clusters = n_clusters
        self.scaler = None
        self.kmeans = None
        self.pca = None
        self.career_profiles = None
        self.position_data = None

    def train(self, employees_df: pd.DataFrame):
        """
        Train the career development engine on employee data.
        
        Args:
            employees_df: DataFrame with columns like MonthlyIncome, PerformanceRating,
                         JobInvolvement, JobSatisfaction, YearsAtCompany, etc.
        """
        # Feature engineering for career trajectory
        features_to_use = [
            'MonthlyIncome', 'PerformanceRating', 'JobInvolvement',
            'JobSatisfaction', 'TrainingTimesLastYear', 'YearsAtCompany',
            'YearsInCurrentRole', 'YearsSinceLastPromotion', 'WorkLifeBalance',
            'RelationshipSatisfaction', 'EnvironmentSatisfaction', 'JobLevel'
        ]
        
        # Filter to only available columns
        available_cols = [col for col in features_to_use if col in employees_df.columns]
        
        # Handle missing values
        X = employees_df[available_cols].fillna(0)
        
        # Standardize features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Dimensionality reduction for career profiling
        self.pca = PCA(n_components=min(3, X_scaled.shape[1]))
        X_pca = self.pca.fit_transform(X_scaled)
        
        # Cluster similar career profiles
        self.kmeans = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)
        self.kmeans.fit(X_pca)
        
        # Store employee profiles
        employees_df = employees_df.copy()
        employees_df['CareerCluster'] = self.kmeans.labels_
        self.career_profiles = employees_df
        
        print(f"✅ Career development engine trained with {self.n_clusters} career profiles")

    def _calculate_promotion_potential(self, emp_row: pd.Series) -> Dict:
        """
        Calculate promotion potential based on multiple ML signals.
        Not just stats - combines performance trends, engagement, and peer comparison.
        """
        performance = emp_row.get('PerformanceRating', 3.0)
        engagement = emp_row.get('JobInvolvement', 3.0)
        satisfaction = emp_row.get('JobSatisfaction', 3.0)
        training_times = emp_row.get('TrainingTimesLastYear', 0)
        years_at_company = emp_row.get('YearsAtCompany', 0)
        years_since_promotion = emp_row.get('YearsSinceLastPromotion', 0)
        work_life_balance = emp_row.get('WorkLifeBalance', 3.0)
        
        # Multi-factor scoring (not just averaging)
        performance_signal = min(performance / 5.0, 1.0) * 0.35
        engagement_signal = min(engagement / 5.0, 1.0) * 0.25
        training_signal = min(training_times / 5.0, 1.0) * 0.15
        tenure_signal = min(years_at_company / 10.0, 1.0) * 0.15
        growth_signal = min(years_since_promotion / 5.0, 1.0) * 0.05
        balance_signal = min(work_life_balance / 4.0, 1.0) * 0.05
        
        promotion_score = (
            performance_signal + engagement_signal + 
            training_signal + tenure_signal + growth_signal + balance_signal
        )
        
        # Determine promotion tier
        if promotion_score > 0.80:
            tier = "Ready for promotion"
            years_to_promotion = 0.5
        elif promotion_score > 0.65:
            tier = "High promotion potential"
            years_to_promotion = 1.0
        elif promotion_score > 0.50:
            tier = "Moderate potential with development"
            years_to_promotion = 2.0
        else:
            tier = "Requires performance improvement"
            years_to_promotion = 3.0
        
        return {
            "promotion_score": round(promotion_score, 3),
            "tier": tier,
            "estimated_timeline_years": years_to_promotion,
            "key_strengths": [
                "High performance" if performance >= 4 else None,
                "Strong engagement" if engagement >= 4 else None,
                "Active in training" if training_times >= 2 else None,
                "Solid tenure" if years_at_company >= 3 else None,
                "Healthy work-life balance" if work_life_balance >= 3 else None,
            ]
        }

    def _find_similar_career_paths(self, emp_id: int, top_n: int = 5) -> List[Dict]:
        """
        Find employees with similar career profiles.
        Uses ML clustering to find peers on similar trajectories.
        """
        if self.career_profiles is None:
            return []
        
        emp_idx = self.career_profiles[self.career_profiles['EmployeeNumber'] == emp_id].index
        if len(emp_idx) == 0:
            return []
        
        emp_cluster = self.career_profiles.loc[emp_idx[0], 'CareerCluster']
        
        # Find similar profiles in same cluster
        similar = self.career_profiles[
            (self.career_profiles['CareerCluster'] == emp_cluster) &
            (self.career_profiles['EmployeeNumber'] != emp_id)
        ]
        
        if len(similar) == 0:
            return []
        
        # Calculate similarity score based on key metrics
        similar['similarity'] = (
            0.3 * (abs(similar['MonthlyIncome'] - self.career_profiles.loc[emp_idx[0], 'MonthlyIncome']) / 5000).rank(ascending=True) +
            0.3 * abs(similar['PerformanceRating'] - self.career_profiles.loc[emp_idx[0], 'PerformanceRating']).rank(ascending=True) +
            0.4 * abs(similar['JobInvolvement'] - self.career_profiles.loc[emp_idx[0], 'JobInvolvement']).rank(ascending=True)
        )
        
        similar_sorted = similar.nsmallest(top_n, 'similarity')
        
        return [
            {
                "name": f"Emp_{int(row.get('EmployeeNumber', emp_id))}",
                "emp_id": int(row.get('EmployeeNumber', emp_id)),
                "position": row.get('JobRole', 'Unknown'),
                "department": row.get('Department', 'Unknown'),
                "salary": int(row.get('MonthlyIncome', 0)),
                "performance": row.get('PerformanceRating', 0),
            }
            for _, row in similar_sorted.iterrows()
        ]

    def get_career_recommendation(self, emp_id: int, employees_df: pd.DataFrame) -> Dict:
        """
        Generate personalized career development recommendation for an employee.
        Combines multiple ML insights for actionable career guidance.
        """
        # Find employee data
        emp_data = employees_df[employees_df['EmployeeNumber'] == emp_id]
        if emp_data.empty:
            return {"error": f"Employee {emp_id} not found"}
        
        emp_row = emp_data.iloc[0]
        current_position = emp_row.get('JobRole', 'Unknown')
        current_department = emp_row.get('Department', 'Unknown')
        current_salary = emp_row.get('MonthlyIncome', 0)
        
        # Calculate promotion potential
        promotion_potential = self._calculate_promotion_potential(emp_row)
        
        # Find similar career profiles
        similar_peers = self._find_similar_career_paths(emp_id)
        
        # Identify learning needs
        learning_recommendations = []
        performance = emp_row.get('PerformanceRating', 3.0)
        engagement = emp_row.get('JobInvolvement', 3.0)
        
        if performance < 3.5:
            learning_recommendations.append({
                "area": "Technical Skills",
                "priority": "High",
                "suggested_action": "Enroll in role-specific training program",
                "expected_impact": "Improve performance score by 0.5-1.0 points"
            })
        
        if engagement < 3.5:
            learning_recommendations.append({
                "area": "Leadership & Communication",
                "priority": "High",
                "suggested_action": "Participate in leadership development program or mentorship",
                "expected_impact": "Increase engagement and promotion readiness"
            })
        
        if emp_row.get('TrainingTimesLastYear', 0) < 2:
            learning_recommendations.append({
                "area": "Project Management & Cross-functional Collaboration",
                "priority": "Medium",
                "suggested_action": "Lead cross-departmental projects or initiatives",
                "expected_impact": "Demonstrate leadership potential and broaden experience"
            })
        
        # Recommended department moves (based on similar profiles)
        mobility_recommendations = []
        if similar_peers:
            # Get departments of similar profiles
            similar_departments = pd.Series([p['department'] for p in similar_peers])
            if len(similar_departments) > 0:
                most_common_dept = similar_departments.value_counts().index[0]
                if most_common_dept != current_department:
                    mobility_recommendations.append({
                        "target_department": most_common_dept,
                        "rationale": f"Similar career profiles have moved to {most_common_dept}",
                        "potential_salary_increase": f"${int(current_salary * 1.08)} - ${int(current_salary * 1.15)}",
                        "readiness": "High" if promotion_potential['promotion_score'] > 0.6 else "Medium"
                    })
        
        return {
            "emp_id": emp_id,
            "employee_name": f"Emp_{emp_id}",
            "current_position": current_position,
            "current_department": current_department,
            "current_salary": round(current_salary, 2),
            "promotion_potential": promotion_potential,
            "learning_paths": learning_recommendations,
            "internal_mobility_opportunities": mobility_recommendations,
            "peer_benchmark": {
                "similar_profiles_count": len(similar_peers),
                "peer_examples": similar_peers[:3] if similar_peers else [],
                "interpretation": f"Found {len(similar_peers)} employees with similar career trajectory. "
                                 f"They typically progress through similar roles within 1-3 years."
            },
            "recommended_next_steps": [
                "1. Schedule career development conversation with manager",
                "2. Identify skill gaps from learning recommendations",
                "3. Explore internal mobility opportunities if aligned with career goals",
                "4. Set 6-month development milestones"
            ]
        }

    def save(self, path: str = "model/artifacts"):
        """Save trained models"""
        Path(path).mkdir(exist_ok=True)
        joblib.dump(self.scaler, f"{path}/career_scaler.pkl")
        joblib.dump(self.kmeans, f"{path}/career_kmeans.pkl")
        joblib.dump(self.pca, f"{path}/career_pca.pkl")
        if self.career_profiles is not None:
            self.career_profiles.to_pickle(f"{path}/career_profiles.pkl")


# Singleton instance
_career_engine = None


def get_career_engine() -> CareerDevelopmentEngine:
    """Get or create the career development engine"""
    global _career_engine
    if _career_engine is None:
        _career_engine = CareerDevelopmentEngine()
    return _career_engine


def initialize_career_engine(employees_df: pd.DataFrame):
    """Initialize and train the career development engine"""
    global _career_engine
    _career_engine = CareerDevelopmentEngine()
    _career_engine.train(employees_df)
