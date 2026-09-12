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
