// Floating WhatsApp / WeChat pills, bottom-right.
// In the canvas these sat behind `sticky = stickyContact !== false && page !==
// 'contact'`; the layout owns that condition now, so the component just draws.
// Styles are copied verbatim from the design canvas, with one declared change.
//
// In the canvas both pills went to the contact page, where the number was
// plain text — so "WhatsApp Bachar" was two taps and a retype away from
// WhatsApp. The WhatsApp pill now opens a chat directly (wa.me, with a first
// line already written, which the visitor still sends themselves), and the
// WeChat pill lands on the contact page's WeChat row, where the ID copies in
// one tap. Both are still <a> elements with the canvas's box, so neither moves
// a pixel.
//
// whatsapp-pill-contrast (declared divergence): the canvas set the label in
// white on #25D366, which is 1.98:1 — the lowest-contrast text on the site, on
// nine pages of ten. It is ink now, 9.1:1; `.hv-whatsapp:hover` in index.css
// keeps its #1FB855 and moves to ink with it. The icon disc keeps its
// translucent white.
import { Link } from 'react-router-dom'
import { whatsappUrl } from '../lib/site'

const HELLO = whatsappUrl('Hi Bachar — I found you on your website.')

export default function StickyContact() {
  return (
    <div data-m="pills" style={{ position: "fixed", right: "22px", bottom: "22px", zIndex: "60", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
      <a className="hv-whatsapp" href={HELLO} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Bachar (opens in a new tab)" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px 12px 14px", background: "#25D366", color: "#1A1614", textDecoration: "none", boxShadow: "0 10px 26px rgba(26,22,20,.3)", font: "600 13px Archivo", borderRadius: "999px" }}><span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }} aria-hidden="true">✆</span>WhatsApp Bachar</a>
      <Link className="hv-ink" to="/contact/#wechat" aria-label="WeChat — Bachar's WeChat ID, on the contact page" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px 12px 14px", background: "#F4F0E8", color: "#1A1614", border: "1px solid rgba(26,22,20,.15)", textDecoration: "none", boxShadow: "0 10px 26px rgba(26,22,20,.15)", font: "600 13px Archivo", borderRadius: "999px" }}><span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#E9E0CF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#C0392F" }} aria-hidden="true">微</span>WeChat</Link>
    </div>
  )
}
