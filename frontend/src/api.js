const getApiBase = () => {
  // Use VITE_API_URL if explicitly set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default to relative API path and let Vite proxy handle backend routing.
  return "/api";
};

const BASE = getApiBase();

async function req(path, options = {}) {
  const url = `${BASE}${path}`;
  const method = options.method || "GET";

  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkError) {
    const err = new Error(
      `[NETWORK] ${method} ${path} (${url}) failed: ${networkError?.message || "Unknown network error"}`
    );
    err.code = "NETWORK_ERROR";
    err.endpoint = path;
    err.url = url;
    err.method = method;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  let parsedBody = null;
  let rawBody = "";

  try {
    if (contentType.includes("application/json")) {
      parsedBody = await res.json();
    } else {
      rawBody = await res.text();
    }
  } catch (parseError) {
    const err = new Error(
      `[PARSE] ${method} ${path} (${url}) response parse failed: ${parseError?.message || "Invalid response format"}`
    );
    err.code = "PARSE_ERROR";
    err.endpoint = path;
    err.url = url;
    err.method = method;
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const backendDetail =
      parsedBody?.detail ||
      parsedBody?.message ||
      parsedBody?.error ||
      rawBody ||
      res.statusText ||
      "No backend detail";

    const err = new Error(
      `[HTTP ${res.status}] ${method} ${path} (${url}) failed: ${backendDetail}`
    );
    err.code = "HTTP_ERROR";
    err.endpoint = path;
    err.url = url;
    err.method = method;
    err.status = res.status;
    err.backendDetail = backendDetail;
    throw err;
  }

  return parsedBody;
}

export const api = {
  req, // Export the main request function
  getAlerts:    (limit = 50) => req(`/alerts?limit=${limit}`),
  getAlert:     (id)         => req(`/alerts/${id}`),
  deleteAlert:  (id)         => req(`/alerts/${id}`, { method: "DELETE" }),
  getStats:     ()           => req("/stats"),
  predict:      (flow)       => req("/predict", { method: "POST", body: JSON.stringify(flow) }),
  injectDemo:   (type)       => req(`/demo/inject?attack_type=${type}`, { method: "POST" }),
  auditReport:  ()           => req("/audit/report"),
  health:       ()           => fetch(`${BASE.replace("/api", "")}/health`).then(r => r.json()),

  // RH — Attrition & Compliance
  hrStats:               ()           => req("/hr/stats"),
  hrEmployees:           (limit = 50, dept = null) => req(`/hr/employees?limit=${limit}${dept ? `&department=${dept}` : ""}`),
  hrPredict:             (empId)      => req(`/hr/predict/${empId}`),
  hrTimeline:            (empId)      => req(`/advanced/timeline/${empId}`),
  hrModelExplainability: ()           => req("/hr/model-explainability"),
  hrAuditRGPD:           (empId)      => req(`/hr/audit-rgpd/${empId}`),
  hrIAAct:               (empId)      => req(`/hr/ia-act/${empId}`),
  hrSimulate:            (data)       => req("/hr/simulate", { method: "POST", body: JSON.stringify(data) }),
  hrCorrelationMatrix:   ()           => req("/hr/correlation-matrix"),
  hrTerminationReasons:  ()           => req("/hr/termination-reasons"),
  hrChat:                (message, empId = null) => req("/advanced/chat", {
    method: "POST",
    body: JSON.stringify({ message, emp_id: empId }),
  }),
  hrChatSuggestions:     ()           => req("/advanced/chat/suggestions"),
};
