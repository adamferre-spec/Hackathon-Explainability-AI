import HRAttrition from "./pages/HRAttritionV2";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#0D1B2A", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Nav />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px" }}>
        <HRAttrition />
      </main>
    </div>
  );
}

function Nav() {
  return (
    <nav style={{
      background: "#1B2E45", borderBottom: "3px solid #00C9A7",
      padding: "0 24px", display: "flex", alignItems: "center", gap: 32, height: 56,
    }}>
      <span style={{ color: "#00C9A7", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
        🛡️ CyberGuard AI
      </span>
      <span style={{ marginLeft: "auto", color: "#8BA5BF", fontSize: 12 }}>
        HR Attrition Dashboard
      </span>
    </nav>
  );
}
