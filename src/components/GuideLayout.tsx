// The frame every guide is set in: breadcrumb, headline, byline and table of
// contents across the top; the sections in a 680px column with "The short
// version" beside them; the other guides underneath.
//
// Beyond the canvas — there is no article artboard, so nothing here is
// pixel-diffed — but it is built from the canvas's own parts: the page header
// is /faq's and /process's (red mono eyebrow, Instrument Serif headline, a
// hairline under the section), the table of contents is a /services "You
// receive" panel, the summary is the dark panel of /process's "What I need
// from you", and the related guides are Home's service cards.
//
// Layout without media queries, because a lazy page cannot bring a stylesheet
// (see GuideProse.tsx). Both rows are the same wrapping flex pair — a main
// column that grows (`999 1 560px`) and a side column that does not
// (`1 1 280px`) — so on a wide screen the side column is 280px and lines up
// from the header to the body, and on anything narrower than the two bases
// plus the gap (about 940px) each wraps under its main column at full width.
// No breakpoint to keep in step with mobile.css; the content decides.
//
// The summary panel is `position: sticky`, and that is safe at every width for
// a reason worth writing down. Side by side, it sticks beside the text as the
// reader scrolls. Wrapped, it is the last thing in its flex container, and a
// sticky element is only ever moved within its containing block — already at
// the bottom of that block, there is nowhere for it to move to. It cannot
// float over the text on a phone, so it needs no breakpoint to switch it off.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toHref } from '../lib/routes'
import { GUIDES, GUIDES_CRUMB, GUIDES_PATH, formatDate, guideByKey } from '../lib/guides'
import { EYEBROW, HAIRLINE, INK, MUTED, PANEL, RED, BODY } from './GuideProse'

export interface GuideSection {
  /** The h2's id, and the table of contents' `#fragment`. Stable: people link to these. */
  id: string
  title: string
  body: ReactNode
}

export interface GuideSummary {
  points: readonly ReactNode[]
  /** The service this guide is about, as a button. */
  cta: { label: string; to: string }
  /** A mono line under the button — a price or a turnaround the site already prints. */
  note?: string
  /** A second, quieter link. */
  more?: { label: string; to: string }
}

/**
 * Clears the sticky masthead (~73px at desktop) when the browser jumps to a
 * section, with room to spare. Below 860px the masthead is static and this is
 * only a little extra air above the heading.
 */
const SCROLL_MARGIN = '96px'

const SIDE = { flex: '1 1 280px', minWidth: '0' } as const
const MAIN = { flex: '999 1 560px', minWidth: '0' } as const

/** The breadcrumb's links: 10px mono is ~13px tall, so padding takes it past 24px without moving the line. */
const CRUMB_LINK = {
  display: 'inline-block',
  padding: '7px 0',
  margin: '-7px 0',
  color: RED,
  textDecoration: 'none',
} as const

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: '22px' }}>
      <ol style={{ ...EYEBROW, listStyle: 'none', margin: '0', padding: '0', display: 'flex', flexWrap: 'wrap', gap: '6px 10px', color: MUTED }}>
        <li><Link className="hv-ink-text" to="/" style={CRUMB_LINK}>Home</Link></li>
        <li aria-hidden="true">/</li>
        <li><Link className="hv-ink-text" to={toHref(GUIDES_PATH)} style={CRUMB_LINK}>{GUIDES_CRUMB}</Link></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  )
}

function Contents({ sections }: { sections: readonly GuideSection[] }) {
  return (
    <nav data-m="pad" aria-labelledby="guide-contents" style={{ ...SIDE, background: PANEL, border: HAIRLINE, padding: '24px 26px 12px' }}>
      <div id="guide-contents" style={{ ...EYEBROW, marginBottom: '8px' }}>In this guide</div>
      <ol style={{ listStyle: 'none', margin: '0', padding: '0' }}>
        {sections.map((s, i) => (
          <li key={s.id} style={{ borderTop: i ? '1px solid rgba(26,22,20,.08)' : 'none' }}>
            {/* A plain fragment link, not a <Link>: the browser does the jump
                itself, the router hears of it as a POP, and ScrollToTop
                leaves a same-page POP alone. */}
            <a className="hv-red" href={`#${s.id}`} style={{ display: 'flex', gap: '14px', padding: '9px 0', color: INK, textDecoration: 'none', font: '400 14.5px/1.45 Archivo' }}>
              <span aria-hidden="true" style={{ font: "500 10.5px/2 'JetBrains Mono',monospace", color: RED, flex: 'none' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{s.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Summary({ summary }: { summary: GuideSummary }) {
  return (
    <aside
      data-m="pad"
      aria-label="The short version"
      style={{ ...SIDE, alignSelf: 'flex-start', position: 'sticky', top: SCROLL_MARGIN, marginTop: '44px', background: INK, color: '#F4F0E8', padding: '28px 28px 24px' }}
    >
      <div style={{ ...EYEBROW, color: '#E2857C', marginBottom: '6px' }}>The short version</div>
      <ol style={{ listStyle: 'none', margin: '0 0 22px', padding: '0' }}>
        {summary.points.map((point, i) => (
          <li key={i} style={{ display: 'flex', gap: '14px', padding: '12px 0', borderBottom: '1px solid rgba(244,240,232,.14)', font: '400 14px/1.6 Archivo', color: 'rgba(244,240,232,.86)' }}>
            <span aria-hidden="true" style={{ font: "500 10.5px/2.1 'JetBrains Mono',monospace", color: '#E2857C', flex: 'none' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ol>
      <Link
        className="hv-cream-fill"
        to={toHref(summary.cta.to)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 18px', background: RED, color: '#F4F0E8', font: '600 14px Archivo', textDecoration: 'none', borderRadius: '3px' }}
      >
        {summary.cta.label}<span style={{ fontSize: '16px', lineHeight: '1' }} aria-hidden="true">→</span>
      </Link>
      {summary.note && (
        <div style={{ font: "500 10px/1.6 'JetBrains Mono',monospace", letterSpacing: '.06em', color: 'rgba(244,240,232,.62)', marginTop: '12px' }}>
          {summary.note}
        </div>
      )}
      {summary.more && (
        <Link
          className="hv-cream"
          to={toHref(summary.more.to)}
          style={{ display: 'inline-block', marginTop: '14px', padding: '6px 0', font: '500 13px Archivo', color: 'rgba(244,240,232,.78)', textDecoration: 'underline', textDecorationColor: 'rgba(244,240,232,.35)', textUnderlineOffset: '3px' }}
        >
          {summary.more.label}
        </Link>
      )}
    </aside>
  )
}

function Related({ currentKey }: { currentKey: string }) {
  const others = GUIDES.filter(g => g.key !== currentKey)
  return (
    <section data-m="wrap" aria-labelledby="guide-related" style={{ maxWidth: '1260px', margin: '0 auto', padding: '56px 32px 80px', borderTop: HAIRLINE }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px 24px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div>
          <div style={{ ...EYEBROW, marginBottom: '14px' }}>Keep reading</div>
          <h2 id="guide-related" style={{ font: "400 40px/1.08 'Instrument Serif',serif", letterSpacing: '-.015em', margin: '0' }}>More guides</h2>
        </div>
        <Link to={toHref(GUIDES_PATH)} style={{ display: 'inline-block', padding: '8px 0 3px', font: '600 13px Archivo', color: RED, textDecoration: 'none', borderBottom: '1px solid rgba(192,57,47,.35)' }}>All guides →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: '1px', background: 'rgba(26,22,20,.12)', border: HAIRLINE }}>
        {others.map(g => (
          // The whole card is the link, named by its headline alone and
          // described by its summary — otherwise a screen reader reads out
          // sixty words as one link name.
          <Link
            key={g.key}
            className="hv-white"
            to={toHref(g.path)}
            aria-labelledby={`related-${g.key}`}
            aria-describedby={`related-${g.key}-summary`}
            style={{ display: 'flex', flexDirection: 'column', background: PANEL, padding: '28px', color: INK, textDecoration: 'none' }}
          >
            <span style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: RED }}>{g.crumb}</span>
            <h3 id={`related-${g.key}`} style={{ font: "400 24px/1.2 'Instrument Serif',serif", margin: '14px 0 10px' }}>{g.headline}</h3>
            <p id={`related-${g.key}-summary`} style={{ font: '400 14px/1.7 Archivo', color: MUTED, margin: '0 0 20px' }}>{g.summary}</p>
            <span aria-hidden="true" style={{ marginTop: 'auto', font: '600 13px Archivo', color: RED }}>Read the guide →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function GuideLayout({
  guideKey,
  standfirst,
  sections,
  summary,
}: {
  guideKey: string
  standfirst: ReactNode
  sections: readonly GuideSection[]
  summary: GuideSummary
}) {
  const guide = guideByKey(guideKey)

  return (
    <>
      <article aria-labelledby="guide-title">
        <div data-m="wrap" style={{ maxWidth: '1260px', margin: '0 auto', padding: '56px 32px 48px', borderBottom: HAIRLINE }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px 64px', alignItems: 'flex-end' }}>
            <div style={MAIN}>
              <Breadcrumb current={guide.crumb} />
              <h1 id="guide-title" style={{ font: "400 clamp(40px,6vw,60px)/1.05 'Instrument Serif',serif", letterSpacing: '-.02em', margin: '0 0 22px', maxWidth: '820px' }}>
                {guide.headline}
              </h1>
              <p style={{ font: '400 17px/1.7 Archivo', color: BODY, maxWidth: '640px', margin: '0 0 24px' }}>{standfirst}</p>
              <p style={{ font: "500 10.5px/1.6 'JetBrains Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: MUTED, margin: '0' }}>
                By{' '}
                {/* Inline in the byline's sentence, which is the one tap-target
                    exemption WCAG 2.5.8 and check-mobile.mjs both allow. */}
                <Link rel="author" to={toHref('/about')} style={{ color: RED, textDecoration: 'none', borderBottom: '1px solid rgba(192,57,47,.35)' }}>Bachar</Link>
                {' · Guangzhou · Updated '}
                <time dateTime={guide.updated}>{formatDate(guide.updated)}</time>
              </p>
            </div>
            <Contents sections={sections} />
          </div>
        </div>

        <div data-m="wrap" style={{ maxWidth: '1260px', margin: '0 auto', padding: '0 32px 88px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 64px', alignItems: 'flex-start' }}>
            <div style={MAIN}>
              <div style={{ maxWidth: '680px' }}>
                {sections.map(s => (
                  <section key={s.id} style={{ paddingTop: '44px' }}>
                    <h2 id={s.id} style={{ font: "400 34px/1.15 'Instrument Serif',serif", letterSpacing: '-.01em', color: INK, margin: '0 0 18px', scrollMarginTop: SCROLL_MARGIN }}>
                      {s.title}
                    </h2>
                    {s.body}
                  </section>
                ))}
              </div>
            </div>
            <Summary summary={summary} />
          </div>
        </div>
      </article>

      <Related currentKey={guideKey} />
    </>
  )
}
