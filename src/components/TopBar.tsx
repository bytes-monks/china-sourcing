// TopBar.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html".

import { Link } from 'react-router-dom'

export default function TopBar() {
  return (
    <div style={{ background: "#1A1614", color: "rgba(244,240,232,.7)", fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", letterSpacing: ".02em" }}>
      <div style={{ maxWidth: "1260px", margin: "0 auto", padding: "10px 32px", display: "flex", flexWrap: "wrap", gap: "18px", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "9px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C0392F", display: "inline-block" }} />BASED IN GUANGZHOU · I BUY IN GUANGZHOU, FOSHAN, YIWU & SHENZHEN · I ANSWER EVERY MESSAGE MYSELF</span>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link className="hv-cream" to="/audit" style={{ color: "rgba(244,240,232,.7)", textDecoration: "none", borderBottom: "1px solid rgba(244,240,232,.25)" }}>SAMPLE AUDIT REPORT</Link>
          <Link className="hv-cream" to="/mobile" style={{ color: "rgba(244,240,232,.7)", textDecoration: "none", borderBottom: "1px solid rgba(244,240,232,.25)" }}>MOBILE</Link>
          <span style={{ color: "rgba(244,240,232,.45)" }}>EN · 中文 · العربية</span>
        </div>
      </div>
    </div>
  )
}
