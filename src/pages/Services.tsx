// Services page.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html".

import { Link } from 'react-router-dom'

/**
 * Beyond the canvas, and pixel-neutral: each of the seven numbered blocks below
 * carries an `id` so it can be linked to — `/services/#freight` — and the
 * footer's Services column points at three of them (sourcing, inspection,
 * freight). `id` and `scroll-margin-top` have no effect on layout.
 *
 * The margin is the masthead's height. SiteHeader is `position: sticky` and
 * 67px tall at desktop (14px padding, a 38px row, 14px padding, a 1px rule),
 * so a jump that put a block's top edge at the top of the viewport would put
 * it under the header. With the margin, the block starts just below the header
 * and its own 44px top padding sits between the header and the heading.
 * Below 860px mobile.css makes the header static, and the margin is only a
 * little air above the block. It applies to a native fragment jump on first
 * load and to ScrollToTop's scrollIntoView() after a client-side navigation.
 */
const ANCHOR_OFFSET = '67px'

export default function Services() {
  return (
    <>

    <section data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "68px 32px 44px", borderBottom: "1px solid rgba(26,22,20,.12)" }}>
      <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "18px" }}>What I do</div>
      <h1 style={{ font: "400 66px/1 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0 0 22px", maxWidth: "820px" }}>Take the whole chain, or the one link you're missing.</h1>
      <p style={{ font: "400 17px/1.7 Archivo", color: "#3A332E", maxWidth: "600px", margin: "0" }}>Most clients start with sourcing and inspection, then hand me freight once they trust the reports. Every service below can be bought on its own.</p>
    </section>

    <section data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "8px 32px 76px" }}>
      <div id="sourcing" data-m="stack" style={{ borderBottom: "1px solid rgba(26,22,20,.12)", padding: "44px 0", display: "grid", gridTemplateColumns: "minmax(0,60px) minmax(0,1.3fr) minmax(0,1fr)", gap: "32px", alignItems: "start", scrollMarginTop: ANCHOR_OFFSET }}>
        <div style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "8px" }}>01</div>
        <div>
          <h2 style={{ font: "400 34px/1.1 'Instrument Serif',serif", margin: "0 0 14px" }}>Supplier sourcing & vetting</h2>
          <p style={{ font: "400 15px/1.7 Archivo", color: "#3A332E", margin: "0 0 18px", maxWidth: "520px" }}>Tell me the product; I come back with real manufacturers, not resellers with a nice website. Every shortlist entry has a verified business licence, an export record and a capacity check against your volume.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>LICENCE & VAT</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>EXPORT HISTORY</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>CAPACITY VS. MOQ</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>MIDDLEMAN SCREEN</span>
          </div>
        </div>
        <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "24px" }}>
          <div style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "12px" }}>You receive</div>
          <div style={{ font: "400 14px/1.7 Archivo", color: "#1A1614" }}>A comparison sheet of 3–5 factories: quoted FOB price, MOQ, lead time, tooling cost and my recommendation with reasons.</div>
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(26,22,20,.1)", font: "500 11px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".05em" }}>TURNAROUND · 5–8 WORKING DAYS</div>
        </div>
      </div>
      <div id="negotiation" data-m="stack" style={{ borderBottom: "1px solid rgba(26,22,20,.12)", padding: "44px 0", display: "grid", gridTemplateColumns: "minmax(0,60px) minmax(0,1.3fr) minmax(0,1fr)", gap: "32px", alignItems: "start", scrollMarginTop: ANCHOR_OFFSET }}>
        <div style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "8px" }}>02</div>
        <div>
          <h2 style={{ font: "400 34px/1.1 'Instrument Serif',serif", margin: "0 0 14px" }}>Price negotiation</h2>
          <p style={{ font: "400 15px/1.7 Archivo", color: "#3A332E", margin: "0 0 18px", maxWidth: "520px" }}>I build a should-cost model before I open the conversation — material weight, labour minutes, tooling amortisation, packaging. Then I negotiate in Mandarin against that number.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>SHOULD-COST MODEL</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>PAYMENT TERMS</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>TOOLING OWNERSHIP</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>VOLUME TIERS</span>
          </div>
        </div>
        <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "24px" }}>
          <div style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "12px" }}>You receive</div>
          <div style={{ font: "400 14px/1.7 Archivo", color: "#1A1614" }}>A signed quotation in English and Chinese, a cost breakdown, and payment terms I'd be comfortable with myself.</div>
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(26,22,20,.1)", font: "500 11px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".05em" }}>WHAT I AIM FOR · 10–20% OFF THE OPENING QUOTE</div>
        </div>
      </div>
      <div id="audits" data-m="stack" style={{ borderBottom: "1px solid rgba(26,22,20,.12)", padding: "44px 0", display: "grid", gridTemplateColumns: "minmax(0,60px) minmax(0,1.3fr) minmax(0,1fr)", gap: "32px", alignItems: "start", scrollMarginTop: ANCHOR_OFFSET }}>
        <div style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "8px" }}>03</div>
        <div>
          <h2 style={{ font: "400 34px/1.1 'Instrument Serif',serif", margin: "0 0 14px" }}>Factory audits</h2>
          <p style={{ font: "400 15px/1.7 Archivo", color: "#3A332E", margin: "0 0 18px", maxWidth: "520px" }}>I spend a day on site. Machines, staffing, storage, certifications — and the question that matters most: which parts of your order do they actually make themselves?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>14-PAGE SCORED REPORT</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>60+ PHOTOS</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>SUB-CONTRACTING MAP</span>
          </div>
        </div>
        <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "24px" }}>
          <div style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "12px" }}>You receive</div>
          <div style={{ font: "400 14px/1.7 Archivo", color: "#1A1614" }}>A scored report with a clear pass, conditional or fail — and if conditional, the exact fixes to ask for.</div>
          <Link to="/audit/" style={{ display: "inline-block", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(26,22,20,.1)", font: "600 12.5px Archivo", color: "#C0392F", textDecoration: "none" }} aria-label="See a sample report">See a sample report →</Link>
        </div>
      </div>
      <div id="inspection" data-m="stack" style={{ borderBottom: "1px solid rgba(26,22,20,.12)", padding: "44px 0", display: "grid", gridTemplateColumns: "minmax(0,60px) minmax(0,1.3fr) minmax(0,1fr)", gap: "32px", alignItems: "start", scrollMarginTop: ANCHOR_OFFSET }}>
        <div style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "8px" }}>04</div>
        <div>
          <h2 style={{ font: "400 34px/1.1 'Instrument Serif',serif", margin: "0 0 14px" }}>Quality inspection</h2>
          <p style={{ font: "400 15px/1.7 Archivo", color: "#3A332E", margin: "0 0 18px", maxWidth: "520px" }}>AQL 2.5 sampling as standard, tightened where it matters. We inspect at 20% of production so problems are still fixable, and again before the container is sealed.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>DURING PRODUCTION</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>PRE-SHIPMENT</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>LOADING CHECK</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>FUNCTION & DROP TESTS</span>
          </div>
        </div>
        <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "24px" }}>
          <div style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "12px" }}>You receive</div>
          <div style={{ font: "400 14px/1.7 Archivo", color: "#1A1614" }}>Same-day photo report with defects classified, plus a hold-or-ship recommendation. The final call is always yours.</div>
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(26,22,20,.1)", font: "500 11px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".05em" }}>REPORT WITHIN 24H OF THE VISIT</div>
        </div>
      </div>
      <div id="samples" data-m="stack" style={{ borderBottom: "1px solid rgba(26,22,20,.12)", padding: "44px 0", display: "grid", gridTemplateColumns: "minmax(0,60px) minmax(0,1.3fr) minmax(0,1fr)", gap: "32px", alignItems: "start", scrollMarginTop: ANCHOR_OFFSET }}>
        <div style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "8px" }}>05</div>
        <div>
          <h2 style={{ font: "400 34px/1.1 'Instrument Serif',serif", margin: "0 0 14px" }}>Samples handling</h2>
          <p style={{ font: "400 15px/1.7 Archivo", color: "#3A332E", margin: "0 0 18px", maxWidth: "520px" }}>Ordering samples from five factories usually means five couriers, five invoices and a month of waiting. I collect them at my Guangzhou office, shoot them under the same light, and send you one box.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>CONSOLIDATED PARCEL</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>COMPARISON PHOTOS</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>GOLDEN SAMPLE SEALED</span>
          </div>
        </div>
        <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "24px" }}>
          <div style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "12px" }}>You receive</div>
          <div style={{ font: "400 14px/1.7 Archivo", color: "#1A1614" }}>One shipment, one tracking number, and a sealed golden sample kept at my office as the reference for every future batch.</div>
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(26,22,20,.1)", font: "500 11px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".05em" }}>AT YOUR DOOR IN 7–10 DAYS</div>
        </div>
      </div>
      <div id="freight" data-m="stack" style={{ borderBottom: "1px solid rgba(26,22,20,.12)", padding: "44px 0", display: "grid", gridTemplateColumns: "minmax(0,60px) minmax(0,1.3fr) minmax(0,1fr)", gap: "32px", alignItems: "start", scrollMarginTop: ANCHOR_OFFSET }}>
        <div style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "8px" }}>06</div>
        <div>
          <h2 style={{ font: "400 34px/1.1 'Instrument Serif',serif", margin: "0 0 14px" }}>Freight, sea & air</h2>
          <p style={{ font: "400 15px/1.7 Archivo", color: "#3A332E", margin: "0 0 18px", maxWidth: "520px" }}>I book through established Guangzhou forwarders and quote you three ways — FOB, CIF and door-to-door — so you can see what the convenience actually costs.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>FCL & LCL</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>AIR & EXPRESS</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>EXPORT DOCS</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>HS CODES & CO</span>
          </div>
        </div>
        <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "24px" }}>
          <div style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "12px" }}>You receive</div>
          <div style={{ font: "400 14px/1.7 Archivo", color: "#1A1614" }}>A booking confirmation, a customs-ready document pack, and weekly position updates until it lands.</div>
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(26,22,20,.1)", font: "500 11px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".05em" }}>GUANGZHOU → EU · 28–34 DAYS SEA</div>
        </div>
      </div>
      <div id="trade-shows" data-m="stack" style={{ padding: "44px 0", display: "grid", gridTemplateColumns: "minmax(0,60px) minmax(0,1.3fr) minmax(0,1fr)", gap: "32px", alignItems: "start", scrollMarginTop: ANCHOR_OFFSET }}>
        <div style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "8px" }}>07</div>
        <div>
          <h2 style={{ font: "400 34px/1.1 'Instrument Serif',serif", margin: "0 0 14px" }}>Trade shows & market visits</h2>
          <p style={{ font: "400 15px/1.7 Archivo", color: "#3A332E", margin: "0 0 18px", maxWidth: "520px" }}>Canton Fair is 1.2 million square metres. I go ahead of you, mark the booths worth your time, and walk the floor with you as interpreter and buyer.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>CANTON FAIR</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>YIWU MARKET</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>FACTORY TOURS</span>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", border: "1px solid rgba(192,57,47,.3)", padding: "6px 11px", letterSpacing: ".04em" }}>INTERPRETATION</span>
          </div>
        </div>
        <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "24px" }}>
          <div style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259", marginBottom: "12px" }}>You receive</div>
          <div style={{ font: "400 14px/1.7 Archivo", color: "#1A1614" }}>A pre-visit booth plan, a bilingual buyer for the days you're here, and a written follow-up list before you fly home.</div>
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(26,22,20,.1)", font: "500 11px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".05em" }}>BOOK 3 WEEKS AHEAD OF THE FAIR</div>
        </div>
      </div>
    </section>

    </>
  )
}
