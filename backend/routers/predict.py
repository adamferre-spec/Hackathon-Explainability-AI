from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from model.predict import predict, explain
from routers.alerts import store_alert

router = APIRouter()


class FlowInput(BaseModel):
    # Quelques features clés — les autres sont à 0 par défaut
    flow_duration: float = 0.0
    total_fwd_packets: int = 0
    total_bwd_packets: int = 0
    fwd_packet_length_mean: float = 0.0
    bwd_packet_length_mean: float = 0.0
    flow_bytes_s: float = 0.0
    flow_packets_s: float = 0.0
    fwd_iat_mean: float = 0.0
    bwd_iat_mean: float = 0.0
    syn_flag_count: int = 0
    fin_flag_count: int = 0
    rst_flag_count: int = 0
    psh_flag_count: int = 0
    ack_flag_count: int = 0
    packet_length_variance: float = 0.0

    class Config:
        extra = "allow"  # accepte les features supplémentaires


@router.post("/predict")
def predict_flow(flow: FlowInput):
    """
    Analyse un flux réseau et retourne la prédiction + explication SHAP.
    """
    try:
        # Convertir le modèle pydantic en dict avec les noms de features réels
        flow_dict = {
            "Flow Duration": flow.flow_duration,
            "Total Fwd Packets": flow.total_fwd_packets,
            "Total Backward Packets": flow.total_bwd_packets,
            "Fwd Packet Length Mean": flow.fwd_packet_length_mean,
            "Bwd Packet Length Mean": flow.bwd_packet_length_mean,
            "Flow Bytes/s": flow.flow_bytes_s,
            "Flow Packets/s": flow.flow_packets_s,
            "Fwd IAT Mean": flow.fwd_iat_mean,
            "Bwd IAT Mean": flow.bwd_iat_mean,
            "SYN Flag Count": flow.syn_flag_count,
            "FIN Flag Count": flow.fin_flag_count,
            "RST Flag Count": flow.rst_flag_count,
            "PSH Flag Count": flow.psh_flag_count,
            "ACK Flag Count": flow.ack_flag_count,
            "Packet Length Variance": flow.packet_length_variance,
            # Extra fields passés directement
            **flow.model_extra,
        }
        result = predict(flow_dict)

        # Persister si c'est une alerte
        if result["is_alert"]:
            store_alert(result)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain/{alert_id}")
def explain_alert(alert_id: str):
    """
    Retourne l'explication SHAP complète pour une alerte.
    """
    from routers.alerts import get_alert
    alert = get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte introuvable")
    return alert.get("shap_top_features", [])
