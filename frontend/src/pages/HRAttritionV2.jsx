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

function estimatedDeparture(status, riskScore) {
  if (status === "Parti") return "Déjà parti";
  if (riskScore >= 0.8) return "0-3 mois";
  if (riskScore >= 0.65) return "3-6 mois";
  if (riskScore >= 0.5) return "6-12 mois";
  if (riskScore >= 0.35) return "12-18 mois";
  return ">18 mois";
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
              {["ID", "Département", "Poste", "Statut", "Risque", "Horizon", "OverTime", "Sans promo"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#8BA5BF", fontSize: 12, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.emp_id} onClick={() => onSelect(employee)} style={{ cursor: "pointer", background: selectedId === employee.emp_id ? "#243B55" : "transparent", borderBottom: "1px solid #1B2E45" }}>
                <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{employee.name}</td>
                <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{employee.department}</td>
                <td style={{ padding: "10px 12px", color: "#8BA5BF", fontSize: 12 }}>{employee.position}</td>
                <td style={{ padding: "10px 12px", color: employee.status === "Parti" ? COLORS.critical : COLORS.low, fontSize: 12, fontWeight: 600 }}>{employee.status}</td>
                <td style={{ padding: "10px 12px", color: riskColor(employee.risk_score), fontSize: 12, fontWeight: 700 }}>{riskLabel(employee.risk_score)} ({Math.round(employee.risk_score * 100)}%)</td>
                <td style={{ padding: "10px 12px", color: employee.status === "Parti" ? COLORS.critical : "#C5D5E8", fontSize: 12 }}>{estimatedDeparture(employee.status, employee.risk_score)}</td>
                <td style={{ padding: "10px 12px", color: employee.overtime === "Yes" ? COLORS.high : COLORS.low, fontSize: 12 }}>{employee.overtime}</td>
                <td style={{ padding: "10px 12px", color: employee.years_since_last_promotion > 3 ? COLORS.critical : "#C5D5E8", fontSize: 12 }}>{employee.years_since_last_promotion} ans</td>
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
    return <div style={{ background: "#1B2E45", borderRadius: 10, padding: 28, textAlign: "center", color: "#8BA5BF", fontSize: 14 }}>Sélectionne un employé pour voir les leviers concrets.</div>;
  }

  return (
    <div style={{ background: "#1B2E45", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #243B55", color: "#FFFFFF", fontWeight: 600 }}>Plan d’action — {detail.name}</div>
      <div style={{ padding: 16 }}>
        <div style={{ padding: 10, borderRadius: 8, background: `${riskColor(detail.risk_score)}22`, border: `1px solid ${riskColor(detail.risk_score)}55`, color: riskColor(detail.risk_score), fontWeight: 700, marginBottom: 12 }}>
          Risque de départ: {detail.risk_level} ({Math.round(detail.risk_score * 100)}%)
        </div>
        <div style={{ background: "#243B55", borderRadius: 8, padding: 10, marginBottom: 12, color: "#C5D5E8", fontSize: 12 }}>
          <div><strong>Statut:</strong> {detail.status === "Parti" ? "Déjà parti" : "Actif"}</div>
          <div style={{ marginTop: 4 }}>
            <strong>Horizon de départ:</strong> {detail.status === "Parti" ? "Déjà parti" : timeline?.timeline?.months_until_departure != null ? `~${Math.round(timeline.timeline.months_until_departure)} mois` : estimatedDeparture("Actif", detail.risk_score)}
          </div>
          {detail.status !== "Parti" && timeline?.interpretation ? <div style={{ marginTop: 6, color: "#8BA5BF" }}>{timeline.interpretation}</div> : null}
        </div>
        <div style={{ color: "#C5D5E8", fontSize: 12, marginBottom: 10 }}>{detail.recommendation}</div>
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

function ChatAssistant({ selectedEmpId, employees }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Bonjour 👋 Je peux aider sur rétention, top performers, et priorités RH." },
  ]);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const data = await api.hrChatSuggestions();
        if (Array.isArray(data?.suggestions)) {
          setSuggestions(data.suggestions.slice(0, 5));
          return;
        }
      } catch {
      }
      setSuggestions([
        "How do I retain top talent?",
        "Show me top performers",
        "Who will become critical next?",
        "What are the top reasons for leaving?",
      ]);
    }
    loadSuggestions();
  }, []);

  const topPerformers = useMemo(() => {
    return employees
      .filter((employee) => employee.status === "Actif")
      .map((employee) => ({ ...employee, perf: parsePerformance(employee.performance) }))
      .filter((employee) => employee.perf >= 4)
      .sort((a, b) => b.perf - a.perf || a.risk_score - b.risk_score)
      .slice(0, 6);
  }, [employees]);

  function localTopPerformerAnswer() {
    if (!topPerformers.length) {
      return {
        text: "Je ne trouve pas de top performers actifs avec score de performance élevé dans les données actuelles.",
        performers: [],
      };
    }

    const byDepartment = topPerformers.reduce((acc, row) => {
      acc[row.department] = (acc[row.department] || 0) + 1;
      return acc;
    }, {});

    const best = topPerformers[0];
    const deptSummary = Object.entries(byDepartment)
      .map(([dep, cnt]) => `${dep}: ${cnt}`)
      .join(" | ");

    return {
      text:
        `Your organization has high-performing talent across multiple departments. ` +
        `Top performer now: ${best.name} (${best.position}, ${best.department}) with risk ${Math.round(best.risk_score * 100)}%. ` +
        `Department spread: ${deptSummary}. ` +
        `Retention priority: protect these profiles with promotion plans and workload control.`,
      performers: topPerformers,
    };
  }

  async function send(userText) {
    if (!userText?.trim()) return;
    const text = userText.trim();
    const lower = text.toLowerCase();
    const asksTop =
      lower.includes("top performer") ||
      lower.includes("top performers") ||
      lower.includes("retain top talent") ||
      lower.includes("high-performing talent") ||
      lower.includes("show me top");

    setMessages((prev) => [...prev, { role: "user", text }]);
    setMessage("");
    setLoading(true);

    let backendAnswer = "";
    try {
      const data = await api.hrChat(text, selectedEmpId || null);
      backendAnswer = data?.response || "";
    } catch {
      backendAnswer = "";
    }

    if (asksTop) {
      const local = localTopPerformerAnswer();
      const useBackend =
        backendAnswer &&
        !backendAnswer.toLowerCase().includes("high-performing talent across multiple departments");
      const finalText = useBackend ? `${backendAnswer}\n\n${local.text}` : local.text;
      setMessages((prev) => [...prev, { role: "assistant", text: finalText, performers: local.performers }]);
      setLoading(false);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: backendAnswer || "Je n'ai pas pu répondre côté backend. Essaie une question sur top performers, risque critique, ou raisons de départ." },
    ]);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          background: "linear-gradient(135deg, #378ADD, #00C9A7)",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "12px 16px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          zIndex: 50,
          boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
        }}
      >
        💬 HR Assistant
      </button>

      {open ? (
        <div style={{ position: "fixed", right: 20, bottom: 74, width: 380, height: 530, background: "#122235", border: "1px solid #2F4C6C", borderRadius: 12, display: "flex", flexDirection: "column", zIndex: 50, boxShadow: "0 12px 28px rgba(0,0,0,0.45)" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #243B55", color: "#fff", fontWeight: 700, fontSize: 13 }}>
            Assistant RH IA
            {selectedEmpId ? <span style={{ color: "#8BA5BF", fontWeight: 400 }}> • contexte Emp_{selectedEmpId}</span> : null}
          </div>

          <div style={{ padding: 10, display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "1px solid #243B55" }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} style={{ background: "#1B2E45", border: "1px solid #2F4C6C", borderRadius: 999, color: "#C5D5E8", padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%", background: m.role === "user" ? "#378ADD" : "#1B2E45", color: m.role === "user" ? "#fff" : "#C5D5E8", borderRadius: 10, padding: "8px 10px", fontSize: 12, lineHeight: 1.4 }}>
                <div>{m.text}</div>
                {Array.isArray(m.performers) && m.performers.length > 0 ? (
                  <div style={{ marginTop: 8, borderTop: "1px solid #2F4C6C", paddingTop: 8 }}>
                    {m.performers.map((p) => (
                      <div key={p.emp_id} style={{ fontSize: 11, marginBottom: 4, color: "#A7C7E7" }}>
                        {p.name} • {p.department} • Perf {parsePerformance(p.performance)} • Risque {Math.round(p.risk_score * 100)}%
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? <div style={{ color: "#8BA5BF", fontSize: 11 }}>Assistant en train d'écrire…</div> : null}
          </div>

          <div style={{ padding: 10, borderTop: "1px solid #243B55", display: "flex", gap: 8 }}>
            <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(message); }} placeholder="Pose une question RH…" style={{ flex: 1, background: "#0D1B2A", border: "1px solid #2F4C6C", borderRadius: 8, color: "#fff", padding: "8px 10px", fontSize: 12 }} />
            <button onClick={() => send(message)} disabled={loading} style={{ background: "#00C9A7", color: "#082129", border: "none", borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>
              Envoyer
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ModelPerformanceTab({ employees }) {
  const metrics = useMemo(() => {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;
    employees.forEach((employee) => {
      const actualLeave = employee.status === "Parti";
      const predLeave = employee.risk_score >= 0.5;
      if (actualLeave && predLeave) tp += 1;
      else if (!actualLeave && predLeave) fp += 1;
      else if (!actualLeave && !predLeave) tn += 1;
      else fn += 1;
    });
    const precision = tp / Math.max(tp + fp, 1);
    const recall = tp / Math.max(tp + fn, 1);
    const f1 = (2 * precision * recall) / Math.max(precision + recall, 1e-9);
    const accuracy = (tp + tn) / Math.max(tp + tn + fp + fn, 1);
    return { tp, fp, tn, fn, precision, recall, f1, accuracy };
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

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <SegmentCard title="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`} subtitle="Seuil risque 50%" color="#378ADD" />
        <SegmentCard title="Precision" value={`${(metrics.precision * 100).toFixed(1)}%`} subtitle="Prédits à risque qui partent" color="#FF9F1C" />
        <SegmentCard title="Recall" value={`${(metrics.recall * 100).toFixed(1)}%`} subtitle="Départs correctement détectés" color="#E63946" />
        <SegmentCard title="F1-score" value={`${(metrics.f1 * 100).toFixed(1)}%`} subtitle="Équilibre precision/recall" color="#A855F7" />
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
      count: active.filter((employee) => estimatedDeparture("Actif", employee.risk_score) === h).length,
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
                  <td style={{ padding: "10px 12px", color: "#C5D5E8", fontSize: 12 }}>{estimatedDeparture(e.status, e.risk_score)}</td>
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
  const [selectedTimeline, setSelectedTimeline] = useState(null);
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
    try {
      const [detail, timeline] = await Promise.all([api.hrPredict(employee.emp_id), api.hrTimeline(employee.emp_id)]);
      setSelected(detail);
      setSelectedTimeline(timeline);
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
        <h1 style={{ color: "#FFFFFF", margin: 0, fontSize: 22, fontWeight: 700 }}>📊 HR Attrition Dashboard (Dataset v2)</h1>
        <p style={{ color: "#8BA5BF", margin: "6px 0 0", fontSize: 13 }}>Focus opérationnel: talents, performance modèle, raisons de départ et prévision des profils critiques.</p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "model", label: "📈 Model performance" },
          { key: "details", label: "🧭 Reasons & Future" },
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
            <EmployeeTable employees={visibleEmployees} onSelect={handleSelect} selectedId={selected?.emp_id} />
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

          <div>{detailLoading ? <div style={{ color: "#8BA5BF", padding: 12 }}>Chargement détail employé...</div> : <EmployeeFocus detail={selected} timeline={selectedTimeline} />}</div>
        </>
      ) : null}

      {tab === "model" ? <ModelPerformanceTab employees={allEmployees} /> : null}
      {tab === "details" ? <DetailsForecastTab employees={allEmployees} terminationReasons={terminationReasons} /> : null}

      <div style={{ color: "#8BA5BF", fontSize: 11 }}>Horizon affiché = estimation de priorisation (0-3, 3-6, 6-12, 12-18, &gt;18 mois) selon score de risque et statut.</div>
      <ChatAssistant selectedEmpId={selected?.emp_id} employees={allEmployees} />
    </div>
  );
}
