import { useState } from "react";
import { api } from "../api";

export default function SimulationPanel({ empId }) {
  const [interventions, setInterventions] = useState([
    { type: "salary", amount: 10 },
  ]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addIntervention = () => {
    setInterventions([...interventions, { type: "salary", amount: 10 }]);
  };

  const updateIntervention = (idx, field, value) => {
    const newInterventions = [...interventions];
    newInterventions[idx][field] = field === "amount" ? parseFloat(value) : value;
    setInterventions(newInterventions);
  };

  const removeIntervention = (idx) => {
    setInterventions(interventions.filter((_, i) => i !== idx));
  };

  const runSimulation = async () => {
    if (!empId || interventions.length === 0) return;
    setLoading(true);
    try {
      const response = await api.post("/advanced/simulate", {
        emp_id: empId,
        interventions,
      });
      setResult(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🔮 What-If Simulation</h3>
      <p style={styles.description}>
        Test the impact of HR decisions before implementing them.
      </p>

      <div style={styles.interventionsSection}>
        <p style={styles.sectionLabel}>Define interventions:</p>
        {interventions.map((intervention, idx) => (
          <div key={idx} style={styles.interventionRow}>
            <select
              value={intervention.type}
              onChange={(e) => updateIntervention(idx, "type", e.target.value)}
              style={styles.select}
            >
              <option value="salary">Salary Increase (%)</option>
              <option value="satisfaction">Satisfaction (+points)</option>
              <option value="engagement">Engagement (+points)</option>
              <option value="absences">Reduce Absences (-days)</option>
              <option value="tardiness">Reduce Tardiness (-days)</option>
            </select>
            <input
              type="number"
              value={intervention.amount}
              onChange={(e) => updateIntervention(idx, "amount", e.target.value)}
              style={styles.input}
              placeholder="Amount"
            />
            {interventions.length > 1 && (
              <button
                onClick={() => removeIntervention(idx)}
                style={styles.removeBtn}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button onClick={addIntervention} style={styles.addBtn}>
          + Add Intervention
        </button>
      </div>

      <button
        style={styles.simulateBtn}
        onClick={runSimulation}
        disabled={loading || !empId}
      >
        {loading ? "Running..." : "Run Simulation"}
      </button>

      {error && <p style={styles.error}>{error}</p>}

      {result && (
        <div style={styles.resultsSection}>
          <h4 style={styles.resultsTitle}>Simulation Results</h4>

          <div style={styles.metricsGrid}>
            <div style={styles.metric}>
              <p style={styles.metricLabel}>Baseline Risk</p>
              <p style={styles.metricValue}>
                {(result.baseline_prediction * 100).toFixed(1)}%
              </p>
            </div>
            <div style={styles.metric}>
              <p style={styles.metricLabel}>Simulated Risk</p>
              <p style={styles.metricValue}>
                {(result.simulated_prediction * 100).toFixed(1)}%
              </p>
            </div>
            <div style={styles.metric}>
              <p style={styles.metricLabel}>Risk Reduction</p>
              <p
                style={{
                  ...styles.metricValue,
                  color: result.risk_reduction > 0 ? "#10b981" : "#ef4444",
                }}
              >
                {(result.risk_reduction * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div style={styles.comparisonBar}>
            <div
              style={{
                ...styles.bar,
                width: `${result.baseline_prediction * 100}%`,
                backgroundColor: "#ef4444",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                ...styles.bar,
                width: `${result.simulated_prediction * 100}%`,
                backgroundColor: "#10b981",
              }}
            />
          </div>
          <div style={styles.barLabels}>
            <span>Before</span>
            <span>After</span>
          </div>

          <p style={styles.recommendation}>{result.recommendation}</p>

          <div style={styles.simulationDetails}>
            {result.simulations.map((sim, idx) => (
              <div key={idx} style={styles.simDetail}>
                <p style={styles.simLabel}>{sim.explanation}</p>
                <p style={styles.simImpact}>
                  Impact: {(sim.impact.probability_change * 100).toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#1F2937",
    border: "1px solid #374151",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    color: "#E5E7EB",
  },
  title: {
    margin: "0 0 8px 0",
    color: "#00C9A7",
    fontSize: 16,
    fontWeight: 600,
  },
  description: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  interventionsSection: {
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  sectionLabel: {
    marginTop: 0,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#D1D5DB",
  },
  interventionRow: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
  },
  select: {
    flex: 1,
    padding: "6px 8px",
    backgroundColor: "#1F2937",
    color: "#E5E7EB",
    border: "1px solid #374151",
    borderRadius: 4,
    fontSize: 12,
  },
  input: {
    width: 80,
    padding: "6px 8px",
    backgroundColor: "#1F2937",
    color: "#E5E7EB",
    border: "1px solid #374151",
    borderRadius: 4,
    fontSize: 12,
  },
  removeBtn: {
    padding: "6px 8px",
    backgroundColor: "#EF4444",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  addBtn: {
    padding: "6px 12px",
    backgroundColor: "#374151",
    color: "#E5E7EB",
    border: "1px dashed #00C9A7",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  simulateBtn: {
    backgroundColor: "#00C9A7",
    color: "#0D1B2A",
    border: "none",
    padding: "10px 16px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    width: "100%",
  },
  error: {
    color: "#EF4444",
    marginTop: 12,
  },
  resultsSection: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 6,
    marginTop: 16,
  },
  resultsTitle: {
    margin: "0 0 12px 0",
    color: "#00C9A7",
    fontSize: 14,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 16,
  },
  metric: {
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 4,
    textAlign: "center",
  },
  metricLabel: {
    margin: 0,
    fontSize: 11,
    color: "#9CA3AF",
  },
  metricValue: {
    margin: 0,
    marginTop: 4,
    fontSize: 18,
    fontWeight: 700,
    color: "#E5E7EB",
  },
  comparisonBar: {
    display: "flex",
    gap: 4,
    marginBottom: 4,
    height: 24,
  },
  bar: {
    borderRadius: 4,
  },
  barLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  recommendation: {
    padding: 10,
    backgroundColor: "#1F2937",
    borderLeft: "3px solid #00C9A7",
    borderRadius: 4,
    fontSize: 12,
    marginBottom: 12,
  },
  simulationDetails: {
    display: "grid",
    gap: 8,
  },
  simDetail: {
    backgroundColor: "#1F2937",
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
  },
  simLabel: {
    margin: 0,
    color: "#D1D5DB",
  },
  simImpact: {
    margin: "4px 0 0 0",
    color: "#00C9A7",
    fontWeight: 600,
  },
};
