// Sticky masthead: wordmark, primary nav, quote CTA.
// Styles are copied verbatim from the design canvas. The seven nav links are
// identical apart from their label and target, so they are mapped from
// NAV_ROUTES rather than repeated.
import { Link, useLocation } from 'react-router-dom'
import { NAV_ROUTES, normalizePath } from '../lib/routes'

const NAV_LINK: React.CSSProperties = {
  position: 'relative',
  padding: '9px 12px',
  font: '500 13px Archivo',
  color: '#1A1614',
  textDecoration: 'none',
  borderRadius: '4px',
}

/** The 2px rule under the current page's nav item. */
const ACTIVE_RULE: React.CSSProperties = {
  position: 'absolute',
  left: '12px',
  right: '12px',
  bottom: '2px',
  height: '2px',
  background: '#C0392F',
}

export default function SiteHeader() {
  const { pathname } = useLocation()

  return (
    <header data-m="header" style={{ position: "sticky", top: "0", zIndex: "40", background: "rgba(244,240,232,.93)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(26,22,20,.12)" }}>
      <div data-m="header-row" style={{ maxWidth: "1260px", margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "nowrap" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", flex: "none" }}>
          <span style={{ width: "38px", height: "38px", background: "#C0392F", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", borderRadius: "3px", transform: "rotate(-3deg)" }}>
            <span style={{ font: "400 24px/1 'Instrument Serif',serif", color: "#F4F0E8" }}>B</span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
            <span style={{ font: "400 22px/1 'Instrument Serif',serif", color: "#1A1614", letterSpacing: "-.01em" }}>Bachar</span>
            <span style={{ font: "500 8.5px 'JetBrains Mono',monospace", letterSpacing: ".18em", textTransform: "uppercase", color: "#C0392F", marginTop: "4px" }}>The China Guy</span>
          </span>
        </Link>
        <nav data-m="nav" style={{ display: "flex", gap: "2px", alignItems: "center", marginLeft: "auto", flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 auto", minWidth: "0" }}>
          {NAV_ROUTES.map(route => (
            <Link key={route.path} className="hv-red-wash" to={route.path} style={NAV_LINK}>
              {route.nav}
              {normalizePath(pathname) === route.path && <span style={ACTIVE_RULE} />}
            </Link>
          ))}
        </nav>
        <Link data-m="header-cta" className="hv-ink" to="/contact" style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "9px", padding: "12px 20px", background: "#C0392F", color: "#F4F0E8", font: "600 13px Archivo", textDecoration: "none", borderRadius: "3px" }}>Get a free quote<span style={{ fontSize: "14px", lineHeight: "1" }} aria-hidden="true">→</span></Link>
      </div>
    </header>
  )
}
