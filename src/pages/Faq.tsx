// Faq page.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html".

import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Faq() {
  // The canvas kept a single `faq` number in state, so opening one answer
  // closes the last; clicking the open one collapses it.
  const [open, setOpen] = useState<number | null>(1)
  const toggle = (n: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(cur => (cur === n ? null : n))
  }
  // Each question sits in an <h2> — the WAI-ARIA accordion pattern, a heading
  // wrapping the button — so the eight Q&As are separate, heading-led
  // passages to a crawler and to a screen reader's heading list. The heading is
  // neutralised to `margin: 0; font: inherit`; the span inside sets the font,
  // so it adds no pixels.
  //
  // The rows stay <a> elements because the pixel gate compares computed styles
  // and a <button> would drag in the UA stylesheet. role="button" plus this
  // handler gives them button semantics and button keys. preventDefault on
  // Enter suppresses the anchor's own activation (which would fire a second,
  // cancelling toggle through onClick); on Space it also stops the page
  // scrolling.
  //
  // Each href names the answer its row controls, not the canvas's "#". A tap
  // that lands before the bundle has hydrated follows the href natively, and
  // "#" jumped the reader back to the top of the page; "#faq-a-N" names a
  // hidden element, which a browser does not scroll to, so the page stays put.
  // It is also no longer a link to nowhere for a crawler or a link checker
  // (check-functional.mjs fails on any href="#"). An href is not a pixel.
  const onKey = (n: number) => (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return
    e.preventDefault()
    setOpen(cur => (cur === n ? null : n))
  }

  return (
    <>

    <section data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "68px 32px 44px", borderBottom: "1px solid rgba(26,22,20,.12)" }}>
      <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "18px" }}>FAQ</div>
      <h1 style={{ font: "400 66px/1 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0", maxWidth: "720px" }}>The questions I get in the first call.</h1>
    </section>

    <section data-m="wrap" style={{ maxWidth: "900px", margin: "0 auto", padding: "44px 32px 80px" }}>
      <div style={{ borderBottom: "1px solid rgba(26,22,20,.14)" }}>
        <h2 style={{ margin: "0", font: "inherit" }}>
          <a className="hv-red" href="#faq-a-1" role="button" id="faq-q-1" aria-expanded={open === 1} aria-controls="faq-a-1" onClick={toggle(1)} onKeyDown={onKey(1)} style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "baseline", padding: "22px 0", textDecoration: "none", color: "#1A1614" }}>
            <span style={{ font: "400 25px/1.3 'Instrument Serif',serif" }}>Why use an agent instead of buying on Alibaba myself?</span>
            <span style={{ font: "400 22px 'Instrument Serif',serif", color: "#C0392F", flex: "none" }} aria-hidden="true">+</span>
          </a>
        </h2>
        {/* Rendered even when collapsed, and hidden with the `hidden`
            attribute rather than unmounted, so faq-a-1 always exists for the
            question's aria-controls to point at. `hidden` is display:none, so
            it costs no space and no pixels. */}
        <p id="faq-a-1" hidden={open !== 1} role="region" aria-labelledby="faq-q-1" style={{ font: "400 15px/1.75 Archivo", color: "#3A332E", margin: "0 0 26px", maxWidth: "660px" }}>You can, and for a $500 trial order you probably should. It stops working when the money gets real: platform listings hide whether you're talking to a factory or a middleman, nobody inspects before the container seals, and if a batch is wrong you're negotiating from 8,000 km away in your second language. I'm the part that stands in the factory.</p>
      </div>
      <div style={{ borderBottom: "1px solid rgba(26,22,20,.14)" }}>
        <h2 style={{ margin: "0", font: "inherit" }}>
          <a className="hv-red" href="#faq-a-2" role="button" id="faq-q-2" aria-expanded={open === 2} aria-controls="faq-a-2" onClick={toggle(2)} onKeyDown={onKey(2)} style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "baseline", padding: "22px 0", textDecoration: "none", color: "#1A1614" }}>
            <span style={{ font: "400 25px/1.3 'Instrument Serif',serif" }}>Do you take commission from the factories?</span>
            <span style={{ font: "400 22px 'Instrument Serif',serif", color: "#C0392F", flex: "none" }} aria-hidden="true">+</span>
          </a>
        </h2>
        {/* Rendered even when collapsed, and hidden with the `hidden`
            attribute rather than unmounted, so faq-a-2 always exists for the
            question's aria-controls to point at. `hidden` is display:none, so
            it costs no space and no pixels. */}
        <p id="faq-a-2" hidden={open !== 2} role="region" aria-labelledby="faq-q-2" style={{ font: "400 15px/1.75 Archivo", color: "#3A332E", margin: "0 0 26px", maxWidth: "660px" }}>No. It's the single thing my business depends on. You pay the factory directly at the negotiated price, you see their invoice, and my fee is separate and agreed in advance. If a supplier offers me a rebate to steer you their way, I tell you it happened.</p>
      </div>
      <div style={{ borderBottom: "1px solid rgba(26,22,20,.14)" }}>
        <h2 style={{ margin: "0", font: "inherit" }}>
          <a className="hv-red" href="#faq-a-3" role="button" id="faq-q-3" aria-expanded={open === 3} aria-controls="faq-a-3" onClick={toggle(3)} onKeyDown={onKey(3)} style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "baseline", padding: "22px 0", textDecoration: "none", color: "#1A1614" }}>
            <span style={{ font: "400 25px/1.3 'Instrument Serif',serif" }}>What's the smallest order you'll take on?</span>
            <span style={{ font: "400 22px 'Instrument Serif',serif", color: "#C0392F", flex: "none" }} aria-hidden="true">+</span>
          </a>
        </h2>
        {/* Rendered even when collapsed, and hidden with the `hidden`
            attribute rather than unmounted, so faq-a-3 always exists for the
            question's aria-controls to point at. `hidden` is display:none, so
            it costs no space and no pixels. */}
        <p id="faq-a-3" hidden={open !== 3} role="region" aria-labelledby="faq-q-3" style={{ font: "400 15px/1.75 Archivo", color: "#3A332E", margin: "0 0 26px", maxWidth: "660px" }}>My minimum fee is US$600, so orders under about US$8,000 start to feel expensive as a percentage. For small trial quantities the Yiwu market route is usually the better fit — we buy, check and consolidate there, and you can test ten products for the price of one container.</p>
      </div>
      <div style={{ borderBottom: "1px solid rgba(26,22,20,.14)" }}>
        <h2 style={{ margin: "0", font: "inherit" }}>
          <a className="hv-red" href="#faq-a-4" role="button" id="faq-q-4" aria-expanded={open === 4} aria-controls="faq-a-4" onClick={toggle(4)} onKeyDown={onKey(4)} style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "baseline", padding: "22px 0", textDecoration: "none", color: "#1A1614" }}>
            <span style={{ font: "400 25px/1.3 'Instrument Serif',serif" }}>Who owns the tooling and the design?</span>
            <span style={{ font: "400 22px 'Instrument Serif',serif", color: "#C0392F", flex: "none" }} aria-hidden="true">+</span>
          </a>
        </h2>
        {/* Rendered even when collapsed, and hidden with the `hidden`
            attribute rather than unmounted, so faq-a-4 always exists for the
            question's aria-controls to point at. `hidden` is display:none, so
            it costs no space and no pixels. */}
        <p id="faq-a-4" hidden={open !== 4} role="region" aria-labelledby="faq-q-4" style={{ font: "400 15px/1.75 Archivo", color: "#3A332E", margin: "0 0 26px", maxWidth: "660px" }}>You do, and I put it in the contract in both languages before any mould is cut — including the right to move the tooling to another factory. I'll also register your design in China where it's worth doing; it costs little and it's the only thing that helps if a copy appears.</p>
      </div>
      <div style={{ borderBottom: "1px solid rgba(26,22,20,.14)" }}>
        <h2 style={{ margin: "0", font: "inherit" }}>
          <a className="hv-red" href="#faq-a-5" role="button" id="faq-q-5" aria-expanded={open === 5} aria-controls="faq-a-5" onClick={toggle(5)} onKeyDown={onKey(5)} style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "baseline", padding: "22px 0", textDecoration: "none", color: "#1A1614" }}>
            <span style={{ font: "400 25px/1.3 'Instrument Serif',serif" }}>What happens if a batch fails inspection?</span>
            <span style={{ font: "400 22px 'Instrument Serif',serif", color: "#C0392F", flex: "none" }} aria-hidden="true">+</span>
          </a>
        </h2>
        {/* Rendered even when collapsed, and hidden with the `hidden`
            attribute rather than unmounted, so faq-a-5 always exists for the
            question's aria-controls to point at. `hidden` is display:none, so
            it costs no space and no pixels. */}
        <p id="faq-a-5" hidden={open !== 5} role="region" aria-labelledby="faq-q-5" style={{ font: "400 15px/1.75 Archivo", color: "#3A332E", margin: "0 0 26px", maxWidth: "660px" }}>Nothing ships. You get the photo report the same day with defects classified as critical, major or minor, and a recommendation. Usually the factory reworks at their cost — that's why we hold the final payment until after inspection. If they refuse and I can't fix it, I refund my fee on that order and help you claim.</p>
      </div>
      <div style={{ borderBottom: "1px solid rgba(26,22,20,.14)" }}>
        <h2 style={{ margin: "0", font: "inherit" }}>
          <a className="hv-red" href="#faq-a-6" role="button" id="faq-q-6" aria-expanded={open === 6} aria-controls="faq-a-6" onClick={toggle(6)} onKeyDown={onKey(6)} style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "baseline", padding: "22px 0", textDecoration: "none", color: "#1A1614" }}>
            <span style={{ font: "400 25px/1.3 'Instrument Serif',serif" }}>How do payments work, and is it safe?</span>
            <span style={{ font: "400 22px 'Instrument Serif',serif", color: "#C0392F", flex: "none" }} aria-hidden="true">+</span>
          </a>
        </h2>
        {/* Rendered even when collapsed, and hidden with the `hidden`
            attribute rather than unmounted, so faq-a-6 always exists for the
            question's aria-controls to point at. `hidden` is display:none, so
            it costs no space and no pixels. */}
        <p id="faq-a-6" hidden={open !== 6} role="region" aria-labelledby="faq-q-6" style={{ font: "400 15px/1.75 Archivo", color: "#3A332E", margin: "0 0 26px", maxWidth: "660px" }}>Standard terms are 30% deposit on order and 70% after inspection passes, paid by T/T to the factory's own corporate account — never to a personal account, never to me. I verify the account against the business licence before you send anything. For larger orders I'll set up an L/C instead.</p>
      </div>
      <div style={{ borderBottom: "1px solid rgba(26,22,20,.14)" }}>
        <h2 style={{ margin: "0", font: "inherit" }}>
          <a className="hv-red" href="#faq-a-7" role="button" id="faq-q-7" aria-expanded={open === 7} aria-controls="faq-a-7" onClick={toggle(7)} onKeyDown={onKey(7)} style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "baseline", padding: "22px 0", textDecoration: "none", color: "#1A1614" }}>
            <span style={{ font: "400 25px/1.3 'Instrument Serif',serif" }}>Can you handle certification — CE, FDA, FCC?</span>
            <span style={{ font: "400 22px 'Instrument Serif',serif", color: "#C0392F", flex: "none" }} aria-hidden="true">+</span>
          </a>
        </h2>
        {/* Rendered even when collapsed, and hidden with the `hidden`
            attribute rather than unmounted, so faq-a-7 always exists for the
            question's aria-controls to point at. `hidden` is display:none, so
            it costs no space and no pixels. */}
        <p id="faq-a-7" hidden={open !== 7} role="region" aria-labelledby="faq-q-7" style={{ font: "400 15px/1.75 Archivo", color: "#3A332E", margin: "0 0 26px", maxWidth: "660px" }}>I coordinate it with accredited labs — SGS, TÜV, Intertek — and pass the invoice through at cost plus 10% for handling. I'll also tell you early if your product needs testing you hadn't budgeted for, which is a conversation better had before tooling than after.</p>
      </div>
      <div style={{ borderBottom: "1px solid rgba(26,22,20,.14)" }}>
        <h2 style={{ margin: "0", font: "inherit" }}>
          <a className="hv-red" href="#faq-a-8" role="button" id="faq-q-8" aria-expanded={open === 8} aria-controls="faq-a-8" onClick={toggle(8)} onKeyDown={onKey(8)} style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "baseline", padding: "22px 0", textDecoration: "none", color: "#1A1614" }}>
            <span style={{ font: "400 25px/1.3 'Instrument Serif',serif" }}>Do I have to fly to China?</span>
            <span style={{ font: "400 22px 'Instrument Serif',serif", color: "#C0392F", flex: "none" }} aria-hidden="true">+</span>
          </a>
        </h2>
        {/* Rendered even when collapsed, and hidden with the `hidden`
            attribute rather than unmounted, so faq-a-8 always exists for the
            question's aria-controls to point at. `hidden` is display:none, so
            it costs no space and no pixels. */}
        <p id="faq-a-8" hidden={open !== 8} role="region" aria-labelledby="faq-q-8" style={{ font: "400 15px/1.75 Archivo", color: "#3A332E", margin: "0 0 26px", maxWidth: "660px" }}>No — standing in the factory so you don't have to is the whole job. That said, if you're committing to serious volume in one category, a three-day trip during Canton Fair usually pays for itself. I'll plan it and come with you.</p>
      </div>
      <div data-m="pad" style={{ marginTop: "44px", background: "#1A1614", color: "#F4F0E8", padding: "34px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <div>
          <div style={{ font: "400 28px 'Instrument Serif',serif", marginBottom: "8px" }}>Still have a question?</div>
          <div style={{ font: "400 14px Archivo", color: "rgba(244,240,232,.7)" }}>Ask me directly — you'll get a real answer, not a brochure.</div>
        </div>
        <Link className="hv-cream-fill" to="/contact/" style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "9px", padding: "14px 24px", background: "#C0392F", color: "#F4F0E8", font: "600 14px Archivo", textDecoration: "none", borderRadius: "3px" }}>Ask me →</Link>
      </div>
    </section>

    </>
  )
}
