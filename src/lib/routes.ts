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
  /**
   * Present on the guides: an editorial page with a publication date. Drives
   * `og:type=article`, the `article:*` meta and the `Article` JSON-LD node.
   * ISO dates (YYYY-MM-DD).
   */
  article?: { published: string }
}

export const ROUTES: RouteDef[] = [
  {
    key: 'home',
    path: '/',
    nav: 'Home',
    title: 'China Sourcing Agent in Guangzhou | Bachar — The China Guy',
    description:
      'Independent China sourcing agent in Guangzhou. I find your factory, walk the floor and get it shipped — Foshan, Yiwu, Shenzhen. No commission from suppliers.',
    priority: '1.0',
  },
  {
    key: 'services',
    path: '/services',
    nav: 'What I do',
    title: 'Sourcing, Factory Audits & QC Inspection in China | Bachar',
    description:
      'Supplier sourcing and vetting, price negotiation, factory audits, AQL quality inspection, samples and freight from China — buy the whole chain or one link.',
    priority: '0.9',
  },
  {
    key: 'process',
    path: '/process',
    nav: 'How it works',
    title: 'How Sourcing From China Works, Step by Step | Bachar',
    description:
      'How importing from China works with an agent: brief, factory shortlist, golden sample, contract, inspected production and shipping. 9–14 weeks, first order.',
    priority: '0.8',
  },
  {
    key: 'industries',
    path: '/industries',
    nav: 'Who I help',
    title: 'China Sourcing for Amazon Sellers, Brands & Retail | Bachar',
    description:
      'China sourcing for Amazon FBA sellers, retail chains, startups, growing brands and dropshippers — low-MOQ runs, dual sourcing and Yiwu trial orders.',
    priority: '0.8',
  },
  {
    key: 'pricing',
    path: '/pricing',
    nav: 'Pricing',
    title: 'Sourcing Agent Fees: No Supplier Commission | Bachar',
    description:
      'What a China sourcing agent costs: 5–8% per order (min US$600) or US$1,900/mo. No commission from factories, and you pay the supplier directly.',
    priority: '0.9',
  },
  {
    key: 'about',
    path: '/about',
    nav: 'About me',
    title: 'About Bachar — Independent Sourcing Agent in Guangzhou',
    description:
      'Why I take nothing from the factories I recommend: I lost money to a trading company posing as a factory, then moved to Guangzhou to source on the ground.',
    priority: '0.7',
  },
  {
    key: 'faq',
    path: '/faq',
    nav: 'FAQ',
    title: 'China Sourcing FAQ: MOQ, Payment, Tooling & QC | Bachar',
    description:
      'Sourcing from China, answered: agent vs Alibaba, commission, minimum order, tooling ownership, failed inspections, safe payment terms and certification.',
    priority: '0.8',
  },
  {
    key: 'audit',
    path: '/audit',
    nav: null,
    title: 'Sample Factory Audit Report, China Suppliers | Bachar',
    description:
      'A real China factory audit report, redacted: licence, capacity, equipment, workforce, certifications, sub-contracting and defects found on site. US$390.',
    priority: '0.8',
  },
  {
    key: 'contact',
    path: '/contact',
    nav: null,
    title: 'Get a Free China Sourcing Quote | Bachar — The China Guy',
    description:
      "Send me your product list for a free China sourcing quote. You'll hear back within 12 working hours with an honest read on cost, timing and fit.",
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

  // ── Beyond the canvas ──────────────────────────────────────────────────────
  // The design has ten artboards; everything below is a page the canvas does
  // not define. None of these is in the pixel harness's PAGES list — there is
  // no reference to diff them against — so they are covered by check:mobile,
  // check:hydration and check:functional instead.
  {
    key: 'guides',
    path: '/guides',
    nav: null,
    title: 'China Sourcing Guides for Importers | Bachar',
    description:
      'Plain-English guides to importing from China: verifying a factory, AQL quality inspection, and choosing between FOB, CIF and DDP — from an agent in Guangzhou.',
    priority: '0.7',
  },
  {
    key: 'guide-verify-factory',
    path: '/guides/verify-a-chinese-factory',
    nav: null,
    title: 'How to Verify a Chinese Factory Before You Pay | Bachar',
    description:
      'Check the business licence, spot a trading company posing as a factory, confirm export history and capacity, and verify the bank account before any deposit.',
    priority: '0.7',
    article: { published: '2026-09-22' },
  },
  {
    key: 'guide-aql-inspection',
    path: '/guides/aql-inspection',
    nav: null,
    title: 'AQL Inspection Explained for China Orders | Bachar',
    description:
      'What AQL 2.5 means, how the sample size is picked, critical vs major vs minor defects, and when to inspect: during production at 20% and before shipment.',
    priority: '0.7',
    article: { published: '2026-09-22' },
  },
  {
    key: 'guide-fob-cif-ddp',
    path: '/guides/fob-cif-ddp',
    nav: null,
    title: 'FOB vs CIF vs DDP When Importing From China | Bachar',
    description:
      'FOB, CIF and door-to-door DDP compared: who pays freight and insurance, where the risk passes, who clears customs, and how to compare quotes on landed cost.',
    priority: '0.7',
    article: { published: '2026-09-22' },
  },
  {
    key: 'privacy',
    path: '/privacy',
    nav: null,
    title: 'Privacy policy | Bachar — The China Guy',
    // Not "no cookies": the site's own code sets none, but Cloudflare, which
    // proxies it, issues its bot-detection cookie (cf_clearance) on the live
    // host. The page says so; the description must not say otherwise.
    description:
      'What this site collects when you send a quote request, who handles it, how long it is kept and how to have it deleted. No analytics and no ad tracking.',
    // A legal page is there to be read by the person about to send their
    // details, not to rank. `noindex, follow`, the same treatment as /mobile.
    indexable: false,
  },
  {
    key: 'terms',
    path: '/terms',
    nav: null,
    title: 'Terms of use | Bachar — The China Guy',
    description:
      'The terms for using this website. Engagement terms are agreed in writing, per project, before any work starts.',
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

/**
 * The href a `<Link>` should carry: the directory form, trailing slash included.
 *
 * GitHub Pages serves `/pricing/` and 301-redirects `/pricing` to it. Every
 * canonical and sitemap entry already names the slashed form; the links did
 * not, so each internal link in the prerendered HTML was one redirect away from
 * its target — a wasted hop for every crawler fetch and every click made before
 * the bundle hydrates. A fragment survives: `/services#audits` becomes
 * `/services/#audits`.
 */
export const toHref = (path: string): string => {
  const [p, hash] = path.split('#')
  const n = normalizePath(p)
  return (n === '/' ? '/' : `${n}/`) + (hash ? `#${hash}` : '')
}

export const routeByPath = (path: string): RouteDef | undefined => {
  const p = normalizePath(path)
  return ROUTES.find(r => r.path === p)
}
