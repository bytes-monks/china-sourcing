/**
 * The route table.
 *
 * The design canvas swaps ten artboards through component state, because a
 * canvas only ever has one URL. The site gives each artboard a real path, so
 * every page is linkable, crawlable and prerenderable. This table is the one
 * place that mapping lives: the header nav, the router, `scripts/prerender.mjs`
 * and the sitemap all read it.
 */
export interface RouteDef {
  /** Artboard key in the design canvas. */
  key: string
  path: string
  /** Label in the header nav; `null` keeps the route out of the nav. */
  nav: string | null
  title: string
  description: string
  /**
   * Whether the page belongs in a search index. Defaults to true.
   *
   * `false` makes three things happen together, which is the point of keeping
   * the flag here rather than spelling it out in three files: `headFor()` emits
   * `noindex, follow` instead of the indexing directives, `schemaFor()` emits no
   * page-level JSON-LD (a `WebPage` node whose `@id` claims to be an indexable
   * page it is not is a contradiction a crawler can see), and the prerenderer
   * leaves the URL out of sitemap.xml. A noindexed URL listed in a sitemap is
   * the single most common "Excluded by 'noindex'" report in Search Console:
   * the sitemap says crawl and index this, the page says do not.
   */
  indexable?: boolean
  /**
   * sitemap.xml <priority>. Relative importance WITHIN this site only — it
   * says nothing to a crawler about how this site ranks against another.
   * Google has said it ignores the field; Bing, Yandex and Baidu still read it,
   * and it costs one number to point them at the pages that convert.
   */
  priority?: string
}

export const ROUTES: RouteDef[] = [
  {
    key: 'home',
    path: '/',
    nav: 'Home',
    title: 'Bachar — The China Guy | Sourcing agent in Guangzhou',
    description:
      'I find your factory, walk the floor, and get it shipped. Independent sourcing agent in Guangzhou, Foshan, Yiwu and Shenzhen — no commission from suppliers.',
    priority: '1.0',
  },
  {
    key: 'services',
    path: '/services',
    nav: 'What I do',
    title: 'What I do | Bachar — The China Guy',
    description:
      'Sourcing and vetting, price negotiation, factory audits, quality inspection, samples and freight — everything between your idea and a container on the water.',
    priority: '0.9',
  },
  {
    key: 'process',
    path: '/process',
    nav: 'How it works',
    title: 'How it works | Bachar — The China Guy',
    description:
      'Four rules I do not break, and the step-by-step of how an order moves from your product list to a sealed container — with a paper trail at every stage.',
    priority: '0.8',
  },
  {
    key: 'industries',
    path: '/industries',
    nav: 'Who I help',
    title: 'Who I help | Bachar — The China Guy',
    description:
      'The buyers and categories I work with day to day, and the sourcing problems each one runs into in Guangzhou, Foshan, Yiwu and Shenzhen.',
    priority: '0.8',
  },
  {
    key: 'pricing',
    path: '/pricing',
    nav: 'Pricing',
    title: 'Pricing | Bachar — The China Guy',
    description:
      'No commission, no contract, no layers. Sourcing is free until you approve the quote, your money never passes through me, and payment waits for inspection.',
    priority: '0.9',
  },
  {
    key: 'about',
    path: '/about',
    nav: 'About me',
    title: 'About me | Bachar — The China Guy',
    description:
      'Judge the work, not the brochure. Who I am, how I ended up sourcing in Guangzhou, and why I take nothing from the factories I recommend.',
    priority: '0.7',
  },
  {
    key: 'faq',
    path: '/faq',
    nav: 'FAQ',
    title: 'FAQ | Bachar — The China Guy',
    description:
      'The questions I get in the first call: commission, minimum order size, tooling ownership, failed inspections, payment terms and whether you have to fly out.',
    priority: '0.8',
  },
  {
    key: 'audit',
    path: '/audit',
    nav: null,
    title: 'Sample audit report | Bachar — The China Guy',
    description:
      'A real factory audit report, redacted: licence and capacity checks, equipment, workforce, certifications, sub-contracting and the defects found on site.',
    priority: '0.8',
  },
  {
    key: 'contact',
    path: '/contact',
    nav: null,
    title: 'Get a free quote | Bachar — The China Guy',
    description:
      "Send me your product list. You'll hear back within 12 working hours with an honest read on what it costs, what it takes, and whether I'm right for it.",
    priority: '0.9',
  },
  {
    key: 'mobile',
    path: '/mobile',
    nav: null,
    title: 'On a phone | Bachar — The China Guy',
    description:
      'Over half of first enquiries arrive from a phone, usually via WhatsApp. How the site behaves on a small screen.',
    // Documentation of the site's own responsive layer, not something a buyer
    // sourcing from China searches for. Indexing it spends the site's crawl and
    // relevance on a page with no commercial intent and no query behind it, and
    // risks it surfacing for brand searches ahead of a page that converts. It
    // stays reachable, linked from the footer, and passes its link equity on —
    // `noindex, follow`, not `nofollow`.
    indexable: false,
  },
]

/**
 * What a search result can actually show before it truncates.
 *
 * Google renders a title to about 600px and a description to about 920px on
 * desktop — narrower on a phone. Character counts are a proxy for a pixel
 * budget, so these are deliberately a little under where the cut falls: a
 * description that ends in a full stop is one Google is more likely to use
 * verbatim, and one that ends in an ellipsis mid-clause is a sentence the
 * reader has to finish themselves before deciding to click.
 *
 * Enforced at build time by `scripts/prerender.mjs`, which is the only place
 * that can catch the drift — nothing about an over-long description looks
 * wrong in the editor or in the rendered page.
 */
export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 158

export const NAV_ROUTES = ROUTES.filter(r => r.nav !== null)

/** The routes that belong in sitemap.xml and llms.txt. */
export const INDEXABLE_ROUTES = ROUTES.filter(r => r.indexable !== false)

export const isIndexable = (route: RouteDef): boolean => route.indexable !== false

/**
 * `/pricing/` and `/pricing` name the same route.
 *
 * This matters because GitHub Pages serves `dist/pricing/index.html` at
 * `/pricing/` and 301-redirects `/pricing` to it — so the slashed form is the
 * one visitors and crawlers actually land on. React Router matches it happily,
 * but `useLocation().pathname` then reads `/pricing/`, and an exact lookup
 * would miss and silently fall back to the home page's head.
 */
export const normalizePath = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, '') || '/' : '/'

export const routeByPath = (path: string): RouteDef | undefined => {
  const p = normalizePath(path)
  return ROUTES.find(r => r.path === p)
}
