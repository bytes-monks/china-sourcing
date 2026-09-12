// SiteCta.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html".

import { Link } from 'react-router-dom'

export default function SiteCta() {
  return (
    <section style={{ background: "#C0392F", color: "#F4F0E8" }}>
      <div style={{ maxWidth: "1260px", margin: "0 auto", padding: "72px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "40px", alignItems: "center" }}>
        <div>
          <h2 style={{ font: "400 48px/1.05 'Instrument Serif',serif", letterSpacing: "-.015em", margin: "0 0 14px" }}>Send me your product list.</h2>
          <p style={{ font: "400 15.5px/1.7 Archivo", color: "rgba(244,240,232,.88)", margin: "0", maxWidth: "470px" }}>You'll hear back within 12 working hours with an honest read on what it costs, what it takes, and whether I'm the right person for it.</p>
        </div>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link className="hv-ink" to="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 26px", background: "#F4F0E8", color: "#1A1614", font: "600 14.5px Archivo", textDecoration: "none", borderRadius: "3px" }}>Get a free quote<span style={{ fontSize: "16px", lineHeight: "1" }} aria-hidden="true">→</span></Link>
          <Link className="hv-cream-ghost" to="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 24px", border: "1px solid rgba(244,240,232,.5)", color: "#F4F0E8", font: "600 14.5px Archivo", textDecoration: "none", borderRadius: "3px" }}>See pricing</Link>
        </div>
      </div>
    </section>
  )
}
