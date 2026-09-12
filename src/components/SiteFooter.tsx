// Site footer: wordmark and contact block, three link columns, legal strip.
// Styles are copied verbatim from the design canvas. The three columns are
// structurally identical, so they are mapped from COLUMNS.
import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, CONTACT_PHONE } from '../lib/site'

const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: 'Services',
    links: [
      { label: 'Sourcing & vetting', to: '/services' },
      { label: 'Quality inspection', to: '/services' },
      { label: 'Factory audits', to: '/audit' },
      { label: 'Freight & shipping', to: '/services' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About me', to: '/about' },
      { label: 'How it works', to: '/process' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Who I help', to: '/industries' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Sample audit report', to: '/audit' },
      { label: 'Mobile views', to: '/mobile' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

const HEADING: React.CSSProperties = {
  font: "500 9px 'JetBrains Mono',monospace",
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: 'rgba(244,240,232,.4)',
  marginBottom: '16px',
}

const COLUMN: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '9px',
  font: '400 13.5px Archivo',
}

const LINK: React.CSSProperties = { color: 'rgba(244,240,232,.62)', textDecoration: 'none' }

const LEGAL_LINK: React.CSSProperties = { color: 'rgba(244,240,232,.42)', textDecoration: 'none' }

export default function SiteFooter() {
  return (
    <footer style={{ background: "#1A1614", color: "rgba(244,240,232,.62)" }}>
      <div style={{ maxWidth: "1260px", margin: "0 auto", padding: "56px 32px 28px", display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(3,minmax(0,1fr))", gap: "36px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "18px" }}>
            <span style={{ width: "32px", height: "32px", background: "#C0392F", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "3px" }}>
              <span style={{ font: "400 20px/1 'Instrument Serif',serif", color: "#F4F0E8" }}>B</span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
              <span style={{ font: "400 19px 'Instrument Serif',serif", color: "#F4F0E8" }}>Bachar</span>
              <span style={{ font: "500 8px 'JetBrains Mono',monospace", letterSpacing: ".18em", textTransform: "uppercase", color: "#E2857C", marginTop: "4px" }}>The China Guy</span>
            </span>
          </div>
          <p style={{ font: "400 13.5px/1.7 Archivo", margin: "0 0 18px", maxWidth: "300px" }}>End-to-end sourcing for buyers who want a person on the ground rather than a listing on a platform.</p>
          <div style={{ font: "400 11.5px/1.9 'JetBrains Mono',monospace", color: "rgba(244,240,232,.5)" }}>{CONTACT_EMAIL}<br />{CONTACT_PHONE}</div>
        </div>
        {COLUMNS.map(column => (
          <div key={column.heading}>
            <div style={HEADING}>{column.heading}</div>
            <div style={COLUMN}>
              {column.links.map(link => (
                <Link key={link.label} className="hv-cream" to={link.to} style={LINK}>{link.label}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: "1260px", margin: "0 auto", padding: "20px 32px 44px", borderTop: "1px solid rgba(244,240,232,.1)", display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", font: "400 11px 'JetBrains Mono',monospace", color: "rgba(244,240,232,.42)", letterSpacing: ".04em" }}>
        {/* __BUILD_YEAR__ is defined for both the client and the SSR build, so
            the prerendered year and the hydrated one cannot disagree.
            One template literal, not `© {__BUILD_YEAR__} BACHAR…`: the latter
            splits the line into three DOM text nodes, and Chrome antialiases
            across a text-node boundary differently enough to move two pixels.
            The pixel diff caught it. */}
        <span>{`© ${__BUILD_YEAR__} BACHAR SOURCING · GUANGZHOU · YIWU · SHENZHEN`}</span>
        <span style={{ display: "flex", gap: "20px" }}>
          {/* Placeholders in the design too — no policy pages exist yet. */}
          <a className="hv-cream" href="#" style={LEGAL_LINK}>PRIVACY</a>
          <a className="hv-cream" href="#" style={LEGAL_LINK}>TERMS</a>
          <a className="hv-cream" href="#" style={LEGAL_LINK}>中文</a>
        </span>
      </div>
    </footer>
  )
}
