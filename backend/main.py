"""
CyberGuard AI — HR Prediction Engine
🎯 Predict employee attrition with explainable AI & cybersecurity
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from routers import hr, advanced, alerts, audit, predict

app = FastAPI(
    title="CyberGuard AI — HR Prediction",
    description="Prédiction d'attrition des employés avec IA explicable et cybersécurité intégrée",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost", "http://127.0.0.1", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Include all routers
app.include_router(hr.router, prefix="/api", tags=["HR Prediction"])
app.include_router(advanced.router, prefix="/api", tags=["Advanced Analytics"])
app.include_router(alerts.router, prefix="/api", tags=["Cybersecurity Alerts"])
app.include_router(audit.router, prefix="/api", tags=["Audit & Compliance"])
app.include_router(predict.router, prefix="/api", tags=["Predictions"])


@app.get("/health", tags=["System"])
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "service": "HR Prediction with Explainable AI",
        "security": "Cybersecurity & RGPD Compliance Active"
    }


@app.get("/api/stats", tags=["System"])
def get_stats():
    """System statistics."""
    return {
        "alerts_count": 0,
        "critical_alerts": 0,
        "system_health": "operational",
        "services": {
            "hr_prediction": "active",
            "cybersecurity_monitoring": "active",
            "audit_logging": "active"
        }
    }
