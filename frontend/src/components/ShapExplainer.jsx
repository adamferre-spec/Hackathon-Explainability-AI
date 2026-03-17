import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function riskColor(score) {
  if (score >= 0.7) return "#E63946";
  if (score >= 0.5) return "#FF9F1C";
  if (score >= 0.3) return "#A855F7";
  return "#00C9A7";
}

export function ShapVisualization({ shap }) {
  if (!shap?.waterfall) return null;

  const { waterfall } = shap;
  const factors = waterfall.factors || [];
  const chartData = factors.slice(0, 12).map((f) => ({
    feature: f.feature.replace(/_/g, " ").substring(0, 20),
    value: f.shap_value,
    abs_shap: Math.abs(f.shap_value),
    isRisk: f.shap_value > 0,
  }));

  const riskScore = shap.prediction?.risk_score || 0;

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55", color: "#FFFFFF", fontWeight: 600, fontSize: 14 }}>
        📊 Explications SHAP — {shap.name}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Risk Score Gauge */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ flex: "0 0 140px" }}>
            <div style={{ color: riskColor(riskScore), fontSize: 32, fontWeight: 700, textAlign: "center" }}>
              {(riskScore * 100).toFixed(1)}%
            </div>
            <div style={{ color: "#8BA5BF", fontSize: 11, textAlign: "center", marginTop: 4 }}>Score de risque</div>
          </div>
          <div style={{ flex: 1, height: 120 }}>
            <svg viewBox="0 0 180 100" style={{ width: "100%", height: "100%" }}>
              {/* Arc background */}
              <path
                d="M 20 80 A 60 60 0 0 1 160 80"
                fill="none"
                stroke="#243B55"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Arc filled */}
              <defs>
                <linearGradient id="riskGradient" x1="0%" x2="100%">
                  <stop offset="0%" stopColor="#378ADD" />
                  <stop offset="50%" stopColor={riskScore > 0.7 ? "#E63946" : riskScore > 0.5 ? "#FF9F1C" : "#378ADD"} />
                  <stop offset="100%" stopColor={riskScore > 0.7 ? "#E63946" : "#378ADD"} />
                </linearGradient>
              </defs>
              <path
                d="M 20 80 A 60 60 0 0 1 160 80"
                fill="none"
                stroke="url(#riskGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${377 * riskScore} 377`,
                }}
              />
              {/* Labels */}
              <text x="20" y="95" fontSize="10" fill="#8BA5BF">0</text>
              <text x="155" y="95" fontSize="10" fill="#8BA5BF" textAnchor="end">100</text>
            </svg>
          </div>
        </div>

        {/* SHAP Bar Chart */}
        <div style={{ marginTop: 10 }}>
          <div style={{ color: "#8BA5BF", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            📊 Contribution de chaque facteur au score
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#243B55" />
              <XAxis type="number" stroke="#8BA5BF" style={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="feature"
                stroke="#8BA5BF"
                style={{ fontSize: 10 }}
                width={145}
              />
              <Tooltip
                contentStyle={{ background: "#0D1B2A", border: "1px solid #243B55", borderRadius: 6 }}
                labelStyle={{ color: "#C5D5E8" }}
                formatter={(value) => `${(value * 100).toFixed(2)}%`}
              />
              <Bar dataKey="value" fill="#8BA5BF" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isRisk ? "#E63946" : "#00C9A7"}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ color: "#8BA5BF", fontSize: 10, marginTop: 8, display: "flex", gap: 16 }}>
            <div>🔴 = Facteurs aggravants (augmentent le risque)</div>
            <div>🟢 = Facteurs protecteurs (réduisent le risque)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
