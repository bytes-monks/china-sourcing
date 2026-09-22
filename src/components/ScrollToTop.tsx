import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { normalizePath } from '../lib/routes'

/**
 * Puts the page where a navigation says it should be.
 *
 * The canvas reset the scroll in its own `nav()` handler; the router does not,
 * and without this a click from the bottom of a long page lands mid-way down
 * the next one. It used to be exactly that — `scrollTo(0, 0)` whenever the
 * pathname changed — which had three holes once links started carrying a
 * fragment (the footer's Services column points at `/services/#freight`):
 *
 *   - A link to another page's `#section` landed at that page's top. The
 *     target is in a lazy route chunk, so it may not even exist yet when the
 *     URL changes; this waits for it (a frame at a time, for at most
 *     WAIT_MS) and falls back to the top if it never appears.
 *   - A link to a `#section` of the page already on screen did nothing,
 *     because the pathname did not change and the router does not scroll.
 *   - It also ran on first load, after the browser had already put the page
 *     in the right place — at a fragment, or where a reload left it — and
 *     yanked it back to the top once React hydrated.
 *
 * Same-page jumps are smooth unless the reader has asked for reduced motion.
 * A jump to another page is always instant: gliding there from wherever the
 * last page was left is motion with no meaning.
 *
 * Back and Forward are left to the browser, which restores the position it
 * saved for that history entry — what a multi-page site does. The old
 * `scrollTo(0, 0)` did not reliably override that anyway. Measured in
 * Chromium, Back came back to the saved position with the reset and without
 * it, from a short page to a tall one and the reverse: Chrome applies its
 * restoration after the incoming route has rendered, which is after this
 * effect. The spec restores synchronously, right after popstate and before
 * React has rendered anything, so in a browser that follows it the reset ran
 * last and Back meant the top. Doing nothing on POP gives one answer
 * everywhere.
 *
 * Focus follows a user's navigation, not just the scroll position. The header
 * and footer persist across routes, so after a click the focused element was
 * still the link that was clicked — the next Tab went on through the footer
 * and scrolled the reader straight back down to it. A fragment target takes
 * focus (with a tabindex added for the purpose and removed on blur), and a
 * plain page change focuses `<main>`, which AppShell already makes focusable
 * for the skip link. `preventScroll` throughout, so focus never moves the
 * page, and nothing happens on Back/Forward, where the reader did not choose a
 * destination by pointing at it.
 *
 * Effects only: this never changes server-rendered markup, and it does
 * nothing at all on the first render of a prerendered page without a
 * fragment — which is every page the pixel and hydration checks load.
 */

/** How long to wait for a fragment target to be rendered. */
const WAIT_MS = 4000

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** `smooth` for an in-page jump, unless the reader has asked for less motion. */
const inPage = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth')

/** The element a `#fragment` names, if it is in the document. */
function targetOf(hash: string): HTMLElement | null {
  if (hash.length < 2) return null
  let id = hash.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    // A malformed escape: look the id up exactly as written.
  }
  return document.getElementById(id)
}

/**
 * Calls `found` once the fragment's target exists, checking once a frame for
 * at most WAIT_MS. Returns a canceller for the effect's cleanup, so a second
 * navigation during the wait cannot be overtaken by the first one's jump.
 */
function whenRendered(hash: string, found: (el: HTMLElement) => void): () => void {
  const start = performance.now()
  let frame = 0
  const check = () => {
    const el = targetOf(hash)
    if (el) found(el)
    else if (performance.now() - start < WAIT_MS) frame = requestAnimationFrame(check)
  }
  check()
  return () => cancelAnimationFrame(frame)
}

/** Focus without scrolling, making the element focusable only for as long as it has focus. */
function focus(el: HTMLElement): void {
  if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1')
    el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true })
  }
  el.focus({ preventScroll: true })
}

/** How the document itself was loaded: 'navigate', 'reload' or 'back_forward'. */
function loadType(): string {
  const [entry] = performance.getEntriesByType?.('navigation') ?? []
  return (entry as PerformanceNavigationTiming | undefined)?.type ?? 'navigate'
}

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation()
  // PUSH / REPLACE: a link or navigate(). POP: Back/Forward — or a plain
  // <a href="#x"> such as the skip link, which the browser has already
  // scrolled and focused for itself.
  const action = useNavigationType()
  const seen = useRef<{ key: string; path: string; from: string | null } | null>(null)

  useEffect(() => {
    const prev = seen.current
    // StrictMode runs this effect twice for one location in development. The
    // second run must repeat the first's decision, not mistake the location
    // the first run just recorded for the page it came from.
    const from = prev === null ? null : prev.key === key ? prev.from : prev.path
    seen.current = { key, path: normalizePath(pathname), from }

    // The page the browser loaded. It is already where it belongs — at the
    // top, at the fragment (the prerendered HTML contains every target), or
    // wherever a reload or Back left it. The one case that needs help is a
    // fresh load with a fragment whose target was not there when the browser
    // looked: `npm run dev` renders into an empty #root.
    if (from === null) {
      if (!hash || loadType() !== 'navigate') return
      return whenRendered(hash, el => el.scrollIntoView({ block: 'start' }))
    }

    // Back/Forward, or a native fragment jump (the skip link): the browser has
    // already put the page where it belongs, and anything here would fight it.
    if (action === 'POP') return

    if (from === normalizePath(pathname)) {
      // The same page: a link to one of its sections, or to the page itself.
      if (!hash) {
        window.scrollTo({ top: 0, behavior: inPage() })
        return
      }
      const el = targetOf(hash)
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: inPage() })
        focus(el)
      }
      return
    }

    // Another page.
    const land = (el: HTMLElement) => {
      el.scrollIntoView({ block: 'start' })
      focus(el)
    }
    const el = targetOf(hash)
    if (el) {
      land(el)
      return
    }
    // Top first, so a target that is still arriving is jumped to from the top
    // of its page rather than from wherever the last page was left — and the
    // top is where the reader stays if it never arrives.
    window.scrollTo(0, 0)
    if (!hash) {
      const main = document.getElementById('main')
      if (main) focus(main)
      return
    }
    return whenRendered(hash, land)
  }, [pathname, hash, key, action])

  return null
}
