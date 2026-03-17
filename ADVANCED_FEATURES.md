# 🛡️ CyberGuard AI — HR Prediction Engine v2.1.0

## Advanced Analytics & Fairness Audit Edition

A production-ready AI system for **employee attrition prediction** with **explainability**, **fairness auditing**, and **data-driven interventions**.

### 🚀 What's NEW in v2.1.0

This major update transforms CyberGuard from a **basic prediction tool** into a **comprehensive HR intelligence platform**. Beyond statistics, it provides:

#### 1. **💡 Counterfactual Explanations** (`/advanced/counterfactual/{emp_id}`)
- Shows CONCRETE actions that would change an employee's attrition risk
- Example: "Increase salary 12% OR improve satisfaction by 1.2 points"
- Includes **feasibility scores** to prioritize interventions
- Helps HR teams understand "what to do" not just "what's happening"

#### 2. **⚖️ Fairness Audit & Bias Detection** (`/advanced/bias-audit`)
- Detects demographic disparities in model predictions
- Identifies discrimination against protected groups (gender, department)
- Uses **4/5 rule** from employment law to flag disparate impact
- Provides recommendations for model calibration
- **Actionable recommendations** to reduce bias

#### 3. **🚨 Anomaly Detection & Early Warnings** (`/advanced/anomaly/{emp_id}`)
- Identifies unusual employee profiles (outliers)
- **Early warning signs**: absences spike, satisfaction drop, etc.
- Z-score analysis for feature-level extremeness
- Categorizes anomaly type: compensation outlier, attendance issue, etc.

#### 4. **🔮 What-If Simulation** (`/advanced/simulate`)
- Test impact of HR decisions BEFORE implementing
- Simulate chained interventions (salary + engagement + flexible work)
- Shows risk reduction for each action
- Helps build data-backed business cases for HR initiatives

#### 5. **📈 Temporal Trends & Insights** (`/advanced/trends`)
- Attrition rates by department with trend visualization
- Department-level risk identification
- Correlation with satisfaction/engagement metrics
- Key insights: "Low satisfaction group has 65% attrition vs 12% overall"

### 📊 Architecture

```
backend/
├── model/
│   ├── counterfactual.py    ← Explains "what changes flip prediction"
│   ├── bias_mitigation.py   ← Detects & suggests fixes for discrimination
│   ├── anomaly_detection.py ← Finds unusual profiles & early warnings
│   └── simulation.py        ← What-if testing for interventions
├── routers/
│   ├── hr.py               ← Traditional HR prediction endpoints
│   └── advanced.py         ← NEW advanced analytics endpoints
└── main.py                 ← Now includes advanced router

frontend/
├── pages/
│   ├── HRAttrition.jsx          ← Original dashboard
│   └── AdvancedDashboard.jsx    ← NEW advanced analytics interface
└── components/
    ├── CounterfactualPanel.jsx   ← Actionable changes UI
    ├── BiasAuditPanel.jsx        ← Fairness metrics & recommendations
    ├── AnomalyPanel.jsx          ← Profile outliers & warnings
    ├── SimulationPanel.jsx       ← What-if testing interface
    └── TrendsPanel.jsx           ← Department trends & insights
```

### 🎯 Key Endpoints

#### Advanced Analytics API
All endpoints return JSON with detailed explanations and recommendations.

**Counterfactual Explanations**
```bash
GET /api/advanced/counterfactual/{emp_id}
```
Response:
```json
{
  "emp_id": 42,
  "current_risk": 0.73,
  "actionable_changes": [
    {
      "feature": "Salary",
      "original_value": 45000,
      "suggested_value": 50000,
      "change_percent": 11.1,
      "feasibility": 0.92,
      "explanation": "Increase salary from 45000 to 50000 (+11.1%)",
      "new_prediction_proba": 0.52
    }
  ],
  "interpretation": "Employee has high attrition risk (73%). The most feasible action is: Increase salary..."
}
```

**Fairness Audit**
```bash
GET /api/advanced/bias-audit
```
Detects discrimination in hiring/termination patterns by demographic group.

**Anomaly Detection**
```bash
GET /api/advanced/anomaly/{emp_id}
```
Identifies unusual profiles and flags early warning signs.

**What-If Simulation**
```bash
POST /api/advanced/simulate
Body: {
  "emp_id": 42,
  "interventions": [
    {"type": "salary", "amount": 10},
    {"type": "satisfaction", "amount": 1.5}
  ]
}
```
Shows cumulative impact of interventions.

**Trends Analysis**
```bash
GET /api/advanced/trends
```
Department-level attrition rates, key insights, recommendations.

### 🏃 Getting Started

#### 1. Installation
```bash
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

#### 2. Start Backend
```bash
cd backend
python main.py
# Runs on http://localhost:8000
```

#### 3. Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

#### 4. Access Dashboard
- **Traditional Dashboard**: http://localhost:5173 (📊 Dashboard tab)
- **Advanced Analytics**: http://localhost:5173 (🚀 Advanced Analytics tab)

### 💼 Use Cases

#### HR Manager: Identify High-Risk Employees
1. Go to **Advanced Analytics → Employee Analysis**
2. Enter employee ID
3. Review counterfactual panel: "What changes would prevent them from leaving?"
4. Check anomalies: "Is their profile unusual?"
5. Run simulations: "What if we increase their salary 10%?"

#### HR Director: Audit for Fairness
1. Go to **Advanced Analytics → Fairness**
2. Review bias audit: "Do we discriminate against any group?"
3. Check recommendations: "Which departments need intervention?"
4. Assess impact: "Is our model helping reduce turnover equally?"

#### Data Scientist: Improve Model
1. Review trends: "Which departments have highest attrition?"
2. Identify anomalies: "Are there data quality issues?"
3. Check fairness metrics: "Are there biased predictions?"
4. Propose: "Retrain model if fairness issues detected"

### 🔐 Security & Compliance

✅ **GDPR Compliant**
- Employee anonymization (Emp_ID instead of names)
- Audit logging of all predictions
- Data retention policies

✅ **Cybersecurity**
- Security headers (HSTS, X-Frame-Options, etc.)
- Input validation and sanitization
- CORS protection

✅ **Fairness & Explainability**
- Counterfactual explanations (XAI)
- Bias audit (disparate impact testing)
- Transparent feature importance

### 📚 Technical Details

#### Counterfactual Generation
- Binary search for threshold values
- Feasibility scoring based on HR domain knowledge
- Immutable features (can't change age/gender)
- Realistic value ranges for each intervention

#### Bias Detection
- 4/5 rule from EEO employment law
- False positive rate analysis by demographic group
- Recommendation prioritization by severity

#### Anomaly Detection
- Isolation Forest for multivariate detection
- Z-score analysis for feature-level extremeness
- Trend detection for early warnings

#### What-If Simulation
- Chained interventions (apply one change, then next)
- Impact quantification
- Feasibility assessment

### 🧪 Testing

Run the advanced endpoints to test:

```bash
# Get counterfactuals for employee 42
curl http://localhost:8000/api/advanced/counterfactual/42

# Run fairness audit
curl http://localhost:8000/api/advanced/bias-audit

# Check anomalies
curl http://localhost:8000/api/advanced/anomaly/42

# Run simulation
curl -X POST http://localhost:8000/api/advanced/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "emp_id": 42,
    "interventions": [
      {"type": "salary", "amount": 10},
      {"type": "satisfaction", "amount": 1}
    ]
  }'

# Get trends
curl http://localhost:8000/api/advanced/trends
```

### 📖 Documentation

- **Backend API Docs**: http://localhost:8000/docs
- **Frontend Components**: See `frontend/src/components/` for usage examples

### 🤝 Contributing

To add new advanced features:
1. Add analysis module to `backend/model/`
2. Create router endpoint in `backend/routers/advanced.py`
3. Build React component in `frontend/src/components/`
4. Add tab to `frontend/src/pages/AdvancedDashboard.jsx`

### 📝 Version History

- **v2.1.0** (2026-03-16): Advanced Analytics Release
  - Counterfactual explanations
  - Fairness audit & bias detection
  - Anomaly detection & early warnings
  - What-if simulation
  - Temporal trends analysis
  - Advanced analytics UI

- **v2.0.0**: Initial release with basic prediction

### 🎓 Credits

Built with:
- FastAPI (backend)
- React + Vite (frontend)
- scikit-learn (ML models)
- Isolation Forest (anomaly detection)

### 📧 Support

For issues or questions:
- Check `/api/advanced/` endpoints
- Review Swagger docs at `/docs`
- Check component prop types in React files

---

**CyberGuard AI**: Making AI decisions explainable, fair, and actionable. 🚀
