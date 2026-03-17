import { useState } from "react";
import { api } from "../api";

export default function AnomalyPanel({ empId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnomaly = async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const response = await api.get(`/advanced/anomaly/${empId}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load anomaly analysis");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🚨 Anomaly Detection</h3>
        <p style={styles.description}>
          Is this employee's profile unusual? What warning signs exist?
        </p>
        <button style={styles.button} onClick={fetchAnomaly} disabled={loading}>
          {loading ? "Loading..." : "Check Profile"}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  const { anomaly_analysis, early_warning_signs, action_needed } = data;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🚨 Anomaly Detection</h3>

      {/* Anomaly Result */}
      <div
        style={{
          ...styles.anomalyBox,
          backgroundColor: anomaly_analysis.is_anomalous ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
          borderColor: anomaly_analysis.is_anomalous ? "#EF4444" : "#10b981",
        }}
      >
        <div style={styles.anomalyHeader}>
          <span style={styles.anomalyTitle}>{anomaly_analysis.anomaly_type}</span>
          <span
            style={{
              ...styles.anomalySeverity,
              backgroundColor:
                anomaly_analysis.severity === "HIGH"
                  ? "#EF4444"
                  : anomaly_analysis.severity === "MEDIUM"
                  ? "#F59E0B"
                  : "#3B82F6",
            }}
          >
            {anomaly_analysis.severity}
          </span>
        </div>
        <p style={styles.anomalyScore}>
          Anomaly Score: {(anomaly_analysis.anomaly_score * 100).toFixed(1)}
        </p>
        <p style={styles.anomalyExplanation}>{anomaly_analysis.explanation}</p>
      </div>

      {/* Extreme Features */}
      {anomaly_analysis.extreme_features.length > 0 && (
        <div style={styles.extremeSection}>
          <h4 style={styles.sectionTitle}>Extreme Features</h4>
          <div style={styles.featuresList}>
            {anomaly_analysis.extreme_features.map((feat, idx) => (
              <div key={idx} style={styles.featureItem}>
                <div style={styles.featureHeader}>
                  <span style={styles.featureName}>{feat.feature}</span>
                  <span style={styles.zScore}>Z={feat.z_score.toFixed(2)}</span>
                </div>
                <p style={styles.featureValue}>
                  Value: {feat.value.toFixed(2)}
                </p>
                <p style={styles.expectedRange}>
                  Expected range: [{feat.expected_range[0].toFixed(2)}, {feat.expected_range[1].toFixed(2)}]
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Early Warning Signs */}
      {early_warning_signs.length > 0 && (
        <div style={styles.warningsSection}>
          <h4 style={styles.sectionTitle}>⚠️ Early Warning Signs</h4>
          <div style={styles.warningsList}>
            {early_warning_signs.map((warning, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.warningCard,
                  borderLeftColor:
                    warning.severity === "HIGH"
                      ? "#EF4444"
                      : warning.severity === "MEDIUM"
                      ? "#F59E0B"
                      : "#3B82F6",
                }}
              >
                <div style={styles.warningHeader}>
                  <span style={styles.warningSign}>{warning.sign}</span>
                  <span
                    style={{
                      ...styles.warningSeverity,
                      backgroundColor:
                        warning.severity === "HIGH"
                          ? "#EF4444"
                          : warning.severity === "MEDIUM"
                          ? "#F59E0B"
                          : "#3B82F6",
                    }}
                  >
                    {warning.severity}
                  </span>
                </div>
                <p style={styles.warningExplanation}>{warning.explanation}</p>
                {warning.value !== undefined && (
                  <p style={styles.warningMetric}>
                    Current: {warning.value.toFixed(2)} (Threshold: {warning.threshold})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Needed */}
      {action_needed && (
        <div style={styles.actionBox}>
          <p style={styles.actionText}>
            ⚡ This employee requires immediate attention. Consider scheduling a check-in
            with HR to address concerns.
          </p>
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
  anomalyBox: {
    border: "2px solid",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  anomalyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  anomalyTitle: {
    fontWeight: 600,
    color: "#D1D5DB",
    fontSize: 13,
  },
  anomalySeverity: {
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
  },
  anomalyScore: {
    margin: "6px 0",
    fontSize: 12,
    color: "#9CA3AF",
  },
  anomalyExplanation: {
    margin: "6px 0 0 0",
    fontSize: 12,
    color: "#D1D5DB",
    fontStyle: "italic",
  },
  extremeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    margin: "0 0 8px 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#00C9A7",
  },
  featuresList: {
    display: "grid",
    gap: 8,
  },
  featureItem: {
    backgroundColor: "#111827",
    padding: 10,
    borderRadius: 4,
    borderLeft: "3px solid #EF4444",
  },
  featureHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  featureName: {
    fontWeight: 600,
    color: "#D1D5DB",
    fontSize: 12,
  },
  zScore: {
    backgroundColor: "#1F2937",
    padding: "2px 8px",
    borderRadius: 3,
    fontSize: 10,
    color: "#EF4444",
    fontWeight: 600,
  },
  featureValue: {
    margin: "4px 0",
    fontSize: 11,
    color: "#9CA3AF",
  },
  expectedRange: {
    margin: "2px 0 0 0",
    fontSize: 10,
    color: "#6B7280",
  },
  warningsSection: {
    marginBottom: 16,
  },
  warningsList: {
    display: "grid",
    gap: 8,
  },
  warningCard: {
    backgroundColor: "#111827",
    borderLeft: "4px solid",
    padding: 10,
    borderRadius: 4,
  },
  warningHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  warningSign: {
    fontWeight: 600,
    color: "#D1D5DB",
    fontSize: 12,
  },
  warningSeverity: {
    padding: "2px 8px",
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 600,
    color: "#fff",
  },
  warningExplanation: {
    margin: "4px 0",
    fontSize: 11,
    color: "#9CA3AF",
  },
  warningMetric: {
    margin: "4px 0 0 0",
    fontSize: 10,
    color: "#6B7280",
  },
  actionBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #EF4444",
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  actionText: {
    margin: 0,
    fontSize: 13,
    color: "#FCA5A5",
  },
};
