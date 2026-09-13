// Screenshots all ten artboards of the ORIGINAL design canvas.
// These PNGs are the ground truth the React build is diffed against.
import {
  serve, browser, settle, ensureDir, PAGES,
  applyContactData, assertContactDataApplied,
} from './pixel-lib.mjs'

const PORT = 4599
const WIDTH = Number(process.env.WIDTH || 1440)
const OUT = `.pixel/ref/${WIDTH}`

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
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  const h = await page.evaluate(() => document.body.scrollHeight)
  console.log(`ref ${WIDTH}  ${name.padEnd(11)} ${h}px`)
}

if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 5))
await b.close()
server.close()

assertContactDataApplied(swapped)
