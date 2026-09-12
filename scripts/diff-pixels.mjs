// Compares the built site against the original design canvas, page by page.
//
// This is the check that makes "pixel perfect" a fact rather than a claim: the
// reference PNGs come from rendering the untouched `.dc.html` in the same
// browser at the same viewport, so any lit pixel in the diff is a real
// divergence from the design.
//
//   node scripts/diff-pixels.mjs
//
// Exit code is non-zero if any page exceeds THRESHOLD, so CI can gate on it.
import fs from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { PAGES, ensureDir } from './pixel-lib.mjs'

const WIDTH = Number(process.env.WIDTH || 1440)
const REF = `.pixel/ref/${WIDTH}`
const BUILD = `.pixel/build/${WIDTH}`
const OUT = `.pixel/diff/${WIDTH}`

/**
 * Fraction of differing pixels a page may have and still pass. Zero: the whole
 * claim this harness backs is that the build IS the design, and a percentage
 * budget quietly permits ~200 stray pixels on a page this tall. Every
 * divergence found so far has been a real defect — a dropped section, a text
 * node split in two — so there is nothing for a tolerance to absorb.
 * Override with THRESHOLD=0.0001 to triage a large regression.
 */
const THRESHOLD = Number(process.env.THRESHOLD ?? 0)
/**
 * Per-pixel colour tolerance: the YIQ delta two pixels may differ by before the
 * pixel counts as changed. 0 means any difference counts. pixelmatch's default
 * is 0.1, which silently excuses a visible drift on every pixel of every page —
 * the comment here used to describe 0 while the constant was 0.1. Override with
 * TOLERANCE=0.1 to triage a large regression.
 */
const TOLERANCE = Number(process.env.TOLERANCE ?? 0)

ensureDir(OUT)

const read = p => PNG.sync.read(fs.readFileSync(p))

/** Pad both images to a common canvas so a height difference is visible as a
 *  block of diff rather than a crash. */
function pad(png, w, h) {
  if (png.width === w && png.height === h) return png
  const out = new PNG({ width: w, height: h })
  // Fill with a colour no design uses, so padding reads as "missing", not black.
  out.data.fill(0xff)
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0)
  return out
}

let failed = 0
const rows = []

for (const name of PAGES) {
  const refPath = `${REF}/${name}.png`
  const buildPath = `${BUILD}/${name}.png`
  if (!fs.existsSync(refPath) || !fs.existsSync(buildPath)) {
    rows.push({ name, note: 'MISSING', ratio: 1 })
    failed++
    continue
  }

  const a = read(refPath)
  const b = read(buildPath)
  const w = Math.max(a.width, b.width)
  const h = Math.max(a.height, b.height)
  const pa = pad(a, w, h)
  const pb = pad(b, w, h)

  const diff = new PNG({ width: w, height: h })
  const changed = pixelmatch(pa.data, pb.data, diff.data, w, h, {
    threshold: TOLERANCE,
    // true = do NOT skip anti-aliasing detection, i.e. an antialiased pixel that
    // differs still counts. The weaker default would excuse exactly the kind of
    // subpixel shift that a split text node causes.
    includeAA: true,
  })
  const ratio = changed / (w * h)
  const ok = ratio <= THRESHOLD && a.height === b.height

  if (!ok) {
    fs.writeFileSync(`${OUT}/${name}.png`, PNG.sync.write(diff))
    failed++
  } else {
    fs.rmSync(`${OUT}/${name}.png`, { force: true })
  }

  rows.push({
    name,
    ratio,
    changed,
    refH: a.height,
    buildH: b.height,
    ok,
  })
}

const pct = r => (r * 100).toFixed(4).padStart(8) + '%'
console.log(`\n  page          ref h   build h    changed        diff   `)
console.log(`  ${'─'.repeat(54)}`)
for (const r of rows) {
  if (r.note) { console.log(`  ${r.name.padEnd(12)}  ${r.note}`); continue }
  const flag = r.ok ? '  ok' : '  FAIL'
  const hMismatch = r.refH !== r.buildH ? ` (height differs by ${r.buildH - r.refH})` : ''
  console.log(
    `  ${r.name.padEnd(12)} ${String(r.refH).padStart(6)} ${String(r.buildH).padStart(8)}` +
    ` ${String(r.changed).padStart(10)} ${pct(r.ratio)}${flag}${hMismatch}`
  )
}

const worst = rows.filter(r => !r.ok && !r.note)
console.log('')
if (failed === 0) {
  console.log(`  All ${PAGES.length} pages match the design canvas at ${WIDTH}px.`)
} else {
  console.log(`  ${failed}/${PAGES.length} page(s) differ. Diff images: ${OUT}/`)
  for (const r of worst) console.log(`    ${r.name}: ${r.changed} px`)
}
process.exit(failed === 0 ? 0 : 1)
