// Pricing page.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html".

import { Link } from 'react-router-dom'

export default function Pricing() {
  return (
    <>

    <section data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "68px 32px 44px", borderBottom: "1px solid rgba(26,22,20,.12)" }}>
      <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "18px" }}>Pricing</div>
      <h1 style={{ font: "400 66px/1 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0 0 22px", maxWidth: "760px" }}>One fee, written down before I start.</h1>
      <p style={{ font: "400 17px/1.7 Archivo", color: "#3A332E", maxWidth: "620px", margin: "0" }}>I take no commission from factories and no kickback on freight. My margin comes from you, which is the only way my advice can be worth anything.</p>
    </section>

    <section data-m="wrap fluid" style={{ maxWidth: "1260px", margin: "0 auto", padding: "52px 32px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px", alignItems: "stretch" }}>
      <div data-m="pad" style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.14)", padding: "34px", display: "flex", flexDirection: "column" }}>
        <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "18px" }}>One product, one order</div>
        <div data-m="display" style={{ font: "400 52px/1 'Instrument Serif',serif", marginBottom: "8px" }}>5–8%</div>
        <div style={{ font: "500 11.5px 'JetBrains Mono',monospace", color: "#6B6259", marginBottom: "24px", letterSpacing: ".04em" }}>OF ORDER VALUE · MIN. US$600</div>
        <p style={{ font: "400 14px/1.7 Archivo", color: "#3A332E", margin: "0 0 22px" }}>Best if you're testing whether a product works before committing to a programme.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "11px", font: "400 13.5px/1.5 Archivo", color: "#1A1614", marginBottom: "28px" }}>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>Sourcing & 3–5 factory shortlist</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>Negotiation & bilingual contract</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>Sample consolidation</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>One pre-shipment inspection</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <span style={{ color: "#6B6259", opacity: ".55" }}>—</span>
            <span style={{ color: "#6B6259" }}>Factory audit billed separately</span>
          </div>
        </div>
        <Link className="hv-ink" to="/contact" style={{ marginTop: "auto", textAlign: "center", padding: "14px 20px", border: "1px solid rgba(26,22,20,.25)", color: "#1A1614", font: "600 13.5px Archivo", textDecoration: "none", borderRadius: "3px" }}>Get a quote</Link>
      </div>
      <div data-m="pad" style={{ background: "#1A1614", color: "#F4F0E8", padding: "34px", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ position: "absolute", top: "-11px", left: "34px", background: "#C0392F", color: "#F4F0E8", font: "500 9px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", padding: "6px 11px" }}>Most clients</div>
        <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(244,240,232,.55)", marginBottom: "18px" }}>Ongoing programme</div>
        <div data-m="display" style={{ font: "400 52px/1 'Instrument Serif',serif", marginBottom: "8px" }}>$1,900<span style={{ fontSize: "22px", color: "rgba(244,240,232,.55)" }}>/mo</span></div>
        <div style={{ font: "500 11.5px 'JetBrains Mono',monospace", color: "rgba(244,240,232,.55)", marginBottom: "24px", letterSpacing: ".04em" }}>+ 3% OF ORDER VALUE</div>
        <p style={{ font: "400 14px/1.7 Archivo", color: "rgba(244,240,232,.82)", margin: "0 0 22px" }}>Me as your sourcing department, up to five active products. The percentage drops as volume grows.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "11px", font: "400 13.5px/1.5 Archivo", marginBottom: "28px" }}>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#E2857C" }}>✓</span>Everything in single project</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#E2857C" }}>✓</span>Weekly written reporting</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#E2857C" }}>✓</span>Two inspections per order</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#E2857C" }}>✓</span>Two factory audits a year included</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#E2857C" }}>✓</span>Freight booking & consolidation</div>
        </div>
        <Link className="hv-cream-fill" to="/contact" style={{ marginTop: "auto", textAlign: "center", padding: "14px 20px", background: "#C0392F", color: "#F4F0E8", font: "600 13.5px Archivo", textDecoration: "none", borderRadius: "3px" }}>Book a call with me</Link>
      </div>
      <div data-m="pad" style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.14)", padding: "34px", display: "flex", flexDirection: "column" }}>
        <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "18px" }}>Embedded team</div>
        <div data-m="display" style={{ font: "400 52px/1 'Instrument Serif',serif", marginBottom: "8px" }}>Custom</div>
        <div style={{ font: "500 11.5px 'JetBrains Mono',monospace", color: "#6B6259", marginBottom: "24px", letterSpacing: ".04em" }}>FROM US$6,500/MO</div>
        <p style={{ font: "400 14px/1.7 Archivo", color: "#3A332E", margin: "0 0 22px" }}>For brands running multiple categories: your own QC staff, your own desk in my office, your processes.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "11px", font: "400 13.5px/1.5 Archivo", color: "#1A1614", marginBottom: "28px" }}>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>Everything in ongoing programme</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>Dedicated QC inspectors</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>Unlimited products & audits</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>Warehouse space in Guangzhou</div>
          <div style={{ display: "flex", gap: "10px" }}><span style={{ color: "#C0392F" }}>✓</span>Quarterly cost-reduction review</div>
        </div>
        <Link className="hv-ink" to="/contact" style={{ marginTop: "auto", textAlign: "center", padding: "14px 20px", border: "1px solid rgba(26,22,20,.25)", color: "#1A1614", font: "600 13.5px Archivo", textDecoration: "none", borderRadius: "3px" }}>Talk to me</Link>
      </div>
    </section>

    <section data-m="wrap fluid" style={{ maxWidth: "1260px", margin: "0 auto", padding: "36px 32px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "20px" }}>
      <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)" }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(26,22,20,.12)", font: "400 24px 'Instrument Serif',serif" }}>Add-ons, billed per use</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "16px 28px", borderBottom: "1px solid rgba(26,22,20,.07)", font: "400 14px Archivo" }}>
          <span>Factory audit, on site</span>
          <span style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F" }}>US$390</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "16px 28px", borderBottom: "1px solid rgba(26,22,20,.07)", font: "400 14px Archivo" }}>
          <span>Inspection, per man-day</span>
          <span style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F" }}>US$210</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "16px 28px", borderBottom: "1px solid rgba(26,22,20,.07)", font: "400 14px Archivo" }}>
          <span>Container loading supervision</span>
          <span style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F" }}>US$180</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "16px 28px", borderBottom: "1px solid rgba(26,22,20,.07)", font: "400 14px Archivo" }}>
          <span>Trade-show accompaniment, per day</span>
          <span style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F" }}>US$300</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "16px 28px", font: "400 14px Archivo" }}>
          <span>Lab testing coordination</span>
          <span style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F" }}>COST + 10%</span>
        </div>
      </div>
      <div data-m="pad" style={{ background: "#E9E0CF", padding: "36px" }}>
        <h2 style={{ font: "400 30px/1.15 'Instrument Serif',serif", margin: "0 0 20px" }}>What the fee is not</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", font: "400 14px/1.65 Archivo", color: "#1A1614" }}>
          <div><strong style={{ fontWeight: "600" }}>Not a hidden mark-up.</strong> You pay the factory directly, on their invoice, at the price I negotiated. You see it.</div>
          <div><strong style={{ fontWeight: "600" }}>Not commission from suppliers.</strong> I don't take it, and I'll tell you when a factory offers.</div>
          <div><strong style={{ fontWeight: "600" }}>Not billed before you agree.</strong> Sourcing is free until you approve a quotation you're happy with.</div>
          <div><strong style={{ fontWeight: "600" }}>Not freight margin.</strong> Carrier invoices are passed through at cost with the paperwork attached.</div>
        </div>
      </div>
    </section>

    </>
  )
}
