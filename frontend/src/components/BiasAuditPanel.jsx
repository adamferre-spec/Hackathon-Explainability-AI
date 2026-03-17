import { useState, useEffect } from "react";
import { api } from "../api";

export default function BiasAuditPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBiasAudit();
  }, []);

  const fetchBiasAudit = async () => {
    setLoading(true);
    try {
      const response = await api.get("/advanced/bias-audit");
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load bias audit");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.container}>Loading bias audit...</div>;
  if (error) return <div style={{ ...styles.container, color: "#EF4444" }}>{error}</div>;
  if (!data) return null;

  const hasCriticalAlerts = data.bias_alerts.some((a) => a.severity === "HIGH");

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>⚖️ Fairness Audit</h3>
        <span
          style={{
            ...styles.summaryBadge,
            backgroundColor: hasCriticalAlerts ? "#EF4444" : "#10b981",
          }}
        >
          {hasCriticalAlerts ? "⚠️ Issues" : "✓ Clear"}
        </span>
      </div>

      <p style={styles.summary}>{data.summary}</p>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Overall Accuracy</p>
          <p style={styles.metricValue}>
            {(data.global_metrics.accuracy * 100).toFixed(1)}%
          </p>
        </div>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Attrition Rate</p>
          <p style={styles.metricValue}>
            {(data.global_metrics.attrition_rate * 100).toFixed(1)}%
          </p>
        </div>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Prediction Recall</p>
          <p style={styles.metricValue}>
            {(data.global_metrics.recall * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {data.bias_alerts.length > 0 && (
        <div style={styles.alertsSection}>
          <h4 style={styles.alertsTitle}>Bias Alerts ({data.bias_alerts.length})</h4>
          {data.bias_alerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                ...styles.alertCard,
                borderLeftColor:
                  alert.severity === "HIGH" ? "#EF4444" : "#F59E0B",
              }}
            >
              <div style={styles.alertHeader}>
                <span style={styles.alertAttribute}>{alert.attribute}</span>
                <span
                  style={{
                    ...styles.severityBadge,
                    backgroundColor:
                      alert.severity === "HIGH" ? "#EF4444" : "#F59E0B",
                  }}
                >
                  {alert.severity}
                </span>
              </div>
              <p style={styles.alertMessage}>{alert.message}</p>
              <div style={styles.alertMetrics}>
                <span>Group #{alert.group}: {(alert.attrition_rate * 100).toFixed(1)}% attrition</span>
                <span>vs Reference: {(alert.reference_rate * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.entries(data.group_analysis).map(([attribute, groups]) => (
        <div key={attribute} style={styles.groupSection}>
          <h4 style={styles.groupTitle}>By {attribute}</h4>
          <div style={styles.groupsGrid}>
            {Object.entries(groups).map(([groupId, metrics]) => (
              <div key={groupId} style={styles.groupCard}>
                <p style={styles.groupLabel}>Group {groupId}</p>
                <p style={styles.groupStat}>
                  <strong>Count:</strong> {metrics.count}
                </p>
                <p style={styles.groupStat}>
                  <strong>Attrition:</strong> {(metrics.attrition_rate * 100).toFixed(1)}%
                </p>
                <p style={styles.groupStat}>
                  <strong>Avg Risk:</strong> {(metrics.avg_risk_score * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.recommendations.length > 0 && (
        <div style={styles.recommendationsSection}>
          <h4 style={styles.recommendationsTitle}>Recommendations</h4>
          {data.recommendations.map((rec, idx) => (
            <div key={idx} style={styles.recommendationCard}>
              <div style={styles.recHeader}>
                <span style={styles.recCategory}>{rec.category}</span>
                <span style={styles.recPriority}>P{rec.priority}</span>
              </div>
              <p style={styles.recAction}>{rec.action}</p>
              <p style={styles.recRationale}>{rec.rationale}</p>
            </div>
          ))}
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    color: "#00C9A7",
    fontSize: 16,
    fontWeight: 600,
  },
  summaryBadge: {
    padding: "4px 12px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
  },
  summary: {
    marginBottom: 12,
    fontSize: 13,
    color: "#D1D5DB",
    padding: 10,
    backgroundColor: "#111827",
    borderRadius: 4,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: "#111827",
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
    margin: "6px 0 0 0",
    fontSize: 18,
    fontWeight: 700,
    color: "#00C9A7",
  },
  alertsSection: {
    marginBottom: 16,
  },
  alertsTitle: {
    margin: "0 0 8px 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#EF4444",
  },
  alertCard: {
    backgroundColor: "#111827",
    borderLeft: "4px solid #EF4444",
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  alertHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  alertAttribute: {
    fontWeight: 600,
    color: "#00C9A7",
    fontSize: 12,
  },
  severityBadge: {
    padding: "2px 8px",
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 600,
    color: "#fff",
  },
  alertMessage: {
    margin: 0,
    fontSize: 12,
    color: "#D1D5DB",
    marginBottom: 6,
  },
  alertMetrics: {
    fontSize: 11,
    color: "#9CA3AF",
    display: "flex",
    gap: 12,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupTitle: {
    margin: "0 0 8px 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#D1D5DB",
  },
  groupsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 8,
  },
  groupCard: {
    backgroundColor: "#111827",
    padding: 10,
    borderRadius: 4,
    fontSize: 12,
  },
  groupLabel: {
    margin: "0 0 6px 0",
    fontWeight: 600,
    color: "#00C9A7",
  },
  groupStat: {
    margin: "4px 0",
    color: "#D1D5DB",
  },
  recommendationsSection: {
    marginTop: 16,
  },
  recommendationsTitle: {
    margin: "0 0 8px 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#00C9A7",
  },
  recommendationCard: {
    backgroundColor: "#111827",
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    borderLeft: "3px solid #00C9A7",
  },
  recHeader: {
    display: "flex",
    gap: 8,
    marginBottom: 6,
  },
  recCategory: {
    padding: "2px 8px",
    backgroundColor: "#1F2937",
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 600,
    color: "#00C9A7",
  },
  recPriority: {
    padding: "2px 8px",
    backgroundColor: "#F59E0B",
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 600,
    color: "#0D1B2A",
  },
  recAction: {
    margin: 0,
    fontWeight: 600,
    color: "#D1D5DB",
    fontSize: 12,
    marginBottom: 4,
  },
  recRationale: {
    margin: 0,
    color: "#9CA3AF",
    fontSize: 11,
  },
};
