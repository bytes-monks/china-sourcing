/**
 * JSON-LD for the site, in two disjoint halves.
 *
 * `SITE_GRAPH` is the site-wide half — the business, the person behind it and
 * the website itself. It is emitted once on every page, so nothing in it may be
 * repeated below. `schemaFor(path)` is the page-level half. The two are
 * concatenated into one `@graph` by `src/entry-server.tsx`, which lets a
 * page-level node point at `#business`, `#bachar` or `#website` by `@id`
 * instead of restating them.
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
  OG_IMAGE_ALT,
  ADDRESS_LINE,
  ADDRESS_LOCALITY,
  ADDRESS_REGION,
  ADDRESS_POSTAL,
  ADDRESS_COUNTRY,
  ADDRESS_MAP,
  absolute,
} from './site'
import { routeByPath, isIndexable, type RouteDef } from './routes'

/** A JSON-LD node. Loose by necessity — schema.org is an open vocabulary. */
export type JsonLd = Record<string, unknown>

/** A reference to a node declared elsewhere in the same `@graph`. */
interface NodeRef {
  '@id': string
}

const BUSINESS_ID = `${ORIGIN}/#business`
const WEBSITE_ID = `${ORIGIN}/#website`
const PERSON_ID = `${ORIGIN}/#bachar`
const LOGO_URL = `${ORIGIN}/icon-512.png`

/**
 * The pricing page's catalog, named here so the business node can point at it
 * by `@id` from every page while the catalog itself is declared only on the one
 * page that prints it. An `@id` is a global identifier, not a page-local one —
 * a reference across pages is how a graph is meant to be assembled.
 */
const PRICING_CATALOG_ID = `${absolute('/pricing')}#pricing`

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
 * What the business is about, as entities rather than as prose.
 *
 * The first six are the services; the nine after them are the "Categories I
 * know best" strip on /industries. `knowsAbout` is the field an engine reads to
 * decide which topic a site is an authority on, so every category the site
 * claims in print belongs in it — and nothing the site does not.
 */
const KNOWS_ABOUT: readonly string[] = [
  'Supplier sourcing and vetting in China',
  'Factory audits',
  'AQL quality inspection',
  'Price negotiation and should-cost modelling',
  'Sea and air freight from Guangzhou',
  'Canton Fair and Yiwu market sourcing',
  'Kitchen and tableware manufacturing',
  'Home textiles',
  'Small appliances',
  'Furniture',
  'Pet supplies',
  'Outdoor and garden products',
  'Packaging',
  'Bags',
  'Toys and baby products',
]

/**
 * Mon–Sat, 09:00–19:00 China Standard Time (UTC+8), per the About and Contact
 * pages. Schema.org has no timezone field for these, so the times are given as
 * local to the address below.
 */
const OPENING_HOURS: readonly JsonLd[] = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00',
    closes: '19:00',
  },
]

const POSTAL_ADDRESS: JsonLd = {
  '@type': 'PostalAddress',
  streetAddress: ADDRESS_LINE,
  addressLocality: ADDRESS_LOCALITY,
  addressRegion: ADDRESS_REGION,
  postalCode: ADDRESS_POSTAL,
  addressCountry: ADDRESS_COUNTRY,
}

/**
 * Profiles the business is also verifiably at. Deliberately empty: the footer's
 * PRIVACY / TERMS / 中文 links are still `#`, WhatsApp and WeChat are reached
 * through `/contact` rather than a public URL, and `sameAs` pointing at a
 * profile that cannot be checked is worse than no `sameAs` at all. Drop real
 * URLs in here and both the business and the person node pick them up.
 *
 * This is the single highest-value field still empty on this site. A verified
 * LinkedIn, Google Business Profile or Crunchbase URL is what lets an engine
 * connect "Bachar — The China Guy" to an entity it already knows about rather
 * than treating it as an unknown string.
 */
const SAME_AS: readonly string[] = []

const sameAs = (): JsonLd => (SAME_AS.length > 0 ? { sameAs: [...SAME_AS] } : {})

/**
 * The person behind the business.
 *
 * /about is a first-person account by a named individual, and a one-man agency
 * IS its founder as far as an engine's entity model is concerned. Declaring the
 * `Person` separately and linking it both ways — `founder`/`employee` down,
 * `worksFor` up — is what turns "Bachar" from a word on a page into a node an
 * engine can attach experience and expertise to. Everything in it is what the
 * About page says in the first person.
 */
const PERSON: JsonLd = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Bachar',
  alternateName: TAGLINE,
  jobTitle: 'Sourcing agent',
  description:
    "Came to sourcing from the buyer's side of the table, lost money to a trading company posing as a factory and to a mould he had paid for and did not own, and moved to Guangzhou to be the person standing in the building.",
  url: absolute('/about'),
  mainEntityOfPage: ref(`${absolute('/about')}#webpage`),
  image: {
    '@type': 'ImageObject',
    url: OG_IMAGE,
    caption: OG_IMAGE_ALT,
  },
  email: CONTACT_EMAIL,
  telephone: CONTACT_PHONE,
  worksFor: ref(BUSINESS_ID),
  knowsLanguage: LANGUAGES,
  knowsAbout: KNOWS_ABOUT,
  homeLocation: place('City', ADDRESS_LOCALITY),
  workLocation: {
    '@type': 'Place',
    name: `${SITE_NAME} — ${ADDRESS_LOCALITY} office`,
    address: POSTAL_ADDRESS,
  },
  ...sameAs(),
}

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
    address: POSTAL_ADDRESS,
    // Derived from the address above rather than a second copy of it. Not
    // `geo`: the pages print a street address, never coordinates, and a
    // latitude invented to four decimal places is a claim about a doorway the
    // site never makes.
    hasMap: ADDRESS_MAP,
    areaServed: AREA_SERVED,
    knowsLanguage: LANGUAGES,
    knowsAbout: KNOWS_ABOUT,
    // Both directions of the same relationship. `founder` is the one an engine
    // reads for the "who is behind this" panel; `employee` is what makes the
    // "you hire me, you get me" claim on /about legible as structure.
    founder: ref(PERSON_ID),
    employee: ref(PERSON_ID),
    // Declared in full on /pricing; referenced here so the business carries its
    // offer on every page a crawler might land on first.
    hasOfferCatalog: ref(PRICING_CATALOG_ID),
    openingHoursSpecification: OPENING_HOURS,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        availableLanguage: LANGUAGES,
        hoursAvailable: OPENING_HOURS,
        // "I read every enquiry myself and reply within 12 working hours",
        // /contact. There is no schema.org field for a response time on a
        // ContactPoint, so it stays in the description where it is readable
        // rather than being forced into a field that does not mean it.
        description:
          'Read personally, not by a shared inbox. Reply within 12 working hours, with an evening window for Europe and the US.',
      },
    ],
    ...sameAs(),
  },
  PERSON,
  {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: ORIGIN,
    name: SITE_NAME,
    alternateName: SITE_SHORT,
    description:
      'End-to-end sourcing for buyers who want a person on the ground rather than a listing on a platform.',
    inLanguage: 'en',
    publisher: ref(BUSINESS_ID),
    copyrightHolder: ref(BUSINESS_ID),
    // No `potentialAction: SearchAction`. The site has no search, and claiming
    // a search endpoint that 404s is a sitelinks-searchbox claim a crawler will
    // test and fail.
  },
]

/** Breadcrumb label: the nav label where there is one, else the page's own half of the title. */
const crumbName = (route: RouteDef): string => route.nav ?? route.title.split(' | ')[0]

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
        areaServed: AREA_SERVED,
        provider: ref(BUSINESS_ID),
      },
    })),
  }
}

/**
 * The six numbered steps on /process, with the week bands the page prints.
 *
 * Modelled as a `HowTo` knowing that Google retired the HowTo rich result in
 * 2023. It is not here for a rich result: it is the only vocabulary that says
 * "these six things happen in this order, and this is what you supply", which
 * is exactly the shape an answer engine quotes when someone asks how sourcing
 * from China works. Bing and the LLM crawlers still read it.
 */
const STEPS: readonly { when: string; name: string; text: string }[] = [
  {
    when: 'Day 0–2',
    name: 'Brief & feasibility call',
    text: 'You send photos, a spec, a target price and a volume. I tell you honestly whether that price exists in China — and at what quality.',
  },
  {
    when: 'Week 1–2',
    name: 'Sourcing & shortlist',
    text: 'I approach factories directly, verify each one, and return a comparison sheet with my recommendation and the reasoning behind it.',
  },
  {
    when: 'Week 2–4',
    name: 'Samples & golden sample',
    text: 'One consolidated box. You pick a winner; I seal a duplicate at the office as the reference every batch is judged against.',
  },
  {
    when: 'Week 4–5',
    name: 'Contract, audit & deposit',
    text: 'Bilingual contract, tooling ownership in writing, audit on file. The deposit goes to the factory — never to me.',
  },
  {
    when: 'Week 5–11',
    name: 'Production & inspection',
    text: 'Weekly progress notes, an in-line inspection at 20%, and a pre-shipment check before anything is packed. Photos every time.',
  },
  {
    when: 'Week 11–14',
    name: 'Shipping & handover',
    text: 'Loading supervised, documents issued, container booked. You get the file your customs broker needs and a weekly position update.',
  },
]

/** "What I need from you" — the five inputs the same page lists. */
const SUPPLIES: readonly string[] = [
  'Photos, a sample, or a technical drawing',
  'Target landed price and target market',
  'First-order volume and expected annual volume',
  'Any certification you must have — CE, FDA, FCC, LFGB',
  'Destination port or warehouse address',
]

function howTo(url: string): JsonLd {
  return {
    '@type': 'HowTo',
    '@id': `${url}#process`,
    name: 'From your product list to a container, in six steps.',
    // No `totalTime`. The page gives a range — 9 to 14 weeks for a first order,
    // 5 to 7 for a repeat — and schema.org's Duration holds one value, so any
    // number here would be a commitment the page does not make.
    description:
      'A typical first order runs 9 to 14 weeks. Repeat orders, with tooling and a golden sample already in place, run 5 to 7.',
    inLanguage: 'en',
    supply: SUPPLIES.map(name => ({ '@type': 'HowToSupply', name })),
    step: STEPS.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: `${s.when}. ${s.text}`,
      url,
    })),
  }
}

/** The five buyer types on /industries, each with the job it actually is. */
const AUDIENCES: readonly {
  audience: string
  name: string
  description: string
  tags: string
}[] = [
  {
    audience: 'Amazon & e-commerce sellers',
    name: 'Protect the listing you already rank for',
    description:
      "Your risk isn't price, it's a bad batch tanking a review score. I inspect twice, hold the golden sample, and label to your FBA spec before the goods leave the factory.",
    tags: 'Double inspection, FBA prep, air/sea split',
  },
  {
    audience: 'Retail chains & wholesalers',
    name: 'Hit the promo date, every time',
    description:
      'Multi-supplier programmes consolidated into one weekly outbound, with a delivery calendar your buying team can plan a season around.',
    tags: 'Consolidation, vendor compliance, calendars',
  },
  {
    audience: 'Startups launching a first product',
    name: 'Get to a real product without a costly mistake',
    description:
      "I'll tell you which factories will take a small first run, what the tooling really costs, and how to keep ownership of the mould you paid for.",
    tags: 'Low-MOQ sourcing, tooling terms, samples',
  },
  {
    audience: 'Established brands scaling up',
    name: 'Second-source before you need to',
    description:
      "Qualifying a backup factory while things are calm, benchmarking your incumbent's pricing, and auditing to the standards your retailers ask about.",
    tags: 'Dual sourcing, benchmarking, audits',
  },
  {
    audience: 'Dropshippers & small-order buyers',
    name: 'Test ten products before betting on one',
    description:
      'Small trial quantities from the Yiwu market, checked and consolidated, so you can validate demand without committing to a container.',
    tags: 'Yiwu buying, trial quantities, express',
  },
]

function audienceList(url: string): JsonLd {
  return {
    '@type': 'ItemList',
    '@id': `${url}#audiences`,
    name: 'Five kinds of buyer, five different jobs.',
    description:
      'A first-time founder and a retail chain both need China — but they need very different things from me.',
    numberOfItems: AUDIENCES.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: AUDIENCES.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        '@id': `${url}#audience-${i + 1}`,
        name: `${a.audience}: ${a.name.toLowerCase()}`,
        description: a.description,
        serviceType: a.tags,
        url,
        areaServed: AREA_SERVED,
        provider: ref(BUSINESS_ID),
        audience: { '@type': 'BusinessAudience', name: a.audience },
      },
    })),
  }
}

/**
 * The audit the /audit page shows one page of, with the two numbers it prints
 * in the footer of the sample: US$390 per factory, report in four working days.
 * The same figure appears as an add-on on /pricing, from the same page.
 */
function auditService(url: string): JsonLd {
  return {
    '@type': 'Service',
    '@id': `${url}#factory-audit`,
    name: 'Factory audit, on site',
    serviceType: 'Factory audit',
    description:
      'A full day on site and a scored 14-page report: legal and business standing, equipment and capacity, quality management, traceability and records, workplace and social compliance — with the findings to correct listed, and photographic evidence. Report in four working days.',
    url,
    inLanguage: 'en',
    areaServed: AREA_SERVED,
    provider: ref(BUSINESS_ID),
    offers: {
      '@type': 'Offer',
      '@id': `${url}#audit-offer`,
      name: 'Factory audit, per factory',
      url,
      offeredBy: ref(BUSINESS_ID),
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceCurrency: 'USD',
        price: 390,
        unitText: 'factory',
        description: 'US$390 per factory, report in 4 working days.',
      },
    },
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

/**
 * The Question list for /faq.
 *
 * Attached to the page node itself, whose `@type` becomes `FAQPage` — a
 * subtype of WebPage — rather than sitting in a second node for the same URL.
 * One URL, one page node.
 *
 * Google narrowed the FAQ rich result to government and health sites in 2023,
 * so this will not draw an accordion into the result for a sourcing agency.
 * It stays because it is the cleanest machine-readable statement of eight
 * questions a buyer actually types, and answer engines quote it.
 */
const faqQuestions = (): JsonLd[] =>
  FAQ.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  }))

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
    '@id': PRICING_CATALOG_ID,
    url,
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
          areaServed: AREA_SERVED,
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
          areaServed: AREA_SERVED,
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
          areaServed: AREA_SERVED,
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
    url,
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

/**
 * What one page adds to the graph on top of the `WebPage` every page gets.
 *
 * `type` narrows the page node itself — `AboutPage`, `ContactPage`, `FAQPage`
 * and `CollectionPage` are all subtypes of `WebPage`, so naming the specific
 * one costs nothing and tells an engine what kind of page it is looking at
 * before it has parsed a word of the body.
 */
interface PageSpec {
  type?: string
  nodes?: JsonLd[]
  mainEntity?: unknown
}

function pageSpec(path: string, url: string): PageSpec {
  switch (path) {
    case '/services':
      return { type: 'CollectionPage', nodes: [serviceList(url)], mainEntity: ref(`${url}#services`) }
    case '/process':
      return { nodes: [howTo(url)], mainEntity: ref(`${url}#process`) }
    case '/industries':
      return {
        type: 'CollectionPage',
        nodes: [audienceList(url)],
        mainEntity: ref(`${url}#audiences`),
      }
    case '/pricing':
      return {
        nodes: [pricingCatalog(url), addOnCatalog(url)],
        mainEntity: ref(PRICING_CATALOG_ID),
      }
    case '/about':
      // The page is about a person, and the person is declared site-wide.
      return { type: 'AboutPage', mainEntity: ref(PERSON_ID) }
    case '/faq':
      return { type: 'FAQPage', mainEntity: faqQuestions() }
    case '/audit':
      return { nodes: [auditService(url)], mainEntity: ref(`${url}#factory-audit`) }
    case '/contact':
      return { type: 'ContactPage', mainEntity: ref(BUSINESS_ID) }
    default:
      return {}
  }
}

function webPage(route: RouteDef, url: string, spec: PageSpec): JsonLd {
  const node: JsonLd = {
    '@type': spec.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: route.title,
    description: route.description,
    isPartOf: ref(WEBSITE_ID),
    about: ref(BUSINESS_ID),
    inLanguage: 'en',
    // The page is free to read and needs no login. Both are defaults, and both
    // are read by the crawlers that decide whether a page is worth quoting.
    isAccessibleForFree: true,
    // Every page carries the CTA band and the footer; the primary content is
    // what sits between the masthead and them.
    publisher: ref(BUSINESS_ID),
  }
  if (route.path !== '/') node.breadcrumb = ref(`${url}#breadcrumb`)
  if (spec.mainEntity !== undefined) node.mainEntity = spec.mainEntity
  return node
}

/**
 * Page-level JSON-LD for one route: a `WebPage` (or the narrower subtype the
 * page earns), a `BreadcrumbList` everywhere but the home page, and whatever
 * that page alone declares. Disjoint from `SITE_GRAPH` — the business, the
 * person and the website are referenced by `@id`, never restated.
 *
 * An unknown path gets nothing rather than a node whose `@id` claims to be a
 * page that does not exist. So does a route marked `indexable: false`: the head
 * on that page says `noindex`, and a `WebPage` node asserting a canonical URL
 * for a page that has just asked not to be indexed is the two halves of the
 * same document contradicting each other.
 */
export function schemaFor(path: string): object[] {
  const route = routeByPath(path)
  if (!route || !isIndexable(route)) return []

  const url = absolute(route.path)
  const spec = pageSpec(route.path, url)
  const nodes: JsonLd[] = [webPage(route, url, spec)]
  if (route.path !== '/') nodes.push(breadcrumbList(route, url))
  return [...nodes, ...(spec.nodes ?? [])]
}
