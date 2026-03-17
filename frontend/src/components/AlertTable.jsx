const TYPE_COLORS = {
  DDoS: "#E63946", PortScan: "#FF9F1C", Bot: "#A855F7",
  "Brute Force": "#F97316", "Web Attack": "#EAB308",
  Infiltration: "#EC4899", BENIGN: "#00C9A7",
};

function Badge({ text }) {
  const color = TYPE_COLORS[text] || "#8BA5BF";
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600,
    }}>{text}</span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct > 90 ? "#E63946" : pct > 75 ? "#FF9F1C" : "#00C9A7";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#243B55", borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ color: "#C5D5E8", fontSize: 12, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

export default function AlertTable({ alerts, loading, onSelect, onDelete, selected }) {
  if (loading) return (
    <div style={{ background: "#1B2E45", borderRadius: 10, padding: 40, textAlign: "center", color: "#8BA5BF" }}>
      Chargement des alertes...
    </div>
  );

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55", display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 15 }}>
          Alertes détectées
        </span>
        <span style={{ color: "#8BA5BF", fontSize: 13 }}>{alerts.length} entrée(s)</span>
      </div>

      {alerts.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#8BA5BF", fontSize: 14 }}>
          ✅ Aucune alerte — trafic normal
        </div>
      ) : (
        <div style={{ overflowY: "auto", maxHeight: 480 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0D1B2A" }}>
                {["Horodatage", "Type", "Confiance", "Révision", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    color: "#8BA5BF", fontSize: 12, fontWeight: 500,
                    borderBottom: "1px solid #243B55",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr
                  key={alert.alert_id}
                  onClick={() => onSelect(alert)}
                  style={{
                    cursor: "pointer",
                    background: selected?.alert_id === alert.alert_id ? "#243B55" : "transparent",
                    borderBottom: "1px solid #1B2E45",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (selected?.alert_id !== alert.alert_id) e.currentTarget.style.background = "#1e3250"; }}
                  onMouseLeave={e => { if (selected?.alert_id !== alert.alert_id) e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "10px 16px", color: "#8BA5BF", fontSize: 12 }}>
                    {new Date(alert.timestamp).toLocaleTimeString("fr-FR")}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Badge text={alert.prediction} />
                  </td>
                  <td style={{ padding: "10px 16px", minWidth: 120 }}>
                    <ConfidenceBar value={alert.confidence} />
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {alert.requires_human_review
                      ? <span style={{ color: "#E63946", fontSize: 12 }}>⚠ Requise</span>
                      : <span style={{ color: "#00C9A7", fontSize: 12 }}>✓ Auto</span>}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(alert.alert_id); }}
                      title="Supprimer (RGPD)"
                      style={{
                        background: "none", border: "none", color: "#8BA5BF",
                        cursor: "pointer", fontSize: 14, padding: "2px 6px",
                      }}
                    >🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
