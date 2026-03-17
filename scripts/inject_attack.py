"""
Script de démo — injecte du trafic réseau simulé vers l'API CyberGuard AI.
Usage : python scripts/inject_attack.py --type ddos --intensity high
"""
import argparse
import time
import requests

API = "http://localhost:8000/api"

FLOWS = {
    "ddos": {
        "low":  {"flow_duration": 0.01,  "total_fwd_packets": 300,  "flow_packets_s": 5000,  "flow_bytes_s": 800000,  "syn_flag_count": 300,  "ack_flag_count": 0},
        "high": {"flow_duration": 0.001, "total_fwd_packets": 1200, "flow_packets_s": 15000, "flow_bytes_s": 2400000, "syn_flag_count": 1200, "ack_flag_count": 0},
    },
    "portscan": {
        "low":  {"flow_duration": 0.002, "total_fwd_packets": 50,  "flow_packets_s": 200,  "flow_bytes_s": 8000,   "rst_flag_count": 45,  "syn_flag_count": 50},
        "high": {"flow_duration": 0.001, "total_fwd_packets": 200, "flow_packets_s": 800,  "flow_bytes_s": 32000,  "rst_flag_count": 180, "syn_flag_count": 200},
    },
    "bruteforce": {
        "low":  {"flow_duration": 60000000, "total_fwd_packets": 120, "fwd_iat_mean": 500000,  "flow_bytes_s": 200,  "fin_flag_count": 12},
        "high": {"flow_duration": 120000000,"total_fwd_packets": 450, "fwd_iat_mean": 280000,  "flow_bytes_s": 380,  "fin_flag_count": 45},
    },
    "normal": {
        "low":  {"flow_duration": 500000, "total_fwd_packets": 10, "flow_packets_s": 20,  "flow_bytes_s": 5000,  "syn_flag_count": 1, "ack_flag_count": 8,  "fin_flag_count": 1},
        "high": {"flow_duration": 800000, "total_fwd_packets": 25, "flow_packets_s": 40,  "flow_bytes_s": 12000, "syn_flag_count": 1, "ack_flag_count": 20, "fin_flag_count": 1},
    },
}


def inject(attack_type: str, intensity: str = "high", count: int = 5, delay: float = 0.5):
    flow = FLOWS.get(attack_type, FLOWS["ddos"])[intensity]
    print(f"\n🚨 Injection : {attack_type.upper()} [{intensity}] × {count} flux")
    print(f"   Payload : {flow}\n")

    for i in range(count):
        try:
            r = requests.post(f"{API}/predict", json=flow, timeout=5)
            data = r.json()
            icon = "🔴" if data.get("is_alert") else "🟢"
            print(f"  [{i+1}/{count}] {icon} {data.get('prediction', '?')} "
                  f"— confiance {data.get('confidence', 0)*100:.1f}% "
                  f"— alerte: {data.get('is_alert', False)}")
        except Exception as e:
            print(f"  [{i+1}/{count}] ❌ Erreur : {e}")
        time.sleep(delay)

    print(f"\n✅ Injection terminée — voir le dashboard sur http://localhost:3000")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--type",      default="ddos",   choices=list(FLOWS.keys()))
    parser.add_argument("--intensity", default="high",   choices=["low", "high"])
    parser.add_argument("--count",     default=5,        type=int)
    parser.add_argument("--delay",     default=0.5,      type=float)
    args = parser.parse_args()
    inject(args.type, args.intensity, args.count, args.delay)
