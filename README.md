# Bachar — The China Guy

Marketing site for Bachar, a sourcing agent working out of Guangzhou. React 19 +
TypeScript + Vite 5, ten routes, every one prerendered to static HTML and served
from GitHub Pages on a custom domain.

```bash
npm install
npm run dev        # vite dev server
npm run typecheck  # tsc, no emit
npm run build      # typecheck -> client build -> SSR build -> prerender
npm run preview    # serve dist/
```

## The one fact that shapes this repo

**None of the page markup was typed by hand.** The design exists as a Claude
Design canvas — `reference/index.html` — and `scripts/from-design.mjs`
transpiles it into React. Every colour, every padding, every letter-spacing in
`src/pages/` and `src/components/` is a byte-for-byte copy of a declaration in
that canvas.

And fidelity to it is not a matter of opinion. It is checked mechanically, by
screenshotting the canvas and the built site through the same headless browser
and counting the pixels that differ. That check is the reason the code looks the
way it does; most of the rules below follow from it.

## The design canvas

`reference/` holds the canvas exactly as exported, and is never edited:

| File | What it is |
| --- | --- |
| `reference/index.html` | One `x-dc` template. Everything is styled with inline `style="…"` strings, branched with `sc-if` elements, and hovered with `style-hover=` / `style-focus=` attributes. A `helmet` block carries the font links and the base stylesheet. |
| `reference/support.js` | The design runtime that renders it — it mounts the template with React from CDN and compiles the `style-hover` attributes into a generated stylesheet at runtime. |

A canvas has one URL, so it swaps its ten artboards through component state. The
site gives each artboard a real path instead, so every page is linkable,
crawlable and prerenderable.

### Contact details are data, not design

The canvas was exported with placeholders in the three contact rows and the
footer — `+86 138 0000 0000`, `bachar-china`, `bachar@thechinaguy.com`. The site
prints the real ones, from `src/lib/site.ts`.

Diffed as they are, that reddens every page: 1,695 px of glyph difference in the
footer on all ten, and 4,344 px on `/contact`. Every page height is identical,
because the difference is which characters are in the boxes and not where the
boxes are — which is to say it is the one thing the diff exists to check being
right, reported as ten failures.

So `applyContactData()` in `pixel-lib.mjs` rewrites the placeholders in the
rendered canvas before the shutter, on both `capture-reference.mjs` and
`diff-states.mjs`. Both sides then show the same data and the diff is about
layout again. Three things keep it honest:

- **`reference/index.html` is still never written to.** The substitution happens
  in the DOM at capture time, and it is declared in one map.
- **The real values are read out of `src/lib/site.ts`**, by regex rather than by
  import, because site.ts is TypeScript and the scripts are plain Node. A
  missing constant throws with the reason rather than falling back.
- **A placeholder that is never hit is a failure.** `assertContactDataApplied()`
  runs at the end of both scripts. Re-export the canvas with different
  placeholder text and the harness stops and names the strings it could not
  find, instead of quietly comparing the wrong thing.

The substitution is confined to contact details. Anything else the canvas says
is the canvas's to say, and a difference in it is a real failure.

### How the transpile works

`node scripts/from-design.mjs` parses the template with parse5 and emits JSX:

- Each top-level `sc-if value="{{ isX }}"` under `main` is one page, written to
  `.design-import/pages/<Name>.tsx`.
- The five frame parts around `main` — the announcement bar, the masthead, the
  site-wide CTA band, the footer and the sticky contact pills — become
  `.design-import/components/{TopBar,SiteHeader,SiteCta,SiteFooter,StickyContact}.tsx`.
- Each `style="…"` string is split on top-level `;` (never inside `(…)`,
  so gradients and `rgba()` survive), camel-cased, and re-serialised as an object
  literal in the same order.
- An `a href="#"` with `onClick={{ go.pricing }}` becomes `Link to="/pricing"`.
  A `Link` still renders an `a`, so routing costs no pixels.
- `style-hover` / `style-focus` become class names, and the matching rules are
  written to `.design-import/pseudo.css`.

Output goes to `.design-import/` (gitignored). It is a starting point that gets
curated into `src/` by hand — **not** a build step.

## The pixel-fidelity harness

Three scripts and a shared library — plus three further checks, below, built on
the same library. Both sides are captured through the same code path, so any
difference in the images is a difference in the markup and not in how the two
were photographed.

`scripts/pixel-lib.mjs` holds what they share: a small static file server, the
browser launch (see the Chrome gotcha for how the binary is resolved), the list
of ten page keys, the contact-data normalisation described above, and
`settle()` — which awaits `document.fonts.ready` and two
animation frames before any shot. That wait is not superstition: capture the
first frame and the text measures at fallback font metrics, and every block
lands a few pixels off.

**`scripts/capture-reference.mjs`** serves `reference/` on port 4599, waits for
`support.js` to boot the canvas, then walks the artboards by setting the
canvas's own prop — `window.__dcSetProps(window.__dcRootName(), { startPage })`
— rather than clicking the nav. Driving it by prop is what reaches the three
pages the header does not link to (`audit`, `contact`, `mobile`). Full-page PNGs
land in `.pixel/ref/<width>/`.

**`scripts/capture-build.mjs`** serves `dist/` on port 4600 and visits the ten
real routes. Two details matter:

- The server has **no SPA fallback** for this build. If a route file were
  missing, a fallback would quietly serve the home page and the diff would come
  back clean. It must 404 instead. (`SPA=1` enables the fallback, for shooting
  `build:spa` output.)
- It waits for **`window.__hydrated`**, a flag `src/App.tsx` sets in an effect,
  before shooting. It used to wait for `header nav a` — which the *prerendered*
  markup already contains, so the gate was satisfied on first paint and a build
  whose client JS 404s passed every check on a dead page. Only a signal that
  requires JavaScript to have run can prove JavaScript ran.

**`scripts/diff-pixels.mjs`** compares the two sets with pixelmatch. Three
settings do the work, and the first two are routinely confused with each other:

- **`TOLERANCE`** is pixelmatch's per-pixel *colour* tolerance: how far apart
  two pixels' colours must be before that pixel counts as changed. It is not a
  budget for how many pixels may change. It defaults to **`0`** — any difference
  counts. It was `0.1`, pixelmatch's permissive default, beneath a comment
  claiming the comparison was exact; that silently excused a visible colour
  drift on every pixel of every page. `TOLERANCE=0.1` survives as an override.
- **`THRESHOLD`** is that budget — the fraction of a page's pixels allowed to
  differ — and it defaults to **`0`**. Exact. A percentage sounds prudent and is
  not: `0.0001` of a page this tall quietly permits around 200 stray pixels, and
  every divergence this harness has ever found was a real defect (a dropped
  section, a text node split in two). There is nothing for a tolerance to
  absorb. `THRESHOLD=0.0001` survives as an override, for triaging a regression
  too large to read.
- **`includeAA: true`**, which is the opposite of pixelmatch's default. The
  default detects antialiased pixels and skips them; `true` means an antialiased
  pixel that differs still counts. That matters because a subpixel shift is
  exactly what AA detection excuses — see the `__BUILD_YEAR__` gotcha below,
  which is a real two-pixel regression of precisely that shape.

A page also fails outright if the two images differ in height, whatever the
pixel count. When they do, both are first padded to a common canvas (filled
`0xff`, so padding reads as "missing" rather than as black) — a height change
then shows up as a visible block instead of a crash. The script exits non-zero
if any page fails, so CI can gate on it.

### Current result

**All ten pages match the design canvas at 0 differing pixels**, verified at
1280, 1440, 1600 and 1920 px. With `THRESHOLD=0` and `includeAA: true` that is
a literal zero, not a rounded one.

390 px used to be in that list. It is not any more, and the reason is a feature
rather than a regression: `src/mobile.css` now adds the breakpoints the canvas
does not contain, so below 860 px the build is deliberately not the canvas and
there is nothing at 390 to diff it against. Phone widths are gated by
`check-mobile.mjs` instead — see [Responsiveness](#responsiveness).

### Re-running it

Needs a built `dist/` and a browser `pixel-lib.mjs` can find. It is deliberately
not part of `npm run build` — it drives a browser and takes minutes per width.

```bash
npm run build
npm run pixel                                   # ref -> build -> diff, at 1440
for W in 1280 1440 1600 1920; do WIDTH=$W npm run pixel; done
```

`npm run pixel` is the three-step loop chained with `&&`, so a failed capture
can never diff stale PNGs. The steps are also individually exposed —
`npm run pixel:ref`, `npm run pixel:build`, `node scripts/diff-pixels.mjs`.
Re-capturing the reference is only necessary when `reference/` or the width
changes; otherwise the last two are the loop you want.

### Reading a failure

`diff-pixels.mjs` prints one row per page — reference height, build height,
pixels changed, percentage, and `ok` or `FAIL`. A height mismatch is called out
explicitly (`height differs by -261`), and that is the single most useful number
in the table: it almost always means a whole block is missing or duplicated,
not that something shifted.

Every failing page writes `.pixel/diff/<width>/<page>.png`, with the differing
pixels lit up. A page that passes has its stale diff deleted, so whatever is in
that directory is current. Large flat regions in a diff are padding — one image
was shorter than the other.

Knobs, all environment variables: `WIDTH` (default 1440), `THRESHOLD`
(default 0), `CHROME_PATH`, and for the build capture `DIR` and `SPA`.

### The four checks the resting diff cannot make

All four need the same prerendered `dist/`, and all four use `pixel-lib.mjs`'s
server and browser, so they see exactly what the diff sees.

**`npm run check:hydration`** loads every route twice — once with JavaScript
disabled, capturing exactly what the server wrote, and once normally, capturing
the tree after hydration — and fails if the two disagree or if React logged a
hydration complaint. Differences that are legitimate rather than bugs are
normalised away first (React writes `style="a: b"` where the server wrote
`style="a:b"`; inter-block whitespace is not observable). On a mismatch it
prints the first diverging character with 60 characters of context either side,
which is usually enough to name the element. It refuses to run against
`build:spa` output, checking for `dist/404.html` to tell the two apart.

**`npm run check:hover`** hovers every `a`, `button`, `input`, `textarea` and
`select` on both the canvas and the build at 1440 px and compares `color`,
`backgroundColor`, `borderTopColor` and `textDecorationLine`. Elements are
matched by geometry — position and size — which is exact precisely because the
two documents are already known to be pixel-identical. It is the only check that
covers the hand-written `:hover` rules in `src/index.css`, which no screenshot
can see.

**`npm run check:mobile`** is the one check with no canvas on the other side of
it. Below 860 px there is no reference to diff against, so instead of comparing
an image it asserts the two properties a phone layout has to have, at 390 px and
at 320 px: no element wider than the viewport, and no two masthead links
overlapping each other. Both are the failures the old layout actually had — the
contact form's right-hand column ran off the screen, and seven nav links wrapped
into a ~90 px column that landed on the wordmark. It deliberately does not
assert a minimum font size: the canvas sets its mono eyebrows at 8.5–11 px at
every width, so a floor would flag thirty elements a page that are exactly as
intended and say nothing about the mobile layer. `WIDTHS=360,414` overrides the
widths.

**`npm run check:states`** covers what a first-paint screenshot structurally
cannot: the interactive states. `diff-pixels.mjs` shoots each page as it loads,
which leaves untested exactly the places where the React port re-implements
canvas behaviour by hand rather than copying markup — a FAQ answer opened on a
different item, the contact form after submit. So this drives the same click
sequence on both sides and diffs the results (`threshold: 0`, `includeAA:
true`, any changed pixel fails), writing `.pixel/states/<state>.png` when one
differs. Clicks are addressed by visible text, prefix-matched, so the same
instruction resolves in both documents. Two details are hard-won: the reference
page is fully reloaded between states, because the canvas keeps the open FAQ
item in component state and `__dcSetProps` does not reset it — without the
reload the second state started where the first left off on the canvas but fresh
on the build, and the harness reported its own asymmetry as a divergence.

Current result: all ten routes hydrate with byte-identical server and client
markup and no React complaint; rest, hover and focus match across 328 elements
× 10 computed properties — 9,840 comparisons.

`check:hover` forces the pseudo-states through the DevTools Protocol rather than
moving a mouse, and that is not incidental. The mouse-driven version never
scrolled, so 179 of those 328 elements sat below the 1000px fold and were
compared resting-state to resting-state — already known equal from the pixel
diff, making more than half the headline number vacuous. Scrolling fixed that
and exposed a second hole: the fixed WhatsApp/WeChat pills sit on top of the
footer's right-hand links, so the pointer could never reach them. A forced state
has neither problem, and cannot degrade into comparing two resting states.

Elements marked `data-beyond-canvas` are excluded and **counted in the output** —
currently 10, the skip link on each route. The canvas has no skip link, so there
is nothing to compare it against. The count is printed so the exemption cannot
quietly grow into a way of hiding drift.

## Why the styles are inline objects

There is no Tailwind in the pages and there are no CSS modules. Every element
carries a `style={{ … }}` object, because that object *is* the design's own
`style="…"` string — same declarations, same values, same order. Rewriting them
into utility classes or a stylesheet would mean re-deriving cascade and
specificity by hand, and the pixel diff would stop proving anything. Zero
differing pixels is only meaningful because nothing was re-expressed on the way
in.

(`tailwindcss`, `postcss` and `autoprefixer` are in `devDependencies` as
scaffold inheritance from the sibling project. The pages do not use them.)

### The exceptions: `src/index.css` and `src/mobile.css`

`index.css` is twenty-four lines, two blocks.

The first is the base rules, copied verbatim from the canvas's `helmet` style
block — box-sizing, the body background and font, the default link colour,
`::selection`.

The second is the generated pseudo-class sheet, because an inline style object
cannot express `:hover`. `style-hover="background:#1A1614;color:#F4F0E8"` in the
canvas becomes `className="hv-ink"` on the element and this rule in the sheet:

```css
.hv-ink:hover { background:#1A1614 !important;color:#F4F0E8 !important }
```

**The `!important` is load-bearing, not sloppiness.** Each of these elements also
carries an inline `background` / `color` / `border-color` for the same property,
and an inline declaration beats any normal stylesheet rule no matter how
specific the selector. Drop the `!important` and the hover silently does
nothing. This is exactly what the design runtime does — see `createPseudoSheet`
and `importantify` in `reference/support.js`; the `importantify()` in
`from-design.mjs` is a deliberate copy of it, so the generated sheet and the
canvas behave identically.

The class names are looked up in `HOVER_NAMES` / `FOCUS_NAMES` in
`from-design.mjs` rather than hashed, so the components stay readable. An
unrecognised `style-hover` value throws — a new hover in the canvas has to be
named, it cannot be dropped by accident.

`mobile.css` is the second exception and a different kind of one: `index.css`
transcribes the canvas, `mobile.css` says things the canvas does not. It is the
only file in `src/` whose values were chosen here rather than copied, and every
one of them is fenced inside a `max-width` media query so it cannot reach the
widths the canvas specifies. [Responsiveness](#responsiveness) covers what it
does and what it costs.

## Responsiveness

**The design canvas defines no breakpoints. The site now defines its own.**

Until `src/mobile.css` there was not one width-based media query in
`reference/index.html` or `src/index.css`, and the site inherited exactly that:
what responsiveness existed was whatever CSS does unasked — `flex-wrap` on the
top bar and the hero button row, `repeat(auto-fit,minmax(…,1fr))` on nearly
every card grid. It reflowed as the viewport narrowed. It did not adapt. At
390 px the honest word was *degrades*:

- The masthead was `flex-wrap: nowrap` with the wordmark and the quote button
  both `flex: none`, so the seven nav links wrapped among themselves into a
  ~90 px column that sat on top of the wordmark and swallowed most of the first
  screen.
- The hero was `grid-template-columns: minmax(0,1.15fr) minmax(0,.85fr)` — a
  fixed two-track grid with no `auto-fit`. It never collapsed.
- The hero headline stayed `78px` at every width, so in a 326 px content column
  it set at roughly one word per line.
- The contact page's two-track grid never collapsed either, which put the form's
  right-hand column, and every input in it, off the right of the screen.
- Home scrolled 66 px sideways, because the hero's "Live order" card is
  positioned 24 px off the left of a column that had become narrower than the
  card's own `min-width`.

### What `src/mobile.css` does

One file, two breakpoints, and the first design decisions in this repo that
`reference/` does not contain. Every declaration sits inside a `max-width`
query, so nothing in it applies at the widths the canvas actually specifies —
which is what keeps the diff at 1280/1440/1600/1920 at a literal zero.

At **≤ 860 px**: the masthead reflows to wordmark and quote button on one row
with the nav on its own row beneath, and stops being sticky — two rows of nav is
~140 px, and a bar that tall pinned to a 780 px viewport costs more than it
returns, given the floating WhatsApp pill is already a persistent CTA. The fixed
multi-track grids collapse to one column. The footer's four tracks become the
brand across the top with the link lists two-up. Display type moves to `clamp()`
— `h1` to `clamp(34px, 8.4vw, 54px)` and so on, landing on the canvas value at
the top of the range. The audit report's `220px | 1fr | 50px` score rows put the
label and score on one row with the bar spanning beneath.

At **≤ 560 px**: gutters tighten from 32 to 20 px, oversized panel padding with
them, the announcement bar drops to 10 px, and the floating pills shrink into
the corner. `repeat(auto-fit,minmax(300px,1fr))` also loses its floor here — a
300 px track cannot shrink to the 280 px a 320 px screen leaves, and six routes
hung over the edge because of it. Dropping the floor costs nothing at 560, where
there is no room for a second column either way; it only bites below ~370 px,
which is where the bug was.

Elements are addressed through `data-m` tokens rather than by structure, so a
re-transpile that reorders a section cannot silently retarget a rule. The tokens
are listed at the top of `mobile.css`.

### What this costs

The 390 px pixel gate. It used to pass at zero, which read like a fidelity
result and was the opposite of one: with no breakpoints on either side, a clean
diff at 390 only ever said *the build is as unresponsive as the canvas*. That
sentence is no longer true, and the diff is correspondingly no longer zero —
all ten pages differ there now, by design. `WIDTH=390 npm run pixel` will fail;
it is not in CI's matrix any more, and `npm run check:mobile` gates those widths
instead.

The order the README used to prescribe — add mobile artboards to the canvas,
re-export, re-transpile, then hold 390 to zero — is still the order that would
restore a single source of truth. `mobile.css` is what those artboards should
replace when they exist. Until then the divergence is deliberate, confined to
one file, and bounded by a media query.

## Layout

```
.github/
  workflows/deploy.yml  Push to main -> build -> GitHub Pages
  workflows/ci.yml      PRs and side branches: typecheck + client build
  workflows/pixel.yml   PRs and side branches: pixel diff, hover, hydration
  dependabot.yml        Weekly grouped npm and github-actions updates
index.html              Shell. Fonts verbatim from the canvas helmet; the
                        seo:start / seo:end markers are rewritten per route.
reference/              The untouched design canvas. Ground truth.
scripts/
  from-design.mjs       Canvas -> JSX, into .design-import/
  pixel-lib.mjs         Shared server / browser / settle helpers
  capture-reference.mjs Screenshots the canvas    -> .pixel/ref/<width>/
  capture-build.mjs     Screenshots the build     -> .pixel/build/<width>/
  diff-pixels.mjs       Compares them             -> .pixel/diff/<width>/
  diff-states.mjs       Interaction states        -> .pixel/states/
  check-hydration.mjs   Server markup vs hydrated markup, every route
  check-hover.mjs       Hover / focus computed styles, canvas vs build
  check-mobile.mjs      Phone layout at 390 and 320 — no canvas side
  prerender.mjs         Static HTML per route, plus sitemap.xml and 404.html
src/
  lib/routes.ts         ROUTES — the route table, single source of truth
  lib/site.ts           ORIGIN, names, contact details, absolute()
  lib/head.ts           headFor(path) / headToHtml(head)
  lib/schema.ts         SITE_GRAPH + schemaFor(path) — the JSON-LD graph
  components/Seo.tsx    Applies the head to the live DOM after navigation
  AppShell.tsx          The page frame around the routed page
  routes.tsx            Route elements, one lazy chunk per page
  App.tsx main.tsx      Composition and hydration
  entry-server.tsx      SSR entry, consumed only by prerender.mjs
  index.css             Base rules + the generated pseudo-class sheet
  mobile.css            The breakpoints the canvas does not define
  pages/                One component per artboard
  components/           TopBar SiteHeader SiteCta SiteFooter StickyContact
                        ScrollToTop
public/                 Copied verbatim into dist/ (CNAME, icons, robots)
```

`AppShell.tsx` reproduces the canvas's outermost `min-height:100vh` column:
`TopBar`, `SiteHeader`, the routed `main`, `SiteCta`, `SiteFooter`, and the
sticky contact pills — which are hidden on `/contact`, because the canvas hid
them there too. There is already a form on screen; a button that scrolls to it
is noise.

## The route table

`src/lib/routes.ts` is the one place the artboard-to-URL mapping lives:

```ts
interface RouteDef {
  key: string          // artboard key in the design canvas
  path: string
  nav: string | null   // header nav label; null keeps it out of the nav
  title: string
  description: string
}
```

Ten entries. `NAV_ROUTES` is the filtered list the header renders;
`routeByPath()` is how the head lookup finds a route. The header nav, the head
pipeline, `entry-server.tsx`'s exported `paths`, the prerenderer and the sitemap
all read this table, so they cannot drift apart.

`audit`, `contact` and `mobile` have `nav: null` — they are real, indexable,
prerendered routes that simply are not in the masthead.

**Adding a route** touches three places: an entry in `ROUTES`, a page component
in `src/pages/`, and a child route in `src/routes.tsx`. If the page also exists
as an artboard in the canvas, add its key to `PAGES` in `scripts/pixel-lib.mjs`
and its path to `PATHS` in `scripts/capture-build.mjs` so the diff covers it.

## The SEO head

Described once as data, consumed twice — so a prerendered page and a
navigated-to page cannot disagree.

| File | Responsibility |
| --- | --- |
| `src/lib/head.ts` | `headFor(path)` returns the title and the full tag list — description, keywords, robots, canonical, Open Graph, Twitter. `headToHtml()` serialises it. |
| `src/lib/site.ts` | `ORIGIN`, site names, contact details, `absolute(path)`, `OG_IMAGE`. |
| `src/lib/schema.ts` | The JSON-LD. `SITE_GRAPH` is the site-wide half — the `ProfessionalService` and the `WebSite` — emitted on every page. `schemaFor(path)` is the page-level half: a `WebPage`, a `BreadcrumbList` everywhere but home, plus the service `ItemList`, the `FAQPage` and the two pricing `OfferCatalog`s on the three pages that have them. The halves are disjoint, so a page node references `#business` / `#website` by `@id` instead of restating them. Nothing in it is invented — no review count, no founding date, and `sameAs` is empty because no profile URL can currently be verified. |
| `src/components/Seo.tsx` | On client-side navigation: sets `document.title`, removes every `[data-seo]` node and rebuilds the set. Replaces wholesale rather than diffing — both sets come from the same list, so a stale tag can only be the previous route's. |
| `src/entry-server.tsx` | The single bridge to plain Node. Exports `paths`, `render(path)`, `head(path)` and `jsonLd(path)`; the prerenderer imports it from the SSR bundle instead of keeping a second copy of anything. |
| `scripts/prerender.mjs` | Writes the tags between the `seo:start` / `seo:end` markers in each emitted HTML file, injects the `@graph` and the per-route modulepreloads, and writes `sitemap.xml` and `404.html`. |

`index.html` carries only what is genuinely site-wide. Anything added between
the markers is discarded on every route.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server. `#root` starts empty, so `main.tsx` takes the `createRoot` branch. |
| `npm run typecheck` | `tsc` alone, no build. |
| `npm run build` | `tsc` → client build → SSR build into `.ssr/` → `scripts/prerender.mjs`. |
| `npm run build:spa` | Typecheck and client build only. Plain SPA output, no prerender. |
| `npm run build:ssr` | The SSR bundle alone. |
| `npm run prerender` | The prerender step alone — a fast loop when iterating on head or sitemap output. |
| `npm run preview` | Serve `dist/`. |
| `npm run check:hydration` | Every prerendered route, loaded with JS off and then on; fails on a divergence or a React hydration complaint. Needs `npm run build`, not `build:spa`. |
| `npm run check:hover` | Hover and focus computed styles, canvas vs build, at 1440 px. |
| `npm run check:mobile` | The phone gate: no element wider than the viewport and no overlapping masthead links, at 390 and 320 px. `WIDTHS=360,414` overrides. Has no canvas side — below 860 px there is nothing to diff against. |
| `npm run check:states` | Drives four click sequences (three FAQ, one contact-form submit) on both the canvas and the build and diffs the resulting screenshots. |
| `npm run pixel:ref` | Screenshot the canvas → `.pixel/ref/<width>/`, with the placeholder contact details normalised onto `site.ts`'s values. |
| `npm run pixel:build` | Screenshot `dist/` → `.pixel/build/<width>/`. |
| `npm run pixel` | The three-step loop chained: `pixel:ref && pixel:build && diff-pixels.mjs`. `WIDTH=1920 npm run pixel` works — the env var reaches all three. Below 860 px it will fail, and should: see [Responsiveness](#responsiveness). |
| `npm run clean` | Remove `dist/`, `.ssr/`, **`.pixel/`** and `*.tsbuildinfo`. |
| `node scripts/from-design.mjs` | Re-transpile the canvas into `.design-import/`. |
| `WIDTH=… node scripts/diff-pixels.mjs` | Compare the last two captures, and exit non-zero on a failure. The only harness step with no npm script of its own; `npm run pixel` is the usual way in. |

**`npm run clean` deletes `.pixel/` too.** That is the reference captures as
well as the build ones, and regenerating them is minutes of browser time per
width — four widths is a coffee. When all you want is a fresh build,
`rm -rf dist .ssr` is the command you actually meant.

The build is four stages in `&&` order and the order is a contract: the SSR
build must follow the client build, because `vite build` empties `dist/`.

The prerender's own requirements are narrower than they look. It hard-fails on
exactly two missing files — `.ssr/entry-server.js` and `dist/index.html` — and
on any of the three markers it rewrites (`<!--seo:start-->`, `<!--seo:end-->`,
`<div id="root"></div>`) being absent from the shell, which is how a stale
`dist/` whose markers were already replaced fails loudly instead of emitting a
page with no head. **`dist/.vite/manifest.json` is optional.** Without it the
modulepreload lookup finds nothing, every page is still written, and the run
ends with a printed note naming the routes that will now fetch their route chunk
a round trip late.

Each page is a lazy chunk, so a visit costs one page's JavaScript rather than
ten. The prerenderer emits a `modulepreload` for the matching chunk, so the
split costs no extra round trip on first paint. React and the router are pinned
into their own `vendor` and `router` chunks in `vite.config.ts` — framework code
changes far less often than copy, so its content hash survives ordinary
deploys.

## Deployment

GitHub Pages, from `.github/workflows/deploy.yml`: a push to the default branch
checks out, sets up Node 20 with an npm cache, runs `npm ci` and `npm run
build`, uploads `dist/` as the Pages artifact, and deploys it. The repository's
Pages source has to be set to **GitHub Actions** — with "Deploy from a branch"
the deploy 404s.

The custom domain lives in `public/CNAME`, which Vite copies into `dist/`
verbatim, so the domain survives every deploy without a workflow step.

**To move the site to a different domain, change `ORIGIN` in `src/lib/site.ts`
and make `public/CNAME` agree with it.** `ORIGIN` is what canonical URLs,
`og:url`, the sitemap and the JSON-LD `@id`s are all built from; nothing else
hardcodes the host.

For a project page rather than an apex domain, set `BASE_URL` in the workflow's
build step — `vite.config.ts` reads `process.env.BASE_URL || '/'`.

### `dist/404.html`

GitHub Pages serves `404.html` for any path it has no file for, and the
prerenderer writes one. Two details are load-bearing:

- It is built from the **untouched shell**, not from `dist/index.html`. By the
  time the 404 is written, `dist/index.html` holds the prerendered *home page* —
  copying it would serve the home page's markup, canonical URL and JSON-LD under
  every dead URL on the site.
- It carries `<meta name="robots" content="noindex, follow">`, so a crawler
  following a stale link never banks the page.

- It is **rendered**, not blank. `src/routes.tsx` has a `{ path: '*' }` catch-all
  as a *child* of the `/` route, so `NotFound` appears inside `AppShell` with the
  real header and footer. As a sibling top-level route it would not work: React
  Router will not match a parent unless a descendant matches, so before the
  catch-all existed `useRoutes` returned `null` for every unknown path and
  `404.html` rendered a completely blank page.
- `headFor()` returns a noindex-only head for any unmatched path. That matters
  because `Seo.tsx` replaces the whole `data-seo` block on mount: while `headFor`
  fell back to `ROUTES[0]`, mounting on a dead URL stripped the prerendered
  noindex and published the *home page's* `index, follow`, canonical and title in
  its place — an indexable duplicate of the home page under every dead URL.

### Trailing slashes

GitHub Pages serves `dist/pricing/index.html` at `/pricing/` and 301-redirects
the bare `/pricing` to it, so the slashed form is what visitors and crawlers
actually land on. Two consequences are wired in:

- `absolute()` in `src/lib/site.ts` emits the slashed form, so every canonical,
  `og:url`, `twitter:url`, JSON-LD `url` and sitemap `<loc>` names the URL being
  served rather than one that redirects to it.
- `normalizePath()` in `src/lib/routes.ts` strips it back off for lookups.
  `routeByPath` was an exact match, and `useLocation().pathname` reads
  `/pricing/` on the served URL — so every route silently missed and fell back
  to the home page's head. `AppShell` and `SiteHeader` normalise too, for the
  sticky-pill and active-nav checks.

### Accessibility

The markup is a faithful port, so anything the canvas gets wrong the site gets
wrong. What could be fixed without moving a pixel has been: the FAQ rows carry
`role="button"`, `aria-expanded`, `aria-controls` and Enter/Space handling, and
their answers stay mounted with the `hidden` attribute rather than unmounting,
so every `aria-controls` resolves in every state. The contact form's controls
have `id`/`name`/`htmlFor`, its confirmation panel is a focused
`role="status"` live region, there is a skip link, and three pages had their
heading levels corrected from `h3` to `h2`.

What could **not** be fixed here, because it would change the design:

| Issue | Measured |
| --- | --- |
| WhatsApp pill, white on `#25D366` | 1.98:1 — the worst on the site, and it is on 9 of 10 pages |
| Footer greys on `#1A1614` | 3.50:1, 3.76:1, 4.10:1 |
| `<select>` on the contact page | `outline:none` and no `:focus` style — the canvas gives one to the six inputs and the textarea but not the select, so keyboard focus on it is invisible |

These are design decisions, not implementation bugs, and changing them ends the
zero-pixel guarantee. They need a change to the canvas.

### The workflows

Three, plus Dependabot, all under `.github/`:

| File | Runs on | What it does |
| --- | --- | --- |
| `workflows/deploy.yml` | push to `main`, manual | The deploy above. `fetch-depth: 0` is required rather than tidy: each sitemap `<lastmod>` comes from `git log` on that route's source, and a shallow clone silently collapses every page to the build date. Concurrency group `pages` with `cancel-in-progress: false`, so pushes queue — cancelling a half-finished Pages deploy leaves the live site indeterminate. |
| `workflows/ci.yml` | pull requests, pushes to any branch but `main` | `npm ci`, `npx tsc` as its own step (a type error is then reported as a type error, in seconds), then `npm run build:spa`. It skips the SSR build and the prerender on purpose: those run on `main` in `deploy.yml`, and the prerender wants history this job does not fetch. Superseded runs are cancelled, keyed on `head_ref \|\| ref` so a same-repo PR branch — which fires both `pull_request` and `push` — resolves to one group instead of running everything twice. |
| `workflows/pixel.yml` | pull requests, pushes to any branch but `main`, manual | The fidelity gate, in three jobs. **diff** installs Chromium, checks that the unpkg CDN `reference/support.js` boots from is reachable (an unreachable CDN means ten blank reference PNGs and a meaningless pass, so it fails early and says so), builds, then runs `pixel:ref`, `pixel:build`, `diff-pixels.mjs` and `check:hover` across 1280/1440/1600/1920. **mobile** builds and runs `check:mobile` at the phone widths, which have no canvas to diff against. **hydration** builds and runs `check:hydration`. |
| `dependabot.yml` | weekly, Monday 06:00 Asia/Shanghai | npm and github-actions updates, grouped so version-locked things move as one PR: react + react-dom + their `@types`; react-router on its own; build tooling at minor/patch only, so a Vite or Tailwind major arrives as its own reviewable PR; and the pixel harness (playwright + pixelmatch + pngjs), which has to move as a set or `diff-pixels.mjs` breaks on a mismatched pair. `@types/node` majors are ignored — Node 20 is what the workflows run and what `engines` declares. |

**On failure, `pixel.yml` uploads the images.** The `pixel-diff` artifact
(7-day retention) carries `.pixel/diff/`, `.pixel/ref/` and `.pixel/build/`, so
a red run is diagnosable by download: the diff PNG lights up exactly the pixels
that moved, and the ref and build shots are there to compare by eye when it is
not obvious which side is wrong. Both gates run on pull requests, so a change
that moves a pixel or breaks hydration goes red before review rather than after
deploy.

## Gotchas

**Re-running the importer is safe, and does nothing to `src/`.**
`scripts/from-design.mjs` deletes and rebuilds `.design-import/` and touches
nothing else. Curated work in `src/` is never at risk. The corollary is that it
also does not *propagate* a canvas change into `src/` — after a canvas update,
re-run it and diff `.design-import/` against `src/` by hand.

**The frame assertion in `from-design.mjs` is there for a reason.** It requires
the children of the root div to be exactly `div, header, main, section, footer,
sc-if`, positionally, with nothing left over. An earlier version picked the
frame parts out by tag name and silently dropped the site-wide CTA band that
sits between `main` and `footer` — which cost every single page 261 px, produced
perfectly valid-looking output, and was caught only by the pixel diff. If the
canvas grows a new frame part, the script now throws and tells you to add it to
`FRAME` and give it a component, instead of letting it vanish.

**An unnamed hover throws too.** A `style-hover` or `style-focus` value not in
`HOVER_NAMES` / `FOCUS_NAMES` stops the transpile rather than silently losing an
interaction.

**Never give the build capture an SPA fallback.** `DIR=dist SPA=1` against
prerendered output turns a missing route into a screenshot of the home page,
which diffs clean. The default is off; `SPA=1` is only for `build:spa` output.

**`.pixel/` and `.design-import/` are gitignored.** Both are large regenerated
output. If a diff directory looks empty, that is the pass state, not a missing
run.

**The browser is resolved in three steps**, by `browser()` in
`scripts/pixel-lib.mjs`: `CHROME_PATH` if it is set, else Playwright's own
bundled Chromium, else the first path that exists in `SYSTEM_CHROME`
(`/usr/bin/google-chrome-stable` and four siblings), with a line printed saying
which. CI installs the Playwright browser and so takes the second branch, which
is what keeps its screenshots comparable from run to run; a dev box whose
Playwright cache predates the installed package falls through to system Chrome
instead of failing. If none of the three works the error names both fixes rather
than surfacing Playwright's.

**The copyright year is a build-time define, and the shape of the expression is
load-bearing.** `__BUILD_YEAR__` is defined in `vite.config.ts` for both the
client and the SSR build, and `src/components/SiteFooter.tsx` consumes it in the
legal strip. Defining it for both builds is what stops the prerendered year and
the hydrated year disagreeing — a mismatch React would resolve by throwing the
prerendered DOM away.

How it is written matters just as much:

```tsx
<span>{`© ${__BUILD_YEAR__} BACHAR SOURCING · GUANGZHOU · YIWU · SHENZHEN`}</span>
```

One template literal — deliberately **not** the obvious
`© {__BUILD_YEAR__} BACHAR…`. That form splits the line into three DOM text
nodes, and Chrome antialiases across a text-node boundary differently enough
that the strip moved two pixels. Two pixels, on every page of the site. The
pixel diff caught it and nothing else would have; it is also the concrete reason
`diff-pixels.mjs` sets `includeAA: true`, because pixelmatch's default would
have classified those pixels as antialiasing and waved them through.

The comment above that line in `SiteFooter.tsx` exists to stop the next person
tidying it back into JSX interpolation. Leave it there.
