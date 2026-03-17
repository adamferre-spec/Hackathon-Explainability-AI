"""
Router Advanced — CyberGuard AI
Advanced endpoints: counterfactuals, bias audit, anomalies, simulations, trends, career development.
Provides true AI-powered insights beyond statistics.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Optional

from .hr import _load_data, _get_model, _sanitize_input, _create_audit_log
from model.counterfactual import CounterfactualExplainer
from model.bias_mitigation import BiasAuditor, BiasCorrector
from model.anomaly_detection import AnomalyDetector, EarlyWarningSystem
from model.simulation import WhatIfSimulator, TemporalAnalyzer
from model.career_development import get_career_engine, initialize_career_engine
from model.attrition_timeline import get_timeline_model, initialize_timeline_model


router = APIRouter()

# Instantiate advanced modules (with lazy loading)
_counterfactual_explainer = None
_bias_auditor = None
_anomaly_detector = None
_simulator = None
_temporal_analyzer = None
_career_engine = None
_timeline_model = None


def _init_advanced_modules():
    """Initialize models on first use."""
    global _counterfactual_explainer, _bias_auditor, _anomaly_detector, _simulator, _temporal_analyzer, _career_engine, _timeline_model

    if (
        _counterfactual_explainer is not None
        and _bias_auditor is not None
        and _anomaly_detector is not None
        and _simulator is not None
        and _temporal_analyzer is not None
        and _career_engine is not None
        and _timeline_model is not None
    ):
        return

    model, features = _get_model()
    df = _load_data()

    if _counterfactual_explainer is None:
        _counterfactual_explainer = CounterfactualExplainer(
            model=model,
            feature_names=features,
        )

    if _bias_auditor is None:
        sensitive_attributes = {
            'Gender': list(df['Gender'].unique()[:3]) if 'Gender' in df.columns else ['Male', 'Female'],
            'Department': list(df['Department'].unique()[:5]) if 'Department' in df.columns else [],
        }
        _bias_auditor = BiasAuditor(model=model, sensitive_attributes=sensitive_attributes)

    if _anomaly_detector is None:
        _anomaly_detector = AnomalyDetector(contamination=0.05)
        _anomaly_detector.fit(df[features], features)

    if _simulator is None:
        _simulator = WhatIfSimulator(model=model, feature_names=features)

    if _temporal_analyzer is None:
        _temporal_analyzer = TemporalAnalyzer()

    if _career_engine is None:
        _career_engine = get_career_engine()
        if df is not None and not df.empty:
            _career_engine.train(df)

    if _timeline_model is None:
        _timeline_model = get_timeline_model()
        if df is not None and not df.empty:
            _timeline_model.train(df)


# ──────────────────────────────────────────────────────────────────
# 1. COUNTERFACTUAL EXPLANATIONS
# ──────────────────────────────────────────────────────────────────

@router.get("/advanced/counterfactual/{emp_id}")
def counterfactual_explanations(emp_id: int):
    """    
    🎯 CONTREFACTUALS: "What if we changed X, would prediction flip?"
    
    Returns concrete, actionable changes that could prevent attrition.
    Not just "feature X matters" but "HERE's what to change"
    """
    emp_id = _sanitize_input(emp_id)
    df = _load_data()
    model, features = _get_model()
    
    row = df[df['EmployeeNumber'] == emp_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    row = row.iloc[0]
    instance = pd.Series({f: row[f] for f in features})
    
    # Generate counterfactuals
    _init_advanced_modules()
    counterfactuals = _counterfactual_explainer.generate_counterfactuals(
        instance,
        max_changes=5,
        immutable_features=['Gender', 'MaritalStatus']  # Can't change these
    )
    
    _create_audit_log(emp_id, "COUNTERFACTUAL_REQUEST", counterfactuals['current_prediction']['probability'])
    
    return {
        'emp_id': emp_id,
        'name': f"Emp_{emp_id}",
        'current_risk': counterfactuals['current_prediction']['probability'],
        'actionable_changes': counterfactuals['counterfactuals'],
        'interpretation': counterfactuals['interpretation'],
        'timestamp': datetime.utcnow().isoformat(),
    }


# ──────────────────────────────────────────────────────────────────
# 2. BIAS AUDIT & MITIGATION
# ──────────────────────────────────────────────────────────────────

@router.get("/advanced/bias-audit")
def bias_audit():
    """    
    ⚖️  BIAS AUDIT: Detect discrimination in our model by demographic group.
    
    Also suggests ACTIONS to fix it.
    """
    df = _load_data()
    model, features = _get_model()
    
    X = df[features]
    y = (df['Attrition'] == 'Yes').astype(int).values
    
    _init_advanced_modules()
    audit_results = _bias_auditor.audit(X, y, features)
    
    _create_audit_log(0, "BIAS_AUDIT", -1)  # Audit is for whole population
    
    return {
        'audit_timestamp': datetime.utcnow().isoformat(),
        'global_metrics': audit_results['global_metrics'],
        'group_analysis': audit_results['group_analysis'],
        'bias_alerts': audit_results['bias_alerts'],
        'recommendations': audit_results['recommendations'],
        'summary': _summarize_bias_results(audit_results)
    }


def _summarize_bias_results(results: Dict) -> str:
    """Generate executive summary of bias audit."""
    alerts = results['bias_alerts']
    if not alerts:
        return "✅ No significant bias detected in current model."
    
    high_severity = [a for a in alerts if a['severity'] == 'HIGH']
    if high_severity:
        return f"⚠️  CRITICAL: {len(high_severity)} high-severity bias alerts detected. Immediate action required."
    else:
        return f"⚠️  WARNING: {len(alerts)} moderate bias concerns detected. Review recommended."


@router.get("/advanced/interventions/{emp_id}")
def hr_interventions(emp_id: int):
    """    
    💡 HR INTERVENTIONS: Specific actions to reduce attrition for this employee.
    
    Data-driven recommendations based on employee profile and predicted risk.
    """
    emp_id = _sanitize_input(emp_id)
    df = _load_data()
    model, features = _get_model()
    
    row = df[df['EmployeeNumber'] == emp_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    row = row.iloc[0]
    X = pd.DataFrame([row[features].fillna(0)])
    proba = float(model.predict_proba(X)[:, 1][0])
    
    employee_dict = row.to_dict()
    
    interventions = BiasCorrector.suggest_interventions(
        prediction=proba,
        employee_data=employee_dict,
        sensitive_attr='Gender',
        group_value=employee_dict.get('Gender'),
    )
    
    return {
        'emp_id': emp_id,
        'current_risk': float(proba),
        'recommended_interventions': interventions,
        'priority': 'URGENT' if proba > 0.7 else 'HIGH' if proba > 0.5 else 'MEDIUM',
        'note': 'These interventions are designed to reduce attrition risk based on data analysis.'
    }


# ──────────────────────────────────────────────────────────────────
# 3. ANOMALY DETECTION
# ──────────────────────────────────────────────────────────────────

@router.get("/advanced/anomaly/{emp_id}")
def anomaly_check(emp_id: int):
    """    
    🚨 ANOMALY DETECTION: Is this employee's profile unusual?
    
    Identifies outliers that might need special attention.
    """
    emp_id = _sanitize_input(emp_id)
    df = _load_data()
    model, features = _get_model()
    
    row = df[df['EmployeeNumber'] == emp_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    row = row.iloc[0]
    instance_dict = {f: row[f] for f in features}
    
    _init_advanced_modules()
    anomaly_result = _anomaly_detector.detect(instance_dict, features)
    
    # Early warning signs
    early_warnings = EarlyWarningSystem.check_warning_signs(instance_dict)
    
    return {
        'emp_id': emp_id,
        'anomaly_analysis': anomaly_result,
        'early_warning_signs': early_warnings,
        'action_needed': len(early_warnings) > 0 or anomaly_result['is_anomalous'],
    }


# ──────────────────────────────────────────────────────────────────
# 4. CAREER DEVELOPMENT & INTERNAL MOBILITY (NEW! 🚀)
# ──────────────────────────────────────────────────────────────────

@router.get("/advanced/career-recommendation/{emp_id}")
def career_development_recommendation(emp_id: int):
    """    
    🎯 CAREER DEVELOPMENT: ML-powered personalized career path recommendations.
    
    NOT just statistics - combines clustering, peer analysis, and promotion potential scoring.
    Provides actionable recommendations for:
    - Promotion readiness assessment
    - Learning path recommendations
    - Internal mobility opportunities
    - Peer benchmarking
    
    This is REAL AI value: helps employees grow and managers develop talent.
    """
    emp_id = _sanitize_input(emp_id)
    df = _load_data()
    
    row = df[df['EmployeeNumber'] == emp_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    _init_advanced_modules()
    
    # Get career recommendation from ML engine
    recommendation = _career_engine.get_career_recommendation(emp_id, df)
    
    _create_audit_log(emp_id, "CAREER_RECOMMENDATION", -1)
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'data': recommendation
    }


@router.get("/advanced/talent-pool")
def hidden_talent_detection():
    """    
    ⭐ HIDDEN TALENT DETECTION: Identify high-potential employees who may be undervalued.
    
    Uses ML clustering to find employees with:
    - High promotion potential but not yet promoted
    - Strong performance/engagement signals
    - Initiative (special projects)
    - Low turnover risk (reliably stay)
    
    Helps HR identify emerging leaders and talent for succession planning.
    """
    df = _load_data()
    
    _init_advanced_modules()
    
    # Calculate talent scores
    talent_pool = []
    
    for idx, emp in df.iterrows():
        # Skip inactive/terminated employees
        if emp.get('Attrition') == 'Yes':
            continue
        
        promotion_potential = _career_engine._calculate_promotion_potential(emp)
        
        # Identify hidden talents: high potential + not yet in senior position
        is_entry_to_mid = emp.get('MonthlyIncome', 0) < df['MonthlyIncome'].quantile(0.75)
        
        if (promotion_potential['promotion_score'] > 0.65 and is_entry_to_mid and 
            promotion_potential['estimated_timeline_years'] < 2):
            
            talent_pool.append({
                'emp_id': emp.get('EmployeeNumber'),
                'name': f"Emp_{int(emp.get('EmployeeNumber', 0))}",
                'position': emp.get('JobRole', 'Unknown'),
                'department': emp.get('Department', 'Unknown'),
                'current_salary': round(emp.get('MonthlyIncome', 0), 2),
                'promotion_potential': promotion_potential,
                'talent_score': round(promotion_potential['promotion_score'], 3),
                'readiness_level': 'Ready Now' if promotion_potential['promotion_score'] > 0.8 else 'Ready in 6-12 months',
            })
    
    # Sort by talent score
    talent_pool = sorted(talent_pool, key=lambda x: x['talent_score'], reverse=True)
    
    _create_audit_log(0, "TALENT_POOL_ANALYSIS", -1)
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'total_employees_analyzed': len(df[df['Attrition'] != 'Yes']),
        'hidden_talents_identified': len(talent_pool),
        'talent_pool': talent_pool[:20],  # Top 20
        'summary': f"Found {len(talent_pool)} high-potential employees ready for growth. "
                   f"Estimated {len([t for t in talent_pool if 'Ready Now' in t['readiness_level']])} ready for immediate promotion."
    }


# ──────────────────────────────────────────────────────────────────
# 5. WHAT-IF SIMULATION
# ──────────────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    emp_id: int
    interventions: List[Dict]  # [{'type': 'salary', 'amount': 10}, ...]


@router.post("/advanced/simulate")
def what_if_simulation(request: SimulationRequest):
    """    
    🔮 WHAT-IF SIMULATION: Test impact of HR decisions BEFORE implementing.
    
    e.g., "What if we increase salary 10%? What if we improve satisfaction?"
    """
    emp_id = _sanitize_input(request.emp_id)
    df = _load_data()
    model, features = _get_model()
    
    row = df[df['EmployeeNumber'] == emp_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    row = row.iloc[0]
    employee_dict = {f: row[f] for f in features}
    
    _init_advanced_modules()
    
    all_results = []
    for intervention in request.interventions:
        intervention_type = intervention.get('type', 'salary')
        amount = intervention.get('amount', 0)
        
        result = _simulator.simulate_intervention(
            employee_dict,
            intervention_type,
            amount
        )
        
        all_results.append(result)
        
        # Update for chained interventions
        feature_key_mapping = {
            'salary': 'MonthlyIncome',
            'satisfaction': 'JobSatisfaction',
            'engagement': 'JobInvolvement',
        }
        if intervention_type in feature_key_mapping:
            update_key = feature_key_mapping[intervention_type]
            if update_key in employee_dict:
                employee_dict[update_key] = result['simulated']['feature_value']
    
    baseline_proba = float(model.predict_proba(
        pd.DataFrame([{f: row[f] for f in features}])[features]
    )[:, 1][0])
    final_proba = float(model.predict_proba(
        pd.DataFrame([employee_dict])[features]
    )[:, 1][0])
    
    return {
        'emp_id': emp_id,
        'baseline_prediction': baseline_proba,
        'simulated_prediction': final_proba,
        'total_impact': float(final_proba - baseline_proba),
        'risk_reduction': float(max(0, baseline_proba - final_proba)),
        'simulations': all_results,
        'recommendation': _get_simulation_recommendation(baseline_proba, final_proba)
    }


def _get_simulation_recommendation(baseline: float, simulated: float) -> str:
    """Recommend action based on simulation results."""
    reduction = baseline - simulated
    if reduction > 0.2:
        return f"✅ Strong impact! These interventions could reduce attrition risk by {reduction:.1%}"
    elif reduction > 0.1:
        return f"👍 Moderate impact. These changes would reduce risk by {reduction:.1%}"
    elif reduction > 0:
        return f"📊 Minimal impact. Limited effect on attrition risk."
    else:
        return "❌ Risk increases! Reconsider this intervention."


# ──────────────────────────────────────────────────────────────────
# 6. TEMPORAL ANALYSIS & TRENDS
# ──────────────────────────────────────────────────────────────────

@router.get("/advanced/trends")
def attrition_trends():
    """    
    📈 TRENDS: Attrition patterns by department, time, and demographics.
    
    Helps identify systemic issues vs individual problems.
    """
    df = _load_data()

    global _temporal_analyzer
    if _temporal_analyzer is None:
        _temporal_analyzer = TemporalAnalyzer()
    trends = _temporal_analyzer.analyze_trends(df)
    
    _create_audit_log(0, "TRENDS_ANALYSIS", -1)
    
    return {
        'analysis_date': datetime.utcnow().isoformat(),
        'overall_attrition_rate': trends['overall_rate'],
        'by_department': trends['by_department'],
        'by_status': trends['by_status'],
        'key_insights': trends['insights'],
        'recommendation': _get_trend_recommendation(trends)
    }


# ──────────────────────────────────────────────────────────────────
# 7. ATTRITION TIMELINE PREDICTION
# ──────────────────────────────────────────────────────────────────

@router.get("/advanced/timeline/{emp_id}")
def attrition_timeline(emp_id: int):
    """    
    ⏱️ ATTRITION TIMELINE: Predict WHEN an employee will leave.
    
    Not just IF they'll leave, but HOW SOON - months/years/date.
    Helps prioritize urgency of interventions.
    """
    emp_id = _sanitize_input(emp_id)
    df = _load_data()
    
    row = df[df['EmployeeNumber'] == emp_id] if 'EmployeeNumber' in df.columns else df[df.index == emp_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    emp_data = row.iloc[0].to_dict()
    
    _init_advanced_modules()
    timeline = _timeline_model.predict_departure_timeline(emp_data)
    
    # Get attrition prediction too
    try:
        X = pd.DataFrame([emp_data])
        model, features = _get_model()
        X_features = X[[f for f in features if f in X.columns]].fillna(0)
        attrition_proba = float(model.predict_proba(X_features)[:, 1][0])
    except:
        attrition_proba = None
    
    _create_audit_log(emp_id, "TIMELINE_REQUEST", attrition_proba or -1)
    
    return {
        'emp_id': emp_id,
        'timeline': timeline,
        'attrition_probability': attrition_proba,
        'timestamp': datetime.utcnow().isoformat(),
        'interpretation': _interpret_timeline(timeline, attrition_proba)
    }


def _interpret_timeline(timeline: Dict, attrition_prob: Optional[float]) -> str:
    """Generate human-readable interpretation of timeline"""
    if timeline.get('error'):
        return "Timeline model not available"
    
    months = timeline.get('months_until_departure', 0)
    risk = timeline.get('risk_level', 'UNKNOWN')
    
    if risk == "CRITICAL":
        return f"⚠️ CRITICAL: Employee likely to leave within {int(months)} months. Immediate intervention needed!"
    elif risk == "HIGH":
        return f"🔴 HIGH RISK: Expected departure in {int(months)} months ({timeline.get('years_until_departure', 0):.1f} years). Schedule retention conversation."
    elif risk == "MEDIUM":
        return f"🟡 MODERATE RISK: Potential departure in ~{months:.0f} months. Proactive career planning recommended."
    else:
        return f"🟢 LOW RISK: Stable tenure expected. Continue engagement initiatives."


def _get_trend_recommendation(trends: Dict) -> str:
    """Generate trend-based recommendation."""
    rate = trends['overall_rate']
    if rate > 0.25:
        return "🔴 HIGH PRIORITY: Attrition rate above 25%. Systemic intervention needed."
    elif rate > 0.15:
        return "🟡 MEDIUM PRIORITY: Elevated attrition. Identify root causes."
    else:
        return "🟢 Low attrition rate. Continue monitoring key departments."
