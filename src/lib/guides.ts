/**
 * The guides, as data: what the /guides/ index lists, what each guide's
 * "Keep reading" cards say, what its breadcrumb calls it, and the headline its
 * <h1> and its JSON-LD `Article` both print.
 *
 * The headline lives here rather than in the page module for one reason: it is
 * said twice, once to the reader (the <h1>) and once to a crawler (the
 * `Article.headline` in src/lib/schema.ts), and a headline that says one thing
 * on the page and another in the structured data is a mismatch Google's Rich
 * Results test reports as an error. One string, read by both, cannot drift.
 *
 * The body copy stays in each page module under src/pages/guides/, because it
 * is JSX — links and emphasis — and because scripts/prerender.mjs dates each
 * guide's sitemap <lastmod> from its own file. This module counts as content
 * for that purpose too (prerender.mjs's CONTENT_MODULES), so editing a
 * headline or a summary here moves the <lastmod> of the pages that print it.
 *
 * Paths and dates are not restated: each entry names its route by key, and the
 * path and publication date are read from ROUTES, which is where the router,
 * the head and the sitemap already get them.
 */
import { ROUTES, normalizePath, type RouteDef } from './routes'

interface GuideSource {
  /** Route key in ROUTES. */
  key: string
  /** The short label in the breadcrumb, visible and in the JSON-LD. */
  crumb: string
  /** The <h1>, and the Article's `headline`. Google truncates past ~110 characters. */
  headline: string
  /** One paragraph, for the index and for the related-guide cards. */
  summary: string
  /** Who should read it — the side panel on the index. */
  readIf: string
  /** Mono chips on the index: what the guide covers, in the canvas's tag style. */
  topics: readonly string[]
  /** `Article.about` — the subjects, as schema.org `Thing` names. */
  about: readonly string[]
  /**
   * The date of the last substantive revision, when there has been one.
   * Absent, the guide is as first published and `dateModified` equals
   * `datePublished`. Set it when the advice changes, not for a typo.
   */
  modified?: string
}

export interface Guide extends GuideSource {
  route: RouteDef
  /** The route path, unslashed, exactly as ROUTES spells it. */
  path: string
  /** ISO date, from the route's `article.published`. */
  published: string
  /** ISO date: `modified`, or `published` when the guide has not been revised. */
  updated: string
}

/** The index. Its own route, and the middle rung of every guide's breadcrumb. */
export const GUIDES_PATH = '/guides'
export const GUIDES_CRUMB = 'Guides'

const SOURCES: readonly GuideSource[] = [
  {
    key: 'guide-verify-factory',
    crumb: 'Verify a factory',
    headline: 'How to verify a Chinese factory before you pay it anything.',
    summary:
      'The checks I run on every supplier before a client sends a deposit: the business licence and its 18-character code, the government register, the business scope, export history and capacity, certificates, a video walk-through or an audit — and the bank account the money goes to.',
    readIf: "You've found a supplier online and you're about to send a deposit.",
    topics: ['BUSINESS LICENCE', 'GSXT.GOV.CN', 'FACTORY VS TRADER', 'CAPACITY', 'BANK ACCOUNT'],
    about: [
      'Supplier verification',
      'Business licence',
      'Unified Social Credit Code',
      'Trading company',
      'Factory audit',
    ],
  },
  {
    key: 'guide-aql-inspection',
    crumb: 'AQL inspection',
    headline: 'AQL inspection: what 2.5 means, and what gets checked before you pay.',
    summary:
      'What an acceptance quality limit is and is not, how the lot size sets the sample, the accept and reject numbers for AQL 2.5 and 4.0 with a worked example, critical, major and minor defects, and why I inspect twice — at 20% of production and before the container is sealed.',
    readIf: "An inspection report says 'AQL 2.5' and you want to know what that actually promised.",
    topics: ['ISO 2859-1', 'LEVEL II', 'ACCEPT / REJECT', 'DEFECT CLASSES', 'IN-LINE AT 20%'],
    about: [
      'Acceptance quality limit',
      'ISO 2859-1',
      'ANSI/ASQ Z1.4',
      'Pre-shipment inspection',
      'Quality control',
    ],
  },
  {
    key: 'guide-fob-cif-ddp',
    crumb: 'FOB, CIF & DDP',
    headline: 'FOB, CIF or DDP: what the price includes, and where the risk passes.',
    summary:
      'The Incoterms 2020 rules you will actually meet buying from China — EXW, FOB, CIF, DAP and DDP — what each makes the seller pay for, the point at which the goods become your risk, who clears customs, and why CIF is safer-looking than it is.',
    readIf: "You have quotes on different terms and can't tell which one is cheaper.",
    topics: ['INCOTERMS 2020', 'FOB', 'CIF', 'DDP', 'LANDED COST'],
    about: ['Incoterms 2020', 'Free On Board', 'Cost, Insurance and Freight', 'Delivered Duty Paid', 'Importer of record'],
  },
]

function resolve(source: GuideSource): Guide {
  const route = ROUTES.find(r => r.key === source.key)
  // Thrown at import time, so a renamed route key fails the SSR build and the
  // typecheck-adjacent prerender instead of rendering a guide with no path.
  if (!route) throw new Error(`guides.ts: no route with key "${source.key}" in ROUTES`)
  if (!route.article) throw new Error(`guides.ts: route "${source.key}" has no article.published date`)
  return {
    ...source,
    route,
    path: route.path,
    published: route.article.published,
    updated: source.modified ?? route.article.published,
  }
}

export const GUIDES: readonly Guide[] = SOURCES.map(resolve)

export const guideByKey = (key: string): Guide => {
  const guide = GUIDES.find(g => g.key === key)
  if (!guide) throw new Error(`guides.ts: no guide with key "${key}"`)
  return guide
}

export const guideByPath = (path: string): Guide | undefined => {
  const p = normalizePath(path)
  return GUIDES.find(g => g.path === p)
}

/**
 * The breadcrumb label for a path, where the guides have a shorter one than
 * the route title. `undefined` for every other route, so the breadcrumb
 * builder in schema.ts falls through to its usual rule and the ten canvas
 * pages keep exactly the names they had.
 */
export const crumbLabel = (path: string): string | undefined => {
  const p = normalizePath(path)
  if (p === GUIDES_PATH) return GUIDES_CRUMB
  return guideByPath(p)?.crumb
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * `2026-09-22` -> `22 September 2026`.
 *
 * By hand rather than through `Intl.DateTimeFormat`, because the same string
 * is rendered twice — by Node in the prerender and by the browser on
 * hydration — and a date is exactly the kind of text whose locale formatting
 * differs between the two. A mismatch there is a hydration error on every
 * guide. The ISO string is parsed as text, never as a `Date`, so no time zone
 * can move it a day either way.
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
