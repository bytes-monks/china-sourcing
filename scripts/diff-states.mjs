// Pixel diff for the states the resting screenshots never reach.
//
// diff-pixels.mjs shoots every page as it first paints. That leaves the
// interactive states unchecked — a FAQ answer opened on a different item, the
// contact form after submit — and those are exactly the places where the React
// port re-implements canvas logic by hand rather than copying markup. So this
// drives the same interaction on the design canvas and on the build, and
// compares the results.
//
// The contact form is submitted for real on the build side, because the
// confirmation panel only appears once the POST succeeds — and that POST is a
// real enquiry to Bachar's inbox. It never leaves the machine: the build page
// routes the form backend and fulfils the request locally, this script asserts
// the request was exactly the one enquiry it typed, and pixel-lib's browser()
// aborts any form-backend request a script has not routed, as a second net.
//
//   node scripts/diff-states.mjs
import fs from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import {
  serve, browser, settle, ensureDir,
  applyContactData, assertContactDataApplied,
  applyDivergences, tallyDivergences, printDivergences, assertDivergencesApplied,
  RESTING_KINDS, divergenceOps, isFormRequest, formEndpoint,
} from './pixel-lib.mjs'

const WIDTH = Number(process.env.WIDTH || 1440)
const OUT = '.pixel/states'

const PATHS = {
  faq: '/faq',
  contact: '/contact',
}

/** Read from src/lib/site.ts; throws with the reason if it is not there. */
const FORM_ENDPOINT = formEndpoint()

/**
 * Each state names a page and a click sequence, expressed as visible text so it
 * resolves identically in both documents. `nth` disambiguates repeated labels.
 *
 * `fill` types into form controls, addressed by their visible label, on BOTH
 * sides before the clicks. The build marks name, email and specification
 * `required`, so an empty form never submits there — while the canvas, which
 * has no validation, would submit anyway and the two would diverge on whether
 * the click did anything. The values never reach a screenshot: the
 * confirmation panel replaces the form. `waitFor` is text that must be on
 * screen before the shot, on both sides; on the build it appears only after the
 * POST resolves. `submits` is what that POST must contain.
 */
const STATES = [
  {
    name: 'faq-third-open',
    page: 'faq',
    why: 'opening a different answer must close the default one',
    clicks: ["What's the smallest order you'll take on?"],
  },
  {
    name: 'faq-all-closed',
    page: 'faq',
    why: 'clicking the open answer collapses it, leaving none open',
    clicks: ['Why use an agent instead of buying on Alibaba myself?'],
  },
  {
    name: 'faq-reopen-first',
    page: 'faq',
    why: 'collapse then reopen returns to the initial state',
    clicks: [
      'Why use an agent instead of buying on Alibaba myself?',
      'Why use an agent instead of buying on Alibaba myself?',
    ],
  },
  {
    name: 'contact-submitted',
    page: 'contact',
    why: 'the form is replaced by the confirmation panel',
    fill: [
      ['Your name', 'Pixel Harness'],
      ['Company', 'diff-states.mjs'],
      ['Email', 'harness@example.com'],
      ['Destination country', 'Nowhere'],
      ['First-order quantity', '0 units'],
      ['Target unit price', 'n/a'],
      ['Product & specification', 'Automated pixel-harness test. Intercepted locally; never sent.'],
    ],
    clicks: ['Send it to Bachar'],
    waitFor: "Got it — it's on my desk.",
    submits: { formType: 'china-guy-quote', carries: ['Your name', 'Email'] },
  },
]

// This script does not paint the portrait mask diff-pixels.mjs uses. A state on
// an artboard that has a masked portrait would diff the portrait's content —
// fail here, with the reason, rather than in a confusing red image later.
{
  const unmaskable = STATES.filter(s => divergenceOps(s.page, ['mask']).length)
  if (unmaskable.length) {
    throw new Error(
      `${unmaskable.map(s => s.name).join(', ')}: diff-states.mjs does not mask the portrait box, and ` +
      'that artboard has one (the portrait-slot divergence). Add masking before adding the state.'
    )
  }
}

/**
 * Click the first clickable element whose trimmed text starts with `label`.
 * Prefix, not equality: the FAQ questions carry a trailing "+" toggle glyph
 * inside the same anchor.
 */
const CLICK = label => {
  const nodes = [...document.querySelectorAll('a, button')]
  const hit = nodes.find(el => (el.textContent || '').trim().startsWith(label))
  if (!hit) {
    const near = nodes.map(el => (el.textContent || '').trim()).filter(t => t && t.length < 80).slice(0, 40)
    throw new Error(`no clickable element labelled ${JSON.stringify(label)}. Saw: ${JSON.stringify(near)}`)
  }
  hit.click()
  return true
}

/**
 * The form control a visible label names. By text, prefix-matched (the build
 * may append a visually-hidden "required" to a label), then `label.control`,
 * which resolves both the canvas's nesting and the build's htmlFor.
 */
const CONTROL = label => {
  const labels = [...document.querySelectorAll('form label')]
  const hit = labels.filter(l => (l.textContent || '').trim().startsWith(label))
  if (hit.length !== 1) {
    const saw = labels.map(l => (l.textContent || '').trim().slice(0, 40))
    throw new Error(`${hit.length} form labels start with ${JSON.stringify(label)}, expected one. Saw: ${JSON.stringify(saw)}`)
  }
  if (!hit[0].control) throw new Error(`the label ${JSON.stringify(label)} is not attached to a control`)
  return hit[0].control
}

async function fill(page, fields) {
  for (const [label, value] of fields) {
    const handle = await page.evaluateHandle(CONTROL, label)
    await handle.asElement().fill(value)
    await handle.dispose()
  }
  // fill() focuses each control, and the last one would still hold focus at the
  // submit click. A focused text field always matches :focus-visible, and Chrome
  // carries that over to the next element script focuses — the build's
  // confirmation panel — which could then paint a focus ring the canvas never
  // shows. Blurring puts focus back where it was before any fill existed.
  await page.evaluate(() => document.activeElement?.blur())
}

async function waitForText(page, text) {
  await page.waitForFunction(t => document.body.innerText.includes(t), text, { timeout: 10_000 })
    .catch(() => { throw new Error(`${JSON.stringify(text)} never appeared`) })
}

/**
 * Check what the build sent to the form backend during one state. Returns a
 * reason string on failure, null when it was exactly right.
 */
function checkSubmission(state, seen) {
  // Preflights are answered by Playwright itself; count only the requests the
  // page actually made.
  const real = seen.filter(r => r.method !== 'OPTIONS')
  if (!state.submits) {
    return real.length ? `the build sent ${real.length} request(s) to the form backend in a state that does not submit` : null
  }
  if (real.length !== 1) {
    return `expected exactly one POST to ${FORM_ENDPOINT}, the build made ${real.length}` +
      (real.length ? `: ${real.map(r => `${r.method} ${r.url}`).join(', ')}` : '')
  }
  const [r] = real
  if (r.method !== 'POST' || r.url !== FORM_ENDPOINT) return `expected POST ${FORM_ENDPOINT}, got ${r.method} ${r.url}`
  let body
  try { body = JSON.parse(r.body ?? '') } catch { return `the POST body is not JSON: ${String(r.body).slice(0, 120)}` }
  if (body?.formType !== state.submits.formType) {
    return `formType is ${JSON.stringify(body?.formType)}, expected ${JSON.stringify(state.submits.formType)}`
  }
  const values = new Set()
  ;(function walk(v) { if (v && typeof v === 'object') Object.values(v).forEach(walk); else values.add(v) })(body)
  for (const label of state.submits.carries) {
    const typed = state.fill.find(([l]) => l === label)[1]
    if (!values.has(typed)) {
      return `the POST body does not carry the ${label} that was typed (${JSON.stringify(typed)}): ` +
        JSON.stringify(body).slice(0, 200)
    }
  }
  return null
}

const refServer = await serve('reference', 4630)
const buildServer = await serve('dist', 4631)
const b = await browser()

ensureDir(OUT)

const refPage = await b.newPage({ viewport: { width: WIDTH, height: 1000 } })
await refPage.goto('http://127.0.0.1:4630/index.html', { waitUntil: 'networkidle' })
await refPage.waitForFunction(() => typeof window.__dcRootName === 'function' && !!document.querySelector('header'))

const buildPage = await b.newPage({ viewport: { width: WIDTH, height: 1000 } })

/**
 * Every request the build makes to the form backend, answered here with the
 * backend's success response and never forwarded. A page route outranks the
 * abort-everything context route pixel-lib installs, so this is the one place
 * a form request is allowed to "succeed". The CORS header is what lets the
 * page's cross-origin fetch read the response.
 */
const submissions = []
await buildPage.route(url => isFormRequest(url), async route => {
  const req = route.request()
  submissions.push({ method: req.method(), url: req.url(), body: req.postData() })
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
  }
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
  return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: '{"ok":true}' })
})

let failed = 0
/** Per-placeholder hit counts, asserted after the loop. */
const swapped = {}
/** Per-divergence hit counts, printed and asserted after the loop. */
const diverged = {}
const intercepted = []

for (const state of STATES) {
  // Reference: a FULL RELOAD, not just __dcSetProps.
  //
  // The canvas keeps `faq` in component state, and setting the startPage prop
  // does not reset it — so without this the second state would begin with
  // whatever the first state left open, while the build (which navigates for
  // real) begins fresh. That asymmetry reported a divergence that was the
  // harness's own doing, not the app's.
  await refPage.goto('http://127.0.0.1:4630/index.html', { waitUntil: 'networkidle' })
  await refPage.waitForFunction(
    () => typeof window.__dcRootName === 'function' && !!document.querySelector('header')
  )
  await refPage.evaluate(p => window.__dcSetProps(window.__dcRootName(), { startPage: p }), state.page)
  await refPage.evaluate(() => window.scrollTo(0, 0))
  await settle(refPage)
  if (state.fill) await fill(refPage, state.fill)
  for (const label of state.clicks) {
    await refPage.evaluate(CLICK, label)
    await settle(refPage)
  }
  let problem = null
  if (state.waitFor) await waitForText(refPage, state.waitFor).catch(e => { problem = `design: ${e.message}` })
  await refPage.evaluate(() => window.scrollTo(0, 0))
  await settle(refPage)
  // Same normalisation the resting capture does: the canvas ships placeholder
  // contact details, the build prints the real ones.
  for (const [k, n] of Object.entries(await applyContactData(refPage))) {
    swapped[k] = (swapped[k] || 0) + n
  }
  // And the same declared divergences, applied after the clicks so they land on
  // the state being photographed. Resting kinds only: the css divergences
  // change hover/focus, which this shot does not contain (and the submitted
  // state has no <select> left to give a focus ring to).
  tallyDivergences(diverged, await applyDivergences(refPage, { pageKey: state.page, kinds: RESTING_KINDS }))
  const refShot = await refPage.screenshot({ fullPage: true })

  // Build: a fresh load guarantees the same starting state.
  submissions.length = 0
  await buildPage.goto(`http://127.0.0.1:4631${PATHS[state.page]}`, { waitUntil: 'networkidle' })
  await buildPage.waitForFunction(() => window.__hydrated === true)
  await settle(buildPage)
  if (state.fill) await fill(buildPage, state.fill)
  for (const label of state.clicks) {
    await buildPage.evaluate(CLICK, label)
    await settle(buildPage)
  }
  if (state.waitFor) await waitForText(buildPage, state.waitFor).catch(e => { problem ??= `build: ${e.message}` })
  await buildPage.evaluate(() => window.scrollTo(0, 0))
  await settle(buildPage)
  const buildShot = await buildPage.screenshot({ fullPage: true })

  const sent = checkSubmission(state, submissions)
  if (sent) problem ??= sent
  else if (state.submits) intercepted.push(state.name)

  const a = PNG.sync.read(refShot)
  const c = PNG.sync.read(buildShot)
  const w = Math.max(a.width, c.width)
  const h = Math.max(a.height, c.height)

  if (problem) {
    console.log(`  ${state.name.padEnd(20)} FAIL — ${problem}`)
    fs.writeFileSync(`${OUT}/${state.name}-ref.png`, PNG.sync.write(a))
    fs.writeFileSync(`${OUT}/${state.name}-build.png`, PNG.sync.write(c))
    failed++
    continue
  }

  if (a.height !== c.height) {
    console.log(`  ${state.name.padEnd(20)} HEIGHT ${a.height} vs ${c.height}   FAIL — ${state.why}`)
    fs.writeFileSync(`${OUT}/${state.name}-ref.png`, PNG.sync.write(a))
    fs.writeFileSync(`${OUT}/${state.name}-build.png`, PNG.sync.write(c))
    failed++
    continue
  }

  const diff = new PNG({ width: w, height: h })
  // threshold 0, matching diff-pixels.mjs: any colour difference counts. This
  // file used pixelmatch's permissive 0.1 default while the sibling gate was
  // exact, which is a difference in strictness with no reason behind it.
  const changed = pixelmatch(a.data, c.data, diff.data, w, h, { threshold: 0, includeAA: true })
  if (changed) {
    fs.writeFileSync(`${OUT}/${state.name}.png`, PNG.sync.write(diff))
    failed++
  }
  console.log(
    `  ${state.name.padEnd(20)} ${String(a.height).padStart(5)}px  ` +
    `${String(changed).padStart(7)} changed  ${changed ? 'FAIL' : 'ok'}   ${state.why}`
  )
}

console.log('')
console.log(
  failed === 0
    ? `  All ${STATES.length} interaction states match the design canvas.`
    : `  ${failed}/${STATES.length} state(s) differ. Images: ${OUT}/`
)
for (const name of intercepted) {
  console.log(`  ${name}: exactly one enquiry POSTed to ${FORM_ENDPOINT}, fulfilled locally — nothing was sent.`)
}

await b.close()
refServer.close()
buildServer.close()

const visited = [...new Set(STATES.map(s => s.page))]
printDivergences(diverged, { pages: visited, kinds: RESTING_KINDS })

// Both states' pages carry the footer, and /contact carries the WeChat id, so
// every placeholder should have been hit. One that was not means the canvas was
// re-exported and the substitution is silently doing nothing.
assertContactDataApplied(swapped)
assertDivergencesApplied(diverged, { pages: visited, kinds: RESTING_KINDS })

process.exit(failed === 0 ? 0 : 1)
