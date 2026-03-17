const TYPE_COLORS = {
  DDoS: "#E63946", PortScan: "#FF9F1C", Bot: "#A855F7",
  "Brute Force": "#F97316", "Web Attack": "#EAB308", Infiltration: "#EC4899",
};

export default function StatsBar({ stats }) {
  const kpis = [
    { label: "Alertes totales",   value: stats.total_alerts,       color: "#00C9A7" },
    { label: "À réviser",         value: stats.requires_review,    color: "#E63946" },
    { label: "Confiance moyenne", value: `${(stats.avg_confidence * 100).toFixed(1)}%`, color: "#378ADD" },
    { label: "Types détectés",    value: Object.keys(stats.by_type).filter(k => k !== "BENIGN").length, color: "#A855F7" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {kpis.map(({ label, value, color }) => (
        <div key={label} style={{
          background: "#1B2E45", borderRadius: 10, padding: "16px 20px",
          borderLeft: `4px solid ${color}`,
        }}>
          <div style={{ color, fontSize: 28, fontWeight: 700 }}>{value}</div>
          <div style={{ color: "#8BA5BF", fontSize: 12, marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
