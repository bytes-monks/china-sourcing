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

const { paths, render, head, jsonLd, seoRoutes, site, limits } = await import(
  pathToFileURL(path.resolve(SSR)).href
)

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

// ── route -> page module ─────────────────────────────────────────────────────
//
// Two things below need the source file that renders a route: the
// modulepreload (the manifest is keyed by source path) and <lastmod> (git log
// on that file). It used to be derived from the path by naming convention —
// `/services` -> `src/pages/Services.tsx` — which held for ten flat routes and
// broke on the first nested one: `/guides/aql-inspection` became
// `src/pages/Guides/aql-inspection.tsx`, a file that does not exist, so every
// guide shipped without its preload and with a <lastmod> that only tracked
// routes.ts.
//
// The mapping already exists, once, in src/routes.tsx: a
// `const X = lazy(() => import('./pages/…'))` per page and a
// `{ path: '…', element: <X /> }` per route. So it is read out of that file
// rather than restated here, by regex — the same trade pixel-lib.mjs makes to
// read site.ts, since routes.tsx is TSX and this is plain Node. A file that no
// longer parses fails loudly; a single route the parse cannot place is named
// in the run's closing note, like any other route that found no chunk.
//
// Child paths are taken as children of `/`, which is the only parent route
// src/routes.tsx has. A nested <Outlet> layout would need its prefix here.
const ROUTES_SRC = 'src/routes.tsx'
const SOURCE_EXTS = ['.tsx', '.ts', '.jsx', '.js']

/** An import specifier resolved from `fromFile` to a repo-relative source path. */
function resolveSource(fromFile, spec) {
  const base = path.posix.join(path.posix.dirname(fromFile), spec)
  for (const candidate of [base, ...SOURCE_EXTS.map(e => base + e), ...SOURCE_EXTS.map(e => `${base}/index${e}`)]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return null
}

function readRouteModules() {
  const src = fs.readFileSync(ROUTES_SRC, 'utf8')
  const lazyPages = new Map(
    [...src.matchAll(/const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)\s*\)/g)]
      .map(([, name, spec]) => [name, spec])
  )
  if (lazyPages.size === 0) die(`found no \`lazy(() => import(…))\` page in ${ROUTES_SRC} — has its shape changed?`)

  const modules = new Map()
  for (const [, index, childPath, name] of src.matchAll(
    /\{\s*(?:(index:\s*true)|path:\s*['"]([^'"]*)['"])\s*,\s*element:\s*<(\w+)\s*\/>/g
  )) {
    // AppShell and NotFound are imported eagerly: they have no chunk of their
    // own to preload, and neither is a page with a sitemap entry.
    const spec = lazyPages.get(name)
    if (!spec) continue
    const routePath = index ? '/' : `/${childPath.replace(/^\/+|\/+$/g, '')}`
    const file = resolveSource(ROUTES_SRC, spec)
    if (file) modules.set(routePath, file)
  }
  if (modules.size === 0) die(`found no \`{ path, element: <Page /> }\` route in ${ROUTES_SRC} — has its shape changed?`)
  return modules
}

const ROUTE_MODULES = readRouteModules()

/** `/guides/aql-inspection` -> `src/pages/guides/AqlInspection.tsx`, or null. */
function pageModule(routePath) {
  return ROUTE_MODULES.get(routePath) ?? null
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
  const mod = pageModule(routePath)
  const entry = mod && manifest[mod]
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

// Content a page renders that lives outside its own module. The guides take
// their headline and summaries from src/lib/guides.ts — each guide through
// GuideLayout, the index directly — so an edit there is an edit to every page
// that reaches it and has to move their <lastmod>. Only the modules named here
// count, deliberately: a page importing site.ts for a phone number, or a shared
// layout component, has not changed what it says when those files do, and a
// lastmod that moves for no reason teaches a crawler to stop trusting it.
const CONTENT_MODULES = ['src/lib/guides.ts']

/**
 * The CONTENT_MODULES a page module reaches through its relative imports,
 * directly or through the components it renders. Package imports are not
 * followed; they are not the site's copy.
 */
function contentModulesOf(file) {
  const seen = new Set()
  const walk = f => {
    if (!f || seen.has(f)) return
    seen.add(f)
    const src = fs.readFileSync(f, 'utf8')
    for (const [, spec] of src.matchAll(/\b(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      walk(resolveSource(f, spec))
    }
  }
  walk(file)
  return CONTENT_MODULES.filter(m => seen.has(m))
}

function lastModified(routePath) {
  const mod = pageModule(routePath)
  const files = [mod, ...contentModulesOf(mod), 'src/lib/routes.ts'].filter(Boolean)
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

// ── snippet length gate ──────────────────────────────────────────────────────
//
// A title or description that overruns the SERP is cut mid-clause, and there is
// no place it looks wrong before then: not in the editor, not in the rendered
// page, not in any of the other checks in this repo. The build is the only
// moment it can be caught, so it is caught here and it is fatal.
//
// Over the limit, the fix is to write a shorter one — never to let it ship and
// hope Google picks a better sentence out of the body, which it will do on its
// own terms and often badly.
const tooLong = []
for (const r of seoRoutes) {
  if (r.title.length > limits.title) {
    tooLong.push(`${r.path} title ${r.title.length}/${limits.title}`)
  }
  if (r.description.length > limits.description) {
    tooLong.push(`${r.path} description ${r.description.length}/${limits.description}`)
  }
}
if (tooLong.length) {
  die(`over the SERP length budget — shorten in src/lib/routes.ts:\n    ${tooLong.join('\n    ')}`)
}

// ── share-card gate ──────────────────────────────────────────────────────────
//
// headFor() names `/og/<route key>.png` for every route without looking — it
// runs in the browser too, so it cannot stat a file. That makes this the one
// place a missing card can be caught before it ships as a broken image in
// every WhatsApp and LinkedIn preview of the page. `--check` also catches a
// card rendered for a title the route no longer has. It needs no browser and
// no network (scripts/generate-og.mjs explains how), so the deploy can afford
// it; rendering the cards stays a manual `npm run og`.
try {
  execFileSync(process.execPath, ['scripts/generate-og.mjs', '--check'], { stdio: 'inherit' })
} catch {
  die('share cards in public/og/ are missing or stale — run `npm run og` and commit the result')
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
//
// Indexable routes only. A sitemap is a list of URLs the site is ASKING to have
// indexed, so listing one that serves `noindex` is the site contradicting
// itself — it shows up in Search Console as "Excluded by 'noindex'" and spends
// crawl on a page that can never appear.
//
// `url` and `priority` come from the route table through the SSR bundle rather
// than being rebuilt here. The sitemap was the one place that built its own URL
// and the one place still emitting the unslashed, redirecting spelling.
const indexable = seoRoutes.filter(r => r.indexable)

const urls = indexable
  .map(r =>
    [
      '  <url>',
      `    <loc>${r.url}</loc>`,
      `    <lastmod>${lastModified(r.path)}</lastmod>`,
      `    <changefreq>${r.path === '/' ? 'weekly' : 'monthly'}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
      '  </url>',
    ].join('\n')
  )
  .join('\n')

fs.writeFileSync(
  `${DIST}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
)

// ── robots.txt ───────────────────────────────────────────────────────────────
//
// Generated, not shipped from public/, for one reason: it names the origin, and
// so do the canonical tags, the sitemap and every JSON-LD @id. A static
// public/robots.txt is a second place the domain is written down, and the last
// time this site had two of those they disagreed — robots.txt advertised a
// sitemap on a host with no DNS record, so no crawler ever read it. ORIGIN in
// src/lib/site.ts is now the only place the domain appears.
//
// `npm run build:spa` does not run this script and so emits no robots.txt. That
// is correct: build:spa is the typecheck-and-bundle path for CI, not a
// deployable artefact. The deploy workflow runs the full `npm run build`.
const AI_RETRIEVAL = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User']
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'meta-externalagent']

const agentGroup = name => `User-agent: ${name}\nAllow: /\n`

const robots = [
  `# ${site.origin}/robots.txt`,
  '#',
  '# Every route is prerendered to static HTML and returns 200 — nothing here',
  '# needs JavaScript to be crawled. There is nothing on this site that should',
  '# not be crawled, so there is no Disallow for anything: the pages are public,',
  '# and /assets/ has to stay fetchable or Google renders the site unstyled and',
  '# judges the layout it sees rather than the one visitors get.',
  '#',
  '# Pages that should not be INDEXED say so in their own <meta name="robots">,',
  '# which is the only mechanism that works. A Disallow does the opposite of what',
  '# people expect of it: it blocks the crawl, so the crawler never reads the',
  '# noindex, and the URL can still be listed from inbound links alone.',
  '',
  agentGroup('*'),
  '# ── Answer engines ─────────────────────────────────────────────────────────',
  '#',
  '# Named explicitly because several of these default to "no" when a site has',
  '# never mentioned them. Being quotable inside an assistant is now part of',
  '# being findable: a buyer asking "how do I find a factory in China" is',
  '# increasingly asking a model, not a search box.',
  '#',
  '# Two groups, and the distinction is worth keeping straight. The first fetch',
  '# pages to ANSWER a question, with attribution and a link — that is traffic.',
  '# The second collect pages to TRAIN on, with no link back. Both are allowed',
  '# here; to keep the training crawlers out without losing the citations, change',
  '# AI_TRAINING in scripts/prerender.mjs to emit Disallow instead.',
  '',
  '# Retrieval and citation — these send a link back.',
  ...AI_RETRIEVAL.map(agentGroup),
  '# Training and model improvement — no link back.',
  ...AI_TRAINING.map(agentGroup),
  `Sitemap: ${site.origin}/sitemap.xml`,
  '',
].join('\n')

fs.writeFileSync(`${DIST}/robots.txt`, robots)

// ── llms.txt ─────────────────────────────────────────────────────────────────
//
// The same map of the site, written for the crawlers that answer a question
// instead of returning ten links. A growing share of "how do I find a factory
// in China" now gets answered inside an assistant, and the page that gets cited
// is the one the model could read cheaply and attribute confidently.
//
// This is a convention, not a standard: no engine is obliged to read it, and
// nothing here is a directive. It costs one generated file and it is built from
// the same route table as everything else, so it cannot drift out of date the
// way a hand-maintained one would.
//
// The guides get a section of their own. They are the pages on the site most
// likely to be quoted — "how do I verify a Chinese factory" is a question, and
// they are answers — and an answer engine choosing what to read first is
// helped by being told which pages are reference and which are the business.
// Identified by path, the one thing the SSR bundle's seoRoutes carries that
// marks them: /guides and everything under it.
const isGuide = r => r.path === '/guides' || r.path.startsWith('/guides/')

const llms = [
  `# ${site.name}`,
  '',
  `> ${indexable[0].description}`,
  '',
  'Independent sourcing agent based in Guangzhou, China. Finds and vets factories,',
  'negotiates prices, audits plants, inspects goods before shipment and arranges',
  'freight, for overseas buyers importing from Guangzhou, Foshan, Yiwu and Shenzhen.',
  'Takes no commission from suppliers; the client pays the factory directly.',
  '',
  '## Pages',
  '',
  ...indexable.filter(r => !isGuide(r)).map(r => `- [${r.nav ?? r.title.split(' | ')[0]}](${r.url}): ${r.description}`),
  '',
  '## Guides',
  '',
  'Plain-English reference on importing from China, written in the first person by the agent.',
  '',
  ...indexable.filter(isGuide).map(r => `- [${r.title.split(' | ')[0]}](${r.url}): ${r.description}`),
  '',
  '## Contact',
  '',
  `- Email: ${site.email}`,
  `- WhatsApp / phone: ${site.phone}`,
  `- WeChat: ${site.wechat}`,
  '- Hours: Monday to Saturday, 09:00–19:00 China Standard Time (UTC+8)',
  '',
  '## Notes',
  '',
  '- Prices quoted on the pricing page are in US dollars and are the fee for the',
  '  sourcing service only. They exclude the cost of the goods and freight.',
  '- Structured data for every page is published as JSON-LD in the page head.',
  `- Full URL list: ${site.origin}/sitemap.xml`,
  '',
].join('\n')

fs.writeFileSync(`${DIST}/llms.txt`, llms)

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
console.log(`  sitemap.xml  ${indexable.length} urls (${paths.length - indexable.length} noindex, excluded)`)
console.log(`  llms.txt     ${indexable.length} pages`)
console.log(`  robots.txt   ${1 + AI_RETRIEVAL.length + AI_TRAINING.length} agent groups`)
console.log(`  404.html`)
if (missingPreloads.length) {
  console.log(`\n  note: no manifest chunk found for ${missingPreloads.join(', ')} — ` +
    'these pages will fetch their route chunk a round trip late.')
}
