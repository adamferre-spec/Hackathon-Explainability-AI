import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

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

function rate(part, total) {
  if (!total) return 0;
  return (part / total) * 100;
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

function ShapLikePanel({ explainability, correlationMap }) {
  const items = (explainability?.feature_importance || []).slice(0, 10);
  const max = Math.max(...items.map((item) => item.percentage || 0), 1);

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 15 }}>SHAP-like drivers (global)</span>
      </div>
      <div style={{ padding: "14px 20px", color: "#8BA5BF", fontSize: 11 }}>
        Classement des variables les plus influentes du modèle. Vert = réduit le risque, Rouge = augmente le risque.
      </div>
      <div style={{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => {
          const signedCorr = correlationMap?.[item.feature];
          const positiveForRisk = typeof signedCorr === "number" ? signedCorr > 0 : null;
          const valueColor = positiveForRisk === null ? "#8BA5BF" : positiveForRisk ? "#E63946" : "#00C9A7";
          const barColor = positiveForRisk === null ? "linear-gradient(90deg, #65758A, #8BA5BF)" : positiveForRisk ? "linear-gradient(90deg, #FF9F1C, #E63946)" : "linear-gradient(90deg, #378ADD, #00C9A7)";

          return (
          <div key={item.feature}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#C5D5E8", fontSize: 12 }}>{item.feature}</span>
              <span style={{ color: valueColor, fontSize: 12, fontWeight: 600 }}>{item.percentage?.toFixed(1)}%</span>
            </div>
            <div style={{ height: 7, background: "#243B55", borderRadius: 4 }}>
              <div
                style={{
                  width: `${(item.percentage / max) * 100}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: barColor,
                }}
              />
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

function InfluenceInsights({ correlationData }) {
  const rows = correlationData?.correlation_with_departure || [];
  const positive = [...rows].filter((row) => row.correlation > 0).sort((a, b) => b.correlation - a.correlation).slice(0, 5);
  const negative = [...rows].filter((row) => row.correlation < 0).sort((a, b) => a.correlation - b.correlation).slice(0, 5);

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, padding: 16 }}>
      <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Facteurs aggravants vs protecteurs</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ color: "#E63946", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>🔴 Augmentent le risque</div>
          {positive.length === 0 ? (
            <div style={{ color: "#8BA5BF", fontSize: 11 }}>Non disponible</div>
          ) : positive.map((row) => (
            <div key={row.feature} style={{ color: "#C5D5E8", fontSize: 11, marginBottom: 4 }}>
              {row.feature} ({(row.correlation * 100).toFixed(1)}%)
            </div>
          ))}
        </div>
        <div>
          <div style={{ color: "#00C9A7", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>🟢 Réduisent le risque</div>
          {negative.length === 0 ? (
            <div style={{ color: "#8BA5BF", fontSize: 11 }}>Non disponible</div>
          ) : negative.map((row) => (
            <div key={row.feature} style={{ color: "#C5D5E8", fontSize: 11, marginBottom: 4 }}>
              {row.feature} ({(row.correlation * 100).toFixed(1)}%)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeTable({ employees, onSelect, selectedId }) {
  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55", color: "#FFFFFF", fontSize: 15, fontWeight: 600 }}>
        Employés à surveiller (triés par risque)
      </div>
      <div style={{ maxHeight: 520, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0D1B2A" }}>
              {["ID", "Département", "Poste", "Statut", "Risque", "OverTime", "Sans promo"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#8BA5BF", fontSize: 12, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr
                key={employee.emp_id}
                onClick={() => onSelect(employee)}
                style={{
                  cursor: "pointer",
                  background: selectedId === employee.emp_id ? "#243B55" : "transparent",
                  borderBottom: "1px solid #1B2E45",
                }}
              >
                <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{employee.name}</td>
                <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{employee.department}</td>
                <td style={{ padding: "10px 12px", color: "#8BA5BF", fontSize: 12 }}>{employee.position}</td>
                <td style={{ padding: "10px 12px", color: employee.status === "Parti" ? COLORS.critical : COLORS.low, fontSize: 12, fontWeight: 600 }}>
                  {employee.status}
                </td>
                <td style={{ padding: "10px 12px", color: riskColor(employee.risk_score), fontSize: 12, fontWeight: 700 }}>
                  {riskLabel(employee.risk_score)} ({Math.round(employee.risk_score * 100)}%)
                </td>
                <td style={{ padding: "10px 12px", color: employee.overtime === "Yes" ? COLORS.high : COLORS.low, fontSize: 12 }}>
                  {employee.overtime}
                </td>
                <td style={{ padding: "10px 12px", color: employee.years_since_last_promotion > 3 ? COLORS.critical : "#C5D5E8", fontSize: 12 }}>
                  {employee.years_since_last_promotion} ans
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeFocus({ detail, timeline }) {
  if (!detail) {
    return (
      <div style={{ background: "#1B2E45", borderRadius: 10, padding: 28, textAlign: "center", color: "#8BA5BF", fontSize: 14 }}>
        Sélectionne un employé pour voir les leviers concrets.
      </div>
    );
  }

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55", color: "#FFFFFF", fontWeight: 600 }}>
        Plan d’action — {detail.name}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ padding: 10, borderRadius: 8, background: `${riskColor(detail.risk_score)}22`, border: `1px solid ${riskColor(detail.risk_score)}55`, color: riskColor(detail.risk_score), fontWeight: 700, marginBottom: 12 }}>
          Risque de départ: {detail.risk_level} ({Math.round(detail.risk_score * 100)}%)
        </div>
        <div style={{ background: "#243B55", borderRadius: 8, padding: 10, marginBottom: 12, color: "#C5D5E8", fontSize: 12 }}>
          <div><strong>Statut:</strong> {detail.status === "Parti" ? "Déjà parti" : "Actif"}</div>
          <div style={{ marginTop: 4 }}>
            <strong>Horizon de départ:</strong>{" "}
            {detail.status === "Parti"
              ? "Déjà parti"
              : timeline?.timeline?.months_until_departure != null
                ? `~${Math.round(timeline.timeline.months_until_departure)} mois`
                : "Non disponible"}
          </div>
          {detail.status !== "Parti" && timeline?.interpretation && (
            <div style={{ marginTop: 6, color: "#8BA5BF" }}>{timeline.interpretation}</div>
          )}
        </div>
        <div style={{ color: "#C5D5E8", fontSize: 12, marginBottom: 10 }}>
          {detail.recommendation}
        </div>
        <div style={{ color: "#8BA5BF", fontSize: 11, marginBottom: 6 }}>Top facteurs influents</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(detail.risk_factors || []).slice(0, 6).map((factor) => (
            <div key={factor.feature} style={{ background: "#243B55", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: "#FFFFFF", fontSize: 12 }}>{factor.feature}</span>
                <span style={{ color: "#00C9A7", fontSize: 11 }}>{(factor.importance * 100).toFixed(1)}%</span>
              </div>
              <div style={{ color: "#8BA5BF", fontSize: 11 }}>Valeur: {String(factor.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HRAttritionV2() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [explainability, setExplainability] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, employeesData, explainabilityData, correlationMatrix] = await Promise.all([
          api.hrStats(),
          api.hrEmployees(10000),
          api.hrModelExplainability(),
          api.hrCorrelationMatrix(),
        ]);
        setStats(statsData);
        const fetched = employeesData.employees || [];
        setAllEmployees(fetched);
        setEmployees(fetched.slice(0, 150));
        setExplainability(explainabilityData);
        setCorrelationData(correlationMatrix);
      } catch (err) {
        setError(err.message || "Failed to load HR dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
    try {
      const [detail, timeline] = await Promise.all([
        api.hrPredict(employee.emp_id),
        api.hrTimeline(employee.emp_id),
      ]);
      setSelected(detail);
      setSelectedTimeline(timeline);
    } catch (err) {
      setError(`Employee detail failed: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return <div style={{ color: "#8BA5BF", textAlign: "center", padding: 60 }}>Chargement dashboard RH utile...</div>;
  }

  if (error) {
    return <div style={{ color: "#E63946", padding: 24 }}>❌ {error}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ color: "#FFFFFF", margin: 0, fontSize: 22, fontWeight: 700 }}>📊 HR Attrition Dashboard (Dataset v2)</h1>
        <p style={{ color: "#8BA5BF", margin: "6px 0 0", fontSize: 13 }}>
          Focus opérationnel: qui risque de partir, pourquoi, et quels leviers RH agir maintenant.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <SegmentCard title="Employés" value={stats.total_employees} subtitle={`${stats.active} actifs / ${stats.terminated} partis`} color="#378ADD" />
        <SegmentCard title="Attrition globale" value={`${(stats.attrition_rate * 100).toFixed(1)}%`} subtitle="Taux historique dataset" color="#FF9F1C" />
        <SegmentCard title="Attrition + OverTime" value={`${segments.overtimeAttritionYes.toFixed(1)}%`} subtitle={`vs ${segments.overtimeAttritionNo.toFixed(1)}% sans OverTime (population complète)`} color="#E63946" />
        <SegmentCard title="Actifs en risque critique" value={`${segments.activeCriticalRate.toFixed(1)}%`} subtitle={`${segments.activeCriticalCount} employés actifs à traiter`} color="#A855F7" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
        <EmployeeTable employees={employees} onSelect={handleSelect} selectedId={selected?.emp_id} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <ShapLikePanel explainability={explainability} correlationMap={correlationMap} />
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

      <div>
        {detailLoading ? (
          <div style={{ color: "#8BA5BF", padding: 12 }}>Chargement détail employé...</div>
        ) : (
          <EmployeeFocus detail={selected} timeline={selectedTimeline} />
        )}
      </div>
    </div>
  );
}
