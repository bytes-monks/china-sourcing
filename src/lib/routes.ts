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
}

export const ROUTES: RouteDef[] = [
  {
    key: 'home',
    path: '/',
    nav: 'Home',
    title: 'Bachar — The China Guy | Sourcing agent in Guangzhou',
    description:
      "I find your factory, walk the floor, and get it shipped. On the ground in Guangzhou, Foshan, Yiwu and Shenzhen. No commission from suppliers — my advice is only worth what it's worth to you.",
  },
  {
    key: 'services',
    path: '/services',
    nav: 'What I do',
    title: 'What I do | Bachar — The China Guy',
    description:
      'Supplier sourcing and vetting, price negotiation, factory audits, quality inspection, samples handling, freight by sea and air, and trade shows. Everything between your idea and a container on the water.',
  },
  {
    key: 'process',
    path: '/process',
    nav: 'How it works',
    title: 'How it works | Bachar — The China Guy',
    description:
      'Four rules I do not break, and the step-by-step of how an order moves from your product list to a sealed container — with a paper trail at every stage.',
  },
  {
    key: 'industries',
    path: '/industries',
    nav: 'Who I help',
    title: 'Who I help | Bachar — The China Guy',
    description:
      'The buyers and categories I work with day to day, and the sourcing problems each one runs into in Guangzhou, Foshan, Yiwu and Shenzhen.',
  },
  {
    key: 'pricing',
    path: '/pricing',
    nav: 'Pricing',
    title: 'Pricing | Bachar — The China Guy',
    description:
      'No commission, no contract, no layers. Sourcing is free until you approve the quote, your money never passes through me, and final payment waits for inspection.',
  },
  {
    key: 'about',
    path: '/about',
    nav: 'About me',
    title: 'About me | Bachar — The China Guy',
    description:
      'Judge the work, not the brochure. Who I am, how I ended up sourcing in Guangzhou, and why I take nothing from the factories I recommend.',
  },
  {
    key: 'faq',
    path: '/faq',
    nav: 'FAQ',
    title: 'FAQ | Bachar — The China Guy',
    description:
      'The questions I get in the first call: commission, minimum order size, tooling ownership, failed inspections, payment terms, certification, and whether you have to fly out.',
  },
  {
    key: 'audit',
    path: '/audit',
    nav: null,
    title: 'Sample audit report | Bachar — The China Guy',
    description:
      'A real factory audit report, redacted: licence and capacity checks, equipment and workforce, certifications, sub-contracting, and the defects classified critical, major and minor.',
  },
  {
    key: 'contact',
    path: '/contact',
    nav: null,
    title: 'Get a free quote | Bachar — The China Guy',
    description:
      "Send me your product list. You'll hear back within 12 working hours with an honest read on what it costs, what it takes, and whether I'm the right person for it.",
  },
  {
    key: 'mobile',
    path: '/mobile',
    nav: null,
    title: 'On a phone | Bachar — The China Guy',
    description:
      'Over half of first enquiries arrive from a phone, usually via WhatsApp. How the site behaves on a small screen.',
  },
]

export const NAV_ROUTES = ROUTES.filter(r => r.nav !== null)

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
