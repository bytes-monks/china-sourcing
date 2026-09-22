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
 * Where the quote form on /contact delivers to.
 *
 * The same formgrid collector the owner's other site (bytes-monks) posts to;
 * `formType` in the body is what separates the two sites' enquiries in the one
 * inbox. The request shape lives in `src/lib/contact.ts`. A single-quoted
 * literal on one line on purpose: the harness reads it by regex, the same way
 * it reads the three constants above, to mock it so CI never sends a real
 * enquiry.
 */
export const FORM_ENDPOINT = 'https://formgrid.dev/api/f/jjl2cap8'

/**
 * CONTACT_PHONE as wa.me wants it — country code and number, digits only, no
 * `+`. Derived rather than restated, so the number printed on the page and the
 * number every WhatsApp link opens can never disagree.
 */
export const WHATSAPP_NUMBER = CONTACT_PHONE.replace(/\D/g, '')

/**
 * A click-to-chat link. `text` pre-fills the visitor's first message; they
 * still see it and press send themselves, so nothing is sent on their behalf.
 */
export const whatsappUrl = (text?: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}` + (text ? `?text=${encodeURIComponent(text)}` : '')

/**
 * A mailto: link to CONTACT_EMAIL. Each part is percent-encoded on its own
 * (RFC 6068 — a raw `&` or `#` in a subject would end it early), and line
 * breaks in the body are written as CRLF, which is what the RFC asks for and
 * the form Outlook needs before it keeps them.
 */
export const mailtoUrl = (subject?: string, body?: string): string => {
  const query = [
    subject ? `subject=${encodeURIComponent(subject)}` : '',
    body ? `body=${encodeURIComponent(body.replace(/\r?\n/g, '\r\n'))}` : '',
  ].filter(Boolean).join('&')
  return `mailto:${CONTACT_EMAIL}` + (query ? `?${query}` : '')
}

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

/**
 * The site-wide brand card (scripts/generate-brand-assets.py). No route's head
 * uses it any more — each has its own card in public/og/, see head.ts — so it
 * is now only the business node's `image` in the JSON-LD.
 */
export const OG_IMAGE = `${ORIGIN}/og-image.png`

/** A photograph of Bachar, for the portrait slot on Home and About. */
export interface PortraitImage {
  /** Root-relative (`/bachar.jpg`, served from public/) or an absolute URL. */
  src: string
  /** Intrinsic pixel size of the file. Rendered as width/height attributes. */
  width: number
  height: number
  /** What the photo shows. Read aloud, and used as the JSON-LD caption. */
  alt: string
}

/**
 * The portrait on Home and About, and the `image` of the Person in the JSON-LD.
 * `null` until there is a real photograph.
 *
 * While it is null, both pages draw a finished fallback in the slot — the
 * masthead's red "B" seal at display size over a factual caption — and the
 * Person node has no `image` at all, because the only other picture on the
 * site is the OG brand card, and an `image` on a Person is read as what that
 * person looks like.
 *
 * To add the photo:
 *   1. Put the file in public/ — e.g. public/bachar.jpg. The slot is a 4:5
 *      portrait (it is cropped to fill with object-fit: cover, so another
 *      ratio works but loses its edges); 1200 × 1500 is plenty.
 *   2. Set this to
 *        { src: '/bachar.jpg', width: 1200, height: 1500,
 *          alt: 'Bachar on a factory floor in Foshan' }
 *      with the file's real pixel size and an alt that says what it shows.
 * Nothing else changes. The slot's box is sized by the page layout, not by
 * the image, so the pages around it do not move.
 */
export const PORTRAIT: PortraitImage | null = null

/**
 * The office, in one place. The About and Contact pages print it, the
 * PostalAddress in the JSON-LD restates it field by field, and `ADDRESS_MAP`
 * is what `hasMap` points at — derived from the same string rather than a
 * second, driftable copy of the address.
 */
export const ADDRESS_LINE = 'Room 1804, Tianhe North Road, Tianhe District'
export const ADDRESS_LOCALITY = 'Guangzhou'
export const ADDRESS_REGION = 'Guangdong'
export const ADDRESS_POSTAL = '510620'
export const ADDRESS_COUNTRY = 'CN'

export const ADDRESS_MAP =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(
    `${ADDRESS_LINE}, ${ADDRESS_LOCALITY} ${ADDRESS_POSTAL}, ${ADDRESS_REGION}, China`
  )
