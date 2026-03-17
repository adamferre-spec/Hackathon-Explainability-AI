import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { ShapVisualization } from "../components/ShapExplainer";

const COLORS = {
  critical: "#E63946",
  high: "#FF9F1C",
  moderate: "#A855F7",
  low: "#00C9A7",
};

function riskLabel(score) {
  if (score >= 0.7) return "Critique";
  if (score >= 0.5) return "Élevé";
  if (score >= 0.3) return "Modéré";
  return "Faible";
}

function riskColor(score) {
  if (score >= 0.7) return COLORS.critical;
  if (score >= 0.5) return COLORS.high;
  if (score >= 0.3) return COLORS.moderate;
  return COLORS.low;
}

function horizonRiskIndex(employee) {
  let score = Number(employee?.risk_score) || 0;
  const satisfaction = Number(employee?.satisfaction) || 0;
  const engagement = Number(employee?.engagement) || 0;
  const workLifeBalance = Number(employee?.work_life_balance) || 0;
  const yearsSincePromotion = Number(employee?.years_since_last_promotion) || 0;
  const distance = Number(employee?.distance_from_home) || 0;

  if (employee?.overtime === "Yes") score += 0.08;
  if (satisfaction <= 2) score += 0.10;
  else if (satisfaction <= 3) score += 0.04;
  if (engagement <= 2) score += 0.08;
  else if (engagement <= 3) score += 0.03;
  if (yearsSincePromotion >= 5) score += 0.10;
  else if (yearsSincePromotion >= 3) score += 0.05;
  if (workLifeBalance <= 2) score += 0.06;
  if (distance > 20) score += 0.04;

  return Math.max(0, Math.min(1, score));
}

function estimateDepartureForEmployee(employee) {
  if (!employee) return "Non disponible";
  if (employee.status === "Parti") return "Déjà parti";

  const idx = horizonRiskIndex(employee);
  if (idx >= 0.82) return "0-3 mois";
  if (idx >= 0.68) return "3-6 mois";
  if (idx >= 0.55) return "6-12 mois";
  if (idx >= 0.42) return "12-18 mois";
  if (idx >= 0.30) return "18-24 mois";
  return ">24 mois";
}

function rate(part, total) {
  if (!total) return 0;
  return (part / total) * 100;
}

function parsePerformance(value) {
  if (typeof value === "number") return value;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) return asNumber;
  const txt = String(value || "").toLowerCase();
  if (txt.includes("high")) return 4;
  if (txt.includes("medium")) return 3;
  if (txt.includes("low")) return 2;
  return 0;
}

function SegmentCard({ title, value, subtitle, color }) {
  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16, borderLeft: `4px solid ${color}` }}>
      <div style={{ color: "#8BA5BF", fontSize: 12 }}>{title}</div>
      <div style={{ color, fontSize: 24, fontWeight: 700, marginTop: 6 }}>{value}</div>
      <div style={{ color: "#C5D5E8", fontSize: 11, marginTop: 4 }}>{subtitle}</div>
    </div>
  );
}

function BarRow({ label, value, max, color, right }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#C5D5E8", fontSize: 12 }}>{label}</span>
        <span style={{ color: right?.color || "#C5D5E8", fontSize: 12, fontWeight: 600 }}>{right?.text}</span>
      </div>
      <div style={{ height: 8, background: "#243B55", borderRadius: 4 }}>
        <div style={{ width: `${Math.min(100, (value / Math.max(max, 1)) * 100)}%`, height: "100%", borderRadius: 4, background: color }} />
      </div>
    </div>
  );
}

function ShapLikePanel({ explainability, correlationMap }) {
  const items = (explainability?.feature_importance || []).slice(0, 10);
  const max = Math.max(...items.map((item) => item.percentage || 0), 1);

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 15 }}>SHAP-like drivers (global)</span>
      </div>
      <div style={{ padding: "14px 20px", color: "#8BA5BF", fontSize: 11 }}>
        Vert = facteur protecteur, Rouge = facteur aggravant du départ.
      </div>
      <div style={{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => {
          const signedCorr = correlationMap?.[item.feature];
          const positiveForRisk = typeof signedCorr === "number" ? signedCorr > 0 : null;
          const valueColor = positiveForRisk === null ? "#8BA5BF" : positiveForRisk ? "#E63946" : "#00C9A7";
          const barColor =
            positiveForRisk === null
              ? "linear-gradient(90deg, #65758A, #8BA5BF)"
              : positiveForRisk
                ? "linear-gradient(90deg, #FF9F1C, #E63946)"
                : "linear-gradient(90deg, #378ADD, #00C9A7)";

          return (
            <div key={item.feature}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#C5D5E8", fontSize: 12 }}>{item.feature}</span>
                <span style={{ color: valueColor, fontSize: 12, fontWeight: 600 }}>{item.percentage?.toFixed(1)}%</span>
              </div>
              <div style={{ height: 7, background: "#243B55", borderRadius: 4 }}>
                <div style={{ width: `${(item.percentage / max) * 100}%`, height: "100%", borderRadius: 4, background: barColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfluenceInsights({ correlationData }) {
  const rows = correlationData?.correlation_with_departure || [];
  const positive = [...rows].filter((row) => row.correlation > 0).sort((a, b) => b.correlation - a.correlation).slice(0, 6);
  const negative = [...rows].filter((row) => row.correlation < 0).sort((a, b) => a.correlation - b.correlation).slice(0, 6);

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
      <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Facteurs aggravants vs protecteurs</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ color: "#E63946", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>🔴 Augmentent le risque</div>
          {positive.length === 0 ? <div style={{ color: "#8BA5BF", fontSize: 11 }}>Non disponible</div> : positive.map((row) => (
            <div key={row.feature} style={{ color: "#C5D5E8", fontSize: 11, marginBottom: 4 }}>{row.feature} ({(row.correlation * 100).toFixed(1)}%)</div>
          ))}
        </div>
        <div>
          <div style={{ color: "#00C9A7", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>🟢 Réduisent le risque</div>
          {negative.length === 0 ? <div style={{ color: "#8BA5BF", fontSize: 11 }}>Non disponible</div> : negative.map((row) => (
            <div key={row.feature} style={{ color: "#C5D5E8", fontSize: 11, marginBottom: 4 }}>{row.feature} ({(row.correlation * 100).toFixed(1)}%)</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeTable({ employees, onSelect, selectedId, isLoading }) {
  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55", color: "#FFFFFF", fontSize: 15, fontWeight: 600 }}>
        Employés à surveiller (triés par risque)
      </div>
      <div style={{ maxHeight: 520, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0D1B2A" }}>
              {["ID", "Département", "Poste", "Statut", "Risque", "Horizon", "OverTime", "Sans promo"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#8BA5BF", fontSize: 12, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.emp_id} onClick={() => !isLoading && onSelect(employee)} style={{ cursor: isLoading ? "not-allowed" : "pointer", background: selectedId === employee.emp_id ? "#243B55" : "transparent", borderBottom: "1px solid #1B2E45", opacity: isLoading ? 0.5 : 1 }}>
                <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{employee.name}</td>
                <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{employee.department}</td>
                <td style={{ padding: "10px 12px", color: "#8BA5BF", fontSize: 12 }}>{employee.position}</td>
                <td style={{ padding: "10px 12px", color: employee.status === "Parti" ? COLORS.critical : COLORS.low, fontSize: 12, fontWeight: 600 }}>{employee.status}</td>
                <td style={{ padding: "10px 12px", color: riskColor(employee.risk_score), fontSize: 12, fontWeight: 700 }}>{riskLabel(employee.risk_score)} ({Math.round(employee.risk_score * 100)}%)</td>
                <td style={{ padding: "10px 12px", color: employee.status === "Parti" ? COLORS.critical : "#C5D5E8", fontSize: 12 }}>{estimateDepartureForEmployee(employee)}</td>
                <td style={{ padding: "10px 12px", color: employee.overtime === "Yes" ? COLORS.high : COLORS.low, fontSize: 12 }}>{employee.overtime}</td>
                <td style={{ padding: "10px 12px", color: employee.years_since_last_promotion > 3 ? COLORS.critical : "#C5D5E8", fontSize: 12 }}>{employee.years_since_last_promotion} ans</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isLoading && (
        <div style={{ padding: 20, textAlign: "center", color: "#8BA5BF", fontSize: 12 }}>
          ⏳ Chargement des données...
        </div>
      )}
    </div>
  );
}

function EmployeeAnalysisPanel({ detail, recommendations }) {
  if (!detail) {
    return (
      <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
        <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Analyse employé</div>
        <div style={{ color: "#8BA5BF", fontSize: 12 }}>Sélectionne un employé dans le tableau pour afficher son analyse personnalisée.</div>
      </div>
    );
  }

  const topFactors = (detail.risk_factors || []).slice(0, 4);
  const firstActionPack = (recommendations?.recommendations || [])[0];
  const actions = (firstActionPack?.actions || []).slice(0, 3);

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
      <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Analyse employé — {detail.name}</div>

      <div style={{ background: "#243B55", borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ color: "#C5D5E8", fontSize: 12 }}>
          <strong>Risque:</strong> <span style={{ color: riskColor(detail.risk_score), fontWeight: 700 }}>{detail.risk_level}</span> ({Math.round(detail.risk_score * 100)}%)
        </div>
        <div style={{ color: "#8BA5BF", fontSize: 11, marginTop: 4 }}>
          <strong>Horizon:</strong> {estimateDepartureForEmployee(detail)}
        </div>
      </div>

      <div style={{ color: "#8BA5BF", fontSize: 11, marginBottom: 6 }}>Facteurs dominants (profil individuel)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {topFactors.map((factor) => (
          <div key={factor.feature} style={{ background: "#243B55", borderRadius: 6, padding: "7px 9px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#C5D5E8", fontSize: 11 }}>{factor.feature}</span>
            <span style={{ color: "#00C9A7", fontSize: 11, fontWeight: 700 }}>{(factor.importance * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div style={{ color: "#8BA5BF", fontSize: 11, marginBottom: 6 }}>Priorités d’action</div>
      {actions.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {actions.map((action, index) => (
            <div key={`${action}-${index}`} style={{ color: "#C5D5E8", fontSize: 11 }}>• {action}</div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#8BA5BF", fontSize: 11 }}>Les recommandations apparaissent après chargement complet du profil.</div>
      )}
    </div>
  );
}

function RecommendationsPanel({ recommendations }) {
  if (!recommendations?.recommendations) return null;
  
  const recs = recommendations.optimized_plan?.recommended_actions?.length
    ? recommendations.optimized_plan.recommended_actions
    : recommendations.recommendations;
  
  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55", color: "#FFFFFF", fontWeight: 600, fontSize: 14 }}>
        💡 Recommandations personnalisées — {recommendations.name}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, maxHeight: 600, overflowY: "auto" }}>
        <div style={{ background: "#243B55", borderRadius: 8, padding: 10 }}>
          <div style={{ color: "#8BA5BF", fontSize: 10, marginBottom: 4 }}>Risque actuel</div>
          <div style={{ color: riskColor(recommendations.current_risk_score), fontSize: 14, fontWeight: 700 }}>
            {recommendations.risk_level} • {(recommendations.current_risk_score * 100).toFixed(1)}%
          </div>
          <div style={{ color: "#8BA5BF", fontSize: 10, marginTop: 6 }}>
            {recommendations.projected_impact}
          </div>
        </div>

        {recs.map((rec, i) => {
          const priorityColors = {
            "CRITIQUE": { bg: "#E639464C", border: "#E63946", text: "#FF9F9F" },
            "ÉLEVÉE": { bg: "#FF9F1C4C", border: "#FF9F1C", text: "#FFD499" },
            "MODÉRÉE": { bg: "#A855F74C", border: "#A855F7", text: "#DCC9FF" },
            "FAIBLE": { bg: "#00C9A74C", border: "#00C9A7", text: "#7FFBDB" },
          };
          const colors = priorityColors[rec.priority] || priorityColors["MODÉRÉE"];
          
          return (
            <div key={i} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ color: colors.text, fontSize: 12, fontWeight: 700 }}>{rec.priority}</div>
                {rec.area && <div style={{ color: "#C5D5E8", fontSize: 11, fontWeight: 600 }}>{rec.area}</div>}
              </div>
              
              {rec.current_value && (
                <div style={{ color: "#8BA5BF", fontSize: 10, marginBottom: 4 }}>
                  {rec.current_value} → {rec.target_value}
                </div>
              )}
              
              <div style={{ color: "#C5D5E8", fontSize: 11, marginBottom: 6 }}>
                <strong>Actions:</strong>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, listStyle: "none" }}>
                  {rec.actions?.slice(0, 3).map((action, j) => (
                    <li key={j} style={{ marginBottom: 2, fontSize: 10 }}>• {action}</li>
                  ))}
                </ul>
              </div>

              {rec.estimated_cost_points != null && rec.estimated_risk_reduction_points != null ? (
                <div style={{ color: "#8BA5BF", fontSize: 10, marginBottom: 4 }}>
                  Coût estimé: {rec.estimated_cost_points.toFixed(1)} | Gain risque: -{rec.estimated_risk_reduction_points.toFixed(1)} pts | Efficacité: {rec.efficiency_score?.toFixed ? rec.efficiency_score.toFixed(2) : rec.efficiency_score}
                </div>
              ) : null}
              
              {rec.expected_impact && (
                <div style={{ color: colors.text, fontSize: 10, fontStyle: "italic" }}>
                  {rec.expected_impact}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModelPerformanceTab({ employees }) {
  const metrics = useMemo(() => {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;
    let brierSum = 0;
    let activeRisk = 0;
    let leftRisk = 0;
    let activeCount = 0;
    let leftCount = 0;
    let criticalCount = 0;
    let criticalLeft = 0;

    const threshold = 0.7;

    employees.forEach((employee) => {
      const actualLeave = employee.status === "Parti";
      const score = Number(employee.risk_score) || 0;
      const predLeave = score >= threshold;
      const actual = actualLeave ? 1 : 0;

      brierSum += (score - actual) ** 2;

      if (actualLeave) {
        leftRisk += score;
        leftCount += 1;
      } else {
        activeRisk += score;
        activeCount += 1;
      }

      if (predLeave) {
        criticalCount += 1;
        if (actualLeave) criticalLeft += 1;
      }

      if (actualLeave && predLeave) tp += 1;
      else if (!actualLeave && predLeave) fp += 1;
      else if (!actualLeave && !predLeave) tn += 1;
      else fn += 1;
    });
    const precision = tp / Math.max(tp + fp, 1);
    const recall = tp / Math.max(tp + fn, 1);
    const f1 = (2 * precision * recall) / Math.max(precision + recall, 1e-9);
    const accuracy = (tp + tn) / Math.max(tp + tn + fp + fn, 1);
    const brier = brierSum / Math.max(employees.length, 1);
    const meanRiskActive = activeRisk / Math.max(activeCount, 1);
    const meanRiskLeft = leftRisk / Math.max(leftCount, 1);
    const separation = meanRiskLeft - meanRiskActive;
    const alertCoverage = criticalCount / Math.max(employees.length, 1);
    const criticalPrecision = criticalLeft / Math.max(criticalCount, 1);

    return {
      tp,
      fp,
      tn,
      fn,
      precision,
      recall,
      f1,
      accuracy,
      brier,
      threshold,
      meanRiskActive,
      meanRiskLeft,
      separation,
      alertCoverage,
      criticalPrecision,
    };
  }, [employees]);

  const bands = useMemo(() => {
    const groups = [
      { key: "Faible", min: 0, max: 0.3 },
      { key: "Modéré", min: 0.3, max: 0.5 },
      { key: "Élevé", min: 0.5, max: 0.7 },
      { key: "Critique", min: 0.7, max: 1.01 },
    ];
    return groups.map((group) => {
      const rows = employees.filter((employee) => employee.risk_score >= group.min && employee.risk_score < group.max);
      const left = rows.filter((employee) => employee.status === "Parti").length;
      return {
        ...group,
        total: rows.length,
        leaveRate: rate(left, rows.length),
      };
    });
  }, [employees]);

  const numericRows = useMemo(() => {
    return employees.map((employee) => ({
      leave: employee.status === "Parti" ? 1 : 0,
      risk_score: Number(employee.risk_score) || 0,
      salary: Number(employee.salary) || 0,
      satisfaction: Number(employee.satisfaction) || 0,
      engagement: Number(employee.engagement) || 0,
      training_times: Number(employee.training_times) || 0,
      years_at_company: Number(employee.years_at_company) || 0,
      years_since_last_promotion: Number(employee.years_since_last_promotion) || 0,
      distance_from_home: Number(employee.distance_from_home) || 0,
      work_life_balance: Number(employee.work_life_balance) || 0,
      performance_num: parsePerformance(employee.performance),
    }));
  }, [employees]);

  const numericColumns = [
    "risk_score",
    "salary",
    "satisfaction",
    "engagement",
    "training_times",
    "years_at_company",
    "years_since_last_promotion",
    "distance_from_home",
    "work_life_balance",
    "performance_num",
  ];

  const pretty = {
    risk_score: "Risk score",
    salary: "Salary",
    satisfaction: "Satisfaction",
    engagement: "Engagement",
    training_times: "Training times",
    years_at_company: "Years at company",
    years_since_last_promotion: "Years since last promotion",
    distance_from_home: "Distance from home",
    work_life_balance: "Work-life balance",
    performance_num: "Performance",
  };

  const numericInsights = useMemo(() => {
    const left = numericRows.filter((row) => row.leave === 1);
    const active = numericRows.filter((row) => row.leave === 0);
    return numericColumns.map((key) => {
      const values = numericRows.map((row) => row[key]).sort((a, b) => a - b);
      const median = values[Math.floor(values.length / 2)] || 0;
      const high = numericRows.filter((row) => row[key] >= median);
      const low = numericRows.filter((row) => row[key] < median);

      const avgLeft = left.reduce((acc, row) => acc + row[key], 0) / Math.max(left.length, 1);
      const avgActive = active.reduce((acc, row) => acc + row[key], 0) / Math.max(active.length, 1);

      return {
        key,
        label: pretty[key] || key,
        avgLeft,
        avgActive,
        median,
        highLeaveRate: rate(high.filter((row) => row.leave === 1).length, high.length),
        lowLeaveRate: rate(low.filter((row) => row.leave === 1).length, low.length),
      };
    });
  }, [numericRows]);

  const categoricalInsights = useMemo(() => {
    const categoricalKeys = ["department", "position", "overtime", "status", "performance"];
    return categoricalKeys.map((key) => {
      const map = {};
      employees.forEach((employee) => {
        const value = String(employee[key] ?? "Unknown");
        if (!map[value]) map[value] = { total: 0, leave: 0 };
        map[value].total += 1;
        if (employee.status === "Parti") map[value].leave += 1;
      });
      const rows = Object.entries(map)
        .map(([value, stats]) => ({
          value,
          total: stats.total,
          leaveRate: rate(stats.leave, stats.total),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
      return { key, rows };
    });
  }, [employees]);

  const corrMatrix = useMemo(() => {
    const cols = numericColumns;
    const matrix = {};

    const corr = (a, b) => {
      const n = Math.min(a.length, b.length);
      if (!n) return 0;
      const meanA = a.reduce((s, v) => s + v, 0) / n;
      const meanB = b.reduce((s, v) => s + v, 0) / n;
      let num = 0;
      let denA = 0;
      let denB = 0;
      for (let i = 0; i < n; i += 1) {
        const da = a[i] - meanA;
        const db = b[i] - meanB;
        num += da * db;
        denA += da * da;
        denB += db * db;
      }
      if (denA === 0 || denB === 0) return 0;
      return num / Math.sqrt(denA * denB);
    };

    cols.forEach((colA) => {
      matrix[colA] = {};
      const arrA = numericRows.map((row) => row[colA]);
      cols.forEach((colB) => {
        const arrB = numericRows.map((row) => row[colB]);
        matrix[colA][colB] = corr(arrA, arrB);
      });
    });

    return { cols, matrix };
  }, [numericRows]);

  const heatColor = (value) => {
    const v = Math.max(-1, Math.min(1, value));
    if (v > 0) {
      const alpha = 0.15 + Math.abs(v) * 0.45;
      return `rgba(230,57,70,${alpha})`;
    }
    const alpha = 0.15 + Math.abs(v) * 0.45;
    return `rgba(0,201,167,${alpha})`;
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <SegmentCard title="Brier score" value={metrics.brier.toFixed(3)} subtitle="Plus bas = meilleure calibration" color="#378ADD" />
        <SegmentCard title="Risk separation" value={`${(metrics.separation * 100).toFixed(1)} pts`} subtitle={`Départs ${(metrics.meanRiskLeft * 100).toFixed(1)}% vs Actifs ${(metrics.meanRiskActive * 100).toFixed(1)}%`} color="#FF9F1C" />
        <SegmentCard title="Alert coverage" value={`${(metrics.alertCoverage * 100).toFixed(1)}%`} subtitle={`Profils critiques (seuil ${(metrics.threshold * 100).toFixed(0)}%)`} color="#E63946" />
        <SegmentCard title="Critical precision" value={`${(metrics.criticalPrecision * 100).toFixed(1)}%`} subtitle="Parmi les critiques, % réellement partis" color="#A855F7" />
      </div>

      <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
        <div style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: 10 }}>Matrice de performance (proxy opérationnel)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <div style={{ background: "#143F31", borderRadius: 8, padding: 10, color: "#B7F7DC" }}>Vrais positifs (TP): <strong>{metrics.tp}</strong></div>
          <div style={{ background: "#4A2B18", borderRadius: 8, padding: 10, color: "#FFD4B0" }}>Faux positifs (FP): <strong>{metrics.fp}</strong></div>
          <div style={{ background: "#1D3C57", borderRadius: 8, padding: 10, color: "#C3E8FF" }}>Vrais négatifs (TN): <strong>{metrics.tn}</strong></div>
          <div style={{ background: "#4A1F2A", borderRadius: 8, padding: 10, color: "#FFC1CE" }}>Faux négatifs (FN): <strong>{metrics.fn}</strong></div>
        </div>
      </div>

      <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
        <div style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: 10 }}>Qualité du score par bande de risque</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bands.map((b) => (
            <BarRow key={b.key} label={`${b.key} (${b.total})`} value={b.leaveRate} max={100} color={b.leaveRate > 40 ? "#E63946" : b.leaveRate > 20 ? "#FF9F1C" : "#00C9A7"} right={{ text: `${b.leaveRate.toFixed(1)}% départ réel`, color: "#C5D5E8" }} />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
          <div style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: 8 }}>Analyse numérique (presque toutes les colonnes)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto" }}>
            {numericInsights.map((row) => (
              <div key={row.key} style={{ background: "#243B55", borderRadius: 8, padding: 10 }}>
                <div style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{row.label}</div>
                <div style={{ color: "#8BA5BF", fontSize: 11, marginBottom: 6 }}>
                  Avg actifs: {row.avgActive.toFixed(2)} | Avg partis: {row.avgLeft.toFixed(2)} | Médiane: {row.median.toFixed(2)}
                </div>
                <BarRow
                  label="Leave rate (>= médiane)"
                  value={row.highLeaveRate}
                  max={100}
                  color="#E63946"
                  right={{ text: `${row.highLeaveRate.toFixed(1)}%`, color: "#FFC1CE" }}
                />
                <div style={{ height: 6 }} />
                <BarRow
                  label="Leave rate (< médiane)"
                  value={row.lowLeaveRate}
                  max={100}
                  color="#00C9A7"
                  right={{ text: `${row.lowLeaveRate.toFixed(1)}%`, color: "#B7F7DC" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
          <div style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: 8 }}>Analyse catégorielle (département/poste/overtime/statut/performance)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 520, overflowY: "auto" }}>
            {categoricalInsights.map((group) => (
              <div key={group.key} style={{ background: "#243B55", borderRadius: 8, padding: 10 }}>
                <div style={{ color: "#C5D5E8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{group.key}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.rows.map((r) => (
                    <BarRow
                      key={`${group.key}-${r.value}`}
                      label={`${r.value} (${r.total})`}
                      value={r.leaveRate}
                      max={100}
                      color={r.leaveRate > 40 ? "#E63946" : r.leaveRate > 20 ? "#FF9F1C" : "#00C9A7"}
                      right={{ text: `${r.leaveRate.toFixed(1)}%`, color: "#C5D5E8" }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16, overflowX: "auto" }}>
        <div style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: 10 }}>Correlation matrix (numérique)</div>
        <table style={{ borderCollapse: "separate", borderSpacing: 4, minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ color: "#8BA5BF", fontSize: 11, textAlign: "left", padding: 6 }}>Feature</th>
              {corrMatrix.cols.map((col) => (
                <th key={`h-${col}`} style={{ color: "#8BA5BF", fontSize: 11, padding: 6 }}>{pretty[col] || col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {corrMatrix.cols.map((rowKey) => (
              <tr key={`r-${rowKey}`}>
                <td style={{ color: "#C5D5E8", fontSize: 11, padding: 6, fontWeight: 600 }}>{pretty[rowKey] || rowKey}</td>
                {corrMatrix.cols.map((colKey) => {
                  const v = corrMatrix.matrix[rowKey][colKey];
                  return (
                    <td
                      key={`${rowKey}-${colKey}`}
                      style={{
                        background: heatColor(v),
                        color: "#FFFFFF",
                        textAlign: "center",
                        padding: "6px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        minWidth: 62,
                      }}
                    >
                      {v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailsForecastTab({ employees, terminationReasons }) {
  const reasons = useMemo(() => {
    const departed = employees.filter((employee) => employee.status === "Parti");
    if (!departed.length) return [];
    const salaryMedian = [...employees].map((employee) => employee.salary).sort((a, b) => a - b)[Math.floor(employees.length / 2)] || 0;
    const reasonRows = [
      { label: "OverTime = Yes", count: departed.filter((employee) => employee.overtime === "Yes").length, color: "#E63946" },
      { label: "Satisfaction faible (<=2)", count: departed.filter((employee) => Number(employee.satisfaction) <= 2).length, color: "#FF9F1C" },
      { label: "Engagement faible (<=2)", count: departed.filter((employee) => Number(employee.engagement) <= 2).length, color: "#F4C542" },
      { label: "Sans promo >3 ans", count: departed.filter((employee) => employee.years_since_last_promotion > 3).length, color: "#A855F7" },
      { label: "Long trajet (>20km)", count: departed.filter((employee) => employee.distance_from_home > 20).length, color: "#378ADD" },
      { label: "Salaire < médiane", count: departed.filter((employee) => employee.salary < salaryMedian).length, color: "#00C9A7" },
    ];
    return reasonRows.map((r) => ({ ...r, pct: rate(r.count, departed.length) })).sort((a, b) => b.count - a.count);
  }, [employees]);

  const forecast = useMemo(() => {
    const active = employees.filter((employee) => employee.status === "Actif");
    const horizons = ["0-3 mois", "3-6 mois", "6-12 mois", "12-18 mois", ">18 mois"];
    const counts = horizons.map((h) => ({
      horizon: h,
      count: active.filter((employee) => estimateDepartureForEmployee(employee) === h).length,
    }));
    const nextCritical = [...active]
      .filter((employee) => employee.risk_score >= 0.7)
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10);
    return { counts, nextCritical };
  }, [employees]);

  const maxReasons = Math.max(...reasons.map((r) => r.count), 1);
  const maxForecast = Math.max(...forecast.counts.map((r) => r.count), 1);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
          <div style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: 8 }}>Raisons probables de départ (détails)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reasons.map((r) => (
              <BarRow key={r.label} label={r.label} value={r.count} max={maxReasons} color={r.color} right={{ text: `${r.count} (${r.pct.toFixed(1)}%)`, color: "#C5D5E8" }} />
            ))}
          </div>
          {Array.isArray(terminationReasons?.reasons) ? (
            <div style={{ marginTop: 10, color: "#8BA5BF", fontSize: 11 }}>
              Source complémentaire API: {terminationReasons.reasons.length} catégories déclarées.
            </div>
          ) : null}
        </div>

        <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
          <div style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: 8 }}>Futur de l’effectif (projection risque)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {forecast.counts.map((r) => (
              <BarRow key={r.horizon} label={r.horizon} value={r.count} max={maxForecast} color={r.horizon === "0-3 mois" ? "#E63946" : r.horizon === "3-6 mois" ? "#FF9F1C" : "#378ADD"} right={{ text: `${r.count} actifs`, color: "#C5D5E8" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55", color: "#FFFFFF", fontWeight: 600 }}>Next employees becoming critical</div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0D1B2A" }}>
                {["ID", "Département", "Poste", "Risque", "Horizon", "OverTime"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#8BA5BF", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecast.nextCritical.map((e) => (
                <tr key={e.emp_id} style={{ borderBottom: "1px solid #1B2E45" }}>
                  <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{e.name}</td>
                  <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{e.department}</td>
                  <td style={{ padding: "10px 12px", color: "#8BA5BF", fontSize: 12 }}>{e.position}</td>
                  <td style={{ padding: "10px 12px", color: "#E63946", fontWeight: 700, fontSize: 12 }}>{Math.round(e.risk_score * 100)}%</td>
                  <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{estimateDepartureForEmployee(e)}</td>
                  <td style={{ padding: "10px 12px", color: e.overtime === "Yes" ? "#FF9F1C" : "#00C9A7", fontSize: 12 }}>{e.overtime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function HRAttritionV2() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [explainability, setExplainability] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [terminationReasons, setTerminationReasons] = useState(null);
  const [selected, setSelected] = useState(null);
    const [shap, setShap] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, employeesData, explainabilityData, correlationMatrix, reasonsData] = await Promise.all([
          api.hrStats(),
          api.hrEmployees(10000),
          api.hrModelExplainability(),
          api.hrCorrelationMatrix(),
          api.hrTerminationReasons(),
        ]);
        setStats(statsData);
        setAllEmployees(employeesData.employees || []);
        setExplainability(explainabilityData);
        setCorrelationData(correlationMatrix);
        setTerminationReasons(reasonsData);
      } catch (err) {
        setError(err.message || "Failed to load HR dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const visibleEmployees = useMemo(() => {
    let base = activeOnly ? allEmployees.filter((employee) => employee.status === "Actif") : allEmployees;
    if (statusFilter !== "all") base = base.filter((employee) => employee.status === statusFilter);
    if (departmentFilter !== "all") base = base.filter((employee) => employee.department === departmentFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter((employee) => String(employee.name).toLowerCase().includes(q) || String(employee.position).toLowerCase().includes(q));
    }
    return base.slice(0, 150);
  }, [allEmployees, activeOnly, statusFilter, departmentFilter, searchQuery]);

  const departments = useMemo(() => ["all", ...new Set(allEmployees.map((employee) => employee.department))], [allEmployees]);

  const segments = useMemo(() => {
    const source = allEmployees;
    const overtimeYes = source.filter((employee) => employee.overtime === "Yes");
    const overtimeNo = source.filter((employee) => employee.overtime !== "Yes");
    const departedOvertimeYes = overtimeYes.filter((employee) => employee.status === "Parti").length;
    const departedOvertimeNo = overtimeNo.filter((employee) => employee.status === "Parti").length;
    const stagnation = source.filter((employee) => employee.years_since_last_promotion > 3 && employee.status === "Actif");
    const activeCritical = source.filter((employee) => employee.status === "Actif" && employee.risk_score >= 0.75);
    const longCommute = source.filter((employee) => employee.distance_from_home > 20);
    const departedLongCommute = longCommute.filter((employee) => employee.status === "Parti").length;
    return {
      overtimeAttritionYes: rate(departedOvertimeYes, overtimeYes.length),
      overtimeAttritionNo: rate(departedOvertimeNo, overtimeNo.length),
      activeCriticalRate: rate(activeCritical.length, source.filter((employee) => employee.status === "Actif").length),
      commuteAttritionRate: rate(departedLongCommute, longCommute.length),
      activeCriticalCount: activeCritical.length,
      stagnationCount: stagnation.length,
      commuteCount: longCommute.length,
    };
  }, [allEmployees]);

  const correlationMap = useMemo(() => {
    const rows = correlationData?.correlation_with_departure || [];
    return rows.reduce((acc, row) => {
      acc[row.feature] = row.correlation;
      return acc;
    }, {});
  }, [correlationData]);

  async function handleSelect(employee) {
    setDetailLoading(true);
    setShap(null);
    setRecommendations(null);
    try {
      const [detail, shapData, recsData] = await Promise.all([
        api.hrPredict(employee.emp_id),
        api.hrShapExplain(employee.emp_id),
        api.hrRecommendations(employee.emp_id),
      ]);
      setSelected(detail);
      setShap(shapData);
      setRecommendations(recsData);
    } catch (err) {
      setError(`Employee detail failed: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) return <div style={{ color: "#8BA5BF", textAlign: "center", padding: 60 }}>Chargement dashboard RH...</div>;
  if (error) return <div style={{ color: "#E63946", padding: 24 }}>❌ {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ color: "#FFFFFF", margin: 0, fontSize: 22, fontWeight: 700 }}>📊 HR Attrition Dashboard</h1>
        <p style={{ color: "#8BA5BF", margin: "6px 0 0", fontSize: 13 }}>Focus opérationnel: talents, performance modèle, raisons de départ et prévision des profils critiques.</p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "model", label: "📈 Model performance" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ background: tab === t.key ? "#378ADD" : "#1B2E45", color: "#fff", border: "1px solid #2F4C6C", borderRadius: 8, padding: "8px 12px", fontSize: 12, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            <SegmentCard title="Employés" value={stats.total_employees} subtitle={`${stats.active} actifs / ${stats.terminated} partis`} color="#378ADD" />
            <SegmentCard title="Attrition globale" value={`${(stats.attrition_rate * 100).toFixed(1)}%`} subtitle="Taux historique dataset" color="#FF9F1C" />
            <SegmentCard title="Attrition + OverTime" value={`${segments.overtimeAttritionYes.toFixed(1)}%`} subtitle={`vs ${segments.overtimeAttritionNo.toFixed(1)}% sans OverTime`} color="#E63946" />
            <SegmentCard title="Actifs critiques" value={`${segments.activeCriticalRate.toFixed(1)}%`} subtitle={`${segments.activeCriticalCount} employés actifs à traiter`} color="#A855F7" />
          </div>

          <div style={{ background: "#1B2E45", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ color: "#C5D5E8", fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
              Afficher uniquement les membres actifs
            </label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ background: "#0D1B2A", color: "#C5D5E8", border: "1px solid #2F4C6C", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}>
              <option value="all">Statut: Tous</option>
              <option value="Actif">Statut: Actifs</option>
              <option value="Parti">Statut: Partis</option>
            </select>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ background: "#0D1B2A", color: "#C5D5E8", border: "1px solid #2F4C6C", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}>
              <option value="all">Département: Tous</option>
              {departments.filter((d) => d !== "all").map((dep) => <option key={dep} value={dep}>{dep}</option>)}
            </select>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher ID ou poste" style={{ background: "#0D1B2A", color: "#C5D5E8", border: "1px solid #2F4C6C", borderRadius: 6, padding: "6px 10px", fontSize: 12, minWidth: 180 }} />
            <span style={{ color: "#8BA5BF", fontSize: 11 }}>{`${visibleEmployees.length} employés affichés`}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
            <EmployeeTable employees={visibleEmployees} onSelect={handleSelect} selectedId={selected?.emp_id} isLoading={detailLoading} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {detailLoading ? (
                <div style={{ background: "#1B2E45", borderRadius: 10, padding: 32, textAlign: "center", color: "#8BA5BF", fontSize: 13 }}>
                  ⏳ Chargement données employé...
                </div>
              ) : (
                <EmployeeAnalysisPanel detail={selected} recommendations={recommendations} />
              )}
              <InfluenceInsights correlationData={correlationData} />
              <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
                <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Segments utiles</div>
                <div style={{ color: "#C5D5E8", fontSize: 12, lineHeight: 1.6 }}>
                  <div>• Long trajet domicile (&gt;20km): <strong>{segments.commuteCount}</strong> employés, <strong>{segments.commuteAttritionRate.toFixed(1)}%</strong> d’attrition historique.</div>
                  <div>• Sans promotion &gt;3 ans (actifs): <strong>{segments.stagnationCount}</strong> employés à risque de stagnation.</div>
                  <div>• Priorité action: charge (OverTime), progression (promotion) et satisfaction/engagement.</div>
                </div>
              </div>
            </div>
          </div>

          {selected && !detailLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <ShapVisualization shap={shap} />
              <RecommendationsPanel recommendations={recommendations} />
            </div>
          )}
          {detailLoading && selected && (
            <div style={{ background: "#1B2E45", borderRadius: 10, padding: 32, textAlign: "center", color: "#8BA5BF", fontSize: 13 }}>
              ⏳ Chargement SHAP et recommandations...
            </div>
          )}
        </>
      ) : null}

      {tab === "model" ? <ModelPerformanceTab employees={allEmployees} /> : null}

      <div style={{ color: "#8BA5BF", fontSize: 11 }}>Horizon affiché = estimation de priorisation (0-3, 3-6, 6-12, 12-18, 18-24, &gt;24 mois) selon score + facteurs RH.</div>
    </div>
  );
}
