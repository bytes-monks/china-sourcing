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
import { ROUTES } from './lib/routes'
import { headFor, headToHtml } from './lib/head'
import { SITE_GRAPH, schemaFor } from './lib/schema'
import { ORIGIN, absolute } from './lib/site'

/** Every path the prerenderer should emit a file for. */
export const paths: string[] = ROUTES.map(r => r.path)

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
