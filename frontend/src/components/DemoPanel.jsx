import { useState } from "react";
import { api } from "../api";

const ATTACKS = [
  { id: "ddos",       label: "DDoS",        color: "#E63946", desc: "SYN flood massif" },
  { id: "portscan",   label: "Port Scan",   color: "#FF9F1C", desc: "Scan réseau nmap" },
  { id: "bruteforce", label: "Brute Force", color: "#A855F7", desc: "Force brute SSH" },
];

export default function DemoPanel({ onInjected }) {
  const [loading, setLoading] = useState(null);
  const [last, setLast] = useState(null);

  async function inject(type) {
    setLoading(type);
    try {
      const result = await api.injectDemo(type);
      setLast(result);
      onInjected();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55" }}>
        <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 15 }}>
          Panel démo
        </div>
        <div style={{ color: "#8BA5BF", fontSize: 12, marginTop: 2 }}>
          Injecter une attaque simulée
        </div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {ATTACKS.map(({ id, label, color, desc }) => (
          <button
            key={id}
            onClick={() => inject(id)}
            disabled={loading !== null}
            style={{
              background: loading === id ? color + "44" : color + "22",
              border: `1px solid ${color}55`,
              borderRadius: 8, padding: "10px 16px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              transition: "background 0.2s",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div style={{ color, fontWeight: 600, fontSize: 13 }}>
                {loading === id ? "Injection..." : `🔴 Simuler ${label}`}
              </div>
              <div style={{ color: "#8BA5BF", fontSize: 11, marginTop: 2 }}>{desc}</div>
            </div>
            <span style={{ color, fontSize: 18 }}>→</span>
          </button>
        ))}

        {last && (
          <div style={{
            marginTop: 6, padding: "10px 14px", borderRadius: 7,
            background: "#E6394622", border: "1px solid #E6394644",
            fontSize: 12,
          }}>
            <div style={{ color: "#E63946", fontWeight: 600 }}>
              ✓ Alerte injectée : {last.prediction}
            </div>
            <div style={{ color: "#8BA5BF", marginTop: 2 }}>
              ID: {last.alert_id.slice(0, 8)}... — confiance {Math.round(last.confidence * 100)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
