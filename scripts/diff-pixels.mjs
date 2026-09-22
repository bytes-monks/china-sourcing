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

/**
 * The portrait mask (the `portrait-slot` divergence in pixel-lib.mjs).
 *
 * The canvas's portrait is a dashed placeholder reading "Photo placeholder";
 * the site shows the real photo, or a finished fallback, in the same box. What
 * is IN the box is therefore not the canvas's to decide, and is masked: painted
 * one flat colour, identically, in both images before pixelmatch runs. Where
 * the box IS, and how big, still is the canvas's — so both captures record the
 * box's rect in `<page>.masks.json`, and a box that moved or resized by any
 * amount fails the page before a pixel is compared.
 *
 * On home the "Example order" card hangs over the box's bottom-left corner. It
 * is design, not portrait, so it is carved out of the mask and stays diffed.
 *
 * Rounding is deliberately asymmetric. The portrait rect grows outward to whole
 * pixels, because an edge pixel is part box content. The card rect shrinks
 * inward, because its edge pixels blend card and portrait, and its rounded
 * corners are handed back to the mask, because portrait content shows through
 * them. The mask may cost a few card pixels; it never lets portrait content
 * through to the comparison.
 */
const MASK_RGBA = [0xff, 0x00, 0xff, 0xff]
/** How the masked region is drawn in a written diff image, so it reads as masked. */
const MASK_IN_DIFF = [0xf2, 0xdc, 0xf2, 0xff]

ensureDir(OUT)

const read = p => PNG.sync.read(fs.readFileSync(p))
const readMasks = p => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null)

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

const fmt = r => `(${r.x}, ${r.y}) ${r.width}×${r.height}`
const sameRect = (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

/**
 * Decide what to mask from the two sidecars. Returns `{ region }` to mask,
 * `{ problem }` to fail the page with a reason, or `{}` for a page with no
 * portrait on either side — which is unaffected.
 */
function maskPlan(ref, build) {
  if (!ref || !build) {
    return { problem: `no masks sidecar from the ${!ref ? 'reference' : 'build'} capture — re-run it` }
  }
  if (!ref.portrait && !build.portrait) return {}
  if (!ref.portrait) return { problem: 'the build has [data-portrait] where the canvas has no portrait box' }
  if (!build.portrait) return { problem: 'the canvas has a portrait box here and the build has no [data-portrait]' }
  if (!sameRect(ref.portrait, build.portrait)) {
    return { problem: `portrait box moved or resized: canvas ${fmt(ref.portrait)}, build ${fmt(build.portrait)}` }
  }
  const rb = ref.badges || []
  const bb = build.badges || []
  if (rb.length !== bb.length || rb.some((r, i) => !sameRect(r, bb[i]) || r.radius !== bb[i].radius)) {
    return {
      problem: `card over the portrait differs: canvas ${rb.map(fmt).join(', ') || 'none'}, ` +
        `build ${bb.map(fmt).join(', ') || 'none'}`,
    }
  }
  return { region: { portrait: ref.portrait, badges: rb } }
}

/** Paint the masked region of `png` with `rgba`; returns the pixel count. */
function paintMask(png, { portrait, badges }, rgba) {
  const x0 = Math.max(0, Math.floor(portrait.x))
  const y0 = Math.max(0, Math.floor(portrait.y))
  const x1 = Math.min(png.width, Math.ceil(portrait.x + portrait.width))
  const y1 = Math.min(png.height, Math.ceil(portrait.y + portrait.height))
  const keep = badges.map(b => ({
    x0: Math.ceil(b.x), y0: Math.ceil(b.y),
    x1: Math.floor(b.x + b.width), y1: Math.floor(b.y + b.height),
    r: Math.ceil(b.radius),
  }))
  const kept = (x, y) => keep.some(k =>
    x >= k.x0 && x < k.x1 && y >= k.y0 && y < k.y1 &&
    !((x < k.x0 + k.r || x >= k.x1 - k.r) && (y < k.y0 + k.r || y >= k.y1 - k.r))
  )
  let n = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (kept(x, y)) continue
      const i = (y * png.width + x) * 4
      png.data[i] = rgba[0]; png.data[i + 1] = rgba[1]; png.data[i + 2] = rgba[2]; png.data[i + 3] = rgba[3]
      n++
    }
  }
  return n
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

  // A page whose masks disagree is failed with the reason and diffed unmasked,
  // so the written diff image shows the portrait too.
  const plan = maskPlan(readMasks(`${REF}/${name}.masks.json`), readMasks(`${BUILD}/${name}.masks.json`))
  let masked = 0
  if (plan.region) {
    masked = paintMask(pa, plan.region, MASK_RGBA)
    paintMask(pb, plan.region, MASK_RGBA)
  }

  const diff = new PNG({ width: w, height: h })
  const changed = pixelmatch(pa.data, pb.data, diff.data, w, h, {
    threshold: TOLERANCE,
    // true = do NOT skip anti-aliasing detection, i.e. an antialiased pixel that
    // differs still counts. The weaker default would excuse exactly the kind of
    // subpixel shift that a split text node causes.
    includeAA: true,
  })
  const ratio = changed / (w * h)
  const ok = ratio <= THRESHOLD && a.height === b.height && !plan.problem

  if (!ok) {
    if (plan.region) paintMask(diff, plan.region, MASK_IN_DIFF)
    fs.writeFileSync(`${OUT}/${name}.png`, PNG.sync.write(diff))
    failed++
  } else {
    fs.rmSync(`${OUT}/${name}.png`, { force: true })
  }

  rows.push({
    name,
    ratio,
    changed,
    masked,
    refH: a.height,
    buildH: b.height,
    ok,
    problem: plan.problem,
  })
}

const pct = r => (r * 100).toFixed(4).padStart(8) + '%'
console.log(`\n  page          ref h   build h    changed        diff     masked`)
console.log(`  ${'─'.repeat(65)}`)
for (const r of rows) {
  if (r.note) { console.log(`  ${r.name.padEnd(12)}  ${r.note}`); continue }
  const flag = r.ok ? '  ok' : '  FAIL'
  const hMismatch = r.refH !== r.buildH ? ` (height differs by ${r.buildH - r.refH})` : ''
  const problem = r.problem ? ` (${r.problem})` : ''
  console.log(
    `  ${r.name.padEnd(12)} ${String(r.refH).padStart(6)} ${String(r.buildH).padStart(8)}` +
    ` ${String(r.changed).padStart(10)} ${pct(r.ratio)} ${(r.masked ? String(r.masked) : '-').padStart(10)}` +
    `${flag}${hMismatch}${problem}`
  )
}

const worst = rows.filter(r => !r.ok && !r.note)
const maskedRows = rows.filter(r => r.masked)
console.log('')
if (maskedRows.length) {
  console.log(
    `  portrait-slot: box geometry identical on both sides; its content masked on ` +
    maskedRows.map(r => `${r.name} (${r.masked} px)`).join(', ') + '.'
  )
}
if (failed === 0) {
  console.log(`  All ${PAGES.length} pages match the design canvas at ${WIDTH}px.`)
} else {
  console.log(`  ${failed}/${PAGES.length} page(s) differ. Diff images: ${OUT}/`)
  for (const r of worst) console.log(`    ${r.name}: ${r.changed} px${r.problem ? ` — ${r.problem}` : ''}`)
}
process.exit(failed === 0 ? 0 : 1)
