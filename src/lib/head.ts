/**
 * The per-route head, built once and consumed twice.
 *
 * `scripts/prerender.mjs` imports this through the SSR bundle and writes the
 * tags between the `<!--seo:start-->`/`<!--seo:end-->` markers in each emitted
 * HTML file; `src/components/Seo.tsx` runs the same list through the DOM after
 * a client-side navigation. One definition, so a prerendered page and a
 * navigated-to page can never disagree.
 */
import { ORIGIN, SITE_NAME, OG_IMAGE, absolute } from './site'
import { routeByPath } from './routes'

export interface MetaTag {
  /** `name` for standard meta, `property` for Open Graph. */
  kind: 'name' | 'property' | 'canonical'
  key: string
  content: string
}

export interface Head {
  title: string
  tags: MetaTag[]
}

export const NOT_FOUND_TITLE = 'Page not found | Bachar — The China Guy'

const KEYWORDS =
  'china sourcing agent, guangzhou sourcing agent, factory audit china, quality inspection china, yiwu market agent, shenzhen sourcing, product sourcing china, freight forwarding china'

export function headFor(path: string): Head {
  const route = routeByPath(path)

  // No route: this is the 404. Falling back to ROUTES[0] used to hand every
  // dead URL the home page's title, canonical and `robots: index, follow` —
  // and because Seo.tsx replaces the whole `data-seo` block on mount, it did
  // so *after* stripping the prerendered noindex, turning 404.html into an
  // indexable duplicate of the home page in the rendered DOM.
  if (!route) {
    return {
      title: NOT_FOUND_TITLE,
      tags: [{ kind: 'name', key: 'robots', content: 'noindex, follow' }],
    }
  }

  const url = absolute(route.path)
  const { title, description } = route

  return {
    title,
    tags: [
      { kind: 'name', key: 'title', content: title },
      { kind: 'name', key: 'description', content: description },
      { kind: 'name', key: 'keywords', content: KEYWORDS },
      {
        kind: 'name',
        key: 'robots',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
      { kind: 'canonical', key: 'canonical', content: url },

      { kind: 'property', key: 'og:type', content: 'website' },
      { kind: 'property', key: 'og:site_name', content: SITE_NAME },
      { kind: 'property', key: 'og:url', content: url },
      { kind: 'property', key: 'og:title', content: title },
      { kind: 'property', key: 'og:description', content: description },
      { kind: 'property', key: 'og:image', content: OG_IMAGE },
      { kind: 'property', key: 'og:image:width', content: '1200' },
      { kind: 'property', key: 'og:image:height', content: '630' },
      { kind: 'property', key: 'og:image:type', content: 'image/png' },
      {
        kind: 'property',
        key: 'og:image:alt',
        content: 'Bachar — sourcing agent on the ground in Guangzhou',
      },
      { kind: 'property', key: 'og:locale', content: 'en_US' },

      { kind: 'name', key: 'twitter:card', content: 'summary_large_image' },
      { kind: 'name', key: 'twitter:url', content: url },
      { kind: 'name', key: 'twitter:title', content: title },
      { kind: 'name', key: 'twitter:description', content: description },
      { kind: 'name', key: 'twitter:image', content: OG_IMAGE },
    ],
  }
}

const escapeAttr = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Serialise one head to the HTML the prerenderer injects. */
export function headToHtml(head: Head, indent = '    '): string {
  return head.tags
    .map(t => {
      const content = escapeAttr(t.content)
      if (t.kind === 'canonical') return `${indent}<link rel="canonical" href="${content}" data-seo />`
      return `${indent}<meta ${t.kind}="${t.key}" content="${content}" data-seo />`
    })
    .join('\n')
}

export { ORIGIN }
