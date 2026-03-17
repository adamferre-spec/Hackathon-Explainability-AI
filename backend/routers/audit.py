from fastapi import APIRouter
from fastapi.responses import JSONResponse
from datetime import datetime
from routers.alerts import _alerts

router = APIRouter()


@router.get("/audit/report")
def generate_audit_report():
    """
    Génère un rapport d'audit RGPD complet pour toutes les alertes en mémoire.
    Conforme EU AI Act Art. 22 — traçabilité des décisions automatisées.
    """
    alerts = list(_alerts.values())
    now = datetime.utcnow().isoformat() + "Z"

    # Résumé par classe
    by_type: dict = {}
    reviewed = 0
    for a in alerts:
        t = a["prediction"]
        by_type[t] = by_type.get(t, 0) + 1
        if a.get("requires_human_review"):
            reviewed += 1

    report = {
        "report_id": f"audit-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
        "generated_at": now,
        "system": "CyberGuard AI v1.0.0",
        "rgpd_compliance": {
            "ip_anonymization": True,
            "method": "SHA-256 irreversible hashing",
            "data_retention_days": 90,
            "right_to_erasure": "DELETE /api/alerts/{id}",
            "legal_basis": "Legitimate interest (IT security)",
        },
        "eu_ai_act": {
            "article_22_compliant": True,
            "human_oversight": True,
            "explainability": "SHAP TreeExplainer",
            "model_version": "1.0.0",
            "decisions_requiring_review": reviewed,
        },
        "summary": {
            "total_decisions": len(alerts),
            "alerts_triggered": sum(1 for a in alerts if a.get("is_alert")),
            "by_attack_type": by_type,
            "avg_confidence": round(
                sum(a["confidence"] for a in alerts) / max(len(alerts), 1), 4
            ),
        },
        "decisions": [
            {
                "alert_id": a["alert_id"],
                "timestamp": a["timestamp"],
                "prediction": a["prediction"],
                "confidence": a["confidence"],
                "requires_human_review": a.get("requires_human_review", False),
                "model_version": a.get("model_version", "1.0.0"),
                "top_feature": (
                    a["shap_top_features"][0]["feature"]
                    if a.get("shap_top_features") else "N/A"
                ),
                "ip_data": "anonymized",
            }
            for a in alerts
        ],
    }

    return JSONResponse(content=report)
