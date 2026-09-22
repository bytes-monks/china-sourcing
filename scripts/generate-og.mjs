#!/usr/bin/env node
/**
 * One Open Graph card per route: `public/og/<route key>.png`, 1200 x 630.
 *
 *     npm run og                          # render every card
 *     node scripts/generate-og.mjs --check  # verify, no browser: exit 1 if any
 *                                         # card is missing or out of date
 *
 * Every page used to share `public/og-image.png`, so a link to /pricing/ pasted
 * into WhatsApp, Slack or LinkedIn previewed exactly like a link to /faq/ — the
 * image is the largest thing in the preview and it said nothing about the page
 * behind it. The card now carries the page's own headline, and `headFor()` in
 * `src/lib/head.ts` points each route's `og:image` / `twitter:image` at its
 * card by the same rule this file writes them by: `/og/<route.key>.png`.
 *
 * Run it by hand; the output is committed. Like `generate-brand-assets.py` it
 * is deliberately NOT part of `npm run build` — rendering needs a browser and
 * the Google Fonts CSS, and a deploy should not depend on either. What the
 * build CAN afford is `--check`, which needs neither, and is what stops a
 * retitled route shipping the card for its old title (see `inputHash()`).
 *
 * ── Reading the route table without building ────────────────────────────────
 *
 * The routes live in `src/lib/routes.ts`, and this is plain Node. The options
 * were Node's `--experimental-strip-types` or TypeScript's own transpiler.
 * The flag exists only on Node >= 22.6, and `engines` and every workflow say
 * Node 20, where it is not an option but a startup error. `typescript` is
 * already a devDependency, so `transpileModule()` strips the types on any Node
 * and the result is imported from a `data:` URL — no temp file, no flag, and
 * the npm script is a bare `node` call.
 *
 * A `data:` module cannot resolve a relative import, which is fine because
 * routes.ts has no runtime imports — and if it grows one, `loadRoutes()` stops
 * and says so, rather than letting Node fail with an unhelpful resolution
 * error. (Type-only imports are erased by the transpile and do not count.)
 *
 * ── The card ────────────────────────────────────────────────────────────────
 *
 * Everything on it is in the canvas vocabulary, at OG scale: parchment
 * #F4F0E8, ink #1A1614, signal red #C0392F; the header lockup — the rotated
 * red "B" seal, the Instrument Serif wordmark, the mono "THE CHINA GUY" — at
 * the header's own proportions scaled from its 38px seal; the page eyebrow's
 * mono-caps-plus-hairline; and an Instrument Serif headline with one clause in
 * red italic, the way the home hero sets "and get it shipped.". The ink strip
 * at the foot carries the domain, so a card screenshotted out of its preview
 * still says where it came from.
 *
 * The headline is the route's `title` before " | " — the half that is about
 * the page rather than the brand, which the lockup already says. `head.ts`
 * derives the image's alt text from the same half; both spell the rule out
 * rather than sharing code, because this file cannot import head.ts (it has
 * runtime imports) and a one-line rule is cheaper to duplicate than a build.
 *
 * Nothing on a card is copy this file invents: the headline is the route's
 * title, the eyebrow is the page's own eyebrow or nav label, the cities are
 * the ones the home page names, and the domain comes from `ORIGIN`.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ROUTES_TS = path.join(ROOT, 'src/lib/routes.ts')
const SITE_TS = path.join(ROOT, 'src/lib/site.ts')
const OUT = path.join(ROOT, 'public/og')

const W = 1200
const H = 630

/**
 * Per-card byte budget. Flat colour compresses to a fraction of this; a card
 * over it means something photographic crept in, and every preview fetch —
 * several scrapers per share — pays for it.
 */
const BUDGET = 120 * 1024

/** The tEXt keyword `--check` reads back. See `inputHash()`. */
const CHUNK_KEY = 'og-card'

// ── Inputs ──────────────────────────────────────────────────────────────────

async function loadRoutes() {
  const source = fs.readFileSync(ROUTES_TS, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    fileName: ROUTES_TS,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  if (/^\s*import\b|^\s*export\b[^;\n]*\bfrom\s*['"]|\bimport\s*\(/m.test(outputText)) {
    throw new Error(
      `${path.relative(ROOT, ROUTES_TS)} now has a runtime import.\n` +
      '  generate-og.mjs loads it as a standalone data: module, which cannot resolve one.\n' +
      '  Move the import out of routes.ts, or teach loadRoutes() to transpile the dependency too.'
    )
  }
  const mod = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
  if (!Array.isArray(mod.ROUTES) || mod.ROUTES.length === 0) {
    throw new Error(`${path.relative(ROOT, ROUTES_TS)} did not export a non-empty ROUTES array.`)
  }
  return mod.ROUTES
}

/**
 * The host the strip prints, read out of site.ts the way `pixel-lib.mjs` reads
 * the contact data: by regex, and throwing rather than falling back — a card
 * with a guessed domain is exactly the stale `bacharthechinaguy.com` that the
 * old shared og-image.png still carries.
 */
function siteHost() {
  const m = /export const ORIGIN = '([^']+)'/.exec(fs.readFileSync(SITE_TS, 'utf8'))
  if (!m) throw new Error(`${path.relative(ROOT, SITE_TS)} does not export ORIGIN as a single-quoted string literal.`)
  return new URL(m[1]).host
}

// ── Copy ────────────────────────────────────────────────────────────────────

/** Same rule as `ogHeadline()` in src/lib/head.ts. Keep the two in step. */
const headlineOf = route => route.title.split(' | ')[0]

/**
 * The mono eyebrow above the headline. Where the page has an eyebrow of its
 * own it is that, verbatim; otherwise the nav label, which on the five nav
 * pages IS their eyebrow. Only the routes whose label would be wrong are
 * listed ("Home" is a nav label, not an eyebrow).
 */
const EYEBROW = {
  home: 'Sourcing agent · Guangzhou',
  audit: 'Sample deliverable',
  contact: 'Get a free quote',
  mobile: 'Mobile',
  guides: 'Guides',
  privacy: 'Legal',
  terms: 'Legal',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `2026-09-22` -> `22 Sep 2026`, without asking the locale. */
const shortDate = iso => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

const eyebrowOf = route =>
  EYEBROW[route.key] ??
  (route.article ? `Guide · ${shortDate(route.article.published)}` : route.nav ?? 'Sourcing agent · Guangzhou')

/**
 * Which clause of the headline is set in red italic.
 *
 * A title with a colon or a spaced em dash has already said where its second
 * clause starts ("Sourcing Agent Fees: No Supplier Commission"), and that
 * clause gets its own line. For the rest, the phrase is named here; it must
 * occur in the headline verbatim, and a title edited out from under it stops
 * the run rather than quietly losing its accent. A route in neither case is
 * set plain, with the red full stop every card ends on.
 */
const EMPHASIS = {
  home: 'in Guangzhou',
  services: 'QC Inspection in China',
  process: 'Step by Step',
  industries: 'Brands & Retail',
  audit: 'China Suppliers',
  contact: 'China Sourcing Quote',
  guides: 'for Importers',
  'guide-verify-factory': 'Before You Pay',
  'guide-aql-inspection': 'for China Orders',
  'guide-fob-cif-ddp': 'When Importing From China',
}

/** -> [{ text, em, block }] runs, the full stop appended to the last. */
function headlineRuns(route) {
  const text = headlineOf(route)
  const split = /^(.+?)(:|\s—)\s+(.+)$/.exec(text)
  let runs
  if (split) {
    // The colon stays on the first line; a dash becomes the line break.
    runs = [
      { text: split[1] + (split[2] === ':' ? ':' : ''), em: false, block: true },
      { text: split[3], em: true, block: true },
    ]
  } else if (EMPHASIS[route.key]) {
    const phrase = EMPHASIS[route.key]
    const at = text.indexOf(phrase)
    if (at < 0) {
      throw new Error(
        `EMPHASIS['${route.key}'] is "${phrase}", which is not in its headline "${text}".\n` +
        '  The route was retitled: update or remove the entry in scripts/generate-og.mjs.'
      )
    }
    // A phrase that ends the headline starts a line of its own, as a colon
    // clause does; left to text-wrap it can break after its first word and
    // leave one red word stranded at the end of an ink line.
    const trailing = at + phrase.length === text.length
    runs = [
      { text: text.slice(0, at).trimEnd(), em: false, block: trailing },
      { text: phrase, em: true, block: trailing },
      { text: text.slice(at + phrase.length), em: false },
    ].filter(r => r.text)
    if (!trailing) runs[0].text += ' '
  } else {
    runs = [{ text, em: false }]
  }
  // Every page H1 on the canvas ends on a full stop; the card does too, in red
  // when the last run is not already red. A title ending in ? or ! keeps its own.
  const last = runs[runs.length - 1]
  if (!/[.?!]$/.test(last.text)) {
    if (last.em) last.text += '.'
    else runs.push({ text: '.', em: true })
  }
  return runs
}

// ── Markup ──────────────────────────────────────────────────────────────────

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * The two families the card uses, from the same Google Fonts CSS the site's
 * index.html links (Archivo is left out; nothing on the card is body copy).
 * `display=block` rather than the site's `swap`: there is no first paint to
 * protect here, only the one frame that gets captured.
 */
const FONTS_CSS =
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500&display=block'

/** Headline fitting: start big, step down until it fits in three lines. */
const FIT = { max: 100, min: 56, step: 2, lines: 3, leading: 0.98, air: 44 }

/*
 * Geometry, in card pixels. The lockup is the header's, scaled from its 38px
 * seal to 64px (x 1.684): 24px "B" -> 40, 22px wordmark -> 37, 8.5px mono ->
 * 14.3, 12px gap -> 20, 4px under the wordmark -> 7, 3px corner radius -> 5.
 * The eyebrow is the home hero's (500 mono, .16em tracking, a .15-alpha
 * hairline capped at a fixed length) at about 1.7x.
 */
function cardHtml(route, host) {
  const runs = headlineRuns(route)
  const h1 = runs
    .map(r => {
      const tag = r.em ? 'em' : 'span'
      const cls = r.block ? ' class="line"' : ''
      return `<${tag}${cls}>${esc(r.text)}</${tag}>`
    })
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${FONTS_CSS}">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #F4F0E8; }
  body { -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
  .card { width: ${W}px; height: ${H}px; display: flex; flex-direction: column; background: #F4F0E8; color: #1A1614; }

  .top { flex: none; display: flex; align-items: center; padding: 56px 80px 0; }
  .lockup { display: flex; align-items: center; gap: 20px; }
  .seal { width: 64px; height: 64px; flex: none; background: #C0392F; border-radius: 5px; transform: rotate(-3deg); display: flex; align-items: center; justify-content: center; }
  .seal span { font: 400 40px/1 'Instrument Serif', serif; color: #F4F0E8; }
  .word { display: flex; flex-direction: column; line-height: 1; }
  .word .name { font: 400 37px/1 'Instrument Serif', serif; letter-spacing: -.01em; color: #1A1614; }
  .word .tag { font: 500 14.3px 'JetBrains Mono', monospace; letter-spacing: .18em; text-transform: uppercase; color: #C0392F; margin-top: 7px; }

  .main { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; padding: 0 80px; }
  .eyebrow { flex: none; display: flex; align-items: center; gap: 20px; margin-bottom: 26px; }
  .eyebrow span { font: 500 17px 'JetBrains Mono', monospace; letter-spacing: .16em; text-transform: uppercase; color: #C0392F; white-space: nowrap; }
  .eyebrow i { display: block; height: 2px; flex: 1; max-width: 200px; background: rgba(26,22,20,.15); }
  h1 { font: 400 ${FIT.max}px/${FIT.leading} 'Instrument Serif', serif; letter-spacing: -.02em; color: #1A1614; text-wrap: balance; max-width: ${W - 160}px; }
  h1 em { color: #C0392F; }
  h1 .line { display: block; }

  .strip { flex: none; height: 92px; background: #1A1614; display: flex; align-items: center; justify-content: space-between; gap: 32px; padding: 0 80px; }
  .host { font: 500 21px 'JetBrains Mono', monospace; letter-spacing: .02em; color: #F4F0E8; }
  .cities { font: 500 13px 'JetBrains Mono', monospace; letter-spacing: .16em; text-transform: uppercase; color: rgba(244,240,232,.55); white-space: nowrap; }
</style>
</head>
<body>
<div class="card">
  <div class="top">
    <div class="lockup">
      <div class="seal"><span>B</span></div>
      <div class="word"><span class="name">Bachar</span><span class="tag">The China Guy</span></div>
    </div>
  </div>
  <div class="main">
    <div class="eyebrow"><span>${esc(eyebrowOf(route))}</span><i></i></div>
    <h1>${h1}</h1>
  </div>
  <div class="strip">
    <span class="host">${esc(host)}</span>
    <span class="cities">Guangzhou · Foshan · Yiwu · Shenzhen</span>
  </div>
</div>
</body>
</html>`
}

/**
 * What a card was rendered from, stamped into the PNG as a tEXt chunk.
 *
 * The hash covers the card's whole HTML — so the route's headline and eyebrow,
 * the domain, and the template itself. `--check` recomputes it from the
 * current route table and compares, which catches the failure a file-exists
 * check cannot: a route retitled for search, still shipping a preview image
 * with the old title on it. The rendered pixels are not hashed; they depend on
 * the browser and the font files, and neither is an input anyone edits here.
 */
const inputHash = (route, host) =>
  'sha256:' + crypto.createHash('sha256').update(cardHtml(route, host)).digest('hex').slice(0, 32)

// ── PNG chunks ──────────────────────────────────────────────────────────────
// Hand-rolled because it is twenty lines: a PNG is an 8-byte signature and a
// run of [length][type][data][crc32] chunks, and IHDR is always first.
// `zlib.crc32` would do, but only from Node 20.15, and engines says >= 20.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function withTextChunk(png, keyword, text) {
  const body = Buffer.concat([Buffer.from(keyword, 'latin1'), Buffer.from([0]), Buffer.from(text, 'latin1')])
  const type = Buffer.from('tEXt', 'latin1')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(body.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([type, body])))
  const ihdrEnd = 8 + 4 + 4 + png.readUInt32BE(8) + 4
  return Buffer.concat([png.subarray(0, ihdrEnd), len, type, body, crc, png.subarray(ihdrEnd)])
}

function readTextChunk(png, keyword) {
  let at = 8
  while (at + 8 <= png.length) {
    const len = png.readUInt32BE(at)
    const type = png.toString('latin1', at + 4, at + 8)
    if (type === 'tEXt') {
      const body = png.subarray(at + 8, at + 8 + len)
      const nul = body.indexOf(0)
      if (body.toString('latin1', 0, nul) === keyword) return body.toString('latin1', nul + 1)
    }
    if (type === 'IDAT' || type === 'IEND') break // metadata is written before the image data
    at += 12 + len
  }
  return null
}

// ── Check ───────────────────────────────────────────────────────────────────

function check(routes, host) {
  const problems = []
  for (const route of routes) {
    const file = path.join(OUT, `${route.key}.png`)
    const rel = path.relative(ROOT, file)
    if (!fs.existsSync(file)) {
      problems.push(`  ${rel}  missing`)
      continue
    }
    const png = fs.readFileSync(file)
    const stamp = readTextChunk(png, CHUNK_KEY)
    if (stamp !== inputHash(route, host)) {
      // Either the route's title/eyebrow or the card template changed since
      // this file was rendered — or it was not rendered by this script at all.
      problems.push(`  ${rel}  out of date${stamp ? '' : ' (no og-card stamp: not rendered by this script)'}`)
    } else if (png.length > BUDGET) {
      problems.push(`  ${rel}  ${png.length.toLocaleString('en')} B, over the ${BUDGET.toLocaleString('en')} B budget`)
    }
  }
  for (const orphan of orphans(routes)) console.warn(`  note: public/og/${orphan} matches no route`)
  if (problems.length) {
    console.error(`og cards: ${problems.length} of ${routes.length} need regenerating\n${problems.join('\n')}`)
    console.error('\n  Run `npm run og` and commit public/og/.')
    return 1
  }
  console.log(`og cards: all ${routes.length} present and current`)
  return 0
}

const orphans = routes => {
  const keys = new Set(routes.map(r => `${r.key}.png`))
  return fs.existsSync(OUT) ? fs.readdirSync(OUT).filter(f => f.endsWith('.png') && !keys.has(f)) : []
}

// ── Render ──────────────────────────────────────────────────────────────────

/**
 * Wait for the faces the card actually uses, then prove they arrived.
 * `document.fonts.ready` alone resolves just as happily when every font
 * request failed, and a card rendered in the fallback serif would be committed
 * looking almost right — the same trap `settle()` in pixel-lib.mjs guards.
 */
async function settleFonts(page) {
  const missing = await page.evaluate(async () => {
    const text = document.body.innerText
    const faces = [
      ["400 100px 'Instrument Serif'", 'Instrument Serif', 'normal'],
      ["italic 400 100px 'Instrument Serif'", 'Instrument Serif', 'italic'],
      ["500 20px 'JetBrains Mono'", 'JetBrains Mono', 'normal'],
    ]
    await Promise.all(faces.map(([spec]) => document.fonts.load(spec, text)))
    await document.fonts.ready
    const loaded = [...document.fonts].filter(f => f.status === 'loaded')
    return faces
      .filter(([, family, style]) => !loaded.some(f => f.family.replace(/['"]/g, '') === family && f.style === style))
      .map(([spec]) => spec)
  })
  if (missing.length) {
    throw new Error(
      `Web fonts did not load: ${missing.join(', ')}.\n` +
      '  The card fetches them from fonts.googleapis.com. Fix the network and re-run;\n' +
      '  a card in the fallback serif is not one to commit.'
    )
  }
}

/** Step the headline down until it is at most FIT.lines lines and fits the column. */
async function fitHeadline(page) {
  return page.evaluate(({ max, min, step, lines, leading, air }) => {
    const main = document.querySelector('.main')
    const eyebrow = document.querySelector('.eyebrow')
    const h1 = document.querySelector('h1')
    const eyebrowBlock = eyebrow.offsetHeight + parseFloat(getComputedStyle(eyebrow).marginBottom)
    // Keep `air` px of parchment between the text block and the lockup above
    // and the strip below. It is more than it looks like it needs: the italic
    // descenders (the g of "Guangzhou") hang below the line box it measures.
    const room = main.clientHeight - eyebrowBlock - 2 * air
    for (let size = max; size >= min; size -= step) {
      h1.style.fontSize = `${size}px`
      const height = h1.getBoundingClientRect().height
      const count = Math.round(height / (size * leading))
      if (count <= lines && height <= room && h1.scrollWidth <= h1.clientWidth) return { size, lines: count }
    }
    return null
  }, FIT)
}

async function render(routes, host) {
  // pixel-lib.mjs reads src/lib/site.ts relative to the working directory when
  // it loads, so it is imported only once the process is standing at the repo
  // root. It is imported at all for `browser()`: the same three-step resolution
  // (CHROME_PATH, Playwright's Chromium, system Chrome) the harness uses.
  process.chdir(ROOT)
  const { browser: launch } = await import('./pixel-lib.mjs')

  fs.mkdirSync(OUT, { recursive: true })
  const browser = await launch()
  const failed = []
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
    console.log(`og cards -> ${path.relative(ROOT, OUT)}/`)
    for (const route of routes) {
      const name = `${route.key}.png`
      await page.setContent(cardHtml(route, host), { waitUntil: 'load' })
      await settleFonts(page)
      const fit = await fitHeadline(page)
      if (!fit) {
        console.log(`  ${name.padEnd(28)} FAILED: "${headlineOf(route)}" does not fit in ${FIT.lines} lines at ${FIT.min}px`)
        failed.push(name)
        continue
      }
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
      const shot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } })
      const png = withTextChunk(shot, CHUNK_KEY, inputHash(route, host))
      fs.writeFileSync(path.join(OUT, name), png)
      const over = png.length > BUDGET
      if (over) failed.push(name)
      console.log(
        `  ${name.padEnd(28)} ${String(fit.size).padStart(3)}px x ${fit.lines}  ${png.length.toLocaleString('en').padStart(8)} B` +
        (over ? `   << over the ${BUDGET.toLocaleString('en')} B budget` : '')
      )
    }
  } finally {
    await browser.close()
  }

  // The folder mirrors the route table: a card for a route that no longer
  // exists is a file nothing links to, deployed forever.
  for (const orphan of orphans(routes)) {
    fs.rmSync(path.join(OUT, orphan))
    console.log(`  removed ${orphan} (no such route)`)
  }

  if (failed.length) {
    console.error(`\nFAILED: ${failed.join(', ')}`)
    return 1
  }
  return 0
}

const routes = await loadRoutes()
const host = siteHost()
process.exitCode = process.argv.includes('--check') ? check(routes, host) : await render(routes, host)
