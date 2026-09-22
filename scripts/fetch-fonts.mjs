// Self-hosts the site's three Google font families, byte for byte.
//
//   node scripts/fetch-fonts.mjs           download, then rewrite the two generated regions
//   node scripts/fetch-fonts.mjs --print   download, print the regions, touch neither file
//   node scripts/fetch-fonts.mjs --check   read-only: exit 1 if anything has drifted
//
// WHY SELF-HOST
//
// The site used to load its fonts the way the design canvas does, from
// fonts.googleapis.com, with a stylesheet <link> in the <head>. That is a
// render-blocking stylesheet on a third-party origin (two extra connections
// before a single glyph can paint), and the business this site sells is in
// Guangzhou: Google's hosts are often slow or blocked from inside China, and
// that is exactly where some visitors, and the man himself, will open it.
// Serving the same files from our own origin removes both connections.
//
// WHY THESE EXACT FILES
//
// The pixel gate (scripts/diff-pixels.mjs) compares the build against the design
// canvas, and the canvas still loads these families from Google at capture time.
// So "the same fonts" is not good enough: the files must be the very woff2
// files Google serves to the harness's own Chromium, or a hinting or outline
// difference moves glyph pixels on every page. Google varies its CSS by
// User-Agent, so this script asks the harness's browser for its UA and makes
// the request with it. Measured on 2026-09-22: Playwright's headless Chromium,
// desktop Chrome on Linux and on Windows, and Firefox on Linux all receive the
// same 13 files. Chrome on macOS receives a different build of every one of
// them, in all three families, which is why a macOS UA is refused below.
//
// The same fact bounds the pixel gate. It is exact on Linux, where CI runs it.
// On a Mac the canvas would fetch Google's macOS files while the build serves
// these, so a desktop diff run on macOS can show glyph differences that CI
// does not.
//
// Everything else in Google's CSS is kept verbatim: all 34 @font-face rules,
// every subset (vietnamese, latin-ext, latin, and cyrillic/greek for
// JetBrains Mono), every unicode-range. That matters beyond tidiness. A browser
// picks a face per character by unicode-range, so dropping a subset or widening
// a range changes which font draws a character. The latin subset does not
// contain "→" (U+2192), for instance, and on the canvas that arrow falls through
// to a system font. Only the src URL is rewritten.
//
// WHERE THE FILES GO
//
// public/fonts/<family>/<version>/<file>.woff2, mirroring Google's own path
// after /s/. The version directory is kept on purpose: Google's file name
// encodes the family, subset and axes, not the content, so when a family is
// revised the name can stay the same and only the version segment changes.
// Keeping both makes each URL content-unique and therefore safe to cache
// forever. Vite copies public/ into dist/ verbatim, so the names survive the
// build unhashed.
//
// WHAT IT WRITES
//
// Two marked regions, and nothing outside them:
//   src/index.css   between /* fonts:start … */ and /* fonts:end */: the
//                   @font-face rules, one per line.
//   index.html      between <!--fonts:preload:start--> and
//                   <!--fonts:preload:end-->: the <link rel="preload"> tags.
// The preload hrefs are generated from the same rules as the src URLs. A
// preload whose URL is not the one the @font-face asks for is not reused; the
// browser downloads the font twice. Generating both from one list means that
// cannot happen. Font files that are no longer referenced are deleted.
//
// WHEN TO RE-RUN IT
//
// When Google revises one of the families. The canvas picks the revision up at
// its next capture; the build does not, so the pixel diff goes red with small
// glyph-level differences in text on every page and every width, with page
// heights unchanged. `--check` diagnoses exactly that: it exits non-zero, naming
// what changed, when Google's current answer no longer matches what is committed.
//
// ENVIRONMENT
//
//   CHROME_PATH   The browser used for the UA, resolved exactly as
//                 scripts/pixel-lib.mjs's browser() resolves it (CHROME_PATH,
//                 else Playwright's Chromium, else system Chrome). It is
//                 re-implemented here rather than imported because pixel-lib
//                 reads src/lib/site.ts at import time and throws if the contact
//                 constants are missing, and fonts should not depend on those.
//   FONT_UA       Skip the browser and send this User-Agent. Use a Linux or
//                 Windows desktop Chrome UA; see the macOS note above.
//
// Needs network access to fonts.googleapis.com and fonts.gstatic.com, in every
// mode. It binds no ports and writes nothing outside public/fonts/, the CSS
// region and the preload region.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REFERENCE_HTML = path.join(ROOT, 'reference/index.html')
const INDEX_CSS = path.join(ROOT, 'src/index.css')
const INDEX_HTML = path.join(ROOT, 'index.html')
const FONT_DIR = path.join(ROOT, 'public/fonts')
/** Public URL of FONT_DIR. Written root-relative; Vite adds `base` (see index.html). */
const FONT_URL = '/fonts/'

const CSS_REGION = /\/\* fonts:start[\s\S]*?\/\* fonts:end \*\//g
const HTML_REGION = /<!--fonts:preload:start-->[\s\S]*?<!--fonts:preload:end-->/g

/**
 * The faces worth a preload: the ones on screen at first paint, in the only
 * subset first paint needs. Every other face and subset still loads on demand,
 * exactly as it did from Google, when a character in its unicode-range is laid
 * out.
 *
 * Archivo and JetBrains Mono are variable fonts, and Google serves one file per
 * subset for every weight, so one preload covers each family's weights. If that
 * ever changes, the weight named here is the one that gets preloaded.
 */
const PRELOAD = [
  { family: 'Instrument Serif', style: 'normal', weight: '400', role: 'display headings and the masthead wordmark' },
  { family: 'Instrument Serif', style: 'italic', weight: '400', role: 'the <em> in the home hero headline' },
  { family: 'Archivo', style: 'normal', weight: '400', role: 'body copy and buttons, 400-700' },
  { family: 'JetBrains Mono', style: 'normal', weight: '500', role: 'the top bar and every mono eyebrow' },
]
const PRELOAD_SUBSET = 'latin'

/** Same fallbacks as scripts/pixel-lib.mjs. */
const SYSTEM_CHROME = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]

const args = new Set(process.argv.slice(2))
const MODE = args.has('--check') ? 'check' : args.has('--print') ? 'print' : 'write'

function die(msg) {
  console.error(`fetch-fonts: ${msg}`)
  process.exit(1)
}

const rel = p => path.relative(ROOT, p)

// ── 1. The stylesheet URL, from the canvas ───────────────────────────────────
//
// Read out of reference/index.html rather than restated here: the canvas is
// what the build is diffed against, so its request is by definition the right
// one. If the canvas is re-exported with another family or weight, this follows.
function stylesheetUrl() {
  const html = fs.readFileSync(REFERENCE_HTML, 'utf8')
  const hrefs = [...html.matchAll(/<link\b[^>]*\bhref="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/g)]
    .map(m => m[1].replace(/&amp;/g, '&'))
  if (hrefs.length !== 1) {
    die(`expected exactly one fonts.googleapis.com/css2 <link> in ${rel(REFERENCE_HTML)}, found ${hrefs.length}.`)
  }
  return hrefs[0]
}

// ── 2. The User-Agent the harness sends ──────────────────────────────────────
async function launch() {
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH })
  try {
    return await chromium.launch()
  } catch (err) {
    const found = SYSTEM_CHROME.find(p => fs.existsSync(p))
    if (!found) {
      die(
        `no browser available to read a User-Agent from.\n  Playwright: ${err.message.split('\n')[0]}\n` +
        '  Run `npx playwright install chromium`, set CHROME_PATH, or set FONT_UA.'
      )
    }
    console.error(`  (using system Chrome at ${found})`)
    return chromium.launch({ executablePath: found })
  }
}

async function userAgent() {
  if (process.env.FONT_UA) return { ua: process.env.FONT_UA, source: 'FONT_UA' }
  const b = await launch()
  try {
    const page = await b.newPage()
    const ua = await page.evaluate(() => navigator.userAgent)
    if (/Macintosh|Mac OS X/.test(ua)) {
      die(
        'this browser reports a macOS User-Agent, and Google serves macOS a different build of\n' +
        '  every file from the one it serves the Linux Chromium in CI. Committing these would make\n' +
        "  CI's canvas and build disagree. Re-run with a Linux desktop Chrome UA, e.g.\n" +
        "  FONT_UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/<version> Safari/537.36' node scripts/fetch-fonts.mjs"
      )
    }
    return { ua, source: `Chromium ${b.version()}` }
  } finally {
    await b.close()
  }
}

async function get(url, ua) {
  const res = await fetch(url, { headers: { 'user-agent': ua } })
  if (!res.ok) die(`${res.status} ${res.statusText} from ${url}`)
  return res
}

// ── 3. Parse Google's CSS, rewrite only the src ──────────────────────────────
const SRC = /^src:\s*url\((https:\/\/fonts\.gstatic\.com\/s\/([^)]+))\)\s*format\('woff2'\)$/
/** `<family>/<version>/<file>.woff2`, nothing that could climb out of FONT_DIR. */
const SAFE_PATH = /^[a-z0-9]+\/v\d+\/[A-Za-z0-9_-]+\.woff2$/

function parse(css) {
  const rules = []
  for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    const [, subset, body] = m
    // Descriptor values here never contain ";": unicode-range is comma-separated
    // and the src url is unquoted with no query string.
    const decls = body.split(';').map(d => d.trim()).filter(Boolean)
    const get1 = name => {
      const d = decls.find(x => x.startsWith(name + ':'))
      return d && d.slice(name.length + 1).trim()
    }
    const srcIndex = decls.findIndex(d => d.startsWith('src:'))
    const src = srcIndex >= 0 && SRC.exec(decls[srcIndex])
    if (!src) die(`unexpected src in the ${subset} rule: ${decls[srcIndex] ?? '(none)'}. Is the UA a woff2 browser?`)
    const [, remote, file] = src
    if (!SAFE_PATH.test(file)) die(`unexpected font path from Google: ${file}`)
    if (get1('font-display') !== 'swap') die(`the ${subset} rule for ${get1('font-family')} is not font-display: swap`)
    if (!get1('unicode-range')) die(`the ${subset} rule for ${get1('font-family')} has no unicode-range`)

    const url = FONT_URL + file
    decls[srcIndex] = `src: url('${url}') format('woff2')`
    rules.push({
      subset,
      family: get1('font-family').replace(/^'|'$/g, ''),
      style: get1('font-style'),
      weight: get1('font-weight'),
      remote,
      file,
      url,
      text: `/* ${subset} */ @font-face { ${decls.join('; ')} }`,
    })
  }
  const faces = (css.match(/@font-face/g) || []).length
  if (!faces || faces !== rules.length) {
    die(`parsed ${rules.length} of ${faces} @font-face rules. Google's CSS format has changed; update parse().`)
  }
  return rules
}

// ── 4. The two generated regions ─────────────────────────────────────────────
function cssRegion(rules, url) {
  return [
    '/* fonts:start. Generated by `node scripts/fetch-fonts.mjs`; do not edit by hand, re-run it.',
    `   Google's CSS for ${url}`,
    '   verbatim except for src. */',
    ...rules.map(r => r.text),
    '/* fonts:end */',
  ].join('\n')
}

function preloads(rules) {
  const picked = []
  for (const want of PRELOAD) {
    const rule = rules.find(r =>
      r.family === want.family && r.style === want.style && r.weight === want.weight && r.subset === PRELOAD_SUBSET)
    if (!rule) die(`no ${PRELOAD_SUBSET} rule for ${want.family} ${want.style} ${want.weight}; update PRELOAD.`)
    const seen = picked.find(p => p.url === rule.url)
    if (seen) seen.roles.push(want.role)
    else picked.push({ url: rule.url, file: rule.file, label: `${want.family} ${want.style}`, roles: [want.role] })
  }
  return picked
}

function htmlRegion(picked) {
  const lines = picked.flatMap(p => [
    `    <!-- ${p.label}, ${PRELOAD_SUBSET}: ${p.roles.join('; ')} -->`,
    `    <link rel="preload" as="font" type="font/woff2" crossorigin href="${p.url}" />`,
  ])
  return ['<!--fonts:preload:start-->', ...lines, '    <!--fonts:preload:end-->'].join('\n')
}

function region(file, re, label) {
  const text = fs.readFileSync(file, 'utf8')
  const found = text.match(re) || []
  if (found.length !== 1) {
    die(`expected exactly one ${label} region in ${rel(file)}, found ${found.length}. ` +
      'Restore the markers (see the header of this script) and re-run.')
  }
  return { text, current: found[0] }
}

// ── 5. Font files ────────────────────────────────────────────────────────────
/**
 * A woff2 starts with the signature "wOF2", and bytes 8-11 hold the file's own
 * total length, which also catches a truncated download.
 */
function woff2Problem(buf) {
  if (buf.length < 48) return `only ${buf.length} bytes`
  if (buf.subarray(0, 4).toString('latin1') !== 'wOF2') return `signature is ${JSON.stringify(buf.subarray(0, 4).toString('latin1'))}, not "wOF2"`
  if (buf.readUInt32BE(8) !== buf.length) return `header says ${buf.readUInt32BE(8)} bytes, file is ${buf.length}`
  return null
}

function localWoff2s(dir = FONT_DIR) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return localWoff2s(p)
    return e.name.endsWith('.woff2') ? [path.relative(FONT_DIR, p).split(path.sep).join('/')] : []
  })
}

function removeEmptyDirs(dir = FONT_DIR) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) removeEmptyDirs(path.join(dir, e.name))
  }
  if (dir !== FONT_DIR && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
}

// ── 6. Guard against a Google font request creeping back in ──────────────────
function googleReferences() {
  const hits = []
  const html = fs.readFileSync(INDEX_HTML, 'utf8')
  if (/<link\b[^>]*\bhref="https:\/\/fonts\.(googleapis|gstatic)\.com/.test(html)) hits.push(`${rel(INDEX_HTML)}: <link> to Google Fonts`)
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.css') ? [path.join(d, e.name)] : [])
  for (const f of walk(path.join(ROOT, 'src'))) {
    if (/(url\(|@import)\s*['"]?https:\/\/fonts\.(googleapis|gstatic)\.com/.test(fs.readFileSync(f, 'utf8'))) {
      hits.push(`${rel(f)}: url()/@import from Google Fonts`)
    }
  }
  return hits
}

// ── main ─────────────────────────────────────────────────────────────────────
const url = stylesheetUrl()
const { ua, source } = await userAgent()
console.log(`  stylesheet  ${url}`)
console.log(`  user-agent  ${ua}  (${source})`)

const rules = parse(await (await get(url, ua)).text())
const files = new Map()
for (const r of rules) {
  if (files.has(r.file) && files.get(r.file) !== r.remote) die(`two URLs map to ${r.file}`)
  files.set(r.file, r.remote)
}

const problems = []
const bytes = new Map()
for (const [file, remote] of files) {
  const buf = Buffer.from(await (await get(remote, ua)).arrayBuffer())
  const bad = woff2Problem(buf)
  if (bad) die(`${remote} is not a usable woff2: ${bad}`)
  bytes.set(file, buf.length)
  const dest = path.join(FONT_DIR, file)
  const same = fs.existsSync(dest) && fs.readFileSync(dest).equals(buf)
  if (MODE === 'check') {
    if (!same) problems.push(`public/fonts/${file} ${fs.existsSync(dest) ? 'differs from' : 'is missing; Google serves'} ${remote}`)
  } else if (!same) {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, buf)
  }
}

const stale = localWoff2s().filter(f => !files.has(f))
if (MODE === 'check') {
  for (const f of stale) problems.push(`public/fonts/${f} is no longer referenced`)
} else {
  for (const f of stale) fs.unlinkSync(path.join(FONT_DIR, f))
  removeEmptyDirs()
}

const picked = preloads(rules)
const css = cssRegion(rules, url)
const html = htmlRegion(picked)

if (MODE === 'print') {
  console.log('\n' + css + '\n\n    ' + html + '\n')
} else {
  const cssFile = region(INDEX_CSS, CSS_REGION, 'fonts:start/fonts:end')
  const htmlFile = region(INDEX_HTML, HTML_REGION, 'fonts:preload')
  if (MODE === 'check') {
    if (cssFile.current !== css) problems.push(`${rel(INDEX_CSS)}: the @font-face region is not what Google serves now`)
    if (htmlFile.current !== html) problems.push(`${rel(INDEX_HTML)}: the preload region does not match the @font-face src URLs`)
  } else {
    // Re-read immediately before writing and splice only the region, so an
    // edit elsewhere in either file is never clobbered.
    if (cssFile.current !== css) fs.writeFileSync(INDEX_CSS, fs.readFileSync(INDEX_CSS, 'utf8').replace(CSS_REGION, () => css))
    if (htmlFile.current !== html) fs.writeFileSync(INDEX_HTML, fs.readFileSync(INDEX_HTML, 'utf8').replace(HTML_REGION, () => html))
  }
}
if (MODE !== 'print') problems.push(...googleReferences())

// ── report ───────────────────────────────────────────────────────────────────
const preloaded = new Set(picked.map(p => p.file))
const kb = n => (n / 1024).toFixed(1).padStart(6) + ' KB'
console.log(`\n  ${rules.length} @font-face rules, ${files.size} files\n`)
for (const [file] of files) {
  const subsets = [...new Set(rules.filter(r => r.file === file).map(r => r.subset))].join(', ')
  console.log(`  ${preloaded.has(file) ? 'preload' : '       '}  ${kb(bytes.get(file))}  ${file}  (${subsets})`)
}
const total = [...bytes.values()].reduce((a, b) => a + b, 0)
const first = [...preloaded].reduce((a, f) => a + bytes.get(f), 0)
console.log(`\n  total ${kb(total).trim()}; preloaded for first paint ${kb(first).trim()} in ${preloaded.size} files`)

if (problems.length) {
  console.error(`\n  ${problems.length} problem(s):`)
  for (const p of problems) console.error(`    - ${p}`)
  console.error(MODE === 'check' ? '\n  Run `node scripts/fetch-fonts.mjs` to bring them back in line.\n' : '')
  process.exit(1)
}
console.log(MODE === 'check' ? '\n  Fonts match what Google serves the harness browser.\n' : '')
