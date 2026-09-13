// Shared helpers for the pixel-fidelity harness.
//
// The design canvas (reference/index.html + support.js) and the React build are
// screenshotted through the same code path so any difference in the images is a
// difference in the markup, not in how the two were captured.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

/**
 * System Chrome locations, tried only as a fallback.
 *
 * CI installs Playwright's own browser and that is what should be used there —
 * pinning a version keeps the screenshots comparable run to run. But a dev
 * machine often has a Playwright browser cache that predates the installed
 * package, and `chromium.launch()` refuses rather than degrading, so fall back
 * to whatever Chrome is on the box. Set CHROME_PATH to override both.
 */
const SYSTEM_CHROME = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]

/** The ten artboards the design defines, in canvas order. */
export const PAGES = [
  'home', 'services', 'process', 'industries', 'pricing',
  'about', 'faq', 'audit', 'contact', 'mobile',
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

/**
 * Static file server. `spa` makes unknown paths fall back to index.html, which
 * the dev-mode React capture needs; the prerendered build serves real files per
 * route and must NOT fall back, or a missing route would silently screenshot
 * the home page and diff clean.
 */
export function serve(root, port, { spa = false } = {}) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0])
    let file = path.join(root, url)
    if (url.endsWith('/')) file = path.join(file, 'index.html')
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const asDir = path.join(root, url, 'index.html')
      if (fs.existsSync(asDir)) file = asDir
      else if (spa) file = path.join(root, 'index.html')
      else { res.writeHead(404); res.end('not found'); return }
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)))
}

export async function browser() {
  if (process.env.CHROME_PATH) {
    return chromium.launch({ executablePath: process.env.CHROME_PATH })
  }
  try {
    return await chromium.launch()
  } catch (err) {
    const found = SYSTEM_CHROME.find(p => fs.existsSync(p))
    if (!found) {
      throw new Error(
        `No browser available.\n  Playwright: ${err.message.split('\n')[0]}\n` +
        '  Run `npx playwright install chromium`, or set CHROME_PATH to a Chrome binary.'
      )
    }
    console.error(`  (using system Chrome at ${found})`)
    return chromium.launch({ executablePath: found })
  }
}

/**
 * The three families both index.html and reference/index.html pull from Google.
 * Every page uses all three.
 */
const REQUIRED_FAMILIES = ['Instrument Serif', 'Archivo', 'JetBrains Mono']

/**
 * Screenshot settling. Fonts must be loaded before capture or the first frame
 * measures at fallback metrics and every text block lands a few pixels off.
 *
 * `document.fonts.ready` is not enough on its own: it resolves just as happily
 * when every font request FAILED. If that happens on both sides they fall back
 * identically and the diff passes while comparing nothing the design specifies,
 * so this asserts each family actually arrived. `fonts.check()` is no use here
 * either — it returns true for a family that never loaded; only a face with
 * status 'loaded' proves the fetch succeeded.
 */
export async function settle(page) {
  await page.evaluate(() => document.fonts.ready)

  const missing = await page.evaluate(families => {
    const loaded = new Set(
      [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/['"]/g, ''))
    )
    return families.filter(f => !loaded.has(f))
  }, REQUIRED_FAMILIES)

  if (missing.length) {
    throw new Error(
      `Web fonts did not load: ${missing.join(', ')}.\n` +
      '  Both the canvas and the build fetch these from fonts.googleapis.com at capture\n' +
      '  time. A blocked or rate-limited fetch makes every screenshot fall back to system\n' +
      '  metrics, and the diff would pass while proving nothing. Fix the network and re-run.'
    )
  }

  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.waitForTimeout(150)
}

export function ensureDir(d) { fs.mkdirSync(d, { recursive: true }) }

/**
 * Contact details are data, not design.
 *
 * The canvas was exported with placeholders in the three contact rows and the
 * footer — `+86 138 0000 0000`, `bachar-china`, `bachar@thechinaguy.com`. The
 * site prints the real ones, from `src/lib/site.ts`. Diffed as-is, every page
 * fails on the footer and /contact fails on four blocks, all of it glyphs
 * inside identical boxes: the layout the diff exists to check is untouched.
 *
 * So both sides are normalised onto the same data before the shutter, and what
 * the diff compares is the layout again rather than whose phone number it is.
 * `reference/index.html` is never written to — the substitution happens in the
 * rendered DOM, at capture time, declared here.
 *
 * The real values are read out of site.ts rather than repeated, so there is
 * still one place to change a phone number. The read is a regex and not an
 * import because site.ts is TypeScript and these scripts are plain Node; it
 * throws rather than falling back, since a silent miss would leave the canvas
 * showing placeholders and every page red for a reason nobody could see.
 */
const SITE_TS = 'src/lib/site.ts'

function siteConst(name) {
  const m = new RegExp(`export const ${name} = '([^']*)'`).exec(fs.readFileSync(SITE_TS, 'utf8'))
  if (!m) {
    throw new Error(
      `${SITE_TS} does not export ${name} as a single-quoted string literal.\n` +
      '  The pixel harness reads the contact data from there to normalise the design\n' +
      '  canvas, which still carries the placeholders it was exported with.'
    )
  }
  return m[1]
}

/** Canvas placeholder -> the value the site actually prints. */
export const CONTACT_SUBSTITUTIONS = {
  '+86 138 0000 0000': siteConst('CONTACT_PHONE'),
  'bachar@thechinaguy.com': siteConst('CONTACT_EMAIL'),
  'bachar-china': siteConst('CONTACT_WECHAT'),
}

/**
 * Rewrite the canvas's placeholder contact details in place, then re-settle —
 * the replacements are longer than what they replace and the text has to be
 * re-laid-out before the shot.
 *
 * Returns a per-placeholder hit count. Callers assert on it: a placeholder that
 * is never found means the canvas changed under the harness and the
 * substitution has quietly become a no-op.
 */
export async function applyContactData(page) {
  const hits = await page.evaluate(pairs => {
    const counts = Object.fromEntries(pairs.map(([from]) => [from, 0]))
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)

    for (const node of nodes) {
      let text = node.nodeValue
      for (const [from, to] of pairs) {
        if (!text.includes(from)) continue
        text = text.split(from).join(to)
        counts[from]++
      }
      if (text !== node.nodeValue) node.nodeValue = text
    }
    return counts
  }, Object.entries(CONTACT_SUBSTITUTIONS))

  if (Object.values(hits).some(Boolean)) await settle(page)
  return hits
}

/**
 * Fail if any placeholder went unseen across a whole run. Every artboard has
 * the footer's email and phone; the WeChat id is on /contact alone, so this is
 * only meaningful once all ten have been visited.
 */
export function assertContactDataApplied(totals) {
  const missed = Object.keys(CONTACT_SUBSTITUTIONS).filter(k => !totals[k])
  if (missed.length) {
    throw new Error(
      `The design canvas no longer contains: ${missed.join(', ')}.\n` +
      '  These are the strings the harness swaps for the real contact details in\n' +
      `  ${SITE_TS}. If the canvas was re-exported with different placeholders, update\n` +
      '  CONTACT_SUBSTITUTIONS in scripts/pixel-lib.mjs to match.'
    )
  }
}
