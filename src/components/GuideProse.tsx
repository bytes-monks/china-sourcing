// The prose vocabulary of the guides: paragraph, subheading, list, link,
// callout, numbered checklist and data table.
//
// Beyond the canvas. The design has no article artboard, so none of these
// values is a transcription — but every one of them is a value the canvas
// already uses somewhere, so a guide reads as part of the same site rather
// than as a blog bolted onto it:
//
//   - body copy is the canvas's standfirst, `400 17px Archivo` in #3A332E,
//     opened up from 1.7 to 1.75 for a 680px measure read end to end;
//   - subheadings are Instrument Serif, the face of every canvas heading;
//   - labels are the red mono eyebrow — `500 10px JetBrains Mono`, .16em,
//     uppercase, #C0392F — and numbered items the red mono numerals of Home's
//     "Four rules I don't break";
//   - panels are #FBF9F5 on a rgba(26,22,20,.12) hairline, like /services'
//     "You receive" boxes.
//
// Inline styles only, like every page. These components ship in the guides'
// lazy chunks, and a CSS file imported from a lazy chunk is injected only once
// that chunk has loaded — after the prerendered HTML has already painted
// unstyled. Nothing here needs a stylesheet: the one hover (links) is the
// global `a:hover` rule in index.css, which applies because no link here sets
// an inline colour for it to lose to.
//
// Every tap target here is either inline in running text (a <p> or <li>, which
// WCAG 2.5.8 exempts and scripts/check-mobile.mjs recognises) or sized past
// 24px on its own. The table's scroll box is focusable so a keyboard can scroll
// it, and keeps the browser's own focus ring.
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toHref } from '../lib/routes'

export const INK = '#1A1614'
export const BODY = '#3A332E'
export const MUTED = '#6B6259'
export const RED = '#C0392F'
export const PANEL = '#FBF9F5'
export const HAIRLINE = '1px solid rgba(26,22,20,.12)'

/** The canvas's section eyebrow. */
export const EYEBROW: CSSProperties = {
  font: "500 10px 'JetBrains Mono',monospace",
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: RED,
}

const PARA: CSSProperties = { font: '400 17px/1.75 Archivo', color: BODY, margin: '0 0 20px' }

export function P({ children }: { children: ReactNode }) {
  return <p style={PARA}>{children}</p>
}

/** A subheading inside a section. Sections themselves are h2s, set by GuideLayout. */
export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 style={{ font: "400 24px/1.2 'Instrument Serif',serif", letterSpacing: '-.005em', color: INK, margin: '32px 0 10px' }}>
      {children}
    </h3>
  )
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong style={{ fontWeight: 600, color: INK }}>{children}</strong>
}

/**
 * A Chinese term, marked as Chinese. `lang` is what makes a screen reader
 * switch voice instead of spelling the characters out, and what lets the
 * browser pick a CJK face — Archivo has no Chinese glyphs.
 */
export function Zh({ children }: { children: ReactNode }) {
  return <span lang="zh-Hans">{children}</span>
}

const LINK: CSSProperties = {
  textDecoration: 'underline',
  textDecorationColor: 'rgba(192,57,47,.4)',
  textDecorationThickness: '1px',
  textUnderlineOffset: '3px',
}

/**
 * A link in running text.
 *
 * `to` is an internal route and goes through toHref(), so it carries the
 * trailing slash GitHub Pages serves and a `#fragment` survives —
 * `/services#freight` becomes `/services/#freight`. `href` is an external
 * site, opened in the same tab: a new window is a decision for the reader.
 *
 * No inline colour, deliberately: the global `a` / `a:hover` rules in
 * index.css already give #C0392F at rest (4.78:1 on the page, 5.16:1 on a
 * panel) and #93261E on hover, and an inline colour would switch the hover
 * off. The underline is a text decoration rather than the canvas's
 * border-bottom so it wraps with the text across a line break.
 */
export function A({ to, href, children }: { to?: string; href?: string; children: ReactNode }) {
  if (to) {
    return <Link to={toHref(to)} style={LINK}>{children}</Link>
  }
  return <a href={href} style={LINK}>{children}</a>
}

export function List({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul style={{ margin: '0 0 22px', padding: '0 0 0 22px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ font: '400 17px/1.75 Archivo', color: BODY, margin: '0 0 8px', paddingLeft: '4px' }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

/**
 * Numbered points with a bold lead-in, in the shape of Home's "Four rules I
 * don't break": red mono numeral, a short title, the explanation under it.
 */
export function Checklist({ items }: { items: readonly { title: string; body: ReactNode }[] }) {
  return (
    <ol style={{ listStyle: 'none', margin: '4px 0 26px', padding: '0', borderTop: HAIRLINE }}>
      {items.map((item, i) => (
        <li key={item.title} style={{ display: 'flex', gap: '18px', padding: '16px 0', borderBottom: HAIRLINE }}>
          <span aria-hidden="true" style={{ font: "500 11px 'JetBrains Mono',monospace", color: RED, flex: 'none', paddingTop: '6px' }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <div style={{ minWidth: '0' }}>
            <div style={{ font: '600 15.5px/1.5 Archivo', color: INK, marginBottom: '4px' }}>{item.title}</div>
            <div style={{ font: '400 15.5px/1.7 Archivo', color: BODY }}>{item.body}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** A boxed aside inside the copy: a worked example, a rule of thumb, a caution. */
export function Callout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ background: PANEL, border: HAIRLINE, borderLeft: `2px solid ${RED}`, padding: '20px 24px 4px', margin: '6px 0 28px' }}>
      <div style={{ ...EYEBROW, marginBottom: '10px' }}>{label}</div>
      <div style={{ font: '400 15.5px/1.7 Archivo', color: BODY }}>{children}</div>
    </div>
  )
}

/** A paragraph inside a Callout: the Callout's own size, with room under it. */
export function CalloutP({ children }: { children: ReactNode }) {
  return <p style={{ margin: '0 0 16px' }}>{children}</p>
}

const TH: CSSProperties = {
  font: "500 10px/1.5 'JetBrains Mono',monospace",
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: MUTED,
  textAlign: 'left',
  verticalAlign: 'bottom',
  padding: '14px 16px 12px',
  borderBottom: HAIRLINE,
}

const TD: CSSProperties = {
  font: '400 14px/1.55 Archivo',
  color: BODY,
  textAlign: 'left',
  verticalAlign: 'top',
  padding: '13px 16px',
  borderTop: HAIRLINE,
}

/**
 * A data table that can never widen the page.
 *
 * The table keeps a `minWidth` it can be read at and scrolls sideways inside
 * its own box when the column is narrower than that — which on a 320px phone
 * it always is. The box is the scroll container scripts/check-mobile.mjs
 * measures a table's cells against, so the page itself stays inside the
 * screen. It takes focus (tabIndex 0, the browser's focus ring left alone) so
 * the arrow keys can scroll it, and it is a named region so a screen reader
 * announces what the focus has landed on.
 *
 * The first cell of each row is a row header. The caption is a <figcaption>
 * outside the scroller rather than a <caption> inside it, because a caption
 * inside would be as wide as the table and scroll out of view with it.
 */
export function DataTable({
  id,
  caption,
  columns,
  rows,
  minWidth = '640px',
  note,
}: {
  id: string
  caption: string
  columns: readonly string[]
  rows: readonly (readonly ReactNode[])[]
  minWidth?: string
  note?: ReactNode
}) {
  const captionId = `${id}-caption`
  return (
    <figure style={{ margin: '8px 0 30px' }}>
      <figcaption id={captionId} style={{ ...EYEBROW, marginBottom: '12px' }}>{caption}</figcaption>
      <div
        role="region"
        aria-labelledby={captionId}
        tabIndex={0}
        style={{ overflowX: 'auto', background: PANEL, border: HAIRLINE }}
      >
        <table aria-labelledby={captionId} style={{ borderCollapse: 'collapse', width: '100%', minWidth }}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c} scope="col" style={TH}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) =>
                  c === 0 ? (
                    <th key={c} scope="row" style={{ ...TD, font: '600 14px/1.55 Archivo', color: INK, whiteSpace: 'nowrap' }}>{cell}</th>
                  ) : (
                    <td key={c} style={TD}>{cell}</td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p style={{ font: '400 13.5px/1.65 Archivo', color: MUTED, margin: '12px 0 0' }}>{note}</p>}
    </figure>
  )
}
