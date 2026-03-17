# 🛡️HR Attrition Prediction with Explainable AI (Team 20)

> **Hackathon Project** — Explainability & Ethics in AI  
> FastAPI + React + scikit-learn | Docker

---

## Objectives

CyberGuard AI is a **production-ready HR intelligence platform** that predicts employee attrition risk using **explainable machine learning**. The project explores the intersection of:

- **Explainable AI (XAI)** — every prediction comes with human-readable justifications
- **Fairness & Bias Auditing** — automatic detection of discriminatory patterns
- **GDPR & EU AI Act Compliance** — full transparency, human oversight, right to explanation
- **Cybersecurity** — secure-by-design API with audit logging and input sanitization

The goal is to demonstrate that AI can be **powerful AND responsible** — assisting HR teams without replacing human judgment.

---

## Scope

| In Scope | Out of Scope |
|---|---|
| Employee attrition risk prediction | Automated firing/hiring decisions |
| Explainability of model decisions | Real-time employee tracking |
| Counterfactual interventions | Biometric or surveillance data |
| Fairness audit by department/gender | External data sources |
| GDPR/AI Act compliance audit endpoints | Multi-company deployment |
| What-if simulation for HR decisions | |  

The system is designed as a **decision-support tool**: it informs HR professionals, never replaces them.

---

## Personas

### 1. HR Manager — *Marie*
> "I need to know which employees are at risk of leaving and what I can do about it."

- Uses the **employee list** sorted by risk score
- Reads **counterfactual explanations**: "Increase salary 12% → risk drops from 73% to 48%"
- Runs **what-if simulations** before proposing a retention plan
- Accesses **RGPD audit** reports to stay compliant

### 2. Data Scientist — *Lucas*
> "I want to understand the model's behavior and check for hidden biases."

- Uses the **model explainability endpoint** to review feature importances
- Runs the **bias audit** to detect disparate impact across demographics
- Monitors **anomaly detection** for data quality issues
- Reviews correlation matrix to evaluate feature relevance

### 3. HR Director — *Sophie*
> "I need to ensure our AI tools are fair, legal, and aligned with company values."

- Consults the **EU AI Act compliance audit** per employee
- Reviews **department-level attrition trends**
- Validates the **fairness report** before any HR decision
- Ensures employees' **right to explanation** is respected

---

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- OR: Python 3.11+, Node.js 18+

### Option A — Docker (Recommended)

```bash
git clone https://github.com/adamferre-spec/Hackathon-Explainability-AI.git
cd Hackathon-Explainability-AI
docker compose up --build
```

- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:8000
- **Swagger Docs** → http://localhost:8000/docs

### Option B — Manual Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Instructions

### 1. Predict Employee Attrition

```bash
# Get risk score + explanation for employee #42
curl http://localhost:8000/api/hr/predict/42
```

Response includes: risk score, risk level (Low/Moderate/High/Critical), top risk factors, recommended action.

### Run a What-If Simulation

```bash
curl -X POST http://localhost:8000/api/advanced/simulate \
  -H "Content-Type: application/json" \
  -d '{"emp_id": 42, "interventions": [{"type": "salary", "amount": 10}]}'
```

### Audit for Bias

```bash
curl http://localhost:8000/api/advanced/bias-audit
```

### Check GDPR Compliance

```bash
curl http://localhost:8000/api/hr/audit-rgpd/42
```

### Full AI Act Compliance Audit

```bash
curl http://localhost:8000/api/hr/ia-act/42
```

---

## Project Structure

```
Hackathon-Explainability-AI/
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── HRDataset.csv            ← Training data (IBM HR Analytics)
│   ├── routers/
│   │   ├── hr.py                ← Core prediction + GDPR/AI Act endpoints
│   │   ├── advanced.py          ← Counterfactuals, bias audit, anomaly, simulation
│   │   ├── alerts.py            ← Cybersecurity alerts
│   │   ├── audit.py             ← Audit trail endpoints
│   │   └── predict.py           ← Generic prediction utility
│   ├── model/                   ← ML model modules
│   └── data/                    ← Processed data cache
├── frontend/
│   ├── src/
│   │   ├── pages/               ← HRAttrition.jsx, AdvancedDashboard.jsx
│   │   └── components/          ← CounterfactualPanel, BiasAudit, Anomaly...
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── docs/
│   ├── TECHNICAL_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   └── DATA_MODEL_CARDS.md
└── README.md
```

---

## Security & Compliance Summary

| Requirement | Status |
|---|---|
| GDPR — Data Minimization | ✅ Employee names anonymized (Emp_ID) |
| GDPR — Audit Logging | ✅ Immutable log per prediction |
| EU AI Act — Transparency | ✅ Model type, training data disclosed |
| EU AI Act — Human Oversight | ✅ No automated decisions |
| EU AI Act — Explainability | ✅ Feature importance + counterfactuals |
| Cybersecurity — Input Validation | ✅ Sanitization on all inputs |
| Cybersecurity — Security Headers | ✅ HSTS, X-Frame-Options, XSS protection |
| Fairness | ⚠️ Requires regular third-party audit |

---

## Team & Credits

Built with ❤️ during the **Hackathon Explainability AI**.

Stack: **FastAPI** · **React + Vite** · **scikit-learn** · **Docker**
