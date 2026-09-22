// Screenshots all ten artboards of the ORIGINAL design canvas.
// These PNGs are the ground truth the React build is diffed against.
//
// "Original" means reference/ is never edited. Two things are applied to the
// rendered canvas DOM before each shot, both declared in pixel-lib.mjs and both
// asserted to have hit: the real contact details in place of the canvas's
// placeholders, and the short list of declared design divergences. Next to each
// PNG goes `<page>.masks.json`, the portrait box diff-pixels.mjs masks.
import fs from 'node:fs'
import {
  serve, browser, settle, ensureDir, PAGES,
  applyContactData, assertContactDataApplied,
  applyDivergences, tallyDivergences, printDivergences, assertDivergencesApplied,
  RESTING_KINDS, recordMasks,
} from './pixel-lib.mjs'

const PORT = 4599
const WIDTH = Number(process.env.WIDTH || 1440)
const OUT = `.pixel/ref/${WIDTH}`

/**
 * What a resting screenshot can see, plus the portrait mask. The `css`
 * divergences only change hover and focus states, which no first-paint shot
 * contains; check-hover.mjs applies and compares those.
 */
const KINDS = [...RESTING_KINDS, 'mask']

const server = await serve('reference', PORT)
const b = await browser()
const page = await b.newPage({ viewport: { width: WIDTH, height: 1000 } })

const errors = []
page.on('pageerror', e => errors.push(String(e.message)))

await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' })
// support.js boots asynchronously after fetching the React UMD bundles.
await page.waitForFunction(() => typeof window.__dcRootName === 'function' && !!document.querySelector('header'))
await settle(page)

ensureDir(OUT)
/** Per-placeholder hit counts across every artboard, asserted after the loop. */
const swapped = {}
/** Per-divergence hit counts across every artboard, printed and asserted after. */
const diverged = {}
for (const name of PAGES) {
  // Drive the canvas through its own prop, not by clicking: `state.page` starts
  // null so `props.startPage` decides the artboard, and this reaches pages the
  // header nav does not link to (audit, contact, mobile).
  await page.evaluate(p => window.__dcSetProps(window.__dcRootName(), { startPage: p }), name)
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page)
  // The canvas carries placeholder contact details and the site prints the real
  // ones. Normalising here keeps the diff about layout — see pixel-lib.mjs.
  for (const [k, n] of Object.entries(await applyContactData(page))) {
    swapped[k] = (swapped[k] || 0) + n
  }
  // Then the declared divergences. The frame (announcement bar, footer, pills)
  // survives the artboard switch, so after the first artboard those edits are
  // re-verified rather than re-made; applyDivergences() counts both as hits and
  // throws if any op is not in effect on exactly the elements it declares.
  tallyDivergences(diverged, await applyDivergences(page, { pageKey: name, kinds: KINDS }))
  await page.evaluate(() => window.scrollTo(0, 0))
  const masks = await recordMasks(page)
  fs.writeFileSync(`${OUT}/${name}.masks.json`, JSON.stringify(masks, null, 2) + '\n')
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  const h = await page.evaluate(() => document.body.scrollHeight)
  console.log(`ref ${WIDTH}  ${name.padEnd(11)} ${h}px${masks.portrait ? '   (portrait box recorded for masking)' : ''}`)
}

if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 5))
await b.close()
server.close()

printDivergences(diverged, { kinds: KINDS })
assertContactDataApplied(swapped)
assertDivergencesApplied(diverged, { kinds: KINDS })
