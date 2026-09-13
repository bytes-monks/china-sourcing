// Floating WhatsApp / WeChat pills, bottom-right.
// In the canvas these sat behind `sticky = stickyContact !== false && page !==
// 'contact'`; the layout owns that condition now, so the component just draws.
// Styles are copied verbatim from the design canvas.
import { Link } from 'react-router-dom'

export default function StickyContact() {
  return (
    <div data-m="pills" style={{ position: "fixed", right: "22px", bottom: "22px", zIndex: "60", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
      <Link className="hv-whatsapp" to="/contact" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px 12px 14px", background: "#25D366", color: "#fff", textDecoration: "none", boxShadow: "0 10px 26px rgba(26,22,20,.3)", font: "600 13px Archivo", borderRadius: "999px" }}><span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }} aria-hidden="true">✆</span>WhatsApp Bachar</Link>
      <Link className="hv-ink" to="/contact" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px 12px 14px", background: "#F4F0E8", color: "#1A1614", border: "1px solid rgba(26,22,20,.15)", textDecoration: "none", boxShadow: "0 10px 26px rgba(26,22,20,.15)", font: "600 13px Archivo", borderRadius: "999px" }}><span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#E9E0CF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#C0392F" }} aria-hidden="true">微</span>WeChat</Link>
    </div>
  )
}
