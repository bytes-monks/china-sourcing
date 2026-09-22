// The /guides/ index: the three guides, each with a summary, what it covers
// and who it is for.
//
// Beyond the canvas — there is no artboard for it, so it is not pixel-diffed —
// but every part is a canvas part: the page header is /services' (eyebrow,
// Instrument Serif headline, standfirst, a hairline under the section), each
// guide is a /services row (red mono number, 34px serif heading, mono chips,
// and a "You receive"-style panel on the right), and the closing panel is the
// dark "Still have a question?" box at the foot of /faq. `data-m="stack"` is
// the mobile layer's existing token for a fixed multi-track grid that has to
// become one column, so the rows collapse exactly as /services' do.
//
// The copy is data from src/lib/guides.ts — the same headlines the guides'
// <h1>s and the CollectionPage's ItemList print, so the three cannot disagree.
import { Link } from 'react-router-dom'
import { toHref } from '../../lib/routes'
import { GUIDES, formatDate } from '../../lib/guides'
import { BODY, EYEBROW, HAIRLINE, INK, MUTED, PANEL, RED } from '../../components/GuideProse'

const CHIP = {
  font: "500 11px 'JetBrains Mono',monospace",
  color: RED,
  border: '1px solid rgba(192,57,47,.3)',
  padding: '6px 11px',
  letterSpacing: '.04em',
} as const

export default function GuidesIndex() {
  return (
    <>
      <section data-m="wrap" style={{ maxWidth: '1260px', margin: '0 auto', padding: '68px 32px 44px', borderBottom: HAIRLINE }}>
        <div style={{ ...EYEBROW, marginBottom: '18px' }}>Guides</div>
        <h1 style={{ font: "400 clamp(40px,6vw,60px)/1.05 'Instrument Serif',serif", letterSpacing: '-.02em', margin: '0 0 22px', maxWidth: '820px' }}>
          What to know before the money moves.
        </h1>
        <p style={{ font: '400 17px/1.7 Archivo', color: BODY, maxWidth: '620px', margin: '0' }}>
          Three plain-English guides to the parts of importing from China that cost the most when they
          go wrong: who you are really buying from, how the goods get checked, and where the risk sits
          on the way home. Written from Guangzhou, by the person who does the checking, with the
          numbers left in.
        </p>
      </section>

      <section data-m="wrap" aria-label="All guides" style={{ maxWidth: '1260px', margin: '0 auto', padding: '8px 32px 44px' }}>
        <ol style={{ listStyle: 'none', margin: '0', padding: '0' }}>
          {GUIDES.map((g, i) => (
            <li
              key={g.key}
              data-m="stack"
              style={{ borderBottom: HAIRLINE, padding: '44px 0', display: 'grid', gridTemplateColumns: 'minmax(0,60px) minmax(0,1.3fr) minmax(0,1fr)', gap: '32px', alignItems: 'start' }}
            >
              <div aria-hidden="true" style={{ font: "500 13px 'JetBrains Mono',monospace", color: RED, paddingTop: '8px' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ minWidth: '0' }}>
                <h2 style={{ font: "400 34px/1.1 'Instrument Serif',serif", margin: '0 0 14px' }}>
                  <Link className="hv-red" to={toHref(g.path)} style={{ color: INK, textDecoration: 'none' }}>{g.headline}</Link>
                </h2>
                <p style={{ font: '400 15px/1.7 Archivo', color: BODY, margin: '0 0 18px', maxWidth: '560px' }}>{g.summary}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {g.topics.map(t => (
                    <span key={t} style={CHIP}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ background: PANEL, border: HAIRLINE, padding: '24px' }}>
                <div style={{ font: "500 9.5px 'JetBrains Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: MUTED, marginBottom: '12px' }}>Read this if</div>
                <div style={{ font: '400 14px/1.7 Archivo', color: INK }}>{g.readIf}</div>
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(26,22,20,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px 16px', flexWrap: 'wrap' }}>
                  <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: MUTED, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                    Updated <time dateTime={g.updated}>{formatDate(g.updated)}</time>
                  </span>
                  {/* The visible text leads the accessible name (WCAG 2.5.3),
                      and the guide's name follows, so a list of links read
                      out of context is not three identical "Read the guide"s. */}
                  <Link
                    to={toHref(g.path)}
                    aria-label={`Read the guide: ${g.crumb}`}
                    style={{ display: 'inline-block', padding: '8px 0 3px', font: '600 13px Archivo', color: RED, textDecoration: 'none', borderBottom: '1px solid rgba(192,57,47,.35)' }}
                  >
                    Read the guide →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section data-m="wrap" style={{ maxWidth: '1260px', margin: '0 auto', padding: '0 32px 80px' }}>
        <div data-m="pad" style={{ background: INK, color: '#F4F0E8', padding: '34px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ font: "400 28px 'Instrument Serif',serif", marginBottom: '8px' }}>Have a question these don't answer?</div>
            {/* A <p>, not a <div>: the FAQ link is inline in a sentence, the
                one tap-target exemption check-mobile.mjs allows. */}
            <p style={{ font: '400 14px/1.6 Archivo', color: 'rgba(244,240,232,.7)', margin: '0' }}>
              Ask me directly — you'll get a real answer, not a brochure. The <Link className="hv-cream" to={toHref('/faq')} style={{ color: 'rgba(244,240,232,.7)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>FAQ</Link> covers the questions I get in the first call.
            </p>
          </div>
          <Link className="hv-cream-fill" to={toHref('/contact')} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '14px 24px', background: RED, color: '#F4F0E8', font: '600 14px Archivo', textDecoration: 'none', borderRadius: '3px' }}>
            Ask me →
          </Link>
        </div>
      </section>
    </>
  )
}
