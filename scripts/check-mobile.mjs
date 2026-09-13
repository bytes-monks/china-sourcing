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
// rather than against a reference image:
//
//   1. Nothing may be wider than the viewport. Horizontal scroll on a phone is
//      the single symptom that made the old layout unusable — the contact
//      form ran its right-hand column off the screen, and the hero's "Live
//      order" card sat 66px past the edge.
//   2. The masthead has to hold every nav link, none of them overlapping each
//      other or the wordmark. The old header wrapped seven links into a ~90px
//      column that landed on top of the logo.
// There is deliberately no minimum-font-size assertion. The canvas sets its
// mono eyebrows and the wordmark's strapline at 8.5–11px everywhere, at every
// width, so a floor would flag thirty elements a page that are exactly as the
// design intends and would say nothing at all about the mobile layer.
//
// Widths: 390 is the common modern phone, 320 the narrowest still worth
// supporting — and the one that catches a layout that only fits by luck.
//
//   node scripts/check-mobile.mjs
//   WIDTHS=360,414 node scripts/check-mobile.mjs
import fs from 'node:fs'
import { serve, browser, settle, PAGES } from './pixel-lib.mjs'

const PORT = 4602
const DIR = process.env.DIR || 'dist'
const WIDTHS = (process.env.WIDTHS || '390,320').split(',').map(Number)

const PATHS = {
  home: '/', services: '/services', process: '/process', industries: '/industries',
  pricing: '/pricing', about: '/about', faq: '/faq', audit: '/audit',
  contact: '/contact', mobile: '/mobile',
}

if (!fs.existsSync(DIR)) throw new Error(`${DIR}/ does not exist — run \`npm run build\` first`)

const server = await serve(DIR, PORT)
const b = await browser()

/** Everything one route has to answer for, measured in one page evaluation. */
function audit() {
  const de = document.documentElement
  const viewport = de.clientWidth
  const out = { viewport, scrollWidth: de.scrollWidth, overflow: [], nav: [] }

  const describe = el => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44)
    return `<${el.tagName.toLowerCase()}${el.dataset.m ? ` data-m="${el.dataset.m}"` : ''}>` +
      (text ? ` "${text}"` : '')
  }

  // `data-beyond-canvas` marks the accessibility additions the design has no
  // counterpart for — here, the skip link, which is parked outside the
  // viewport by the visually-hidden pattern and is not an overflow.
  for (const el of de.querySelectorAll('*:not([data-beyond-canvas])')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue

    // A fixed-position element is allowed to sit wherever it likes; it is not
    // in the flow and cannot be what is widening the document.
    const cs = getComputedStyle(el)
    if (cs.position !== 'fixed' && (r.right > viewport + 0.5 || r.left < -0.5)) {
      out.overflow.push({ el: describe(el), left: Math.round(r.left), right: Math.round(r.right) })
    }
  }

  // The masthead: every link laid out, and no two boxes on top of each other.
  const links = [...document.querySelectorAll('header a')]
  const boxes = links.map(a => ({ t: (a.textContent || '').trim().slice(0, 24), r: a.getBoundingClientRect() }))
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].r, c = boxes[j].r
      const dx = Math.min(a.right, c.right) - Math.max(a.left, c.left)
      const dy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)
      if (dx > 1 && dy > 1) out.nav.push(`"${boxes[i].t}" overlaps "${boxes[j].t}"`)
    }
  }
  return out
}

let failed = 0
for (const width of WIDTHS) {
  const page = await b.newPage({ viewport: { width, height: 900 } })
  console.log(`\n  ${width}px`)
  console.log('  page          doc w   overflow   nav overlaps')
  console.log('  ' + '─'.repeat(48))

  for (const name of PAGES) {
    await page.goto(`http://127.0.0.1:${PORT}${PATHS[name]}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.__hydrated === true)
    await settle(page)
    const r = await page.evaluate(audit)

    const scrolls = r.scrollWidth > r.viewport
    const bad = scrolls || r.overflow.length || r.nav.length
    if (bad) failed++
    console.log(
      `  ${name.padEnd(12)} ${String(r.scrollWidth).padStart(5)} ` +
      `${String(r.overflow.length).padStart(10)} ${String(r.nav.length).padStart(14)}` +
      `  ${bad ? 'FAIL' : 'ok'}`
    )
    for (const o of r.overflow.slice(0, 6)) console.log(`      ↦ ${o.el} — ${o.left}…${o.right}`)
    for (const n of r.nav.slice(0, 6)) console.log(`      ↦ ${n}`)
  }
  await page.close()
}

await b.close()
server.close()

console.log('')
if (failed) {
  console.error(`  ${failed} page/width combination(s) failed.\n`)
  process.exit(1)
}
console.log(`  All ${PAGES.length} pages lay out cleanly at ${WIDTHS.join('px, ')}px.\n`)
