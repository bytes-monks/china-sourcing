/**
 * JSON-LD for the site, in two disjoint halves.
 *
 * `SITE_GRAPH` is the site-wide half — the business and the website itself. It
 * is emitted once on every page, so nothing in it may be repeated below.
 * `schemaFor(path)` is the page-level half. The two are concatenated into one
 * `@graph` by `src/entry-server.tsx`, which lets a page-level node point at
 * `#business` or `#website` by `@id` instead of restating them.
 *
 * Everything here is drawn from what the pages actually say. No review counts,
 * no founding date, no social profile, no price the pricing page does not
 * print: an invented fact in structured data is a fact you cannot defend when
 * a crawler compares it against the rendered page.
 */
import {
  ORIGIN,
  SITE_NAME,
  SITE_SHORT,
  TAGLINE,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  OG_IMAGE,
  absolute,
} from './site'
import { routeByPath, type RouteDef } from './routes'

/** A JSON-LD node. Loose by necessity — schema.org is an open vocabulary. */
export type JsonLd = Record<string, unknown>

/** A reference to a node declared elsewhere in the same `@graph`. */
interface NodeRef {
  '@id': string
}

const BUSINESS_ID = `${ORIGIN}/#business`
const WEBSITE_ID = `${ORIGIN}/#website`
const LOGO_URL = `${ORIGIN}/icon-512.png`

const ref = (id: string): NodeRef => ({ '@id': id })

const place = (type: 'City' | 'Country', name: string): JsonLd => ({ '@type': type, name })

const language = (name: string, code: string): JsonLd => ({
  '@type': 'Language',
  name,
  alternateName: code,
})

/**
 * Where the work happens — the four buying cities the top bar names, inside
 * the country they are in. Clients are overseas; the *service* is delivered on
 * the ground here, which is what `areaServed` describes.
 */
const AREA_SERVED: readonly JsonLd[] = [
  place('City', 'Guangzhou'),
  place('City', 'Foshan'),
  place('City', 'Yiwu'),
  place('City', 'Shenzhen'),
  place('Country', 'China'),
]

/**
 * The three languages the site actually claims — the top bar's
 * "EN · 中文 · العربية". French was here once and was removed: no page claims
 * it, and structured data is not the place to widen a business's offer.
 */
const LANGUAGES: readonly JsonLd[] = [
  language('English', 'en'),
  language('Mandarin Chinese', 'zh'),
  language('Arabic', 'ar'),
]

/**
 * Profiles the business is also verifiably at. Deliberately empty: the footer's
 * PRIVACY / TERMS / 中文 links are still `#`, WhatsApp and WeChat are reached
 * through `/contact` rather than a public URL, and `sameAs` pointing at a
 * profile that cannot be checked is worse than no `sameAs` at all. Drop real
 * URLs in here and the business node picks them up.
 */
const SAME_AS: readonly string[] = []

/**
 * Site-wide nodes. `ProfessionalService` rather than a bare `Organization`:
 * this is a one-man agency with an address, opening hours and a published fee
 * range, all of which that type carries and `Organization` does not.
 */
export const SITE_GRAPH: object[] = [
  {
    '@type': 'ProfessionalService',
    '@id': BUSINESS_ID,
    name: SITE_NAME,
    alternateName: [SITE_SHORT, TAGLINE],
    url: ORIGIN,
    logo: {
      '@type': 'ImageObject',
      '@id': `${ORIGIN}/#logo`,
      url: LOGO_URL,
      contentUrl: LOGO_URL,
      width: 512,
      height: 512,
      caption: SITE_NAME,
    },
    image: OG_IMAGE,
    description:
      'End-to-end sourcing for buyers who want a person on the ground rather than a listing on a platform.',
    slogan: 'I find your factory, walk the floor, and get it shipped.',
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    // The three tiers the pricing page prints: a US$600 minimum fee at the
    // bottom, "from US$6,500/mo" at the top.
    priceRange: 'US$600–US$6,500+',
    currenciesAccepted: 'USD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Room 1804, Tianhe North Road, Tianhe District',
      addressLocality: 'Guangzhou',
      addressRegion: 'Guangdong',
      postalCode: '510620',
      addressCountry: 'CN',
    },
    areaServed: AREA_SERVED,
    knowsLanguage: LANGUAGES,
    knowsAbout: [
      'Supplier sourcing and vetting in China',
      'Factory audits',
      'AQL quality inspection',
      'Price negotiation and should-cost modelling',
      'Sea and air freight from Guangzhou',
      'Canton Fair and Yiwu market sourcing',
    ],
    // Mon–Sat, 09:00–19:00 China Standard Time (UTC+8), per the About and
    // Contact pages. Schema.org has no timezone field for these, so the times
    // are given as local to the address above.
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '19:00',
      },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        availableLanguage: LANGUAGES,
      },
    ],
    ...(SAME_AS.length > 0 ? { sameAs: [...SAME_AS] } : {}),
  },
  {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: ORIGIN,
    name: SITE_NAME,
    alternateName: SITE_SHORT,
    inLanguage: 'en',
    publisher: ref(BUSINESS_ID),
    copyrightHolder: ref(BUSINESS_ID),
  },
]

/** Breadcrumb label: the nav label where there is one, else the page's own half of the title. */
const crumbName = (route: RouteDef): string => route.nav ?? route.title.split(' | ')[0]

function webPage(route: RouteDef, url: string, primary?: JsonLd): JsonLd {
  const node: JsonLd = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: route.title,
    description: route.description,
    isPartOf: ref(WEBSITE_ID),
    about: ref(BUSINESS_ID),
    inLanguage: 'en',
  }
  if (route.path !== '/') node.breadcrumb = ref(`${url}#breadcrumb`)
  const primaryId = primary?.['@id']
  if (typeof primaryId === 'string') node.mainEntity = ref(primaryId)
  return node
}

/** Two levels is the whole hierarchy: the site is flat under the home page. */
function breadcrumbList(route: RouteDef, url: string): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absolute('/') },
      { '@type': 'ListItem', position: 2, name: crumbName(route), item: url },
    ],
  }
}

/** The seven numbered offerings on /services, in page order. */
const SERVICES: readonly { name: string; serviceType: string; description: string }[] = [
  {
    name: 'Supplier sourcing & vetting',
    serviceType: 'Supplier sourcing and vetting',
    description:
      'Tell me the product; I come back with real manufacturers, not resellers with a nice website. Every shortlist entry has a verified business licence, an export record and a capacity check against your volume.',
  },
  {
    name: 'Price negotiation',
    serviceType: 'Price negotiation',
    description:
      'I build a should-cost model before I open the conversation — material weight, labour minutes, tooling amortisation, packaging. Then I negotiate in Mandarin against that number.',
  },
  {
    name: 'Factory audits',
    serviceType: 'Factory audit',
    description:
      'I spend a day on site. Machines, staffing, storage, certifications — and the question that matters most: which parts of your order do they actually make themselves?',
  },
  {
    name: 'Quality inspection',
    serviceType: 'Quality inspection',
    description:
      'AQL 2.5 sampling as standard, tightened where it matters. We inspect at 20% of production so problems are still fixable, and again before the container is sealed.',
  },
  {
    name: 'Samples handling',
    serviceType: 'Sample handling and consolidation',
    description:
      'Ordering samples from five factories usually means five couriers, five invoices and a month of waiting. I collect them at my Guangzhou office, shoot them under the same light, and send you one box.',
  },
  {
    name: 'Freight, sea & air',
    serviceType: 'Freight forwarding',
    description:
      'I book through established Guangzhou forwarders and quote you three ways — FOB, CIF and door-to-door — so you can see what the convenience actually costs.',
  },
  {
    name: 'Trade shows & market visits',
    serviceType: 'Trade show and market sourcing',
    description:
      'Canton Fair is 1.2 million square metres. I go ahead of you, mark the booths worth your time, and walk the floor with you as interpreter and buyer.',
  },
]

function serviceList(url: string): JsonLd {
  return {
    '@type': 'ItemList',
    '@id': `${url}#services`,
    name: 'What I do',
    description: 'Every service can be bought on its own.',
    numberOfItems: SERVICES.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: SERVICES.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        '@id': `${url}#service-${i + 1}`,
        name: s.name,
        serviceType: s.serviceType,
        description: s.description,
        url,
        provider: ref(BUSINESS_ID),
      },
    })),
  }
}

/** The eight accordions on /faq, question and answer verbatim. */
const FAQ: readonly { q: string; a: string }[] = [
  {
    q: 'Why use an agent instead of buying on Alibaba myself?',
    a: "You can, and for a $500 trial order you probably should. It stops working when the money gets real: platform listings hide whether you're talking to a factory or a middleman, nobody inspects before the container seals, and if a batch is wrong you're negotiating from 8,000 km away in your second language. I'm the part that stands in the factory.",
  },
  {
    q: 'Do you take commission from the factories?',
    a: "No. It's the single thing my business depends on. You pay the factory directly at the negotiated price, you see their invoice, and my fee is separate and agreed in advance. If a supplier offers me a rebate to steer you their way, I tell you it happened.",
  },
  {
    q: "What's the smallest order you'll take on?",
    a: 'My minimum fee is US$600, so orders under about US$8,000 start to feel expensive as a percentage. For small trial quantities the Yiwu market route is usually the better fit — we buy, check and consolidate there, and you can test ten products for the price of one container.',
  },
  {
    q: 'Who owns the tooling and the design?',
    a: "You do, and I put it in the contract in both languages before any mould is cut — including the right to move the tooling to another factory. I'll also register your design in China where it's worth doing; it costs little and it's the only thing that helps if a copy appears.",
  },
  {
    q: 'What happens if a batch fails inspection?',
    a: "Nothing ships. You get the photo report the same day with defects classified as critical, major or minor, and a recommendation. Usually the factory reworks at their cost — that's why we hold the final payment until after inspection. If they refuse and I can't fix it, I refund my fee on that order and help you claim.",
  },
  {
    q: 'How do payments work, and is it safe?',
    a: "Standard terms are 30% deposit on order and 70% after inspection passes, paid by T/T to the factory's own corporate account — never to a personal account, never to me. I verify the account against the business licence before you send anything. For larger orders I'll set up an L/C instead.",
  },
  {
    q: 'Can you handle certification — CE, FDA, FCC?',
    a: "I coordinate it with accredited labs — SGS, TÜV, Intertek — and pass the invoice through at cost plus 10% for handling. I'll also tell you early if your product needs testing you hadn't budgeted for, which is a conversation better had before tooling than after.",
  },
  {
    q: 'Do I have to fly to China?',
    a: "No — standing in the factory so you don't have to is the whole job. That said, if you're committing to serious volume in one category, a three-day trip during Canton Fair usually pays for itself. I'll plan it and come with you.",
  },
]

function faqPage(url: string): JsonLd {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    name: 'The questions I get in the first call.',
    inLanguage: 'en',
    mainEntity: FAQ.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/**
 * The three engagement tiers on /pricing.
 *
 * Only what the page prints becomes a number: US$600 as the floor of the
 * single-project tier, US$1,900/mo for the ongoing programme, US$6,500/mo as
 * the floor of the embedded tier. The percentages (5–8%, +3%) have no numeric
 * schema.org form, so they stay in the specification's prose.
 */
function pricingCatalog(url: string): JsonLd {
  return {
    '@type': 'OfferCatalog',
    '@id': `${url}#pricing`,
    name: 'Sourcing engagements',
    description:
      'One fee, written down before I start. No commission from factories and no kickback on freight.',
    numberOfItems: 3,
    itemListElement: [
      {
        '@type': 'Offer',
        '@id': `${url}#offer-single-project`,
        name: 'One product, one order',
        description:
          "Best if you're testing whether a product works before committing to a programme.",
        url,
        offeredBy: ref(BUSINESS_ID),
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'USD',
          minPrice: 600,
          description: '5–8% of order value, minimum US$600.',
        },
        itemOffered: {
          '@type': 'Service',
          name: 'Single-order sourcing',
          description:
            'Sourcing and a 3–5 factory shortlist, negotiation and a bilingual contract, sample consolidation, and one pre-shipment inspection. A factory audit is billed separately.',
          provider: ref(BUSINESS_ID),
        },
      },
      {
        '@type': 'Offer',
        '@id': `${url}#offer-ongoing-programme`,
        name: 'Ongoing programme',
        description:
          'Me as your sourcing department, up to five active products. The percentage drops as volume grows.',
        url,
        offeredBy: ref(BUSINESS_ID),
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          priceCurrency: 'USD',
          price: 1900,
          unitCode: 'MON',
          unitText: 'month',
          description: 'US$1,900 per month plus 3% of order value.',
        },
        itemOffered: {
          '@type': 'Service',
          name: 'Ongoing sourcing programme',
          description:
            'Everything in the single project, plus weekly written reporting, two inspections per order, two factory audits a year, and freight booking and consolidation.',
          provider: ref(BUSINESS_ID),
        },
      },
      {
        '@type': 'Offer',
        '@id': `${url}#offer-embedded-team`,
        name: 'Embedded team',
        description:
          'For brands running multiple categories: your own QC staff, your own desk in my office, your processes.',
        url,
        offeredBy: ref(BUSINESS_ID),
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          priceCurrency: 'USD',
          minPrice: 6500,
          unitCode: 'MON',
          unitText: 'month',
          description: 'Custom, from US$6,500 per month.',
        },
        itemOffered: {
          '@type': 'Service',
          name: 'Embedded sourcing team',
          description:
            'Everything in the ongoing programme, plus dedicated QC inspectors, unlimited products and audits, warehouse space in Guangzhou, and a quarterly cost-reduction review.',
          provider: ref(BUSINESS_ID),
        },
      },
    ],
  }
}

/**
 * The add-on table on the same page. Lab-testing coordination is quoted as
 * "COST + 10%" and so carries no number — a fabricated one is worse than none.
 */
const ADD_ONS: readonly { name: string; price?: number; unitText?: string; note: string }[] = [
  { name: 'Factory audit, on site', price: 390, unitText: 'audit', note: 'US$390 per on-site audit.' },
  { name: 'Inspection, per man-day', price: 210, unitText: 'man-day', note: 'US$210 per man-day.' },
  {
    name: 'Container loading supervision',
    price: 180,
    unitText: 'container',
    note: 'US$180 per container loading.',
  },
  {
    name: 'Trade-show accompaniment, per day',
    price: 300,
    unitText: 'day',
    note: 'US$300 per day.',
  },
  {
    name: 'Lab testing coordination',
    note: "The lab's invoice passed through at cost plus 10% for handling.",
  },
]

function addOnCatalog(url: string): JsonLd {
  return {
    '@type': 'OfferCatalog',
    '@id': `${url}#add-ons`,
    name: 'Add-ons, billed per use',
    numberOfItems: ADD_ONS.length,
    itemListElement: ADD_ONS.map((a, i) => ({
      '@type': 'Offer',
      '@id': `${url}#add-on-${i + 1}`,
      name: a.name,
      url,
      offeredBy: ref(BUSINESS_ID),
      priceSpecification:
        a.price === undefined
          ? { '@type': 'PriceSpecification', priceCurrency: 'USD', description: a.note }
          : {
              '@type': 'UnitPriceSpecification',
              priceCurrency: 'USD',
              price: a.price,
              unitText: a.unitText,
              description: a.note,
            },
    })),
  }
}

/** Nodes that only one page has. The first is the page's `mainEntity`. */
function pageNodes(path: string, url: string): JsonLd[] {
  switch (path) {
    case '/services':
      return [serviceList(url)]
    case '/faq':
      return [faqPage(url)]
    case '/pricing':
      return [pricingCatalog(url), addOnCatalog(url)]
    default:
      return []
  }
}

/**
 * Page-level JSON-LD for one route: a `WebPage`, a `BreadcrumbList` everywhere
 * but the home page, and whatever that page alone declares. Disjoint from
 * `SITE_GRAPH` — the business and the website are referenced by `@id`, never
 * restated. An unknown path gets nothing rather than a node whose `@id` claims
 * to be a page that does not exist.
 */
export function schemaFor(path: string): object[] {
  const route = routeByPath(path)
  if (!route) return []

  const url = absolute(route.path)
  const extras = pageNodes(route.path, url)
  const nodes: JsonLd[] = [webPage(route, url, extras[0])]
  if (route.path !== '/') nodes.push(breadcrumbList(route, url))
  return [...nodes, ...extras]
}
