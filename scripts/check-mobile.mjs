// The mobile gate.
//
// This is the check that replaced the 390px pixel diff. That diff used to pass
// at zero, which sounded like a fidelity result and was in fact the opposite:
// the design canvas has no breakpoints, so a clean diff at 390 only ever said
// "the build is as unresponsive as the canvas". src/mobile.css now adds the
// breakpoints the canvas does not contain, and the moment it did, there was
// nothing left at 390 to compare the build against.
//
// So this measures the build against what a phone layout has to be true of,
// rather than against a reference image. Each is a failure the site has
// actually had:
//
//   1. Nothing may be wider than the viewport. Horizontal scroll on a phone is
//      the single symptom that made the old layout unusable — the contact
//      form ran its right-hand column off the screen, and the hero's order
//      card sat 66px past the edge. A descendant of a scroll container is
//      measured against that container instead (the container itself is still
//      measured against the screen): the nav and any wide table are MEANT to
//      scroll sideways inside their own box.
//   2. The masthead holds every nav link on one row, no two links overlapping
//      each other or the wordmark, and none pushed off the left end of the
//      scroller where no swipe can reach it. The old header wrapped seven
//      links into a ~90px column that landed on top of the logo; the first
//      fix wrapped them into two rows that cost a third of the chrome.
//   3. The chrome — announcement bar plus masthead — ends within CHROME_MAX
//      px (150) of the top at phone widths (<= 560px). It was ~205px at 390,
//      which put the headline below the first thumb's-width of screen.
//   4. Every form field computes to at least 16px. Below that, iOS Safari
//      zooms the page on focus and leaves it zoomed.
//   5. Every tap target is at least 24 × 24 CSS px — WCAG 2.2 SC 2.5.8's
//      number — with one exemption: a link inline in a sentence (inside a
//      <p>, <li>, <dd>… with text around it), which the criterion also
//      exempts, because its height is the line-height of the prose it sits in.
//      A field's <label> counts as part of the field's target, because tapping
//      it focuses the field. How many targets passed by the inline exemption
//      is printed, so it cannot quietly grow into a way of passing everything.
//
//      This is deliberately stricter than the criterion, which also passes an
//      undersized target whose 24px circle touches no neighbour. The footer's
//      link lists were 15px tall on a 24.0px pitch: circles exactly touching,
//      a pass by that rule to the decimal, and a list no thumb could use. A
//      gate that waved that through would not have been worth writing.
//   6. Scrolled to the bottom, the fixed contact pills cover no content — no
//      line of text, no image, no target. At phone widths they are a
//      full-width bar and the page reserves its height below the footer; if
//      the two ever drift apart, the legal strip ends up underneath it. On a
//      tablet they float, and used to sit on PRIVACY and TERMS with no scroll
//      left to move them. (Above 860px they are the canvas's own overlay and
//      nothing is asserted: the canvas puts them over TERMS at 1440.)
//   7. Tabbing through the page, no focused element ends up under the pills —
//      WCAG 2.2 SC 2.4.11, Focus Not Obscured. A browser scrolls a focused
//      element into view only if it is outside the viewport, and "behind a
//      fixed bar" is inside it: before mobile.css set scroll-padding-bottom,
//      40 of 358 focus stops across five routes landed behind the bar. This
//      presses real Tab keys, because focus() and a keypress do not scroll by
//      the same rules.
//
// It covers every prerendered route, not only the ten canvas artboards: the
// list is read from dist/ itself (each dist/**/index.html is one route, by
// construction of prerender.mjs) plus dist/404.html, and cross-checked against
// sitemap.xml so a route the walk missed is an error rather than a silent pass.
// A page added tomorrow is gated tomorrow, without anyone editing this file.
//
// There is deliberately no minimum-font-size assertion on TEXT. The canvas
// sets its mono eyebrows and the wordmark's strapline at 8.5–11px everywhere,
// at every width, so a floor would flag thirty elements a page that are
// exactly as the design intends and would say nothing about the mobile layer.
// Form fields are the exception because their floor is not about legibility:
// it is the number at which a browser changes what the page does.
//
// Widths: 390 is the common modern phone, 320 the narrowest still worth
// supporting — and the one that catches a layout that only fits by luck.
//
//   node scripts/check-mobile.mjs
//   WIDTHS=360,414 node scripts/check-mobile.mjs
//   CHROME_MAX=160 node scripts/check-mobile.mjs
import fs from 'node:fs'
import path from 'node:path'
import { serve, browser, settle } from './pixel-lib.mjs'

const PORT = 4602
const DIR = process.env.DIR || 'dist'
const WIDTHS = (process.env.WIDTHS || '390,320').split(',').map(Number)
const HEIGHT = 900
/** The chrome budget, asserted at and below PHONE. */
const CHROME_MAX = Number(process.env.CHROME_MAX || 150)
/** mobile.css's phone breakpoint: where the bar and the one-line top bar start. */
const PHONE = 560

if (!fs.existsSync(DIR)) throw new Error(`${DIR}/ does not exist — run \`npm run build\` first`)
if (!fs.existsSync(path.join(DIR, '404.html'))) {
  throw new Error(
    `${DIR}/ is not prerendered — there is no 404.html, so this is \`build:spa\` output with one\n` +
    '  index.html for every route. Run `npm run build`: the gate walks the per-route files.'
  )
}

/**
 * Every route prerender.mjs wrote: `dist/pricing/index.html` is `/pricing/`.
 * `assets/` and dot-directories (`.vite/`) hold no pages and are skipped.
 */
function prerenderedRoutes(root) {
  const routes = []
  const walk = rel => {
    for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || (rel === '' && entry.name === 'assets')) continue
        walk(rel ? `${rel}/${entry.name}` : entry.name)
      } else if (entry.name === 'index.html') {
        routes.push(rel ? `/${rel}/` : '/')
      }
    }
  }
  walk('')
  return routes.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
}

const ROUTES = prerenderedRoutes(DIR)

// The walk is the source of the list, so it gets checked against the one other
// list of routes the build writes. Every sitemap URL must have been found; the
// walk may find more (noindex routes are left out of the sitemap on purpose).
const SITEMAP = path.join(DIR, 'sitemap.xml')
if (fs.existsSync(SITEMAP)) {
  const base = (process.env.BASE_URL || '/').replace(/\/?$/, '/')
  const missing = [...fs.readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => new URL(m[1]).pathname)
    .map(p => `/${p.slice(base.length)}`.replace(/\/?$/, '/').replace(/^\/+/, '/'))
    .filter(p => !ROUTES.includes(p))
  if (missing.length) {
    throw new Error(`sitemap.xml lists ${missing.length} URL(s) with no page in ${DIR}/: ${missing.join(', ')}`)
  }
}

// GitHub Pages serves 404.html at every dead URL, so it is a page visitors
// land on and it answers to the same rules. It is fetched by its file name —
// this server, rightly, has no fallback — and React Router renders the
// catch-all for that path, which is the same NotFound the prerender wrote.
const PAGES = [...ROUTES.map(r => ({ label: r, url: r })), { label: '404', url: '/404.html' }]

const server = await serve(DIR, PORT)
const b = await browser()

/** Everything one route has to answer for at rest, in one page evaluation. */
function audit() {
  const de = document.documentElement
  const viewport = de.clientWidth
  const out = {
    viewport,
    scrollWidth: de.scrollWidth,
    chrome: 0,
    overflow: [],
    nav: [],
    fields: { checked: 0, small: [] },
    targets: { checked: 0, sized: 0, inline: 0, small: [] },
  }

  const describe = el => {
    const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '')
      .trim().replace(/\s+/g, ' ').slice(0, 44)
    return `<${el.tagName.toLowerCase()}${el.dataset.m ? ` data-m="${el.dataset.m}"` : ''}>` +
      (text ? ` "${text}"` : '')
  }

  // A box of at most 1 × 1 is either collapsed or the visually-hidden
  // pattern — the skip link at rest is exactly that, parked at -1px by its
  // margin. Neither is something a visitor can see, overflow or tap.
  const hidden = r => r.width <= 1 && r.height <= 1

  // The nearest ancestor that clips horizontally — a scroller like the nav or
  // a table wrapper, or an overflow:hidden frame. What is inside one cannot
  // widen the page; the ancestor itself is still measured like anything else.
  const clipCache = new Map()
  const clipper = el => {
    const p = el.parentElement
    if (!p || p === document.body || p === de) return null
    if (clipCache.has(p)) return clipCache.get(p)
    const c = getComputedStyle(p).overflowX !== 'visible' ? p : clipper(p)
    clipCache.set(p, c)
    return c
  }

  // 1 — nothing wider than the screen.
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (hidden(r)) continue

    // A fixed-position element is allowed to sit wherever it likes; it is not
    // in the flow and cannot be what is widening the document.
    if (getComputedStyle(el).position === 'fixed' || clipper(el)) continue
    if (r.right > viewport + 0.5 || r.left < -0.5) {
      out.overflow.push({ el: describe(el), left: Math.round(r.left), right: Math.round(r.right) })
    }
  }

  // 2 — the masthead. Boxes are cut to what their scroller actually shows, so
  // a link scrolled out of the nav is not "overlapping" whatever it would sit
  // under if the nav did not clip it.
  const header = document.querySelector('header')
  const visiblePart = el => {
    let r = el.getBoundingClientRect()
    for (let c = clipper(el); c; c = clipper(c)) {
      const k = c.getBoundingClientRect()
      const left = Math.max(r.left, k.left), right = Math.min(r.right, k.right)
      const top = Math.max(r.top, k.top), bottom = Math.min(r.bottom, k.bottom)
      r = { left, right, top, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
    }
    return r
  }
  if (header) {
    const boxes = [...header.querySelectorAll('a')]
      .map(a => ({ t: (a.textContent || '').trim().slice(0, 24), r: visiblePart(a) }))
      .filter(x => x.r.width > 1 && x.r.height > 1)
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].r, c = boxes[j].r
        const dx = Math.min(a.right, c.right) - Math.max(a.left, c.left)
        const dy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)
        if (dx > 1 && dy > 1) out.nav.push(`"${boxes[i].t}" overlaps "${boxes[j].t}"`)
      }
    }

    const nav = header.querySelector('[data-m~="nav"]') || header.querySelector('nav')
    const links = nav ? [...nav.querySelectorAll('a')] : []
    if (links.length) {
      const rects = links.map(a => a.getBoundingClientRect())
      const tops = rects.map(r => r.top)
      if (Math.max(...tops) - Math.min(...tops) > 1) {
        out.nav.push(`nav wraps: its ${links.length} links sit on ${new Set(tops.map(Math.round)).size} rows`)
      }
      // A nowrap row that overflows toward the start — the canvas's
      // `justify-content:flex-end` does exactly that — puts its first links
      // at a negative scroll offset, which no swipe can reach.
      const n = nav.getBoundingClientRect()
      if (rects[0].left < n.left - 0.5) {
        out.nav.push(`"${(links[0].textContent || '').trim()}" starts ${Math.round(n.left - rects[0].left)}px before the nav's scroll origin — unreachable`)
      }
    }
  }

  // 3 — how far down the page the content starts.
  const main = document.querySelector('main')
  if (main) out.chrome = Math.round(main.getBoundingClientRect().top + window.scrollY)

  // What sits inside a visually-hidden wrapper — the contact form's honeypot
  // field, a status region — keeps its own full-size box, which the wrapper
  // clips to nothing. It is not on screen to be tapped or zoomed into.
  const clippedAway = el => {
    for (let c = clipper(el); c; c = clipper(c)) if (hidden(c.getBoundingClientRect())) return true
    return false
  }

  // 4 — form fields at 16px or more.
  for (const f of document.querySelectorAll('input, select, textarea')) {
    if (f.type === 'hidden' || hidden(f.getBoundingClientRect()) || clippedAway(f)) continue
    if (getComputedStyle(f).visibility === 'hidden') continue
    out.fields.checked++
    const size = parseFloat(getComputedStyle(f).fontSize)
    if (size < 16 - 0.01) out.fields.small.push(`${describe(f)} is ${size}px`)
  }

  // 5 — tap targets.
  const TARGETS = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, ' +
    '[role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'
  const PROSE = 'p, li, dd, dt, td, th, blockquote, figcaption'
  const MIN = 24 - 0.01

  // Inline in running text: an inline <a> whose paragraph (or list item…)
  // has text of its own around it. A list item that is nothing but a link is
  // a list of targets, not prose, and gets no exemption.
  const isInline = el => {
    if (el.tagName !== 'A' || getComputedStyle(el).display !== 'inline') return false
    const block = el.closest(PROSE)
    if (!block) return false
    const own = (el.textContent || '').replace(/\s+/g, ' ').trim().length
    return (block.textContent || '').replace(/\s+/g, ' ').trim().length > own + 1
  }

  const bigEnough = r => r.width >= MIN && r.height >= MIN

  for (const el of document.querySelectorAll(TARGETS)) {
    const r = el.getBoundingClientRect()
    if (hidden(r) || clippedAway(el) || getComputedStyle(el).visibility === 'hidden') continue
    out.targets.checked++
    if (isInline(el)) { out.targets.inline++; continue }
    if (bigEnough(r) || [...(el.labels || [])].some(l => bigEnough(l.getBoundingClientRect()))) {
      out.targets.sized++
      continue
    }
    out.targets.small.push(`${describe(el)} is ${Math.round(r.width * 10) / 10} × ${Math.round(r.height * 10) / 10}`)
  }

  return out
}

/**
 * What the fixed pills cover, as viewport rects. At phone widths they are one
 * full-width bar and its whole box is opaque; between the phone breakpoint and
 * the canvas's widths they float, and only the two pills themselves are.
 * 'none' where there are no pills (/contact). Above 860px they are the
 * canvas's floating stack, an overlay by design — the canvas itself lets it
 * sit over the legal strip at 1440 — so no promise is checked there.
 */
function barBox() {
  const bar = document.querySelector('[data-m~="pills"]')
  if (!bar || getComputedStyle(bar).position !== 'fixed') return { state: 'none', rects: [] }
  const vw = document.documentElement.clientWidth
  const box = r => ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right })
  const b = bar.getBoundingClientRect()
  if (b.left <= 0.5 && b.right >= vw - 0.5) return { state: 'bar', rects: [box(b)] }
  if (vw > 860) return { state: 'canvas', rects: [] }
  return { state: 'float', rects: [...bar.children].map(c => box(c.getBoundingClientRect())) }
}

/** Where focus is after one Tab press, and whether the pills are over it. */
function focusStop(rects) {
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return { done: true }
  if (el.closest('[data-m~="pills"]')) return { el: 'bar' }
  const r = el.getBoundingClientRect()
  const hit = rects.find(b => r.bottom > b.top + 0.5 && r.top < b.bottom - 0.5 && r.right > b.left + 0.5 && r.left < b.right - 0.5)
  const text = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 44)
  return {
    el: `<${el.tagName.toLowerCase()}>${text ? ` "${text}"` : ''}`,
    obscured: !!hit,
    under: hit ? Math.round(r.bottom - hit.top) : 0,
  }
}

/**
 * Run after scrolling to the end: which content, if any, the pills cover.
 * Content is what a visitor reads or taps — each line of text (measured as its
 * own line boxes, not as the block around it, so a paragraph whose text stops
 * short of a pill is not "under" it), images and other replaced elements, and
 * every target. A container's empty background is not content: in the
 * floating case the footer's dark box always runs underneath the pills, and
 * that is the design, not a defect.
 */
function coverage(rects) {
  const bar = document.querySelector('[data-m~="pills"]')
  const under = r => rects.find(b => r.bottom > b.top + 0.5 && r.top < b.bottom - 0.5 && r.right > b.left + 0.5 && r.left < b.right - 0.5)
  const describe = el => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44)
    return `<${el.tagName.toLowerCase()}${el.dataset.m ? ` data-m="${el.dataset.m}"` : ''}>` +
      (text ? ` "${text}"` : '')
  }
  // Fixed chrome is not page content, and text in a visually-hidden wrapper
  // (a live region, the skip link) is laid out but clipped to nothing.
  const shown = el => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (cs.position === 'fixed' || cs.visibility === 'hidden') return false
      const r = p.getBoundingClientRect()
      if (r.width <= 1 && r.height <= 1 && cs.overflowX !== 'visible') return false
    }
    return true
  }
  const covered = new Set()
  const note = (el, r, hit) => covered.add(`${describe(el)} ends ${Math.round(r.bottom - hit.top)}px under the pills`)

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement
    if (!n.nodeValue.trim() || !el || bar.contains(el) || !shown(el)) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    for (const r of range.getClientRects()) {
      if (r.width <= 1 && r.height <= 1) continue
      const hit = under(r)
      if (hit) { note(el, r, hit); break }
    }
  }
  const SOLID = 'img, svg, video, canvas, iframe, input, select, textarea, button, a[href], [role="button"]'
  for (const el of document.body.querySelectorAll(SOLID)) {
    if (bar.contains(el) || !shown(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width <= 1 && r.height <= 1) continue
    const hit = under(r)
    if (hit) note(el, r, hit)
  }
  return [...covered]
}

/**
 * Tab from the top of the page until focus leaves the document, noting every
 * stop the pills hide. Capped, so a focus trap fails loudly instead of hanging.
 */
const MAX_STOPS = 400
async function walkFocus(page, rects) {
  await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur?.() })
  const out = { stops: 0, obscured: [], trapped: false }
  for (let i = 0; i < MAX_STOPS; i++) {
    await page.keyboard.press('Tab')
    const s = await page.evaluate(focusStop, rects)
    if (s.done) return out
    if (s.el === 'bar') continue
    out.stops++
    if (s.obscured) out.obscured.push(`focus on ${s.el} ends ${s.under}px under the pills`)
  }
  out.trapped = true
  return out
}

const totals = { targets: 0, sized: 0, inline: 0, small: 0, fields: 0, stops: 0 }
const col = Math.max(12, ...PAGES.map(p => p.label.length)) + 1
let failed = 0

for (const width of WIDTHS) {
  const page = await b.newPage({ viewport: { width, height: HEIGHT } })
  console.log(`\n  ${width}px`)
  console.log(`  ${'route'.padEnd(col)} doc w  overflow  masthead  chrome  fields  targets    focus  pills`)
  console.log('  ' + '─'.repeat(col + 70))

  for (const { label, url } of PAGES) {
    await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.__hydrated === true)
    await settle(page)
    const r = await page.evaluate(audit)

    // The pill checks, wherever the pills make a promise (barBox says where):
    // focus first, because it walks down from the top of the page, then the
    // end of the page.
    const box = await page.evaluate(barBox)
    let focus = null
    let covered = []
    if (box.rects.length) {
      focus = await walkFocus(page, box.rects)
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))))
      covered = await page.evaluate(coverage, (await page.evaluate(barBox)).rects)
    }

    totals.targets += r.targets.checked
    totals.sized += r.targets.sized
    totals.inline += r.targets.inline
    totals.small += r.targets.small.length
    totals.fields += r.fields.checked
    totals.stops += focus ? focus.stops : 0

    const scrolls = r.scrollWidth > r.viewport
    const tall = width <= PHONE && r.chrome > CHROME_MAX
    const obscured = focus ? focus.obscured.length + (focus.trapped ? 1 : 0) : 0
    const bad = scrolls || tall || r.overflow.length || r.nav.length || r.fields.small.length ||
      r.targets.small.length || obscured || covered.length
    if (bad) failed++

    // `bar ok` / `float ok`, or how many pieces of content end under them.
    const bar = box.rects.length ? `${box.state} ${covered.length ? `${covered.length}!` : 'ok'}` : '—'
    console.log(
      `  ${label.padEnd(col)} ${String(r.scrollWidth).padStart(5)} ` +
      `${String(r.overflow.length).padStart(9)} ${String(r.nav.length).padStart(9)} ` +
      `${String(r.chrome).padStart(7)} ` +
      `${`${r.fields.small.length}/${r.fields.checked}`.padStart(7)} ` +
      `${`${r.targets.small.length}/${r.targets.checked}`.padStart(8)} ` +
      `${(focus ? `${focus.obscured.length}/${focus.stops}` : '—').padStart(8)}  ` +
      `${bar.padEnd(10)} ${bad ? 'FAIL' : 'ok'}`
    )
    if (tall) console.log(`      ↦ chrome ends at ${r.chrome}px, over the ${CHROME_MAX}px budget`)
    for (const o of r.overflow.slice(0, 6)) console.log(`      ↦ ${o.el} — ${o.left}…${o.right}`)
    for (const n of r.nav.slice(0, 6)) console.log(`      ↦ ${n}`)
    for (const f of r.fields.small.slice(0, 6)) console.log(`      ↦ ${f}`)
    for (const t of r.targets.small.slice(0, 6)) console.log(`      ↦ ${t}`)
    if (focus?.trapped) console.log(`      ↦ focus never left the page in ${MAX_STOPS} Tab presses — a focus trap?`)
    for (const o of (focus?.obscured || []).slice(0, 6)) console.log(`      ↦ ${o}`)
    for (const v of covered.slice(0, 6)) console.log(`      ↦ ${v}`)
  }
  await page.close()
}

await b.close()
server.close()

// The exemptions are printed with the totals, so a change that starts passing
// targets by exemption rather than by size shows up in the numbers.
console.log(
  `\n  ${totals.targets} tap targets: ${totals.sized} at 24 × 24px or more, ` +
  `${totals.inline} exempt as links inline in running text, ${totals.small} too small.` +
  `\n  ${totals.fields} form fields checked for the 16px floor; ${totals.stops} focus stops walked past the pills.`
)
console.log('')
if (failed) {
  console.error(`  ${failed} route/width combination(s) failed.\n`)
  process.exit(1)
}
console.log(`  All ${PAGES.length} routes lay out cleanly at ${WIDTHS.join('px, ')}px.\n`)
