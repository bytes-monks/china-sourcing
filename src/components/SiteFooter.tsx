// Site footer: wordmark and contact block, three link columns, legal strip.
// Styles are copied verbatim from the design canvas. The three columns are
// structurally identical, so they are mapped from COLUMNS.
//
// Three declared divergences (ids shared with the pixel harness, which replays
// each one onto the canvas DOM before the shutter so the diff stays at zero):
//
//   footer-guides-link      Resources' third link was "Mobile views" (/mobile/),
//                           a page about the site's own responsive layer. It is
//                           now "Guides" (/guides/) — same slot, same style.
//   footer-no-chinese-link  The legal strip ended in a "中文" link to "#". There
//                           is no Chinese version of the site, so a link that
//                           promises one and goes nowhere is removed rather
//                           than kept as a dead end.
//   footer-contrast         Three greys on #1A1614 that were under the 4.5:1
//                           small text needs: the column headings (.4, 3.5:1),
//                           the legal links and the copyright line (.42,
//                           3.7:1). All three are .55 now, 5.5:1. The contact
//                           block (.5, 4.8:1) and the column links (.62, 6.7:1)
//                           already passed and are untouched.
//
// Not divergences, because they change an href and not a pixel: PRIVACY and
// TERMS became real routes, and three Services links now land on their own
// block of /services/ instead of its top. ScrollToTop does the landing — the
// services page is a lazy chunk, so the target does not exist yet at the
// moment the URL changes.
import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, CONTACT_PHONE, mailtoUrl, whatsappUrl } from '../lib/site'
import { toHref } from '../lib/routes'

const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: 'Services',
    links: [
      // The fragments are the ids on the matching blocks in Services.tsx.
      { label: 'Sourcing & vetting', to: '/services#sourcing' },
      { label: 'Quality inspection', to: '/services#inspection' },
      { label: 'Factory audits', to: '/audit' },
      { label: 'Freight & shipping', to: '/services#freight' },
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
      { label: 'Guides', to: '/guides' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

const HEADING: React.CSSProperties = {
  font: "500 9px 'JetBrains Mono',monospace",
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: 'rgba(244,240,232,.55)', // footer-contrast: canvas .4
  marginBottom: '16px',
}

const COLUMN: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '9px',
  font: '400 13.5px Archivo',
}

const LINK: React.CSSProperties = { color: 'rgba(244,240,232,.62)', textDecoration: 'none' }

// footer-contrast: canvas .42
const FOOTER_CONTACT_LINK: React.CSSProperties = { color: 'inherit', textDecoration: 'none', padding: '5px 0' }

const LEGAL_LINK: React.CSSProperties = { color: 'rgba(244,240,232,.55)', textDecoration: 'none' }

export default function SiteFooter() {
  return (
    <footer style={{ background: "#1A1614", color: "rgba(244,240,232,.62)" }}>
      <div data-m="footer-grid wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "56px 32px 28px", display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(3,minmax(0,1fr))", gap: "36px" }}>
        <div data-m="footer-brand">
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
          <div style={{ font: "400 11.5px/1.9 'JetBrains Mono',monospace", color: "rgba(244,240,232,.5)" }}>
            {/* Beyond the canvas: the canvas prints these as plain text, so on a
                phone the footer's email and number could only be copied, not
                used. Wrapped in links that inherit colour and decoration, they
                render identically. The 5px of vertical padding sits on inline
                boxes, which never affects layout, and takes each tap target
                past WCAG 2.2's 24px. data-beyond-canvas keeps them out of
                check-hover, which has no design counterpart to compare. */}
            <a data-beyond-canvas href={mailtoUrl()} style={FOOTER_CONTACT_LINK}>{CONTACT_EMAIL}</a><br />
            <a data-beyond-canvas href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${CONTACT_PHONE}`} style={FOOTER_CONTACT_LINK}>{CONTACT_PHONE}</a>
          </div>
        </div>
        {COLUMNS.map(column => (
          <div key={column.heading}>
            <div style={HEADING}>{column.heading}</div>
            <div style={COLUMN}>
              {column.links.map(link => (
                <Link key={link.label} className="hv-cream" to={toHref(link.to)} style={LINK}>{link.label}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* footer-contrast: `color` was rgba(244,240,232,.42) in the canvas. */}
      <div data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "20px 32px 44px", borderTop: "1px solid rgba(244,240,232,.1)", display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", font: "400 11px 'JetBrains Mono',monospace", color: "rgba(244,240,232,.55)", letterSpacing: ".04em" }}>
        {/* __BUILD_YEAR__ is defined for both the client and the SSR build, so
            the prerendered year and the hydrated one cannot disagree.
            One template literal, not `© {__BUILD_YEAR__} BACHAR…`: the latter
            splits the line into three DOM text nodes, and Chrome antialiases
            across a text-node boundary differently enough to move two pixels.
            The pixel diff caught it. */}
        <span>{`© ${__BUILD_YEAR__} BACHAR SOURCING · GUANGZHOU · YIWU · SHENZHEN`}</span>
        <span style={{ display: "flex", gap: "20px" }}>
          {/* `href="#"` placeholders in the canvas; real routes now. A <Link>
              renders the same <a>, so this is an href change, not a pixel one.
              The third link, 中文, is gone — see footer-no-chinese-link. */}
          <Link className="hv-cream" to={toHref('/privacy')} style={LEGAL_LINK}>PRIVACY</Link>
          <Link className="hv-cream" to={toHref('/terms')} style={LEGAL_LINK}>TERMS</Link>
        </span>
      </div>
    </footer>
  )
}
