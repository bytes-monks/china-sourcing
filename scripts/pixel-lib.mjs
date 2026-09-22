// Shared helpers for the pixel-fidelity harness.
//
// The design canvas (reference/index.html + support.js) and the React build are
// screenshotted through the same code path so any difference in the images is a
// difference in the markup, not in how the two were captured.
//
// Also here, because every script needs them identically: the browser launch
// (which refuses to let any request reach the contact form's backend), the
// contact-data substitution, and the registry of declared design divergences
// replayed onto the canvas — plus the portrait-mask measurement that goes with
// the one divergence a DOM edit cannot express.
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
  '.woff2': 'font/woff2',
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

/**
 * The contact form's backend. The build POSTs every enquiry here, and it lands
 * in Bachar's inbox as a real lead. A harness that submits the form — and
 * diff-states.mjs does, to photograph the confirmation panel — must therefore
 * never let that request leave the machine.
 */
const FORM_HOST = 'formgrid.dev'

/** True for any URL on the form backend's host or a subdomain of it. */
export function isFormRequest(url) {
  let host
  try { host = new URL(String(url)).hostname } catch { return false }
  return host === FORM_HOST || host.endsWith(`.${FORM_HOST}`)
}

/**
 * Defence in depth, so that no harness script can leak an enquiry, in two
 * layers that fail independently:
 *
 * 1. Every context the harness browser creates gets a route that ABORTS any
 *    request to the form host. A script that means to submit — diff-states —
 *    registers its own `page.route()`, which Playwright gives precedence over a
 *    context route, and fulfils the request locally. Anything a script did not
 *    explicitly route hits this one and dies. It is installed by wrapping
 *    `newContext()` and `newPage()` on the browser object, so it covers the
 *    scripts that call either — including the ones this file does not own —
 *    without any of them opting in.
 * 2. The browser is launched with the host mapped to NOTFOUND, so even a
 *    request Playwright's routing never sees (a new context created some other
 *    way, a service worker) cannot resolve the name.
 *
 * The cost of (1): Playwright intercepts every request of a context that has
 * any route, and disables the HTTP cache while it does. Fonts and the canvas's
 * CDN bundles are re-fetched on every navigation. Screenshots are unaffected —
 * `settle()` waits for, and asserts, the fonts either way — they are only a
 * little slower. Never putting a fake enquiry in a real inbox is worth that.
 */
const guarded = new WeakSet()
async function guardContext(ctx) {
  if (guarded.has(ctx)) return
  guarded.add(ctx)
  await ctx.route(url => isFormRequest(url), route => {
    const req = route.request()
    console.error(
      `  BLOCKED ${req.method()} ${req.url()}\n` +
      '    The harness never lets a request reach the contact form backend. A script that\n' +
      '    submits the form must page.route() it and fulfil it locally (see diff-states.mjs).'
    )
    return route.abort('blockedbyclient')
  })
}

function guardBrowser(b) {
  const newContext = b.newContext.bind(b)
  const newPage = b.newPage.bind(b)
  // Playwright's own newPage() creates its context through newContext(); the
  // WeakSet makes a second guardContext() on the same context a no-op, so this
  // holds whether or not that internal detail survives an upgrade.
  b.newContext = async (...args) => {
    const ctx = await newContext(...args)
    await guardContext(ctx)
    return ctx
  }
  b.newPage = async (...args) => {
    const page = await newPage(...args)
    await guardContext(page.context())
    return page
  }
  return b
}

const LAUNCH_ARGS = [`--host-resolver-rules=MAP ${FORM_HOST} ~NOTFOUND, MAP *.${FORM_HOST} ~NOTFOUND`]

export async function browser() {
  if (process.env.CHROME_PATH) {
    return guardBrowser(await chromium.launch({ executablePath: process.env.CHROME_PATH, args: LAUNCH_ARGS }))
  }
  try {
    return guardBrowser(await chromium.launch({ args: LAUNCH_ARGS }))
  } catch (err) {
    const found = SYSTEM_CHROME.find(p => fs.existsSync(p))
    if (!found) {
      throw new Error(
        `No browser available.\n  Playwright: ${err.message.split('\n')[0]}\n` +
        '  Run `npx playwright install chromium`, or set CHROME_PATH to a Chrome binary.'
      )
    }
    console.error(`  (using system Chrome at ${found})`)
    return guardBrowser(await chromium.launch({ executablePath: found, args: LAUNCH_ARGS }))
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
      '  The canvas fetches these from fonts.googleapis.com at capture time; the build\n' +
      '  serves the same files from public/fonts/ (scripts/fetch-fonts.mjs). A blocked or\n' +
      '  rate-limited fetch on the canvas side, or missing files in dist/fonts/ on the build\n' +
      '  side, makes every screenshot fall back to system metrics, and the diff would pass\n' +
      '  while proving nothing. Fix the network (or re-run `npm run fonts`) and re-run.'
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
  // An optional `: string` annotation is tolerated; anything cleverer than a
  // single-quoted literal is not, and throws below.
  const m = new RegExp(`export const ${name}(?:\\s*:\\s*string)?\\s*=\\s*'([^']*)'`)
    .exec(fs.readFileSync(SITE_TS, 'utf8'))
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

/**
 * Where the site's contact form posts, read from site.ts like the contact data.
 * Read lazily, by the one script that needs it, so a missing constant fails
 * that script with a reason instead of every script at import.
 */
export function formEndpoint() {
  return siteConst('FORM_ENDPOINT')
}

// ─── Declared divergences ────────────────────────────────────────────────────
//
// The contact-data substitution above keeps the diff about layout. This is the
// same mechanism for the few DESIGN changes the site has been approved to make
// where the canvas is wrong: a contrast ratio below 4.5:1, a link to a page that
// does not exist, a "Live order" that is not live. Each one is declared here,
// replayed onto the rendered canvas DOM at capture time, and so the comparison
// is still against the canvas — the canvas plus exactly these edits, and
// nothing else. `reference/index.html` is still never written to.
//
// Four properties keep this from becoming a place to hide drift:
//
// - **Matching is exact and anchored to a landmark**: an element's own text,
//   inside `<main>`, `<footer>`, the announcement bar above `<header>`, or the
//   fixed contact pills. Never an nth-child chain, and never a data-dc-tpl
//   index, both of which a re-export silently renumbers.
// - **Every op declares how many elements it must hit on each artboard it
//   applies to**, and anything else throws: zero means the canvas changed under
//   the declaration, more means the match is broader than intended.
// - **A style op names the value it replaces.** If the canvas no longer has
//   that value, the declaration is stale and it throws rather than overwrite
//   whatever is there now.
// - **Every script that applies them prints one line per id with its hit
//   count**, and `assertDivergencesApplied()` fails the run for any id that
//   never hit. The list cannot grow, or quietly stop applying, unseen.
//
// Op kinds:
//   text    replace an element's own text (`find.text`) with `to`
//   remove  take the element out of the DOM, leaving a comment tombstone
//   style   set inline properties: `set: { prop: [canvasValue, newValue] }`
//   css     a state-only rule (`pseudo` + `set`) for the matched element. The
//           canvas compiles `style-hover=` into generated `.scpN:hover` rules
//           at boot, so editing those attributes afterwards does nothing; the
//           element is stamped and a real stylesheet targets the stamp, with
//           enough specificity to win over the generated class.
//   mask    not a DOM change: stamps the element with the attribute the build
//           carries (MASK below), so recordMasks() measures both documents
//           with one function and diff-pixels.mjs can mask its content.

/** Every kind an op may have. */
export const DIVERGENCE_KINDS = ['text', 'remove', 'style', 'css', 'mask']

/**
 * What a resting screenshot can see. `css` ops only change a hover or focus
 * state, which no first-paint shot contains — check-hover.mjs exercises those —
 * and `mask` ops matter only to a script that paints the mask.
 */
export const RESTING_KINDS = ['text', 'remove', 'style']

/**
 * The attributes that mark the masked portrait on both sides. The build carries
 * them in markup; on the canvas the portrait-slot divergence stamps the same
 * ones onto the dashed placeholder box and the order card that overlaps it.
 */
export const MASK = {
  portrait: { attr: 'data-portrait', token: '' },
  badge: { attr: 'data-m', token: 'figure-badge' },
}
const MASK_SELECTORS = { portrait: '[data-portrait]', badge: '[data-m~="figure-badge"]' }

/** The canvas shows the sticky pills everywhere but /contact
 *  (`sticky: … p !== 'contact'` in its logic), and so does the build. */
const STICKY_PAGES = PAGES.filter(p => p !== 'contact')

const INK_55 = 'rgba(244,240,232,.55)'

export const DIVERGENCES = [
  {
    id: 'topbar-no-mobile-link',
    why: 'announcement bar: the MOBILE link to /mobile/ is removed',
    pages: PAGES,
    ops: [
      { kind: 'remove', find: { scope: 'topbar', tag: 'a', text: 'MOBILE' }, expect: 1 },
    ],
  },
  {
    id: 'topbar-languages-contrast',
    why: 'announcement bar: "EN · 中文 · العربية" alpha .45 -> .55 (4.5:1 on #1A1614)',
    pages: PAGES,
    ops: [
      {
        kind: 'style',
        find: { scope: 'topbar', tag: 'span', text: 'EN · 中文 · العربية' },
        set: { color: ['rgba(244,240,232,.45)', INK_55] },
        expect: 1,
      },
    ],
  },
  {
    id: 'footer-guides-link',
    why: 'footer Resources: "Mobile views" (/mobile/) becomes "Guides" (/guides/)',
    pages: PAGES,
    ops: [
      { kind: 'text', find: { scope: 'footer', tag: 'a', text: 'Mobile views' }, to: 'Guides', expect: 1 },
    ],
  },
  {
    id: 'footer-no-chinese-link',
    why: 'footer legal strip: the "中文" link (href "#", no Chinese version exists) is removed',
    pages: PAGES,
    ops: [
      { kind: 'remove', find: { scope: 'footer', tag: 'a', text: '中文' }, expect: 1 },
    ],
  },
  {
    id: 'footer-contrast',
    why: 'footer column headings .40 and legal strip .42 -> .55 alpha (4.5:1 on #1A1614)',
    pages: PAGES,
    ops: [
      {
        kind: 'style',
        find: { scope: 'footer', tag: 'div', text: ['Services', 'Company', 'Resources'] },
        set: { color: ['rgba(244,240,232,.4)', INK_55] },
        expect: 3,
      },
      {
        kind: 'style',
        find: { scope: 'footer', tag: 'a', text: ['PRIVACY', 'TERMS'] },
        set: { color: ['rgba(244,240,232,.42)', INK_55] },
        expect: 2,
      },
      {
        // The row that holds the copyright line and the legal links: the
        // copyright span inherits its colour from it.
        kind: 'style',
        find: { scope: 'footer', tag: 'span', textPrefix: '© ', up: 1 },
        set: { color: ['rgba(244,240,232,.42)', INK_55] },
        expect: 1,
      },
    ],
  },
  {
    id: 'hero-example-order',
    why: 'home hero card: "Live order · GZB-4471" becomes "Example order · GZB-4471"',
    pages: ['home'],
    ops: [
      {
        kind: 'text',
        find: { scope: 'main', tag: 'div', text: 'Live order · GZB-4471' },
        to: 'Example order · GZB-4471',
        expect: 1,
      },
    ],
  },
  {
    id: 'portrait-slot',
    why: 'home/about portrait: content masked in the diff; box position and size still compared',
    pages: ['home', 'about'],
    ops: [
      {
        // The dashed 4:5 box itself, not its caption: the span is only the
        // handle, and `verify` proves the handle led to the right element.
        kind: 'mask',
        role: 'portrait',
        find: { scope: 'main', tag: 'span', text: 'Photo placeholder', up: 1 },
        verify: { aspectRatio: '4 / 5', borderTopStyle: 'dashed' },
        expect: 1,
      },
      {
        // The order card that hangs over the portrait's bottom-left corner. It
        // stays diffed, so it is carved out of the mask. Either text, so this
        // does not depend on running after hero-example-order.
        kind: 'mask',
        role: 'badge',
        pages: ['home'],
        find: {
          scope: 'main', tag: 'div',
          text: ['Live order · GZB-4471', 'Example order · GZB-4471'],
          up: 'absolute',
        },
        expect: 1,
      },
    ],
  },
  {
    id: 'whatsapp-pill-contrast',
    why: 'WhatsApp pill text #fff -> #1A1614, at rest and on hover (1.98:1 -> 9.1:1 on #25D366)',
    pages: STICKY_PAGES,
    ops: [
      {
        kind: 'style',
        find: { scope: 'sticky', tag: 'a', text: 'WhatsApp Bachar' },
        set: { color: ['#fff', '#1A1614'] },
        expect: 1,
      },
      {
        // The generated `.scpN:hover{background:#1FB855;color:#fff}` keeps its
        // background; only the colour is overridden.
        kind: 'css',
        find: { scope: 'sticky', tag: 'a', text: 'WhatsApp Bachar' },
        pseudo: 'hover',
        set: { color: '#1A1614' },
        expect: 1,
      },
    ],
  },
  {
    id: 'select-focus-ring',
    why: 'contact <select> gets the inputs\' #C0392F focus border (focus state only)',
    pages: ['contact'],
    ops: [
      {
        kind: 'css',
        find: { scope: 'main', tag: 'select', within: 'form' },
        pseudo: 'focus',
        set: { 'border-color': '#C0392F' },
        expect: 1,
      },
    ],
  },
  {
    id: 'contact-wechat-label',
    why: 'contact WeChat row: "SCAN ON MOBILE" (there is no QR code) becomes "COPY ID"',
    pages: ['contact'],
    ops: [
      { kind: 'text', find: { scope: 'main', tag: 'span', text: 'SCAN ON MOBILE' }, to: 'COPY ID', expect: 1 },
    ],
  },
  {
    // The same note-to-self portrait-slot removed from Home and About, in the
    // phone mock of Home: the real phone Home now shows the portrait card, and
    // this is that card's own mono line. check-functional.mjs fails any page
    // that shows the word "placeholder".
    id: 'mobile-mock-photo-label',
    why: 'mobile artboard, Home mock: "FACTORY PHOTO PLACEHOLDER" becomes "BACHAR · THE CHINA GUY"',
    pages: ['mobile'],
    ops: [
      {
        kind: 'text',
        find: { scope: 'main', tag: 'div', text: 'FACTORY PHOTO PLACEHOLDER' },
        to: 'BACHAR · THE CHINA GUY',
        expect: 1,
      },
    ],
  },
]

const SCOPE_NAMES = {
  topbar: 'the announcement bar above <header>',
  header: '<header>',
  main: '<main>',
  footer: '<footer>',
  sticky: 'the fixed contact pills',
}

/**
 * Validate the registry at import, so a malformed entry stops every script
 * with a reason rather than applying half of itself. Each op also gets the
 * token it marks its elements with and a description for error messages.
 */
{
  const seen = new Set()
  for (const d of DIVERGENCES) {
    const bad = msg => { throw new Error(`DIVERGENCES entry ${JSON.stringify(d.id)}: ${msg}`) }
    if (!/^[a-z0-9-]+$/.test(d.id || '')) bad('id must be kebab-case')
    if (seen.has(d.id)) bad('duplicate id')
    seen.add(d.id)
    if (!d.why) bad('needs a one-line `why`')
    if (!d.pages?.length || d.pages.some(p => !PAGES.includes(p))) bad(`pages must be artboards from PAGES`)
    d.ops.forEach((op, i) => {
      if (!DIVERGENCE_KINDS.includes(op.kind)) bad(`op ${i}: unknown kind ${op.kind}`)
      if (op.pages && op.pages.some(p => !d.pages.includes(p))) bad(`op ${i}: pages must be a subset of the entry's`)
      if (!Number.isInteger(op.expect) || op.expect < 1) bad(`op ${i}: expect must be a positive integer`)
      const f = op.find || {}
      if (!SCOPE_NAMES[f.scope] || !f.tag) bad(`op ${i}: find needs a known scope and a tag`)
      if (op.kind === 'text' && (typeof f.text !== 'string' || typeof op.to !== 'string')) {
        bad(`op ${i}: a text op needs a single find.text and a to`)
      }
      if (op.kind === 'style' && !Object.values(op.set || {}).every(v => Array.isArray(v) && v.length === 2)) {
        bad(`op ${i}: a style op's set maps each property to [canvasValue, newValue]`)
      }
      if (op.kind === 'css' && (!op.pseudo || !op.set)) bad(`op ${i}: a css op needs pseudo and set`)
      if (op.kind === 'mask' && !MASK[op.role]) bad(`op ${i}: a mask op needs role portrait or badge`)
      op.token = `${d.id}/${i}`
      const text = f.text != null ? ` ${[].concat(f.text).map(t => JSON.stringify(t)).join(' / ')}`
        : f.textPrefix != null ? ` starting ${JSON.stringify(f.textPrefix)}` : ''
      const up = f.up === 'absolute' ? ', then its absolutely-positioned ancestor' : f.up ? ', then its parent' : ''
      op.what = `<${f.tag}>${text} in ${SCOPE_NAMES[f.scope]}${f.within ? ` inside <${f.within}>` : ''}${up}`
    })
  }
}

const opPages = (d, op) => op.pages || d.pages

/** The ops that apply to one artboard, restricted to some kinds. */
export function divergenceOps(pageKey, kinds = DIVERGENCE_KINDS) {
  return DIVERGENCES.flatMap(d =>
    d.ops
      .filter(op => kinds.includes(op.kind) && opPages(d, op).includes(pageKey))
      .map(op => ({ ...op, id: d.id }))
  )
}

/**
 * Runs in the page. Applies each op idempotently and reports, per op, how many
 * elements the divergence is IN EFFECT on afterwards — not just how many it
 * changed this call. capture-reference.mjs walks the artboards without a
 * reload, so the frame (announcement bar, footer, pills) is edited on the first
 * artboard and merely re-verified on the other nine; counting only fresh edits
 * would report those nine as misses. Marked elements are re-checked, and
 * re-applied if a re-render reverted them.
 */
function APPLY_DIVERGENCES({ ops, mask }) {
  const own = el => [...el.childNodes]
    .filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.nodeValue).join('').trim()
  const show = el => el.outerHTML.replace(/\s+/g, ' ').replace(/ style="[^"]*"/g, '').slice(0, 100)
  const one = (list, what) => {
    if (list.length !== 1) throw new Error(`found ${list.length} ${what}, expected exactly one`)
    return list[0]
  }
  const scopes = {
    main: () => one([...document.querySelectorAll('main')], '<main>'),
    header: () => one([...document.querySelectorAll('header')].filter(e => !e.closest('main')), '<header> outside <main>'),
    footer: () => one([...document.querySelectorAll('footer')].filter(e => !e.closest('main')), '<footer> outside <main>'),
    topbar: () => {
      const bar = scopes.header().previousElementSibling
      if (!bar) throw new Error('nothing precedes <header>: the announcement bar is gone')
      return bar
    },
    sticky: () => {
      const fixed = [...document.querySelectorAll('body *')]
        .filter(e => !e.closest('header, main, footer') && getComputedStyle(e).position === 'fixed')
      return one(fixed.filter(e => !fixed.some(o => o !== e && o.contains(e))),
        'position:fixed containers outside header/main/footer')
    },
  }
  const climb = (el, up) => {
    if (!up) return el
    if (up === 1) return el.parentElement
    let e = el
    while (e && getComputedStyle(e).position !== up) e = e.parentElement
    return e
  }
  const find = f => {
    const scope = scopes[f.scope]()
    const texts = f.text == null ? null : [].concat(f.text)
    const out = new Set()
    for (const el of scope.querySelectorAll(f.tag)) {
      if (f.within && !el.closest(f.within)) continue
      const t = own(el)
      if (texts && !texts.includes(t)) continue
      if (f.textPrefix != null && !t.startsWith(f.textPrefix)) continue
      const target = climb(el, f.up)
      if (!target || !scope.contains(target)) throw new Error(`${show(el)}: no ${f.up} ancestor inside the scope`)
      out.add(target)
    }
    return [...out]
  }
  const norm = (prop, v) => {
    const probe = document.createElement('i')
    probe.style.setProperty(prop, v)
    return probe.style.getPropertyValue(prop)
  }
  const MARK = 'data-divergence'
  const marked = token => [...document.querySelectorAll(`[${MARK}~="${token}"]`)]
  const addToken = (el, attr, token) => {
    const list = (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)
    if (token && !list.includes(token)) list.push(token)
    el.setAttribute(attr, list.join(' '))
  }
  const tombstones = token => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT)
    const out = []
    while (walker.nextNode()) if (walker.currentNode.nodeValue.startsWith(`divergence ${token} `)) out.push(walker.currentNode)
    return out
  }
  const sheet = () => {
    let s = document.getElementById('__divergences')
    if (!s) {
      s = document.createElement('style')
      s.id = '__divergences'
      document.head.appendChild(s)
    }
    return s
  }

  let changed = false
  const counts = []
  const errors = []
  for (const op of ops) {
    try {
      let count
      if (op.kind === 'remove') {
        // A comment in its place, not a bare removal: it counts as "in effect"
        // on later calls, and it renders nothing and takes no flex gap, which
        // is exactly what the build's missing element does.
        for (const el of find(op.find)) {
          el.replaceWith(document.createComment(`divergence ${op.token} removed <${el.tagName.toLowerCase()}>${own(el)}`))
          changed = true
        }
        count = tombstones(op.token).length
      } else {
        const targets = [...new Set([...marked(op.token), ...find(op.find)])]
        for (const el of targets) {
          if (op.kind === 'text') {
            if (own(el) !== op.to) {
              const nodes = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim())
              if (nodes.length !== 1 || nodes[0].nodeValue.trim() !== op.find.text) {
                throw new Error(`${show(el)} reads ${JSON.stringify(own(el))}, which is neither the canvas text nor the replacement`)
              }
              nodes[0].nodeValue = nodes[0].nodeValue.replace(op.find.text, op.to)
              changed = true
            }
          } else if (op.kind === 'style') {
            for (const [prop, [from, to]] of Object.entries(op.set)) {
              const cur = el.style.getPropertyValue(prop)
              if (cur === norm(prop, to)) continue
              if (cur !== norm(prop, from)) {
                throw new Error(`${show(el)} has ${prop}: ${cur || '(unset)'}, but the divergence is declared against ${from}`)
              }
              el.style.setProperty(prop, to)
              changed = true
            }
          } else if (op.kind === 'css') {
            const decls = Object.entries(op.set).map(([p, v]) => `${p}:${v} !important`).join(';')
            // tag + attribute + pseudo = (0,2,1), which outranks the generated
            // `.scpN:hover` (0,2,0) whatever order the sheets end up in.
            const rule = `${op.find.tag}[${MARK}~="${op.token}"]:${op.pseudo}{${decls}}`
            const s = sheet()
            if (!s.textContent.includes(rule)) s.textContent += rule + '\n'
          } else if (op.kind === 'mask') {
            const cs = getComputedStyle(el)
            for (const [prop, want] of Object.entries(op.verify || {})) {
              if (cs[prop] !== want) {
                throw new Error(`${show(el)} computes ${prop}: ${cs[prop]}, expected ${want} — not the element this was declared for`)
              }
            }
            addToken(el, mask[op.role].attr, mask[op.role].token)
          }
          addToken(el, MARK, op.token)
        }
        count = targets.length
      }
      if (count !== op.expect) {
        const hit = op.kind === 'remove' ? [] : [...new Set([...marked(op.token), ...find(op.find)])]
        const seen = hit.length ? `: ${hit.map(show).join(' | ')}` : ''
        throw new Error(`${op.what}: in effect on ${count}, expected exactly ${op.expect}${seen}`)
      }
      counts.push(count)
    } catch (err) {
      errors.push(`${op.id} (${op.kind}): ${err.message}`)
      counts.push(0)
    }
  }
  return { counts, errors, changed }
}

/**
 * Replay the declared divergences that apply to one artboard onto the canvas
 * page, then re-settle if anything visible changed. Returns hits per id: the
 * number of elements each divergence is in effect on, summed over its ops.
 *
 * Throws, naming every failing op, if any op is not in effect on exactly the
 * number of elements it declares — a no-op divergence would otherwise pass as
 * "the build matches the canvas" while comparing against the wrong thing.
 */
export async function applyDivergences(page, { pageKey, kinds = DIVERGENCE_KINDS } = {}) {
  if (!PAGES.includes(pageKey)) throw new Error(`applyDivergences: unknown artboard ${JSON.stringify(pageKey)}`)
  const ops = divergenceOps(pageKey, kinds)
  const hits = {}
  if (!ops.length) return hits

  const { counts, errors, changed } = await page.evaluate(APPLY_DIVERGENCES, { ops, mask: MASK })
  if (errors.length) {
    throw new Error(
      `Declared divergences do not match the design canvas on the "${pageKey}" artboard:\n` +
      errors.map(e => `  - ${e}`).join('\n') + '\n' +
      '  The registry is DIVERGENCES in scripts/pixel-lib.mjs, and every entry names exact\n' +
      '  canvas text and values. If reference/ was re-exported, re-derive the entry from\n' +
      '  reference/index.html; never loosen a match until it passes.'
    )
  }
  ops.forEach((op, i) => { hits[op.id] = (hits[op.id] || 0) + counts[i] })
  if (changed) await settle(page)
  return hits
}

/** Add one artboard's hits into a run's running totals. */
export function tallyDivergences(totals, hits) {
  for (const [id, n] of Object.entries(hits)) totals[id] = (totals[id] || 0) + n
  return totals
}

const expectedIn = (d, pages, kinds) =>
  d.ops.some(op => kinds.includes(op.kind) && opPages(d, op).some(p => pages.includes(p)))

/**
 * One line per declared divergence, with its hit count across the run — or
 * n/a when this script neither visits its artboards nor applies its kind. It is
 * printed by every script that applies them, so the list is read every run.
 */
export function printDivergences(totals, { pages = PAGES, kinds = DIVERGENCE_KINDS } = {}) {
  console.log('\n  Declared divergences, replayed onto the canvas (reference/ is not edited):')
  for (const d of DIVERGENCES) {
    const n = totals[d.id] || 0
    const status = expectedIn(d, pages, kinds) ? `${String(n).padStart(4)} hit${n === 1 ? ' ' : 's'}` : '   n/a   '
    console.log(`    ${d.id.padEnd(26)} ${status}  ${d.why}`)
  }
}

/**
 * Fail if any divergence this run should have applied never hit. `pages` is
 * what the run visited and `kinds` what it applies; together they say which
 * ids were due, independently of what applyDivergences() happened to return.
 */
export function assertDivergencesApplied(totals, { pages = PAGES, kinds = DIVERGENCE_KINDS } = {}) {
  const missed = DIVERGENCES.filter(d => expectedIn(d, pages, kinds) && !totals[d.id])
  if (missed.length) {
    throw new Error(
      `Declared divergences never applied: ${missed.map(d => d.id).join(', ')}.\n` +
      '  Each one names an element of the design canvas; one that never hit means the\n' +
      '  canvas no longer contains it, and the diff would compare against the unedited\n' +
      '  canvas while reporting the divergence as covered. See DIVERGENCES in\n' +
      '  scripts/pixel-lib.mjs.'
    )
  }
}

/**
 * Measure the masked portrait and the order card(s) that overlap it, in
 * document pixels — the coordinates of a fullPage screenshot. Identical code on
 * both sides: the build carries the MASK attributes in its markup, the canvas
 * has them stamped by the portrait-slot divergence.
 *
 * Returns `{ portrait: null, badges: [] }` on a page without one. A badge is
 * recorded only if it overlaps the portrait, with its largest corner radius,
 * because its rounded corners show portrait content through them.
 */
export async function recordMasks(page) {
  const out = await page.evaluate(sel => {
    const rect = el => {
      const r = el.getBoundingClientRect()
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height }
    }
    const boxes = [...document.querySelectorAll(sel.portrait)]
    if (boxes.length > 1) return { error: `${boxes.length} elements match ${sel.portrait}; there is one portrait per page` }
    if (!boxes.length) return { portrait: null, badges: [] }
    const portrait = rect(boxes[0])
    const overlaps = (a, b) =>
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
    const corners = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius']
    const badges = [...document.querySelectorAll(sel.badge)]
      .map(el => {
        const cs = getComputedStyle(el)
        return { ...rect(el), radius: Math.max(...corners.map(k => parseFloat(cs[k]) || 0)) }
      })
      .filter(b => overlaps(portrait, b))
    return { portrait, badges }
  }, MASK_SELECTORS)
  if (out.error) throw new Error(`recordMasks: ${out.error}`)
  return out
}
