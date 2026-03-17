import { useState } from "react";
import { api } from "../api";

export default function CounterfactualPanel({ empId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCounterfactuals = async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const response = await api.get(`/advanced/counterfactual/${empId}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load counterfactuals");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>💡 Actionable Changes</h3>
        <p style={styles.description}>
          What changes would reduce this employee's attrition risk?
        </p>
        <button style={styles.button} onClick={fetchCounterfactuals} disabled={loading}>
          {loading ? "Loading..." : "Analyze Counterfactuals"}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>💡 Actionable Changes</h3>
      <p style={styles.interpretation}>{data.interpretation}</p>

      <div style={styles.changesList}>
        {data.actionable_changes.map((change, idx) => (
          <div key={idx} style={styles.changeCard}>
            <div style={styles.changeHeader}>
              <span style={styles.featureName}>{change.feature}</span>
              <span
                style={{
                  ...styles.feasibilityBadge,
                  backgroundColor:
                    change.feasibility > 0.8
                      ? "#10b981"
                      : change.feasibility > 0.5
                      ? "#f59e0b"
                      : "#ef4444",
                }}
              >
                {(change.feasibility * 100).toFixed(0)}% feasible
              </span>
            </div>
            <div style={styles.changeDetails}>
              <p style={styles.detailItem}>
                <strong>Current:</strong> {change.original_value.toFixed(2)}
              </p>
              <p style={styles.detailItem}>
                <strong>Suggested:</strong> {change.suggested_value.toFixed(2)}
              </p>
              <p style={styles.detailItem}>
                <strong>Change:</strong> {change.change_percent.toFixed(1)}%
              </p>
            </div>
            <div style={styles.explanation}>{change.explanation}</div>
            <div style={styles.impactBar}>
              <div
                style={{
                  ...styles.impactFill,
                  width: `${Math.min(change.new_prediction_proba * 100, 100)}%`,
                  backgroundColor:
                    change.new_prediction_proba > 0.5 ? "#ef4444" : "#10b981",
                }}
              />
            </div>
            <p style={styles.prediction}>
              Risk after change: {(change.new_prediction_proba * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
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
    margin: "0 0 12px 0",
    color: "#00C9A7",
    fontSize: 16,
    fontWeight: 600,
  },
  description: {
    marginBottom: 16,
    fontSize: 13,
    color: "#9CA3AF",
  },
  button: {
    backgroundColor: "#00C9A7",
    color: "#0D1B2A",
    border: "none",
    padding: "8px 16px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 13,
  },
  error: {
    color: "#EF4444",
    marginTop: 12,
  },
  interpretation: {
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 13,
    borderLeft: "3px solid #00C9A7",
  },
  changesList: {
    display: "grid",
    gap: 12,
  },
  changeCard: {
    backgroundColor: "#111827",
    border: "1px solid #374151",
    borderRadius: 6,
    padding: 12,
  },
  changeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  featureName: {
    fontWeight: 600,
    color: "#00C9A7",
  },
  feasibilityBadge: {
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
  },
  changeDetails: {
    margin: "8px 0",
    fontSize: 12,
  },
  detailItem: {
    margin: "4px 0",
    color: "#D1D5DB",
  },
  explanation: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    fontStyle: "italic",
  },
  impactBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  impactFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  prediction: {
    marginTop: 6,
    fontSize: 11,
    color: "#9CA3AF",
  },
};
