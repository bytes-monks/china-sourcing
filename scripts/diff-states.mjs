// Pixel diff for the states the resting screenshots never reach.
//
// diff-pixels.mjs shoots every page as it first paints. That leaves the
// interactive states unchecked — a FAQ answer opened on a different item, the
// contact form after submit — and those are exactly the places where the React
// port re-implements canvas logic by hand rather than copying markup. So this
// drives the same interaction on the design canvas and on the build, and
// compares the results.
//
//   node scripts/diff-states.mjs
import fs from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { serve, browser, settle, ensureDir } from './pixel-lib.mjs'

const WIDTH = Number(process.env.WIDTH || 1440)
const OUT = '.pixel/states'

const PATHS = {
  faq: '/faq',
  contact: '/contact',
}

/**
 * Each state names a page and a click sequence, expressed as visible text so it
 * resolves identically in both documents. `nth` disambiguates repeated labels.
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
    clicks: ['Send it to Bachar'],
  },
]

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

const refServer = await serve('reference', 4630)
const buildServer = await serve('dist', 4631)
const b = await browser()

ensureDir(OUT)

const refPage = await b.newPage({ viewport: { width: WIDTH, height: 1000 } })
await refPage.goto('http://127.0.0.1:4630/index.html', { waitUntil: 'networkidle' })
await refPage.waitForFunction(() => typeof window.__dcRootName === 'function' && !!document.querySelector('header'))

const buildPage = await b.newPage({ viewport: { width: WIDTH, height: 1000 } })

let failed = 0

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
  for (const label of state.clicks) {
    await refPage.evaluate(CLICK, label)
    await settle(refPage)
  }
  await refPage.evaluate(() => window.scrollTo(0, 0))
  await settle(refPage)
  const refShot = await refPage.screenshot({ fullPage: true })

  // Build: a fresh load guarantees the same starting state.
  await buildPage.goto(`http://127.0.0.1:4631${PATHS[state.page]}`, { waitUntil: 'networkidle' })
  await buildPage.waitForFunction(() => window.__hydrated === true)
  await settle(buildPage)
  for (const label of state.clicks) {
    await buildPage.evaluate(CLICK, label)
    await settle(buildPage)
  }
  await buildPage.evaluate(() => window.scrollTo(0, 0))
  await settle(buildPage)
  const buildShot = await buildPage.screenshot({ fullPage: true })

  const a = PNG.sync.read(refShot)
  const c = PNG.sync.read(buildShot)
  const w = Math.max(a.width, c.width)
  const h = Math.max(a.height, c.height)

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

await b.close()
refServer.close()
buildServer.close()
process.exit(failed === 0 ? 0 : 1)
