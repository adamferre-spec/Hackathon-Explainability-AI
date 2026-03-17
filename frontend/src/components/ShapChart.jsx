export default function ShapChart({ alert }) {
  if (!alert) return (
    <div style={{
      background: "#1B2E45", borderRadius: 10, padding: 32,
      textAlign: "center", color: "#8BA5BF", fontSize: 14,
    }}>
      Sélectionnez une alerte pour voir l'explication SHAP
    </div>
  );

  const features = alert.shap_top_features || [];
  const maxShap = Math.max(...features.map(f => Math.abs(f.shap)), 0.01);

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55" }}>
        <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 15 }}>
          Explicabilité SHAP
        </div>
        <div style={{ color: "#8BA5BF", fontSize: 12, marginTop: 2 }}>
          {alert.prediction} — confiance {Math.round(alert.confidence * 100)}%
        </div>
      </div>

      {/* Verdict */}
      <div style={{
        margin: "16px 20px 0",
        padding: "10px 14px",
        borderRadius: 7,
        background: alert.prediction === "BENIGN" ? "#00C9A722" : "#E6394622",
        border: `1px solid ${alert.prediction === "BENIGN" ? "#00C9A7" : "#E63946"}44`,
        color: alert.prediction === "BENIGN" ? "#00C9A7" : "#E63946",
        fontSize: 13, fontWeight: 600,
      }}>
        {alert.prediction === "BENIGN" ? "✅ Trafic normal" : `🚨 Attaque détectée : ${alert.prediction}`}
        {alert.requires_human_review && (
          <span style={{ marginLeft: 12, color: "#FF9F1C", fontSize: 12 }}>
            ⚠ Révision humaine requise
          </span>
        )}
      </div>

      {/* Waterfall */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ color: "#8BA5BF", fontSize: 11, marginBottom: 4 }}>
          Features déclencheurs (valeurs SHAP)
        </div>
        {features.map((f, i) => {
          const isPos = f.shap > 0;
          const barWidth = Math.abs(f.shap) / maxShap;
          const color = isPos ? "#E63946" : "#378ADD";
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: "#C5D5E8", fontSize: 12, fontWeight: 500 }}>
                  {f.feature}
                </span>
                <span style={{ color: "#8BA5BF", fontSize: 11 }}>
                  val = {typeof f.value === "number" ? f.value.toLocaleString("fr-FR") : f.value}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Negative side */}
                <div style={{ flex: 1, height: 18, display: "flex", justifyContent: "flex-end" }}>
                  {!isPos && (
                    <div style={{
                      width: `${barWidth * 100}%`, height: "100%",
                      background: color, borderRadius: "3px 0 0 3px",
                      display: "flex", alignItems: "center", justifyContent: "flex-start",
                      paddingLeft: 4, minWidth: 2,
                    }} />
                  )}
                </div>
                {/* Center */}
                <div style={{ width: 1, height: 20, background: "#243B55" }} />
                {/* Positive side */}
                <div style={{ flex: 1, height: 18 }}>
                  {isPos && (
                    <div style={{
                      width: `${barWidth * 100}%`, height: "100%",
                      background: color, borderRadius: "0 3px 3px 0",
                      display: "flex", alignItems: "center", justifyContent: "flex-end",
                      paddingRight: 4, minWidth: 2,
                    }}>
                      <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>
                        +{f.shap.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {!isPos && (
                <div style={{ color: "#378ADD", fontSize: 10, textAlign: "right", marginTop: 1 }}>
                  {f.shap.toFixed(2)}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ marginTop: 8, fontSize: 11, color: "#8BA5BF", borderTop: "1px solid #243B55", paddingTop: 8 }}>
          🔴 Rouge = pousse vers attaque &nbsp;|&nbsp; 🔵 Bleu = pousse vers normal
        </div>
      </div>
    </div>
  );
}
