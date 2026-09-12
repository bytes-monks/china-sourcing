/**
 * Single source of truth for anything that names or locates the site.
 *
 * `ORIGIN` is the only value that must change when the domain is decided: it
 * is what canonical URLs, og:url, the sitemap and the JSON-LD @ids are built
 * from, and `public/CNAME` must agree with it.
 */
export const ORIGIN = 'https://bacharthechinaguy.com'

export const SITE_NAME = 'Bachar — The China Guy'
export const SITE_SHORT = 'Bachar'
export const TAGLINE = 'The China Guy'

export const CONTACT_EMAIL = 'bachar@thechinaguy.com'
export const CONTACT_PHONE = '+86 138 0000 0000'

/**
 * Absolute URL for a route path, in the directory form.
 *
 * `/pricing` -> `https://…/pricing/`, with the trailing slash, because the
 * build emits `dist/pricing/index.html` and GitHub Pages serves that at
 * `/pricing/` while 301-redirecting the bare `/pricing`. A canonical, og:url or
 * sitemap <loc> naming the redirecting spelling makes every self-reference on
 * the site point one hop away from the page doing the pointing.
 */
export const absolute = (path: string): string =>
  new URL(path.endsWith('/') ? path : `${path}/`, ORIGIN).href

export const OG_IMAGE = `${ORIGIN}/og-image.png`
