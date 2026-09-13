// SSR entry, built to `.ssr/entry-server.js` and used only by
// scripts/prerender.mjs. It is the single bridge between the app's TypeScript
// and the prerenderer's plain Node: the route list, the per-route head and the
// structured data all reach the build through this module, so there is never a
// second copy of them to drift.
import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
// react-router v7 unified the packages: StaticRouter moved out of the old
// 'react-router-dom/server' entry point and onto the root export.
import { StaticRouter } from 'react-router'
import App from './App'
import { ROUTES, isIndexable, TITLE_MAX, DESCRIPTION_MAX } from './lib/routes'
import { headFor, headToHtml } from './lib/head'
import { SITE_GRAPH, schemaFor } from './lib/schema'
import {
  ORIGIN,
  SITE_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_WECHAT,
  absolute,
} from './lib/site'

/** Every path the prerenderer should emit a file for. */
export const paths: string[] = ROUTES.map(r => r.path)

/**
 * The route table flattened for the prerenderer.
 *
 * `scripts/prerender.mjs` writes sitemap.xml and llms.txt, and both need more
 * than a path: the absolute URL, whether the page may be indexed, its sitemap
 * priority, and the title and description for llms.txt. Passing them through
 * this one shape keeps the prerenderer from reimplementing `absolute()` or
 * re-deriving `indexable` — the two things it previously got wrong by having
 * its own copy.
 */
export interface SeoRoute {
  path: string
  url: string
  title: string
  description: string
  nav: string | null
  indexable: boolean
  priority: string
}

export const seoRoutes: SeoRoute[] = ROUTES.map(r => ({
  path: r.path,
  url: absolute(r.path),
  title: r.title,
  description: r.description,
  nav: r.nav,
  indexable: isIndexable(r),
  priority: r.priority ?? '0.5',
}))

/** The SERP length budget, enforced by the prerenderer. */
export const limits = { title: TITLE_MAX, description: DESCRIPTION_MAX }

/** Identity of the site, for the files the prerenderer writes by hand. */
export const site = {
  origin: ORIGIN,
  name: SITE_NAME,
  email: CONTACT_EMAIL,
  phone: CONTACT_PHONE,
  wechat: CONTACT_WECHAT,
}

/**
 * The deploy base. Must match `import.meta.env.BASE_URL` on the client, or
 * every `<Link>` renders a different href on the server than after hydration.
 */
const BASE = process.env.BASE_URL || '/'

const joinBase = (path: string): string => `${BASE}${path}`.replace(/\/{2,}/g, '/')

// Re-exported so scripts/prerender.mjs builds sitemap URLs with the same
// helper the canonical tags use, rather than a second implementation.
export { ORIGIN, absolute }

/**
 * Render one route to HTML.
 *
 * `prerenderToNodeStream`, and therefore async, because every route is a
 * `React.lazy` chunk sitting behind a Suspense boundary. The synchronous
 * renderers cannot await a lazy component: they emit the fallback — `null`
 * here — and hand back a page whose `#root` is empty. This waits for the whole
 * tree to settle before resolving, which is the entire point of the prerender.
 */
export async function render(path: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter basename={BASE} location={joinBase(path)}>
        <App />
      </StaticRouter>
    </StrictMode>
  )

  const chunks: Buffer[] = []
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

/** The `<!--seo:start-->…<!--seo:end-->` payload for one route. */
export function head(path: string): { title: string; html: string } {
  const h = headFor(path)
  return { title: h.title, html: headToHtml(h) }
}

/**
 * JSON-LD for one route: the site-wide nodes plus that page's own. Kept in one
 * `@graph` so the two sets are declared together and can cross-reference by
 * `@id` without either being emitted twice.
 */
export function jsonLd(path: string): string {
  return JSON.stringify(
    { '@context': 'https://schema.org', '@graph': [...SITE_GRAPH, ...schemaFor(path)] },
    null,
    2
  )
}
