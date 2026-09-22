/**
 * The per-route head, built once and consumed twice.
 *
 * `scripts/prerender.mjs` imports this through the SSR bundle and writes the
 * tags between the `<!--seo:start-->`/`<!--seo:end-->` markers in each emitted
 * HTML file; `src/components/Seo.tsx` runs the same list through the DOM after
 * a client-side navigation. One definition, so a prerendered page and a
 * navigated-to page can never disagree.
 */
import { ORIGIN, SITE_NAME, SITE_SHORT, TAGLINE, absolute } from './site'
import { routeByPath, isIndexable, type RouteDef } from './routes'

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

/**
 * The indexing directives, for a page that should be indexed.
 *
 * `index, follow` is the default and saying it changes nothing, but the three
 * that follow it do real work and only exist as a `robots` value:
 * `max-image-preview:large` is what lets Google use the full-width image in a
 * result rather than a thumbnail, and the two `max-snippet`/`max-video-preview`
 * opt-outs of length limits are what allow a full-length snippet. Without them
 * Google applies its conservative defaults.
 */
const INDEX_DIRECTIVES =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

/**
 * `noindex, follow`, for a page that is real but does not belong in an index.
 *
 * `follow` is the load-bearing half: the page is linked from the footer of
 * every other page and links back to all of them, so `nofollow` would strand
 * that link equity rather than pass it on.
 */
const NOINDEX_DIRECTIVES = 'noindex, follow'

/**
 * The route's own share card: `public/og/<route.key>.png`, 1200 x 630,
 * rendered by `scripts/generate-og.mjs` (`npm run og`), which writes them by
 * this same rule.
 *
 * Every route used to point at the one `og-image.png`, so a link to /pricing/
 * and a link to /faq/ previewed identically in WhatsApp, Slack and LinkedIn —
 * the image is the largest thing in a link preview, and it said nothing about
 * the page. Built from the key alone, so this stays a pure function: headFor()
 * runs in the browser on every navigation, where there is no file to look at.
 * Whether the file exists is a build-time question, answered by
 * `generate-og.mjs --check`.
 */
export const ogImageFor = (route: RouteDef): string => `${ORIGIN}/og/${route.key}.png`

/**
 * The headline printed on the card: the title's page half, before " | " —
 * the brand half is already on the card as the lockup. `headlineOf()` in
 * generate-og.mjs spells out the same rule; keep the two in step.
 */
export const ogHeadline = (route: RouteDef): string => route.title.split(' | ')[0]

/**
 * og:image:alt / twitter:image:alt: what the card says, in words. The card is
 * an image of text, so its alt is that text — the headline and whose card it
 * is — not a description of its layout. The brand is left off a headline that
 * already names him ("About Bachar — …").
 */
export const ogImageAlt = (route: RouteDef): string => {
  const headline = ogHeadline(route)
  return headline.includes(SITE_SHORT) ? headline : `${headline} — ${SITE_SHORT}, ${TAGLINE}`
}

/**
 * Open Graph's `article` vocabulary, for the routes that are editorial.
 *
 * `og:type=article` is what makes LinkedIn and Facebook treat the share as a
 * piece of writing with a date and an author, rather than as a home page.
 * `modified_time` equals `published_time` until a guide is revised; the route
 * table carries one date because there has been one. `article:author` is a
 * profile URL, not a name — the spec types it as a `profile` object — and the
 * profile is /about/, the page the JSON-LD `Person` already lives on.
 */
const articleTags = (published: string): MetaTag[] => [
  { kind: 'property', key: 'article:published_time', content: published },
  { kind: 'property', key: 'article:modified_time', content: published },
  { kind: 'property', key: 'article:author', content: absolute('/about') },
  { kind: 'property', key: 'article:section', content: 'Guides' },
]

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
      tags: [{ kind: 'name', key: 'robots', content: NOINDEX_DIRECTIVES }],
    }
  }

  const url = absolute(route.path)
  const { title, description } = route
  const image = ogImageFor(route)
  const imageAlt = ogImageAlt(route)

  return {
    title,
    tags: [
      { kind: 'name', key: 'description', content: description },
      {
        kind: 'name',
        key: 'robots',
        content: isIndexable(route) ? INDEX_DIRECTIVES : NOINDEX_DIRECTIVES,
      },
      // Google's directives are the ones `robots` above carries; Bing, Yandex
      // and Baidu read the generic tag too, so one tag covers every engine.
      // A per-engine `googlebot` tag would only be needed to say something
      // DIFFERENT to Google, and nothing here does.
      { kind: 'canonical', key: 'canonical', content: url },

      { kind: 'property', key: 'og:type', content: route.article ? 'article' : 'website' },
      { kind: 'property', key: 'og:site_name', content: SITE_NAME },
      { kind: 'property', key: 'og:url', content: url },
      { kind: 'property', key: 'og:title', content: title },
      { kind: 'property', key: 'og:description', content: description },
      { kind: 'property', key: 'og:image', content: image },
      // og:image is already https, so secure_url is the same URL. Facebook's
      // scraper and several link-preview services still look for it by name.
      { kind: 'property', key: 'og:image:secure_url', content: image },
      { kind: 'property', key: 'og:image:width', content: '1200' },
      { kind: 'property', key: 'og:image:height', content: '630' },
      { kind: 'property', key: 'og:image:type', content: 'image/png' },
      { kind: 'property', key: 'og:image:alt', content: imageAlt },
      { kind: 'property', key: 'og:locale', content: 'en_US' },
      ...(route.article ? articleTags(route.article.published) : []),

      { kind: 'name', key: 'twitter:card', content: 'summary_large_image' },
      { kind: 'name', key: 'twitter:url', content: url },
      { kind: 'name', key: 'twitter:title', content: title },
      { kind: 'name', key: 'twitter:description', content: description },
      { kind: 'name', key: 'twitter:image', content: image },
      // Paired with twitter:image the way og:image:alt is paired with og:image.
      // Without it the card is an image with no accessible name.
      { kind: 'name', key: 'twitter:image:alt', content: imageAlt },
    ],
  }
}

/*
 * Two tags that used to be in the list above and are deliberately not any more.
 *
 * `<meta name="keywords">` — Google has ignored it since 2009 and said so on
 * the record. Bing went further: it is read as one spam signal among many,
 * because a keyword list is self-declared and unverifiable. It could not raise
 * a ranking and could lower one, which makes keeping it a bet with no upside.
 * The terms it carried are all on the pages themselves, which is where a
 * crawler weighs them.
 *
 * `<meta name="title">` — not a tag in any specification. The document title is
 * `<title>`, which this file already sets, and og:title covers the social half.
 * No engine has ever read `name="title"`.
 */

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
