// 404. Not transpiled from the canvas — the canvas has no such artboard — so
// it is built from the canvas's own vocabulary: the mono eyebrow, the
// Instrument Serif headline, the Archivo body, the red primary button.
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "68px 32px 96px" }}>
      <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "18px" }}>404</div>
      <h1 style={{ font: "400 66px/1 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0 0 22px", maxWidth: "700px" }}>That page isn't here.</h1>
      <p style={{ font: "400 17px/1.7 Archivo", color: "#3A332E", maxWidth: "560px", margin: "0 0 34px" }}>The link may be old, or I may have moved something. The pages below cover most of what people come here for — or just send me the product list and skip the reading.</p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link className="hv-ink" to="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 26px", background: "#C0392F", color: "#F4F0E8", font: "600 14.5px Archivo", textDecoration: "none", borderRadius: "3px" }}>Get a free quote<span style={{ fontSize: "16px", lineHeight: "1" }} aria-hidden="true">→</span></Link>
        <Link className="hv-ink" to="/" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 24px", border: "1px solid rgba(26,22,20,.25)", color: "#1A1614", font: "600 14.5px Archivo", textDecoration: "none", borderRadius: "3px", background: "transparent" }}>Back to the start</Link>
      </div>
    </section>
  )
}
