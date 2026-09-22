// Home page.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html". Two declared
// divergences, both in the hero's right-hand column and both marked where
// they are: `portrait-slot` and `hero-example-order`.

import { Link } from 'react-router-dom'
import Portrait from '../components/Portrait'

export default function Home() {
  return (
    <>

    <section style={{ borderBottom: "1px solid rgba(26,22,20,.12)" }}>
      <div data-m="stack wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "64px 32px 56px", display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,.85fr)", gap: "52px", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <span style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F" }}>Sourcing agent · Guangzhou</span>
            <span style={{ height: "1px", flex: "1", background: "rgba(26,22,20,.15)", maxWidth: "120px" }} />
          </div>
          <h1 style={{ font: "400 78px/.98 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0 0 24px", textWrap: "balance" }}>I find your factory,<br />walk the floor,<br /><em style={{ color: "#C0392F" }}>and get it shipped.</em></h1>
          <p style={{ font: "400 18.5px/1.65 Archivo", color: "#3A332E", maxWidth: "520px", margin: "0 0 34px", textWrap: "pretty" }}>I'm Bachar. I'm on the ground in Guangzhou: I find the factory, negotiate the real price, inspect the goods before they're packed, and put them on a ship. I take nothing from suppliers — so my advice is only ever worth what it's worth to you.</p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
            <Link className="hv-ink" to="/contact/" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 26px", background: "#C0392F", color: "#F4F0E8", font: "600 14.5px Archivo", textDecoration: "none", borderRadius: "3px" }}>Get a free quote<span style={{ fontSize: "16px", lineHeight: "1" }} aria-hidden="true">→</span></Link>
            <Link className="hv-ink" to="/about/" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 24px", border: "1px solid rgba(26,22,20,.25)", color: "#1A1614", font: "600 14.5px Archivo", textDecoration: "none", borderRadius: "3px", background: "transparent" }}>Who I am</Link>
          </div>
          <p style={{ font: "500 12.5px/1.6 'JetBrains Mono',monospace", color: "#6B6259", margin: "0" }}>NO FEE UNTIL YOU APPROVE THE QUOTE · SAMPLES IN 7–10 DAYS</p>
        </div>
        <div style={{ position: "relative" }}>
          {/* portrait-slot: the canvas's dashed 4:5 box, same element and
              styles, with a photo or a finished fallback in it instead of
              "Photo placeholder / PORTRAIT · 1200 × 1500". */}
          <Portrait gap="10px" caption="On the ground in Guangzhou, Foshan, Yiwu & Shenzhen." priority clearBottom />
          {/* hero-example-order: the canvas says "Live order". The card is an
              illustration of what a status update looks like, and "live" next
              to an order number reads as a real-time claim about a real
              client. Same element, same styles, one word. */}
          <div data-m="figure-badge" style={{ position: "absolute", left: "-24px", bottom: "-20px", background: "#1A1614", color: "#F4F0E8", padding: "20px 22px", minWidth: "238px", borderRadius: "3px" }}>
            <div style={{ font: "500 9px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(244,240,232,.5)", marginBottom: "10px" }}>Example order · GZB-4471</div>
            <div style={{ font: "400 22px/1.1 'Instrument Serif',serif", marginBottom: "12px" }}>QC passed — 1,200 units</div>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <span style={{ height: "4px", flex: "1", background: "#C0392F" }} />
              <span style={{ height: "4px", flex: "1", background: "#C0392F" }} />
              <span style={{ height: "4px", flex: "1", background: "#C0392F" }} />
              <span style={{ height: "4px", flex: "1", background: "rgba(244,240,232,.22)" }} />
            </div>
            <div style={{ font: "400 11px 'JetBrains Mono',monospace", color: "rgba(244,240,232,.6)", marginTop: "10px" }}>NEXT: SEALED & BOOKED · ETA 24 DAYS</div>
          </div>
        </div>
      </div>
    </section>

            <section style={{ background: "#1A1614", color: "#F4F0E8", borderBottom: "1px solid rgba(244,240,232,.12)" }}>
          <div data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "40px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "28px" }}>
            <div>
              <div style={{ font: "400 42px/1 'Instrument Serif',serif" }}>0%</div>
              <div style={{ font: "400 11px/1.5 'JetBrains Mono',monospace", color: "rgba(244,240,232,.55)", marginTop: "8px", letterSpacing: ".06em" }}>COMMISSION FROM ANY FACTORY</div>
            </div>
            <div>
              <div style={{ font: "400 42px/1 'Instrument Serif',serif" }}>1</div>
              <div style={{ font: "400 11px/1.5 'JetBrains Mono',monospace", color: "rgba(244,240,232,.55)", marginTop: "8px", letterSpacing: ".06em" }}>PERSON ON YOUR ORDER — ME</div>
            </div>
            <div>
              <div style={{ font: "400 42px/1 'Instrument Serif',serif" }}>12h</div>
              <div style={{ font: "400 11px/1.5 'JetBrains Mono',monospace", color: "rgba(244,240,232,.55)", marginTop: "8px", letterSpacing: ".06em" }}>TO A REAL REPLY, NOT A TEMPLATE</div>
            </div>
            <div>
              <div style={{ font: "400 42px/1 'Instrument Serif',serif", color: "#E2857C" }}>24h</div>
              <div style={{ font: "400 11px/1.5 'JetBrains Mono',monospace", color: "rgba(244,240,232,.55)", marginTop: "8px", letterSpacing: ".06em" }}>FROM INSPECTION TO YOUR REPORT</div>
            </div>
          </div>
        </section>

    <section data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "80px 32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "32px", flexWrap: "wrap", marginBottom: "36px" }}>
        <div>
          <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "16px" }}>What I do</div>
          <h2 style={{ font: "400 50px/1.05 'Instrument Serif',serif", letterSpacing: "-.015em", margin: "0", maxWidth: "620px" }}>Everything between your idea and a container on the water.</h2>
        </div>
        <Link data-m="textlink" to="/services/" style={{ font: "600 13px Archivo", color: "#C0392F", textDecoration: "none", borderBottom: "1px solid rgba(192,57,47,.35)", paddingBottom: "3px", flex: "none" }} aria-label="All seven services">All seven services →</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(258px,1fr))", gap: "1px", background: "rgba(26,22,20,.12)", border: "1px solid rgba(26,22,20,.12)" }}>
        <div className="hv-white" style={{ background: "#FBF9F5", padding: "28px" }}>
          <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", marginBottom: "18px" }}>01</div>
          <h3 style={{ font: "400 24px/1.15 'Instrument Serif',serif", margin: "0 0 10px" }}>Supplier sourcing & vetting</h3>
          <p style={{ font: "400 13.5px/1.65 Archivo", color: "#6B6259", margin: "0" }}>I shortlist three to five real manufacturers — licence, export history and capacity checked before you speak to any of them.</p>
        </div>
        <div className="hv-white" style={{ background: "#FBF9F5", padding: "28px" }}>
          <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", marginBottom: "18px" }}>02</div>
          <h3 style={{ font: "400 24px/1.15 'Instrument Serif',serif", margin: "0 0 10px" }}>Price negotiation</h3>
          <p style={{ font: "400 13.5px/1.65 Archivo", color: "#6B6259", margin: "0" }}>I negotiate in Mandarin against a costed breakdown of material, labour and mould — not against the first number they sent you.</p>
        </div>
        <div className="hv-white" style={{ background: "#FBF9F5", padding: "28px" }}>
          <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", marginBottom: "18px" }}>03</div>
          <h3 style={{ font: "400 24px/1.15 'Instrument Serif',serif", margin: "0 0 10px" }}>Factory audits</h3>
          <p style={{ font: "400 13.5px/1.65 Archivo", color: "#6B6259", margin: "0" }}>A full day on site: equipment, workforce, certifications, sub-contracting. You get a scored 14-page report with photos.</p>
        </div>
        <div className="hv-white" style={{ background: "#FBF9F5", padding: "28px" }}>
          <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", marginBottom: "18px" }}>04</div>
          <h3 style={{ font: "400 24px/1.15 'Instrument Serif',serif", margin: "0 0 10px" }}>Quality inspection</h3>
          <p style={{ font: "400 13.5px/1.65 Archivo", color: "#6B6259", margin: "0" }}>AQL sampling during and after production. Nothing leaves the floor until you've seen the report and said yes.</p>
        </div>
        <div className="hv-white" style={{ background: "#FBF9F5", padding: "28px" }}>
          <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", marginBottom: "18px" }}>05</div>
          <h3 style={{ font: "400 24px/1.15 'Instrument Serif',serif", margin: "0 0 10px" }}>Samples handling</h3>
          <p style={{ font: "400 13.5px/1.65 Archivo", color: "#6B6259", margin: "0" }}>I collect samples from every candidate factory, photograph them side by side, and send you one parcel.</p>
        </div>
        <div className="hv-white" style={{ background: "#FBF9F5", padding: "28px" }}>
          <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", marginBottom: "18px" }}>06</div>
          <h3 style={{ font: "400 24px/1.15 'Instrument Serif',serif", margin: "0 0 10px" }}>Freight, sea & air</h3>
          <p style={{ font: "400 13.5px/1.65 Archivo", color: "#6B6259", margin: "0" }}>Booking, consolidation, export docs, customs-ready file. Priced FOB, CIF and door-to-door so you can choose.</p>
        </div>
        <div className="hv-white" style={{ background: "#FBF9F5", padding: "28px" }}>
          <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", marginBottom: "18px" }}>07</div>
          <h3 style={{ font: "400 24px/1.15 'Instrument Serif',serif", margin: "0 0 10px" }}>Trade shows & markets</h3>
          <p style={{ font: "400 13.5px/1.65 Archivo", color: "#6B6259", margin: "0" }}>Canton Fair and Yiwu with me beside you as buyer and interpreter, plus a pre-built list of booths worth your time.</p>
        </div>
        <Link className="hv-red-deep" to="/contact/" style={{ background: "#C0392F", padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", textDecoration: "none", minHeight: "180px" }}>
          <div style={{ font: "400 24px/1.2 'Instrument Serif',serif", color: "#F4F0E8" }}>Not sure which of these you need?</div>
          <div style={{ font: "600 12.5px Archivo", color: "#F4F0E8" }}>Send me your product list →</div>
        </Link>
      </div>
    </section>

    <section data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "76px 32px" }}>
      <div data-m="fluid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "48px", alignItems: "start" }}>
        <div>
          <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "16px" }}>How I work</div>
          <h2 style={{ font: "400 46px/1.06 'Instrument Serif',serif", letterSpacing: "-.015em", margin: "0 0 20px" }}>Four rules I don't break.</h2>
          <p style={{ font: "400 15.5px/1.7 Archivo", color: "#3A332E", margin: "0", maxWidth: "420px" }}>They're in writing on every engagement, so you can hold me to them from day one.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ borderTop: "1px solid rgba(26,22,20,.15)", padding: "22px 0", display: "flex", gap: "20px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "6px", flex: "none" }}>01</span>
            <div>
              <div style={{ font: "400 22px/1.25 'Instrument Serif',serif", marginBottom: "6px" }}>I take nothing from the factory</div>
              <div style={{ font: "400 14px/1.65 Archivo", color: "#6B6259" }}>No commission, no rebate, no freight margin. My money comes from you, which is the only way my advice is worth anything.</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(26,22,20,.15)", padding: "22px 0", display: "flex", gap: "20px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "6px", flex: "none" }}>02</span>
            <div>
              <div style={{ font: "400 22px/1.25 'Instrument Serif',serif", marginBottom: "6px" }}>Your money never passes through me</div>
              <div style={{ font: "400 14px/1.65 Archivo", color: "#6B6259" }}>You pay the factory's own corporate account, on their invoice, at the price I negotiated. I verify the account first.</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(26,22,20,.15)", padding: "22px 0", display: "flex", gap: "20px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "6px", flex: "none" }}>03</span>
            <div>
              <div style={{ font: "400 22px/1.25 'Instrument Serif',serif", marginBottom: "6px" }}>I'll talk you out of a bad order
</div>
              <div style={{ font: "400 14px/1.65 Archivo", color: "#6B6259" }}>If your target price doesn't exist in China at the quality you want, I'll say so on the first call rather than take the fee and let you find out.</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(26,22,20,.15)", borderBottom: "1px solid rgba(26,22,20,.15)", padding: "22px 0", display: "flex", gap: "20px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#C0392F", paddingTop: "6px", flex: "none" }}>04</span>
            <div>
              <div style={{ font: "400 22px/1.25 'Instrument Serif',serif", marginBottom: "6px" }}>Everything in writing, in both languages</div>
              <div style={{ font: "400 14px/1.65 Archivo", color: "#6B6259" }}>Contracts, tooling ownership, inspection standards, payment terms. Verbal agreements in China are worth exactly what they cost.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section style={{ borderTop: "1px solid rgba(26,22,20,.12)", borderBottom: "1px solid rgba(26,22,20,.12)" }}>
      <div data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "72px 32px" }}>
        <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "16px" }}>Why me</div>
        <h2 style={{ font: "400 46px/1.06 'Instrument Serif',serif", letterSpacing: "-.015em", margin: "0 0 16px", maxWidth: "560px" }}>Judge the work, not the brochure.</h2>
        <p style={{ font: "400 15.5px/1.7 Archivo", color: "#3A332E", margin: "0 0 34px", maxWidth: "560px" }}>You can see how I work before you owe me anything. Most people who hire me decide during that first free stage.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "20px" }}>
          <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "28px" }}>
            <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#C0392F", marginBottom: "16px" }}>Before you owe me anything</div>
            <div style={{ font: "400 26px/1.15 'Instrument Serif',serif", marginBottom: "12px" }}>A shortlist and a real price</div>
            <p style={{ font: "400 13.5px/1.7 Archivo", color: "#6B6259", margin: "0" }}>Verified factories, a should-cost breakdown for your product, and a quotation I've already argued down. Free until you say yes to it.</p>
          </div>
          <div style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "28px" }}>
            <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#C0392F", marginBottom: "16px" }}>No layers between us</div>
            <div style={{ font: "400 26px/1.15 'Instrument Serif',serif", marginBottom: "12px" }}>You deal with me, not an account manager</div>
            <p style={{ font: "400 13.5px/1.7 Archivo", color: "#6B6259", margin: "0" }}>The person who negotiates your price is the person who stands in the factory and the person who answers your message on a Sunday.</p>
          </div>
          <div style={{ background: "#1A1614", color: "#F4F0E8", padding: "28px" }}>
            <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#E2857C", marginBottom: "16px" }}>Nothing hidden</div>
            <div style={{ font: "400 26px/1.15 'Instrument Serif',serif", marginBottom: "12px" }}>You see every invoice I see</div>
            <p style={{ font: "400 13.5px/1.7 Archivo", color: "rgba(244,240,232,.8)", margin: "0" }}>Factory quotes, freight bills, lab fees — passed to you as they are. My fee is the only money I make on your order.</p>
          </div>
        </div>
      </div>
    </section>

    <section style={{ background: "#1A1614", color: "#F4F0E8" }}>
      <div data-m="wrap fluid" style={{ maxWidth: "1260px", margin: "0 auto", padding: "72px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "44px" }}>
        <div>
          <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#E2857C", marginBottom: "20px" }}>How I'm set up</div>
          <h2 style={{ font: "400 44px/1.06 'Instrument Serif',serif", letterSpacing: "-.015em", margin: "0 0 18px" }}>No commission. No contract. No layers.</h2>
          <p style={{ font: "400 15.5px/1.7 Archivo", color: "rgba(244,240,232,.78)", margin: "0 0 26px", maxWidth: "470px" }}>Most sourcing goes wrong because of how the deal is structured, not because someone was careless. So I structured mine to remove every incentive that could work against you.</p>
          <Link className="hv-cream-fill" to="/contact/" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "15px 24px", background: "#C0392F", color: "#F4F0E8", font: "600 14px Archivo", textDecoration: "none", borderRadius: "3px" }}>Start with a free quote<span style={{ fontSize: "16px", lineHeight: "1" }} aria-hidden="true">→</span></Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ borderTop: "1px solid rgba(244,240,232,.2)", padding: "18px 0", display: "flex", gap: "18px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#E2857C", flex: "none", paddingTop: "5px" }}>01</span>
            <div>
              <div style={{ font: "400 20px/1.25 'Instrument Serif',serif", marginBottom: "5px" }}>Sourcing is free until you approve</div>
              <div style={{ font: "400 13.5px/1.6 Archivo", color: "rgba(244,240,232,.72)" }}>If you don't like the factories or the price, we shake hands and you owe nothing.</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(244,240,232,.2)", padding: "18px 0", display: "flex", gap: "18px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#E2857C", flex: "none", paddingTop: "5px" }}>02</span>
            <div>
              <div style={{ font: "400 20px/1.25 'Instrument Serif',serif", marginBottom: "5px" }}>Your money never passes through me</div>
              <div style={{ font: "400 13.5px/1.6 Archivo", color: "rgba(244,240,232,.72)" }}>You pay the factory's own corporate account, verified against their licence first.</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(244,240,232,.2)", padding: "18px 0", display: "flex", gap: "18px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#E2857C", flex: "none", paddingTop: "5px" }}>03</span>
            <div>
              <div style={{ font: "400 20px/1.25 'Instrument Serif',serif", marginBottom: "5px" }}>Final payment waits for inspection</div>
              <div style={{ font: "400 13.5px/1.6 Archivo", color: "rgba(244,240,232,.72)" }}>70% is released after the goods pass, which is what makes a rework request work.</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(244,240,232,.2)", borderBottom: "1px solid rgba(244,240,232,.2)", padding: "18px 0", display: "flex", gap: "18px" }}>
            <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#E2857C", flex: "none", paddingTop: "5px" }}>04</span>
            <div>
              <div style={{ font: "400 20px/1.25 'Instrument Serif',serif", marginBottom: "5px" }}>Walk away at any point</div>
              <div style={{ font: "400 13.5px/1.6 Archivo", color: "rgba(244,240,232,.72)" }}>No lock-in, no notice period. If I'm not earning the fee, stop paying it.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "72px 32px" }}>
      <div data-m="stack pad" style={{ border: "1px solid rgba(192,57,47,.4)", background: "#FBF6F1", padding: "38px", display: "grid", gridTemplateColumns: "minmax(0,auto) minmax(0,1fr) minmax(0,auto)", gap: "34px", alignItems: "center" }}>
        <div style={{ width: "90px", height: "90px", border: "2px solid #C0392F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", flex: "none", transform: "rotate(-4deg)", borderRadius: "3px" }}>
          <span style={{ font: "400 22px/1 'Instrument Serif',serif", color: "#C0392F" }}>QC</span>
          <span style={{ font: "500 7.5px 'JetBrains Mono',monospace", letterSpacing: ".14em", color: "#C0392F", marginTop: "4px" }}>GUARANTEE</span>
        </div>
        <div>
          <h3 style={{ font: "400 30px/1.2 'Instrument Serif',serif", margin: "0 0 10px" }}>If it fails inspection, you don't pay for it.</h3>
          <p style={{ font: "400 14.5px/1.65 Archivo", color: "#3A332E", margin: "0", maxWidth: "620px" }}>Every order is inspected against a spec sheet you signed off. If a batch fails and the factory won't remake it, I refund my service fee on that order in full — and I help you claim from the supplier.</p>
        </div>
        <Link className="hv-red-fill" to="/pricing/" style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 22px", border: "1px solid #C0392F", color: "#C0392F", font: "600 13px Archivo", textDecoration: "none", borderRadius: "3px" }}>Read the terms</Link>
      </div>
    </section>

    </>
  )
}
