// Turns the SPA in dist/ into one real HTML file per route.
//
// Runs last in `npm run build`, after both Vite passes:
//   1. `vite build`                      -> dist/ (client bundle + manifest)
//   2. `vite build --ssr src/entry-server.tsx --outDir .ssr`
//   3. this script                       -> dist/<route>/index.html, sitemap, 404
//
// Everything route-specific comes from the SSR bundle (`paths`, `render`,
// `head`, `jsonLd`), so the route table, the head tags and the structured data
// have exactly one definition in src/ and are never restated here.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const DIST = 'dist'
const SSR = '.ssr/entry-server.js'
const BASE = process.env.BASE_URL || '/'

const die = msg => { console.error('prerender: ' + msg); process.exit(1) }

if (!fs.existsSync(SSR)) die(`${SSR} missing — run the SSR build first`)
if (!fs.existsSync(`${DIST}/index.html`)) die(`${DIST}/index.html missing — run \`vite build\` first`)

const { paths, render, head, jsonLd, absolute } = await import(pathToFileURL(path.resolve(SSR)).href)

const shell = fs.readFileSync(`${DIST}/index.html`, 'utf8')

// The template is rewritten, not appended to. If a previous run already
// replaced the markers this would silently produce a page with no head, so
// fail loudly instead — `npm run prerender` on a stale dist/ is a real mistake.
for (const marker of ['<!--seo:start-->', '<!--seo:end-->', '<div id="root"></div>']) {
  if (!shell.includes(marker)) die(`dist/index.html has no ${marker} — is dist/ stale? Re-run \`vite build\`.`)
}

// ── per-route modulepreload ──────────────────────────────────────────────────
//
// Each route is a lazy chunk. Without a preload the browser cannot discover it
// until the entry bundle has parsed and requested it, costing a round trip on
// first paint. The manifest maps a source module to its emitted file.
const manifestPath = `${DIST}/.vite/manifest.json`
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}

/** `/services` -> `src/pages/Services.tsx`, matching src/routes.tsx's imports. */
function pageModule(routePath) {
  const key = routePath === '/' ? 'Home' : routePath.slice(1)
  const name = key[0].toUpperCase() + key.slice(1)
  return `src/pages/${name}.tsx`
}

/**
 * Module URLs the shell already fetches, in either of the two ways it can.
 *
 * Vite writes a <script type="module"> for the entry and a
 * <link rel="modulepreload"> for each of the entry's static imports — the
 * vendor and router chunks. `preloadsFor` below rediscovers all three as
 * imports of the page chunk, so without this filter every page carried a
 * duplicate preload for three URLs the browser had already been told to fetch:
 * dead bytes in ten HTML files, and three redundant entries in the preload
 * scanner's queue.
 *
 * The page's own chunk is the only one a preload actually helps with, because
 * it is the only one reachable solely through a dynamic import.
 */
const shellPreloads = new Set([
  ...[...shell.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map(m => m[1]),
  ...[...shell.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map(m => m[1]),
])

/** Chunk file plus its imported chunks, so nothing preloaded pulls a surprise. */
function preloadsFor(routePath) {
  const entry = manifest[pageModule(routePath)]
  if (!entry) return []
  const files = new Set([entry.file])
  for (const dep of entry.imports || []) {
    const d = manifest[dep]
    if (d?.file) files.add(d.file)
  }
  // Base-aware: a project-subpath deploy (BASE_URL=/repo/) would 404 on a
  // root-absolute href.
  return [...files]
    .map(f => `${BASE}${f}`.replace(/\/{2,}/g, '/'))
    .filter(href => !shellPreloads.has(href))
}

// ── git-derived <lastmod> ────────────────────────────────────────────────────
//
// The last commit that touched a route's own source is a far better lastmod
// than the deploy date, which would tell a crawler every page changed at once.
// Requires a full clone; the deploy workflow sets fetch-depth: 0 for this.
const today = new Date().toISOString().slice(0, 10)

function lastModified(routePath) {
  const files = [pageModule(routePath), 'src/lib/routes.ts']
  let newest = ''
  for (const f of files) {
    if (!fs.existsSync(f)) continue
    try {
      const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', f], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
      if (out > newest) newest = out
    } catch {
      // Not a git repo, or a shallow clone with no commit for this file.
    }
  }
  return newest || today
}

// ── emit ─────────────────────────────────────────────────────────────────────

const written = []

for (const routePath of paths) {
  const { title, html: seo } = head(routePath)
  const body = await render(routePath)

  let page = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
      `<!--seo:start-->\n${seo}\n    <!--seo:end-->`
    )
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)

  // `crossorigin` matches the tags Vite writes into the shell. A module script
  // is always fetched in CORS mode, so a preload without it can land in a
  // different cache partition and be fetched twice.
  const preloads = preloadsFor(routePath)
    .map(href => `    <link rel="modulepreload" crossorigin href="${href}" />`)
    .join('\n')

  const ld = `    <script type="application/ld+json">\n${jsonLd(routePath)}\n    </script>`

  // The shell indents `</head>` by two spaces; matching that leading run means
  // the first injected line keeps its own indent instead of inheriting both.
  page = page.replace(/[ \t]*<\/head>/, `${preloads ? preloads + '\n' : ''}${ld}\n  </head>`)

  const outDir = routePath === '/' ? DIST : path.join(DIST, routePath)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), page)
  written.push({ routePath, bytes: Buffer.byteLength(page), preloads: preloadsFor(routePath).length })
}

// ── sitemap.xml ──────────────────────────────────────────────────────────────
const urls = paths
  .map(p => {
    // absolute() from src/lib/site.ts, via the SSR bundle — the sitemap used to
    // build its own URL and was the one place still emitting the unslashed,
    // redirecting spelling.
    const loc = absolute(p)
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastModified(p)}</lastmod>`,
      `    <changefreq>${p === '/' ? 'weekly' : 'monthly'}</changefreq>`,
      `    <priority>${p === '/' ? '1.0' : '0.8'}</priority>`,
      '  </url>',
    ].join('\n')
  })
  .join('\n')

fs.writeFileSync(
  `${DIST}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
)

// ── 404 ──────────────────────────────────────────────────────────────────────
//
// GitHub Pages serves 404.html for any unmatched path.
//
// Built from the untouched `shell`, NOT from dist/index.html — by this point
// that file holds the prerendered home page, and copying it would serve the
// home page's markup and JSON-LD under every dead URL on the site.
//
// Rendered rather than left blank: the catch-all in src/routes.tsx puts
// NotFound inside AppShell, so a visitor gets the real chrome and a way out
// before the bundle even arrives. And headFor() returns a noindex-only head for
// any unmatched path, so when Seo.tsx replaces the data-seo block on mount it
// re-derives that same noindex instead of stripping it and publishing the home
// page's `index, follow` in its place.
const NOT_FOUND_PATH = '/__not-found__'
const nf = head(NOT_FOUND_PATH)
const notFound = shell
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${nf.title}</title>`)
  .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n${nf.html}\n    <!--seo:end-->`)
  .replace('<div id="root"></div>', `<div id="root">${await render(NOT_FOUND_PATH)}</div>`)
fs.writeFileSync(`${DIST}/404.html`, notFound)

// ── report ───────────────────────────────────────────────────────────────────
const missingPreloads = written.filter(w => w.preloads === 0).map(w => w.routePath)
for (const w of written) {
  console.log(`  ${w.routePath.padEnd(12)} ${String(w.bytes).padStart(7)} B  ${w.preloads} preload(s)`)
}
console.log(`  sitemap.xml  ${paths.length} urls`)
console.log(`  404.html`)
if (missingPreloads.length) {
  console.log(`\n  note: no manifest chunk found for ${missingPreloads.join(', ')} — ` +
    'these pages will fetch their route chunk a round trip late.')
}
