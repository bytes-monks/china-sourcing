// Rest, hover and focus fidelity.
//
// The screenshot diff proves the resting state matches; it cannot see a hover
// or a focus ring. The design runtime compiles `style-hover="…"` into a
// generated class whose declarations are all `!important` (createPseudoSheet /
// importantify in reference/support.js), and src/index.css reproduces that by
// hand — so this puts every interactive element into each state on both sides
// and compares what the browser computes.
//
// The states are forced through the DevTools Protocol rather than by moving a
// mouse. Two earlier mouse-based versions were quietly incomplete: the first
// never scrolled, so 179 of 328 elements below the 1000px fold were compared
// resting-state to resting-state — which the pixel diff had already proven
// equal, making more than half the reported total vacuous. The second scrolled
// but still could not reach the footer's right-hand links, because the fixed
// WhatsApp/WeChat pills sit on top of them. A forced pseudo-state has neither
// problem, reaches every element, and cannot silently degrade into comparing
// two resting states.
//
//   node scripts/check-hover.mjs
import fs from 'node:fs'
import { serve, browser, settle, PAGES } from './pixel-lib.mjs'

const WIDTH = 1440
// `:not([data-beyond-canvas])` is the one sanctioned escape hatch. The canvas
// has no skip link and no aria plumbing, so anything the site adds for
// accessibility has no counterpart to be compared against and would show up
// here as a spurious count mismatch. Elements marked with that attribute are
// excluded — and counted out loud below, so the exemption can never quietly
// grow into a way of hiding real drift.
const SELECTOR = 'a:not([data-beyond-canvas]), button:not([data-beyond-canvas]), ' +
  'input:not([data-beyond-canvas]), textarea:not([data-beyond-canvas]), ' +
  'select:not([data-beyond-canvas])'

/** Everything the selector above deliberately skips, for the report. */
const EXEMPT = 'a[data-beyond-canvas], button[data-beyond-canvas], input[data-beyond-canvas], ' +
  'textarea[data-beyond-canvas], select[data-beyond-canvas]'

// outline* is here so a dropped or added `outline:none` shows up — the canvas
// sets it on the form controls, and nothing else in the suite would notice.
const PROPS = [
  'color', 'backgroundColor', 'borderTopColor', 'borderBottomColor',
  'textDecorationLine', 'outlineColor', 'outlineWidth', 'outlineStyle',
  'boxShadow', 'opacity',
]

const PATHS = {
  home: '/', services: '/services', process: '/process', industries: '/industries',
  pricing: '/pricing', about: '/about', faq: '/faq', audit: '/audit',
  contact: '/contact', mobile: '/mobile',
}

if (!fs.existsSync('dist')) throw new Error('dist/ missing — run `npm run build` first')

/** Computed style of the i-th match, read in whatever state is currently forced. */
const READ = ({ i, props, sel }) => {
  const el = document.querySelectorAll(sel)[i]
  if (!el) return null
  const cs = getComputedStyle(el)
  return Object.fromEntries(props.map(p => [p, cs[p]]))
}

/**
 * Enough of the i-th match to prove the two sides are lined up on the same
 * element before their styles are compared.
 *
 * Whitespace is stripped, not collapsed. The canvas's source has newlines
 * between sibling spans and JSX drops whitespace-only lines, so the header
 * wordmark reads "B\n Bachar" in the design and "BBachar" in the build. Those
 * text nodes sit in flex containers, where a whitespace-only anonymous item is
 * not rendered at all — which is why the pixel diff is zero across five widths.
 * It is a difference in the DOM with no difference on screen, and it must not
 * be mistaken here for the two sides having drifted out of alignment.
 */
const IDENTIFY = ({ i, sel }) => {
  const el = document.querySelectorAll(sel)[i]
  if (!el) return null
  const raw = el.textContent || el.getAttribute('placeholder') || ''
  return { tag: el.tagName, text: raw.replace(/\s+/g, '').slice(0, 44) }
}

/**
 * Snapshot every interactive element in all three states.
 *
 * `DOM.querySelectorAll` returns node ids in document order — the same order
 * `document.querySelectorAll` uses for the same selector — so one index names
 * the same element on both the protocol side and the page side.
 */
async function probe(page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 })
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
    nodeId: root.nodeId,
    selector: SELECTOR,
  })

  const states = []
  for (let i = 0; i < nodeIds.length; i++) {
    const who = await page.evaluate(IDENTIFY, { i, sel: SELECTOR })
    if (!who) continue

    const rest = await page.evaluate(READ, { i, props: PROPS, sel: SELECTOR })

    await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[i], forcedPseudoClasses: ['hover'] })
    const hover = await page.evaluate(READ, { i, props: PROPS, sel: SELECTOR })

    await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[i], forcedPseudoClasses: ['focus'] })
    const focus = await page.evaluate(READ, { i, props: PROPS, sel: SELECTOR })

    await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[i], forcedPseudoClasses: [] })

    states.push({ who, rest, hover, focus })
  }

  await cdp.detach()
  return states
}

const refServer = await serve('reference', 4610)
const buildServer = await serve('dist', 4611)
const b = await browser()

const refPage = await b.newPage({ viewport: { width: WIDTH, height: 1000 } })
const buildPage = await b.newPage({ viewport: { width: WIDTH, height: 1000 } })

let compared = 0
let mismatches = 0
let exemptTotal = 0
const problems = []

for (const name of PAGES) {
  // Full reload of the canvas too: __dcSetProps does not reset component state,
  // so without this a page would carry the previous one's open accordion.
  await refPage.goto('http://127.0.0.1:4610/index.html', { waitUntil: 'networkidle' })
  await refPage.waitForFunction(
    () => typeof window.__dcRootName === 'function' && !!document.querySelector('header')
  )
  await refPage.evaluate(p => window.__dcSetProps(window.__dcRootName(), { startPage: p }), name)
  await settle(refPage)

  await buildPage.goto(`http://127.0.0.1:4611${PATHS[name]}`, { waitUntil: 'networkidle' })
  await buildPage.waitForFunction(() => window.__hydrated === true)
  await settle(buildPage)

  const refStates = await probe(refPage)
  const buildStates = await probe(buildPage)

  const exempt = await buildPage.evaluate(sel => document.querySelectorAll(sel).length, EXEMPT)
  exemptTotal += exempt

  let pageBad = 0

  if (refStates.length !== buildStates.length) {
    problems.push({
      name,
      text: '(page)',
      issue: `${refStates.length} interactive elements in the design, ${buildStates.length} in the build`,
    })
    pageBad++
  }

  const n = Math.min(refStates.length, buildStates.length)
  for (let i = 0; i < n; i++) {
    const r = refStates[i]
    const c = buildStates[i]

    if (r.who.tag !== c.who.tag || r.who.text !== c.who.text) {
      problems.push({
        name,
        text: r.who.text,
        issue: `element ${i}: design <${r.who.tag}> "${r.who.text}" vs build <${c.who.tag}> "${c.who.text}"`,
      })
      pageBad++
      continue
    }

    compared++
    for (const state of ['rest', 'hover', 'focus']) {
      for (const p of PROPS) {
        if (r[state]?.[p] !== c[state]?.[p]) {
          problems.push({
            name,
            text: r.who.text,
            issue: `${state} ${p}: design ${r[state]?.[p]} vs build ${c[state]?.[p]}`,
          })
          pageBad++
        }
      }
    }
  }

  console.log(
    `  ${name.padEnd(11)} ${String(refStates.length).padStart(3)} elements` +
    (pageBad ? `   ${pageBad} MISMATCH` : '   ok')
  )
  mismatches += pageBad
}

console.log('')
if (mismatches === 0) {
  console.log(
    `  Rest, hover and focus match the design across ${compared} elements ` +
    `× ${PROPS.length} properties — ${compared * PROPS.length * 3} comparisons.`
  )
  if (exemptTotal) {
    console.log(
      `  ${exemptTotal} element(s) marked data-beyond-canvas were skipped: ` +
      'accessibility additions the design has no counterpart for.'
    )
  }
} else {
  console.log(`  ${mismatches} mismatch(es):`)
  for (const p of problems.slice(0, 40)) console.log(`    ${p.name}  "${p.text}"  ${p.issue}`)
}

await b.close()
refServer.close()
buildServer.close()
process.exit(mismatches === 0 ? 0 : 1)
