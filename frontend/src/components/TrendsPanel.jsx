import { useState, useEffect } from "react";
import { api } from "../api";

export default function TrendsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await api.req("/advanced/trends");
      setData(response);
      setError(null);
    } catch (err) {
      setError(`Failed to load trends (/advanced/trends): ${err.message || "Unknown error"}`);
      console.error("TrendsPanel error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.container}>Loading trends...</div>;
  if (error) return <div style={{ ...styles.container, color: "#EF4444" }}>{error}</div>;
  if (!data) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📈 Attrition Trends</h3>
        <span style={styles.timestamp}>
          {new Date(data.analysis_date).toLocaleDateString()}
        </span>
      </div>

      {/* Overall Rate */}
      <div style={styles.overallSection}>
        <p style={styles.label}>Overall Attrition Rate</p>
        <div style={styles.rateBox}>
          <p style={styles.rateValue}>
            {(data.overall_attrition_rate * 100).toFixed(1)}%
          </p>
          <p style={styles.rateSubtext}>
            {data.overall_attrition_rate > 0.25
              ? "🔴 High attrition"
              : data.overall_attrition_rate > 0.15
              ? "🟡 Moderate attrition"
              : "🟢 Healthy attrition rate"}
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <div style={styles.recommendationBox}>
        <p style={styles.recommendationText}>{data.recommendation}</p>
      </div>

      {/* By Department */}
      {Array.isArray(data.by_department) && data.by_department.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>By Department</h4>
          <div style={styles.departmentsGrid}>
            {data.by_department.map((dept) => (
              <div
                key={dept.Department}
                style={{
                  ...styles.deptCard,
                  borderLeftColor:
                    dept.rate > 0.25
                      ? "#EF4444"
                      : dept.rate > 0.15
                      ? "#F59E0B"
                      : "#10b981",
                }}
              >
                <p style={styles.deptName}>{dept.Department}</p>
                <div style={styles.deptStats}>
                  <div style={styles.deptStat}>
                    <p style={styles.statLabel}>Rate</p>
                    <p style={styles.statValue}>{(dept.rate * 100).toFixed(1)}%</p>
                  </div>
                  <div style={styles.deptStat}>
                    <p style={styles.statLabel}>Total</p>
                    <p style={styles.statValue}>{dept.total}</p>
                  </div>
                  <div style={styles.deptStat}>
                    <p style={styles.statLabel}>Departed</p>
                    <p style={styles.statValue}>{dept.departed}</p>
                  </div>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${dept.rate * 100}%`,
                      backgroundColor:
                        dept.rate > 0.25
                          ? "#EF4444"
                          : dept.rate > 0.15
                          ? "#F59E0B"
                          : "#10b981",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {data.key_insights && data.key_insights.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Key Insights</h4>
          <div style={styles.insightsList}>
            {data.key_insights.map((insight, idx) => (
              <div key={idx} style={styles.insightItem}>
                <p style={styles.insightText}>{insight}</p>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    margin: 0,
    color: "#00C9A7",
    fontSize: 16,
    fontWeight: 600,
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  overallSection: {
    marginBottom: 16,
  },
  label: {
    margin: "0 0 8px 0",
    fontSize: 12,
    fontWeight: 600,
    color: "#D1D5DB",
  },
  rateBox: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 6,
    textAlign: "center",
    borderLeft: "4px solid #00C9A7",
  },
  rateValue: {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: "#00C9A7",
  },
  rateSubtext: {
    margin: "8px 0 0 0",
    fontSize: 13,
    color: "#9CA3AF",
  },
  recommendationBox: {
    backgroundColor: "rgba(0, 201, 167, 0.1)",
    border: "1px solid #00C9A7",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  recommendationText: {
    margin: 0,
    fontSize: 12,
    color: "#A7F3D0",
    lineHeight: "1.5",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: 14,
    fontWeight: 600,
    color: "#D1D5DB",
  },
  departmentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  deptCard: {
    backgroundColor: "#111827",
    border: "1px solid #374151",
    borderLeft: "4px solid",
    borderRadius: 6,
    padding: 12,
  },
  deptName: {
    margin: "0 0 8px 0",
    fontWeight: 600,
    color: "#E5E7EB",
    fontSize: 12,
  },
  deptStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginBottom: 8,
  },
  deptStat: {
    textAlign: "center",
  },
  statLabel: {
    margin: 0,
    fontSize: 10,
    color: "#9CA3AF",
  },
  statValue: {
    margin: "2px 0 0 0",
    fontSize: 14,
    fontWeight: 700,
    color: "#D1D5DB",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  insightsList: {
    display: "grid",
    gap: 8,
  },
  insightItem: {
    backgroundColor: "#111827",
    padding: 10,
    borderRadius: 4,
    borderLeft: "3px solid #00C9A7",
  },
  insightText: {
    margin: 0,
    fontSize: 12,
    color: "#D1D5DB",
    lineHeight: "1.4",
  },
};
