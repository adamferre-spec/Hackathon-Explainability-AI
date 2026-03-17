from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Optional
import uuid

router = APIRouter()

# Stockage en mémoire (remplacer par PostgreSQL en production)
_alerts: dict = {}


def store_alert(alert: dict):
    _alerts[alert["alert_id"]] = alert


def get_alert(alert_id: str) -> Optional[dict]:
    return _alerts.get(alert_id)


@router.get("/alerts")
def list_alerts(limit: int = 50, attack_type: Optional[str] = None):
    """
    Liste les dernières alertes détectées, triées par timestamp décroissant.
    """
    alerts = list(_alerts.values())
    if attack_type:
        alerts = [a for a in alerts if a["prediction"].lower() == attack_type.lower()]
    alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"total": len(alerts), "alerts": alerts[:limit]}


@router.get("/alerts/{alert_id}")
def get_alert_detail(alert_id: str):
    """Détail complet d'une alerte."""
    alert = get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte introuvable")
    return alert


@router.delete("/alerts/{alert_id}")
def delete_alert(alert_id: str):
    """Supprime une alerte (droit à l'effacement RGPD)."""
    if alert_id not in _alerts:
        raise HTTPException(status_code=404, detail="Alerte introuvable")
    del _alerts[alert_id]
    return {"deleted": alert_id}


@router.get("/stats")
def get_stats():
    """Statistiques pour le dashboard."""
    alerts = list(_alerts.values())
    by_type = {}
    for a in alerts:
        t = a["prediction"]
        by_type[t] = by_type.get(t, 0) + 1

    return {
        "total_alerts": len(alerts),
        "by_type": by_type,
        "requires_review": sum(1 for a in alerts if a.get("requires_human_review")),
        "avg_confidence": round(
            sum(a["confidence"] for a in alerts) / max(len(alerts), 1), 3
        ),
    }


@router.post("/demo/inject")
def inject_demo_attack(attack_type: str = "ddos"):
    """
    Injecte une fausse alerte pour la démo (ne pas utiliser en production).
    """
    DEMO_ATTACKS = {
        "ddos": {
            "prediction": "DDoS", "confidence": 0.978, "ensemble_score": 0.965,
            "is_alert": True, "requires_human_review": False,
            "shap_top_features": [
                {"feature": "SYN Flag Count",  "value": 1200, "shap": 0.42},
                {"feature": "Flow Packets/s",  "value": 15000, "shap": 0.31},
                {"feature": "Flow Bytes/s",    "value": 2400000, "shap": 0.18},
                {"feature": "Flow Duration",   "value": 0.001, "shap": -0.05},
                {"feature": "ACK Flag Count",  "value": 0, "shap": 0.04},
            ],
        },
        "portscan": {
            "prediction": "PortScan", "confidence": 0.951, "ensemble_score": 0.921,
            "is_alert": True, "requires_human_review": False,
            "shap_top_features": [
                {"feature": "Flow Packets/s",  "value": 800, "shap": 0.35},
                {"feature": "RST Flag Count",  "value": 250, "shap": 0.28},
                {"feature": "Flow Duration",   "value": 0.0008, "shap": 0.22},
                {"feature": "Bwd Packet Length Mean", "value": 0, "shap": 0.19},
                {"feature": "ACK Flag Count",  "value": 5, "shap": -0.03},
            ],
        },
        "bruteforce": {
            "prediction": "Brute Force", "confidence": 0.887, "ensemble_score": 0.834,
            "is_alert": True, "requires_human_review": True,
            "shap_top_features": [
                {"feature": "Flow Duration",   "value": 120000000, "shap": 0.38},
                {"feature": "Total Fwd Packets", "value": 450, "shap": 0.25},
                {"feature": "Fwd IAT Mean",    "value": 280000, "shap": 0.20},
                {"feature": "FIN Flag Count",  "value": 45, "shap": 0.12},
                {"feature": "Flow Bytes/s",    "value": 380, "shap": -0.04},
            ],
        },
    }

    template = DEMO_ATTACKS.get(attack_type.lower(), DEMO_ATTACKS["ddos"])
    alert = {
        "alert_id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model_version": "1.0.0",
        **template,
    }
    store_alert(alert)
    return alert
