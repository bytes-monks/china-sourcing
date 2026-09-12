// Contact page.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html".

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Contact() {
  // No backend yet: the canvas swapped the form for a confirmation panel, and
  // that is the behaviour the page keeps until a real endpoint exists.
  const [sent, setSent] = useState(false)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  // The form is torn out of the DOM on submit, which drops focus to <body> and
  // tells a screen reader nothing. The panel that replaces it is a live region
  // and takes focus itself; tabIndex={-1} makes it focusable without putting it
  // in the tab order, so nothing beyond the canvas becomes tabbable.
  const confirmRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (sent) confirmRef.current?.focus()
  }, [sent])

  return (
    <>

    <section style={{ maxWidth: "1260px", margin: "0 auto", padding: "68px 32px 80px", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "52px", alignItems: "start" }}>
      <div>
        <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "18px" }}>Get a free quote</div>
        <h1 style={{ font: "400 58px/1 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0 0 22px" }}>Tell me what you want made.</h1>
        <p style={{ font: "400 16.5px/1.75 Archivo", color: "#3A332E", margin: "0 0 32px", maxWidth: "520px" }}>I read every enquiry myself and reply within 12 working hours — with a real assessment, not a template. No fee until you approve a quotation.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(26,22,20,.12)", border: "1px solid rgba(26,22,20,.12)", marginBottom: "32px" }}>
          <div style={{ background: "#FBF9F5", padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <div style={{ font: "600 12.5px Archivo", color: "#1A1614", marginBottom: "4px" }}>WhatsApp</div>
              <div style={{ font: "400 13px 'JetBrains Mono',monospace", color: "#6B6259" }}>+86 138 0000 0000</div>
            </div>
            <span style={{ font: "500 10px 'JetBrains Mono',monospace", color: "#F4F0E8", background: "#C0392F", padding: "5px 10px", letterSpacing: ".1em" }}>FASTEST</span>
          </div>
          <div style={{ background: "#FBF9F5", padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <div style={{ font: "600 12.5px Archivo", color: "#1A1614", marginBottom: "4px" }}>WeChat</div>
              <div style={{ font: "400 13px 'JetBrains Mono',monospace", color: "#6B6259" }}>bachar-china</div>
            </div>
            <span style={{ font: "500 10px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".1em" }}>SCAN ON MOBILE</span>
          </div>
          <div style={{ background: "#FBF9F5", padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <div style={{ font: "600 12.5px Archivo", color: "#1A1614", marginBottom: "4px" }}>Email</div>
              <div style={{ font: "400 13px 'JetBrains Mono',monospace", color: "#6B6259" }}>bachar@thechinaguy.com</div>
            </div>
            <span style={{ font: "500 10px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".1em" }}>REPLY IN 12H</span>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(26,22,20,.14)", paddingTop: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "22px" }}>
          <div>
            <div style={{ font: "500 9px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "8px" }}>My hours</div>
            <div style={{ font: "400 13.5px/1.6 Archivo", color: "#1A1614" }}>Mon–Sat, 09:00–19:00 CST<br />Evening window for EU & US</div>
          </div>
          <div>
            <div style={{ font: "500 9px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "8px" }}>Office</div>
            <div style={{ font: "400 13.5px/1.6 Archivo", color: "#1A1614" }}>Room 1804, Tianhe North Road<br />Guangzhou 510620, China</div>
          </div>
        </div>
      </div>
      <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.14)", padding: "34px" }}>
        {!sent && (
          <>
            <form onSubmit={submit}>
              <div style={{ font: "400 27px 'Instrument Serif',serif", marginBottom: "6px" }}>Quote request</div>
              <div style={{ font: "500 10.5px 'JetBrains Mono',monospace", color: "#6B6259", marginBottom: "26px", letterSpacing: ".06em" }}>FIVE FIELDS · ATTACHMENTS CAN FOLLOW BY EMAIL</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "16px", marginBottom: "16px" }}>
                <label htmlFor="f-name" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Your name</span>
                  <input id="f-name" name="name" className="fc-red" type="text" placeholder="Marta Ruiz" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
                <label htmlFor="f-company" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Company</span>
                  <input id="f-company" name="company" className="fc-red" type="text" placeholder="Casa Ruiz S.L." style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "16px", marginBottom: "16px" }}>
                <label htmlFor="f-email" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Email</span>
                  <input id="f-email" name="email" className="fc-red" type="email" placeholder="you@company.com" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
                <label htmlFor="f-destination" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Destination country</span>
                  <input id="f-destination" name="destination" className="fc-red" type="text" placeholder="Spain" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
              </div>
              <label htmlFor="f-need" style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "16px" }}>
                <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>What do you need?</span>
                <select id="f-need" name="need" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }}>
                  <option>Find and vet a supplier</option>
                  <option>Inspect an order I've already placed</option>
                  <option>Audit a factory I'm considering</option>
                  <option>Freight and shipping only</option>
                  <option>Ongoing sourcing programme</option>
                  <option>Something else</option>
                </select>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "16px", marginBottom: "16px" }}>
                <label htmlFor="f-quantity" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>First-order quantity</span>
                  <input id="f-quantity" name="quantity" className="fc-red" type="text" placeholder="2,000 units" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
                <label htmlFor="f-target-price" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Target unit price</span>
                  <input id="f-target-price" name="target-price" className="fc-red" type="text" placeholder="US$4.20 FOB" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
              </div>
              <label htmlFor="f-product" style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "22px" }}>
                <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Product & specification</span>
                <textarea id="f-product" name="product" className="fc-red" rows={4} placeholder="18/10 stainless saucepan, 20cm, tri-ply base, walnut handle. Reference photos to follow." style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", resize: "vertical", fontFamily: "Archivo,sans-serif", lineHeight: "1.6", borderRadius: "2px" }} />
              </label>
              <button className="hv-ink-bg" type="submit" style={{ width: "100%", padding: "16px", background: "#C0392F", color: "#F4F0E8", border: "none", font: "600 14.5px Archivo", cursor: "pointer", borderRadius: "3px" }}>Send it to Bachar</button>
              <p style={{ font: "400 11px/1.6 'JetBrains Mono',monospace", color: "#6B6259", margin: "14px 0 0", textAlign: "center", letterSpacing: ".03em" }}>NO LISTS · NO RESALE · NO FOLLOW-UP SEQUENCE</p>
            </form>
          </>
        )}
        {sent && (
          <>
            <div ref={confirmRef} role="status" aria-live="polite" tabIndex={-1} style={{ textAlign: "center", padding: "44px 10px", outline: "none" }}>
              <div style={{ width: "58px", height: "58px", background: "#C0392F", color: "#F4F0E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 22px", borderRadius: "3px" }} aria-hidden="true">✓</div>
              <div style={{ font: "400 32px/1.2 'Instrument Serif',serif", marginBottom: "14px" }}>Got it — it's on my desk.</div>
              <p style={{ font: "400 14.5px/1.75 Archivo", color: "#6B6259", margin: "0 auto 26px", maxWidth: "340px" }}>You'll hear from me within 12 working hours. If it's urgent, WhatsApp me and mention your company name.</p>
              <Link to="/" style={{ font: "600 13px Archivo", color: "#C0392F", textDecoration: "none", borderBottom: "1px solid rgba(192,57,47,.35)", paddingBottom: "3px" }}>Back to home</Link>
            </div>
          </>
        )}
      </div>
    </section>

    </>
  )
}
