/**
 * Single source of truth for anything that names or locates the site.
 *
 * `ORIGIN` is the only value that must change when the domain moves: it is
 * what canonical URLs, og:url, the sitemap, robots.txt, llms.txt and the
 * JSON-LD @ids are all built from, and `public/CNAME` must agree with it.
 *
 * It has to name the host the site is actually SERVED from. It named
 * bacharthechinaguy.com while Pages served china-sourcing.bytesmonks.com,
 * which has no DNS record — so every page self-canonicalised to a host that
 * does not resolve, and the Sitemap: line in robots.txt pointed at a URL no
 * crawler could fetch. A canonical to an unreachable URL is the strongest
 * possible instruction to not index the page you are looking at.
 */
export const ORIGIN = 'https://china-sourcing.bytesmonks.com'

export const SITE_NAME = 'Bachar — The China Guy'
export const SITE_SHORT = 'Bachar'
export const TAGLINE = 'The China Guy'

export const CONTACT_EMAIL = 'china.sourcing@bytesmonks.com'
export const CONTACT_PHONE = '+216 55 966 277'
export const CONTACT_WECHAT = 'wxid_lw8hr0parldo22'

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
