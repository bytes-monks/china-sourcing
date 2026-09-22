// Contact page.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html".
//
// What is not from the canvas, all of it invisible at rest:
// - the form really sends (src/lib/contact.ts), and says so only when it has;
// - the three contact details are things you can act on — a wa.me link, a
//   mailto link, and a button that copies the WeChat ID;
// - a failed send keeps everything typed and offers the same enquiry,
//   pre-written, through WhatsApp and email.
// The only visible change is declared (contact-wechat-label): the WeChat row's
// "SCAN ON MOBILE" read as a promise of a QR code there is none of, and is now
// "COPY ID", which is what the row does.

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_WECHAT, mailtoUrl, whatsappUrl } from '../lib/site'
import {
  HONEYPOT_FIELD,
  copyWeChatId,
  fallbackLinks,
  isTrapped,
  readEnquiry,
  sendEnquiry,
} from '../lib/contact'
import type { Enquiry } from '../lib/contact'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/** Which contact detail the pointer is over, for its hover underline. */
type Hot = 'whatsapp' | 'wechat' | 'email' | null

/**
 * A contact detail turned into a link, drawn exactly as the plain text it
 * replaces: colour and decoration inherit from the canvas's own <div>, which
 * also beats index.css's red `a` / `a:hover` colours, since an inline
 * declaration outranks any normal stylesheet rule. Hovered, it goes to ink and
 * underlines — the canvas has no hover for text it never made a link, so this
 * one is set here, in the palette's own ink.
 */
const detail = (hot: boolean): CSSProperties => ({
  color: hot ? "#1A1614" : "inherit",
  textDecoration: hot ? "underline" : "none",
  textUnderlineOffset: "3px",
})

/**
 * Every user-agent style a <button> brings, taken back off, so a button can
 * sit where the canvas has plain text and draw nothing of its own. `font`
 * inherits as a shorthand, which carries line-height with it — the line box the
 * text sits in is the one it had before.
 */
const BARE_BUTTON: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "0",
  borderRadius: "0",
  padding: "0",
  margin: "0",
  font: "inherit",
  color: "inherit",
  letterSpacing: "inherit",
  wordSpacing: "inherit",
  textTransform: "inherit",
  textAlign: "left",
  cursor: "pointer",
}

/**
 * The visually-hidden pattern, as AppShell's skip link uses it: present to
 * assistive technology (or to a bot), no box on screen.
 */
const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  border: "0",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
}

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle')
  const sending = status === 'sending'
  // The enquiry as last submitted (and, once a send has failed, as currently
  // typed), which is what the WhatsApp and email fallbacks are written from.
  const [draft, setDraft] = useState<Enquiry | null>(null)
  // Failed attempts so far. The failure panel stays up through a retry, so the
  // "Try again" button that started it is still in the DOM — unmount it and a
  // keyboard user's focus falls to <body>. And the count is in the panel's
  // text, so a second failure changes the alert and is announced again.
  const [failures, setFailures] = useState(0)
  // A ref, not the state: two clicks inside one frame both see the state as
  // it was before either landed, and would both send.
  const busy = useRef(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy.current) return
    const form = e.currentTarget
    // A filled honeypot is a bot. Tell it what it expects to hear, send nothing.
    if (isTrapped(form)) {
      setStatus('sent')
      return
    }
    const fields = readEnquiry(form)
    busy.current = true
    setDraft(fields)
    setStatus('sending')
    const delivered = await sendEnquiry(fields)
    busy.current = false
    if (delivered) {
      setStatus('sent')
    } else {
      setFailures(n => n + 1)
      setStatus('error')
    }
  }

  // Once a send has failed, keep the fallback links in step with the form, so
  // a correction made after the failure is in the message the visitor sends.
  const syncDraft = (e: FormEvent<HTMLFormElement>) => {
    if (failures > 0 && !busy.current) setDraft(readEnquiry(e.currentTarget))
  }

  // The form is torn out of the DOM on submit, which drops focus to <body> and
  // tells a screen reader nothing. The panel that replaces it is a live region
  // and takes focus itself; tabIndex={-1} makes it focusable without putting it
  // in the tab order, so nothing beyond the canvas becomes tabbable.
  const confirmRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (status === 'sent') confirmRef.current?.focus()
  }, [status])

  // The WeChat ID has nothing to link to — WeChat has no public
  // add-by-ID URL — so the row copies it, and says so for a moment.
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no')
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(copiedTimer.current), [])
  const copyWeChat = async () => {
    const ok = await copyWeChatId()
    setCopied(ok ? 'yes' : 'failed')
    clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied('no'), ok ? 2000 : 6000)
  }

  const [hot, setHot] = useState<Hot>(null)
  const hover = (which: Exclude<Hot, null>) => ({
    onMouseEnter: () => setHot(which),
    onMouseLeave: () => setHot(null),
  })

  // The sticky WeChat pill on every other page links to /contact/#wechat.
  // ScrollToTop resets the scroll on every pathname change — including this
  // one, after the browser has already jumped to the anchor on a cold load —
  // and runs before this effect does, so the row is brought back here.
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#wechat') document.getElementById('wechat')?.scrollIntoView({ block: 'center' })
  }, [hash])

  const fallback = failures > 0 && draft ? fallbackLinks(draft) : null

  return (
    <>

    <section data-m="stack wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "68px 32px 80px", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "52px", alignItems: "start" }}>
      <div>
        <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "18px" }}>Get a free quote</div>
        <h1 style={{ font: "400 58px/1 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0 0 22px" }}>Tell me what you want made.</h1>
        <p style={{ font: "400 16.5px/1.75 Archivo", color: "#3A332E", margin: "0 0 32px", maxWidth: "520px" }}>I read every enquiry myself and reply within 12 working hours — with a real assessment, not a template. No fee until you approve a quotation.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(26,22,20,.12)", border: "1px solid rgba(26,22,20,.12)", marginBottom: "32px" }}>
          <div data-m="channel" style={{ background: "#FBF9F5", padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <div style={{ font: "600 12.5px Archivo", color: "#1A1614", marginBottom: "4px" }}>WhatsApp</div>
              <div style={{ font: "400 13px 'JetBrains Mono',monospace", color: "#6B6259" }}><a data-beyond-canvas href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${CONTACT_PHONE} (opens in a new tab)`} style={detail(hot === 'whatsapp')} {...hover('whatsapp')}>{CONTACT_PHONE}</a></div>
            </div>
            <span style={{ font: "500 10px 'JetBrains Mono',monospace", color: "#F4F0E8", background: "#C0392F", padding: "5px 10px", letterSpacing: ".1em" }}>FASTEST</span>
          </div>
          {/* The whole row copies, not just the ID: its right-hand label says
              COPY ID, and a label that reads as an action gets clicked. The
              row's click is a convenience for the pointer; the <button> is the
              one control, and keyboard activation of it arrives here as the
              same bubbled click — so the button carries no handler of its own,
              or one click would copy twice. */}
          <div id="wechat" data-m="channel" onClick={copyWeChat} {...hover('wechat')} style={{ background: "#FBF9F5", padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", cursor: "pointer" }}>
            <div>
              <div style={{ font: "600 12.5px Archivo", color: "#1A1614", marginBottom: "4px" }}>WeChat</div>
              <div style={{ font: "400 13px 'JetBrains Mono',monospace", color: "#6B6259" }}><button type="button" data-beyond-canvas aria-label={`WeChat ID ${CONTACT_WECHAT} — copy to clipboard`} style={{ ...BARE_BUTTON, ...detail(hot === 'wechat') }}>{CONTACT_WECHAT}</button></div>
            </div>
            <span style={{ font: "500 10px 'JetBrains Mono',monospace", color: "#6B6259", letterSpacing: ".1em" }}>{copied === 'yes' ? 'COPIED' : 'COPY ID'}</span>
            <span data-beyond-canvas role="status" style={VISUALLY_HIDDEN}>{
              copied === 'yes' ? 'WeChat ID copied.' :
              copied === 'failed' ? `Couldn't copy automatically. The WeChat ID is ${CONTACT_WECHAT}.` : ''
            }</span>
          </div>
          <div data-m="channel" style={{ background: "#FBF9F5", padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <div style={{ font: "600 12.5px Archivo", color: "#1A1614", marginBottom: "4px" }}>Email</div>
              <div style={{ font: "400 13px 'JetBrains Mono',monospace", color: "#6B6259" }}><a data-beyond-canvas href={mailtoUrl()} style={detail(hot === 'email')} {...hover('email')}>{CONTACT_EMAIL}</a></div>
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
      <div data-m="pad" style={{ background: "#FBF9F5", border: "1px solid rgba(26,22,20,.14)", padding: "34px" }}>
        {status !== 'sent' && (
          <>
            {/* Required: name, email and the spec — the least that can be
                replied to. The canvas marks nothing as required, so neither
                does the page; the attribute is what a screen reader announces
                and what the browser checks before this handler runs.
                While a send is in flight the text fields are readOnly rather
                than disabled: disabling the field that has focus (Enter in any
                of them submits) blurs it to <body>. The submit button is
                aria-disabled for the same reason, and `busy` does the actual
                refusing. */}
            <form onSubmit={submit} onChange={syncDraft}>
              <div style={{ font: "400 27px 'Instrument Serif',serif", marginBottom: "6px" }}>Quote request</div>
              <div style={{ font: "500 10.5px 'JetBrains Mono',monospace", color: "#6B6259", marginBottom: "26px", letterSpacing: ".06em" }}>FIVE FIELDS · ATTACHMENTS CAN FOLLOW BY EMAIL</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "16px", marginBottom: "16px" }}>
                <label htmlFor="f-name" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Your name</span>
                  <input id="f-name" name="name" className="fc-red" type="text" required autoComplete="name" readOnly={sending} placeholder="Marta Ruiz" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
                <label htmlFor="f-company" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Company</span>
                  <input id="f-company" name="company" className="fc-red" type="text" autoComplete="organization" readOnly={sending} placeholder="Casa Ruiz S.L." style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "16px", marginBottom: "16px" }}>
                <label htmlFor="f-email" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Email</span>
                  <input id="f-email" name="email" className="fc-red" type="email" required autoComplete="email" readOnly={sending} placeholder="you@company.com" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
                <label htmlFor="f-destination" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Destination country</span>
                  <input id="f-destination" name="destination" className="fc-red" type="text" autoComplete="country-name" readOnly={sending} placeholder="Spain" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
              </div>
              <label htmlFor="f-need" style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "16px" }}>
                <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>What do you need?</span>
                {/* fc-red is beyond the canvas (select-focus-ring): the canvas
                    gave its focus border to every other control and forgot this
                    one, so keyboard focus on it was invisible. Focus-state only.
                    A <select> cannot be readOnly, so it is the one control that
                    is disabled while sending — nothing submits from it, so it
                    never holds focus at that moment. */}
                <select id="f-need" name="need" className="fc-red" disabled={sending} style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }}>
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
                  <input id="f-quantity" name="quantity" className="fc-red" type="text" readOnly={sending} placeholder="2,000 units" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
                <label htmlFor="f-target-price" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Target unit price</span>
                  <input id="f-target-price" name="target-price" className="fc-red" type="text" readOnly={sending} placeholder="US$4.20 FOB" style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", borderRadius: "2px" }} />
                </label>
              </div>
              <label htmlFor="f-product" style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "22px" }}>
                <span style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B6259" }}>Product & specification</span>
                <textarea id="f-product" name="product" className="fc-red" rows={4} required readOnly={sending} placeholder="18/10 stainless saucepan, 20cm, tri-ply base, walnut handle. Reference photos to follow." style={{ padding: "12px 14px", border: "1px solid rgba(26,22,20,.18)", fontSize: "14px", color: "#1A1614", background: "#fff", outline: "none", resize: "vertical", fontFamily: "Archivo,sans-serif", lineHeight: "1.6", borderRadius: "2px" }} />
              </label>
              {/* The honeypot. Out of flow and clipped to nothing, so it moves
                  no pixel; aria-hidden and tabIndex -1, so no person reaches
                  it; autoComplete off, so no browser fills it. See
                  HONEYPOT_FIELD in src/lib/contact.ts. */}
              <div data-beyond-canvas aria-hidden="true" style={VISUALLY_HIDDEN}>
                <label htmlFor="f-website" data-beyond-canvas>Leave this field empty</label>
                <input id="f-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" data-beyond-canvas />
              </div>
              <button className="hv-ink-bg" type="submit" aria-disabled={sending || undefined} aria-busy={sending || undefined} style={{ width: "100%", padding: "16px", background: "#C0392F", color: "#F4F0E8", border: "none", font: "600 14.5px Archivo", cursor: sending ? "progress" : "pointer", borderRadius: "3px" }}>{sending ? 'Sending…' : 'Send it to Bachar'}</button>
              {/* Beyond the canvas: the failure panel. The alert container is
                  always in the DOM — empty, unstyled, zero height, and its
                  margins collapse through, so the line below does not move —
                  because a live region that exists before its content arrives
                  is announced far more reliably than one inserted with it. */}
              <div role="alert" data-beyond-canvas>
                {fallback && (
                  <div style={{ marginTop: "16px", border: "1px solid rgba(192,57,47,.4)", background: "#FBF6F1", padding: "20px 22px" }}>
                    <div style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "10px" }}>{failures > 1 ? `Still not sent · attempt ${failures}` : 'Not sent'}</div>
                    <p style={{ font: "400 14px/1.65 Archivo", color: "#3A332E", margin: "0 0 16px" }}>Your enquiry didn't reach me — the form service didn't confirm it. Everything you typed is still in the form. Try again, or send the same message on WhatsApp or by email: it's written out for you.</p>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px" }}>
                      <a className="hv-whatsapp" data-beyond-canvas href={fallback.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Send it on WhatsApp (opens in a new tab)" style={{ display: "inline-flex", alignItems: "center", padding: "11px 16px", background: "#25D366", color: "#1A1614", font: "600 13px Archivo", textDecoration: "none", borderRadius: "3px" }}>Send it on WhatsApp</a>
                      <a className="hv-red-fill" data-beyond-canvas href={fallback.email} style={{ display: "inline-flex", alignItems: "center", padding: "10px 16px", border: "1px solid #C0392F", color: "#C0392F", font: "600 13px Archivo", textDecoration: "none", borderRadius: "3px" }}>Send it by email</a>
                      {/* Drawn as the canvas draws its text links (Back to
                          home, below). Written out rather than spread from
                          BARE_BUTTON: a `border` shorthand beside a
                          `borderBottom` longhand is a collision React warns
                          about on the re-render that flips `cursor`. */}
                      <button type="submit" data-beyond-canvas aria-disabled={sending || undefined} style={{ appearance: "none", background: "none", borderWidth: "0 0 1px", borderStyle: "solid", borderColor: "rgba(192,57,47,.35)", borderRadius: "0", padding: "0 0 3px", margin: "0", font: "600 13px Archivo", color: "#C0392F", cursor: sending ? "progress" : "pointer" }}>{sending ? 'Sending…' : 'Try again'}</button>
                    </div>
                  </div>
                )}
              </div>
              <p style={{ font: "400 11px/1.6 'JetBrains Mono',monospace", color: "#6B6259", margin: "14px 0 0", textAlign: "center", letterSpacing: ".03em" }}>
                {/* Beyond the canvas: the promise under the button is the one
                    place a visitor asks "what happens to this?", so it links to
                    the page that answers it. Inherits colour and decoration, so
                    it renders exactly as the canvas's plain text did. */}
                <Link data-beyond-canvas to="/privacy/" aria-label="No lists, no resale, no follow-up sequence — privacy policy" style={{ color: "inherit", textDecoration: "none" }}>NO LISTS · NO RESALE · NO FOLLOW-UP SEQUENCE</Link>
              </p>
            </form>
          </>
        )}
        {status === 'sent' && (
          <>
            <div ref={confirmRef} role="status" aria-live="polite" tabIndex={-1} style={{ textAlign: "center", padding: "44px 10px", outline: "none" }}>
              <div style={{ width: "58px", height: "58px", background: "#C0392F", color: "#F4F0E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 22px", borderRadius: "3px" }} aria-hidden="true">✓</div>
              <div style={{ font: "400 32px/1.2 'Instrument Serif',serif", marginBottom: "14px" }}>Got it — it's on my desk.</div>
              <p style={{ font: "400 14.5px/1.75 Archivo", color: "#6B6259", margin: "0 auto 26px", maxWidth: "340px" }}>You'll hear from me within 12 working hours. If it's urgent, WhatsApp me and mention your company name.</p>
              <Link data-m="textlink" to="/" style={{ font: "600 13px Archivo", color: "#C0392F", textDecoration: "none", borderBottom: "1px solid rgba(192,57,47,.35)", paddingBottom: "3px" }}>Back to home</Link>
            </div>
          </>
        )}
      </div>
    </section>

    </>
  )
}
