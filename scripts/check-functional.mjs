// The behaviour gate.
//
// Every other check in scripts/ is about how the site LOOKS: the pixel diff
// against the canvas, hover and focus colours, the phone layout, the hydrated
// DOM against the prerendered one. None of them can see whether it WORKS — a
// quote form that shows "Got it" while its POST goes nowhere passes all of
// them, and so does a footer link that lands on the right page at the wrong
// height, or a WeChat button that copies nothing. This drives the built site
// the way a visitor does and asserts on what happens:
//
//    1. The quote form sends exactly one JSON POST to FORM_ENDPOINT carrying
//       what was typed and formType 'china-guy-quote', never the honeypot;
//       says "Sending…" (aria-busy) while it waits; ignores a second submit;
//       then shows the confirmation panel and moves focus to it.
//    2. A failed send (500, or no network at all) keeps everything typed and
//       raises a role="alert" whose WhatsApp and email links carry the same
//       enquiry, pre-written; a correction typed afterwards reaches them; and
//       "Try again" sends it.
//    3. An incomplete form sends nothing. A filled honeypot sends nothing and
//       shows the success panel, as a bot expects.
//    4. The WhatsApp pill and the /contact WhatsApp row open wa.me in a new tab
//       with the number from site.ts; the email row is a mailto:; the WeChat
//       pill lands on /contact/#wechat with the row in view; the WeChat button
//       really copies the ID and says COPIED, then goes back to COPY ID.
//    5. Fragment links land on their block below the sticky header — from
//       another page, on the same page and on a cold load — and focus it; a
//       plain navigation still starts at the top.
//    6. Every internal <a href> in every dist/**/*.html is in the slashed
//       directory form GitHub Pages serves without a redirect, resolves to a
//       file in dist/, and names a fragment that exists on its target page.
//       No href="#" anywhere; every target=_blank carries rel=noopener.
//    7. On every route: no request leaves the origin (no Google Fonts, nothing
//       third-party), the three families are loaded from same-origin files,
//       no font file is fetched twice, and nothing throws or logs an error.
//    8. Every route's og:image is a 1200×630 PNG in dist/, guides are
//       og:type=article, privacy/terms/mobile/404 are noindex and everything
//       else is indexable, the canonical is the slashed URL, and every JSON-LD
//       block parses.
//    9. Using / and /contact/ — the form, the pills, the copy button — leaves
//       no cookie and nothing in localStorage, sessionStorage or IndexedDB,
//       which is what the privacy page promises.
//   10. No page shows the word "placeholder"; /guides/ lists and links all
//       three guides; the footer's "Guides" link reaches /guides/.
//
// ── It never sends an enquiry ────────────────────────────────────────────────
//
// FORM_ENDPOINT is read from src/lib/site.ts the way pixel-lib reads the
// contact data. Every page that submits routes that host with page.route() and
// answers locally — success, a 500 or an aborted connection, as the check
// needs. Everything else is the net: pixel-lib's browser() aborts any
// form-host request no script routed and maps the host to NOTFOUND at the
// resolver; on top of that every context here aborts every request that is not
// to the local server. The last line of the run then asserts that every
// request the pages made to the form host was one a mock here answered — a
// request that only the safety net caught still fails the run, because it
// means a check submitted something it did not mean to.
//
// Needs `npm run build` (not build:spa): the static checks read the per-route
// HTML, and the route list is dist/ itself, cross-checked against the route
// table in .ssr/entry-server.js.
//
//   node scripts/check-functional.mjs
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'parse5'
import { serve, browser, settle, isFormRequest, formEndpoint } from './pixel-lib.mjs'

const PORT = 4630
const DIST = 'dist'
const BASE = `http://127.0.0.1:${PORT}`
const VIEWPORT = { width: 1440, height: 900 }

// ─── Inputs ──────────────────────────────────────────────────────────────────

if (!fs.existsSync(`${DIST}/404.html`)) {
  throw new Error(`${DIST}/ is not prerendered — there is no 404.html. Run \`npm run build\`, not \`build:spa\`.`)
}
if (!fs.existsSync('.ssr/entry-server.js')) {
  throw new Error('.ssr/entry-server.js is missing — run `npm run build`.')
}

/**
 * A single-quoted string constant out of a TypeScript source, by regex — the
 * same rule pixel-lib uses for site.ts, because these scripts are plain Node.
 * Throws with the reason rather than falling back.
 */
function tsConst(file, name) {
  const m = new RegExp(`export const ${name}(?:\\s*:\\s*string)?\\s*=\\s*'([^']*)'`).exec(fs.readFileSync(file, 'utf8'))
  if (!m) throw new Error(`${file} does not export ${name} as a single-quoted string literal; check-functional.mjs reads it from there.`)
  return m[1]
}

/** Read from src/lib/site.ts; throws with the reason if it is not there. */
const FORM_ENDPOINT = formEndpoint()
const CONTACT_PHONE = tsConst('src/lib/site.ts', 'CONTACT_PHONE')
const CONTACT_EMAIL = tsConst('src/lib/site.ts', 'CONTACT_EMAIL')
const CONTACT_WECHAT = tsConst('src/lib/site.ts', 'CONTACT_WECHAT')
const ORIGIN = tsConst('src/lib/site.ts', 'ORIGIN')
const WHATSAPP_DIGITS = CONTACT_PHONE.replace(/\D/g, '')
const HONEYPOT = tsConst('src/lib/contact.ts', 'HONEYPOT_FIELD')

/**
 * What the collector's inbox filters this site's enquiries by. Written out
 * rather than read from contact.ts on purpose: it is a contract with the shared
 * inbox, and a change to it should fail here rather than follow along.
 */
const FORM_TYPE = 'china-guy-quote'

const { paths, seoRoutes } = await import(pathToFileURL(path.resolve('.ssr/entry-server.js')).href)

const slashed = p => (p === '/' ? '/' : `${p.replace(/\/+$/, '')}/`)

/** Every route prerender.mjs wrote: `dist/pricing/index.html` is `/pricing/`. */
function prerenderedRoutes(root) {
  const out = []
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name.startsWith('.') || (rel === '' && ['assets', 'fonts', 'og'].includes(e.name))) continue
        walk(rel ? `${rel}/${e.name}` : e.name)
      } else if (e.name === 'index.html') {
        out.push(rel ? `/${rel}/` : '/')
      }
    }
  }
  walk('')
  return out.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
}

const ROUTES = prerenderedRoutes(DIST)
{
  const table = paths.map(slashed).sort()
  const walked = [...ROUTES].sort()
  const missing = table.filter(p => !walked.includes(p))
  const extra = walked.filter(p => !table.includes(p))
  if (missing.length || extra.length) {
    throw new Error(
      `dist/ and the route table disagree — missing from dist/: ${missing.join(', ') || 'none'}; ` +
      `in dist/ but not in ROUTES: ${extra.join(', ') || 'none'}. Rebuild.`
    )
  }
}
/** Every page a visitor can land on, as URL paths on the local server. */
const PAGES = [...ROUTES, '/404.html']

/** A route file on disk, for a slashed path or the 404. */
const fileFor = p => (p.endsWith('.html') ? path.join(DIST, p) : path.join(DIST, p, 'index.html'))

/** The three guides: the routes the table marks as articles, i.e. /guides/<slug>/. */
const GUIDE_ROUTES = ROUTES.filter(r => /^\/guides\/[^/]+\/$/.test(r))

// ─── Reporting ───────────────────────────────────────────────────────────────

let failed = 0
let passed = 0

class CheckError extends Error {}
function assert(cond, msg) {
  if (!cond) throw new CheckError(msg)
}

/** Run one check and print one line for it. A thrown CheckError is the reason. */
async function check(name, fn) {
  try {
    const note = await fn()
    passed++
    console.log(`  ok    ${name}${note ? ` — ${note}` : ''}`)
  } catch (err) {
    failed++
    const reason = err instanceof CheckError ? err.message : `${err.name}: ${err.message.split('\n')[0]}`
    console.log(`  FAIL  ${name} — ${reason}`)
  }
}

/** Several problems in one line: the first few, and how many more. */
const summarise = (problems, n = 4) =>
  problems.slice(0, n).join('; ') + (problems.length > n ? `; … ${problems.length - n} more` : '')

// ─── Browser and network ─────────────────────────────────────────────────────

const server = await serve(DIST, PORT)
const b = await browser()

/** Every request any page made to the form backend's host… */
const formSeen = []
/** …and the ones a mock in this file answered locally. Must end up equal. */
const formAnswered = new Set()
/** Requests to anywhere but the local server, other than the form host. */
const thirdParty = []

const isLocal = url => {
  try { return new URL(String(url)).origin === BASE } catch { return false }
}

const contexts = []

/**
 * A fresh context (so no check inherits another's cookies, storage or
 * clipboard). pixel-lib's browser() has already installed its form-host abort
 * on it; this adds the rest of the net — every request that is not to the
 * local server and not to the form host is recorded and aborted, so nothing
 * here reaches the internet — and the bookkeeping for the final leak check.
 */
async function newContext(options = {}) {
  const ctx = await b.newContext({ viewport: VIEWPORT, ...options })
  contexts.push(ctx)
  ctx.on('request', req => {
    const url = req.url()
    if (isFormRequest(url)) formSeen.push(req)
    else if (!isLocal(url) && !url.startsWith('data:') && !url.startsWith('blob:')) thirdParty.push(url)
  })
  await ctx.route(url => !isLocal(url) && !isFormRequest(url), route => route.abort('blockedbyclient'))
  return ctx
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
}

/**
 * Answer the page's requests to the form host locally. `mode()` is read per
 * request, so a check can switch from failing to succeeding mid-flight to
 * test "Try again". `gate`, when set, holds the response until it resolves —
 * that is how the pending state is observed. Returns the log of non-preflight
 * requests: method, URL, headers and body.
 */
async function mockForm(page, { mode = () => 'ok', gate = null } = {}) {
  const log = []
  await page.route(url => isFormRequest(url), async route => {
    const req = route.request()
    formAnswered.add(req)
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    log.push({ method: req.method(), url: req.url(), headers: await req.allHeaders(), body: req.postData() })
    if (gate) await gate
    const m = mode()
    if (m === 'abort') return route.abort('connectionfailed')
    if (m === 'error') return route.fulfill({ status: 500, contentType: 'application/json', headers: CORS, body: '{"error":"mocked"}' })
    return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"ok":true}' })
  })
  return log
}

/** Load a path and wait for React to have hydrated it and the fonts to be in. */
async function open(page, url) {
  await page.goto(BASE + url, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__hydrated === true, null, { timeout: 15_000 })
    .catch(() => { throw new CheckError(`${url} never hydrated (window.__hydrated was not set)`) })
  await settle(page)
  return page
}

const pause = ms => new Promise(r => setTimeout(r, ms))

// ─── The quote form ──────────────────────────────────────────────────────────

/** What the checks type. Keys are the controls' `name`s — the POST's keys. */
const ENQUIRY = {
  name: 'Functional Check',
  company: 'check-functional.mjs',
  email: 'functional-check@example.com',
  destination: 'Nowhere',
  need: "Audit a factory I'm considering",
  quantity: '12 units',
  'target-price': 'n/a',
  product: 'Automated behaviour check.\nIntercepted locally — never sent.',
}
const REQUIRED = ['name', 'email', 'product']

async function fillForm(page, fields) {
  for (const [name, value] of Object.entries(fields)) {
    const control = page.locator(`form [name="${name}"]`)
    assert(await control.count() === 1, `the form has ${await control.count()} controls named "${name}", expected one`)
    if (name === 'need') await control.selectOption({ label: value })
    else await control.fill(value)
  }
}

const SUBMIT = 'form button[type="submit"]'
const CONFIRM_TEXT = "Got it — it's on my desk."

/** The form's current values, by control name. */
const formValues = page => page.evaluate(() => {
  const form = document.querySelector('form')
  if (!form) return null
  return Object.fromEntries([...form.elements].filter(e => e.name).map(e => [e.name, e.value]))
})

const crlf = s => String(s).replace(/\r\n/g, '\n')

/** What a POST body must say, given what was typed. Returns problems. */
function bodyProblems(entry, typed) {
  const problems = []
  if (entry.method !== 'POST') problems.push(`method ${entry.method}`)
  if (entry.url !== FORM_ENDPOINT) problems.push(`URL ${entry.url}, expected ${FORM_ENDPOINT}`)
  const type = entry.headers['content-type'] || ''
  if (!/^application\/json\b/i.test(type)) problems.push(`Content-Type ${JSON.stringify(type)}, expected application/json`)
  let body
  try { body = JSON.parse(entry.body ?? '') } catch {
    problems.push(`body is not JSON: ${String(entry.body).slice(0, 80)}`)
    return problems
  }
  if (body.formType !== FORM_TYPE) problems.push(`formType ${JSON.stringify(body.formType)}, expected ${JSON.stringify(FORM_TYPE)}`)
  if (HONEYPOT in body) problems.push(`the honeypot field "${HONEYPOT}" was sent`)
  for (const [k, v] of Object.entries(typed)) {
    if (crlf(body[k]) !== crlf(v)) problems.push(`${k} is ${JSON.stringify(body[k])}, typed ${JSON.stringify(v)}`)
  }
  return problems
}

/** The alert's fallback links, parsed. */
async function fallbackLinks(page) {
  const links = await page.evaluate(() => {
    const alert = document.querySelector('[role="alert"]')
    const a = sel => alert?.querySelector(sel)
    const wa = a('a[href^="https://wa.me/"]')
    const mail = a('a[href^="mailto:"]')
    return {
      alertText: alert?.textContent?.trim() || '',
      wa: wa && { href: wa.getAttribute('href'), target: wa.target, rel: wa.rel },
      mail: mail && { href: mail.getAttribute('href') },
      retry: !!alert?.querySelector('button[type="submit"]'),
    }
  })
  const out = { ...links, waText: null, mailSubject: null, mailBody: null, waDigits: null, mailTo: null }
  if (links.wa) {
    const u = new URL(links.wa.href)
    out.waDigits = u.pathname.slice(1)
    out.waText = u.searchParams.get('text')
  }
  if (links.mail) {
    const u = new URL(links.mail.href)
    out.mailTo = decodeURIComponent(u.pathname)
    out.mailSubject = u.searchParams.get('subject')
    out.mailBody = u.searchParams.get('body')
  }
  return out
}

/** Problems with the fallback links, given what the form holds. */
function fallbackProblems(f, typed) {
  const problems = []
  if (!f.wa) return ['the alert has no wa.me link']
  if (!f.mail) return ['the alert has no mailto: link']
  if (f.waDigits !== WHATSAPP_DIGITS) problems.push(`wa.me number ${f.waDigits}, expected ${WHATSAPP_DIGITS}`)
  if (f.wa.target !== '_blank' || !/\bnoopener\b/.test(f.wa.rel)) problems.push(`wa.me link target=${f.wa.target} rel=${f.wa.rel}`)
  if (f.mailTo !== CONTACT_EMAIL) problems.push(`mailto: address ${f.mailTo}, expected ${CONTACT_EMAIL}`)
  if (!f.mailSubject) problems.push('mailto: has no subject')
  else if (!f.mailSubject.includes(typed.name)) problems.push(`mailto: subject ${JSON.stringify(f.mailSubject)} does not name ${typed.name}`)
  if (!f.mailBody) problems.push('mailto: has no body')
  // Every typed value, line by line (the spec keeps its own line breaks; the
  // one-line fields are whitespace-collapsed into "Label: value").
  const wanted = Object.values(typed).flatMap(v => crlf(v).split('\n')).map(s => s.trim()).filter(Boolean)
  for (const [label, text] of [['WhatsApp text', f.waText], ['email body', f.mailBody]]) {
    if (!text) { problems.push(`${label} is empty`); continue }
    const missing = wanted.filter(v => !crlf(text).includes(v))
    if (missing.length) problems.push(`${label} is missing ${missing.map(v => JSON.stringify(v)).join(', ')}`)
  }
  return problems
}

async function waitForConfirmation(page) {
  await page.waitForFunction(t => {
    const s = document.querySelector('[role="status"][tabindex="-1"]')
    return !!s && s.textContent.includes(t)
  }, CONFIRM_TEXT, { timeout: 10_000 }).catch(() => { throw new CheckError(`the confirmation panel ("${CONFIRM_TEXT}") never appeared`) })
}

await check('quote form sends one JSON POST, shows Sending…, then the focused confirmation', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  let release
  const gate = new Promise(r => { release = r })
  const log = await mockForm(page, { gate })
  await open(page, '/contact/')
  const typed = Object.fromEntries(['name', 'email', 'product', 'company', 'need', 'quantity'].map(k => [k, ENQUIRY[k]]))
  await fillForm(page, typed)
  await page.locator(SUBMIT).first().click()

  // Pending: the response is held until the state has been read.
  await page.waitForFunction(() => document.querySelector('form button[type="submit"]')?.textContent.includes('Sending…'), null, { timeout: 5000 })
    .catch(() => { throw new CheckError('the submit button never said "Sending…" while the POST was in flight') })
  const pending = await page.evaluate(() => {
    const btn = document.querySelector('form button[type="submit"]')
    return {
      busy: btn.getAttribute('aria-busy'),
      disabled: btn.getAttribute('aria-disabled'),
      readOnly: document.querySelector('form [name="name"]').readOnly,
    }
  })
  assert(pending.busy === 'true', `aria-busy is ${JSON.stringify(pending.busy)} while sending, expected "true"`)
  assert(pending.disabled === 'true', `aria-disabled is ${JSON.stringify(pending.disabled)} while sending, expected "true"`)
  assert(pending.readOnly, 'the name field is editable while sending')
  // A second click, and Enter in a field, while the first is in flight.
  await page.evaluate(() => document.querySelector('form button[type="submit"]').click())
  await page.evaluate(() => document.querySelector('form').requestSubmit())
  await pause(300)
  assert(log.length === 1, `${log.length} POSTs while the first was pending — a second submit was not ignored`)

  release()
  await waitForConfirmation(page)
  await pause(300)
  assert(log.length === 1, `expected exactly one POST to ${FORM_ENDPOINT}, saw ${log.length}`)
  const problems = bodyProblems(log[0], typed)
  assert(!problems.length, `the POST is wrong: ${summarise(problems)}`)
  const focused = await page.evaluate(() => {
    const el = document.activeElement
    return { role: el?.getAttribute('role'), text: (el?.textContent || '').slice(0, 40) }
  })
  assert(focused.role === 'status' && focused.text.includes('Got it'), `focus is on ${JSON.stringify(focused)}, not the confirmation panel`)
  assert(!(await page.locator('form').count()), 'the form is still on screen after a successful send')
  await ctx.close()
  return `1 POST, application/json, formType ${FORM_TYPE}, ${Object.keys(typed).length} typed fields carried, no "${HONEYPOT}"`
})

await check('a 500 keeps the form, raises an alert with pre-filled wa.me and mailto:, and Try again sends', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  let mode = 'error'
  const log = await mockForm(page, { mode: () => mode })
  await open(page, '/contact/')
  await fillForm(page, ENQUIRY)
  await page.locator(SUBMIT).first().click()
  await page.waitForFunction(() => !!document.querySelector('[role="alert"] a[href^="https://wa.me/"]'), null, { timeout: 10_000 })
    .catch(() => { throw new CheckError('no role="alert" with a wa.me link appeared after the 500') })

  const kept = await formValues(page)
  const lost = Object.entries(ENQUIRY).filter(([k, v]) => crlf(kept?.[k]) !== crlf(v)).map(([k]) => k)
  assert(!lost.length, `the form lost what was typed in: ${lost.join(', ')}`)
  const f = await fallbackLinks(page)
  const problems = fallbackProblems(f, ENQUIRY)
  assert(!problems.length, summarise(problems))
  assert(f.retry, 'the alert has no "Try again" submit button')

  // A correction typed after the failure is what the fallbacks now carry.
  await page.locator('form [name="company"]').fill('Corrected Co')
  await page.waitForFunction(() => {
    const a = document.querySelector('[role="alert"] a[href^="https://wa.me/"]')
    return !!a && new URL(a.href).searchParams.get('text').includes('Corrected Co')
  }, null, { timeout: 3000 }).catch(() => { throw new CheckError('a correction typed after the failure never reached the WhatsApp message') })

  mode = 'ok'
  await page.locator('[role="alert"] button[type="submit"]').click()
  await waitForConfirmation(page)
  await pause(300)
  assert(log.length === 2, `expected 2 POSTs (the failure and the retry), saw ${log.length}`)
  const retry = bodyProblems(log[1], { ...ENQUIRY, company: 'Corrected Co' })
  assert(!retry.length, `the retry POST is wrong: ${summarise(retry)}`)
  await ctx.close()
  return `values kept, wa.me/${WHATSAPP_DIGITS} and mailto: carry all ${Object.keys(ENQUIRY).length} fields, correction followed, retry delivered`
})

await check('a network failure raises the same alert and keeps the form', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  const log = await mockForm(page, { mode: () => 'abort' })
  await open(page, '/contact/')
  await fillForm(page, ENQUIRY)
  await page.locator(SUBMIT).first().click()
  await page.waitForFunction(() => !!document.querySelector('[role="alert"] a[href^="https://wa.me/"]'), null, { timeout: 20_000 })
    .catch(() => { throw new CheckError('no role="alert" with a wa.me link appeared after the connection failed') })
  const kept = await formValues(page)
  const lost = Object.entries(ENQUIRY).filter(([k, v]) => crlf(kept?.[k]) !== crlf(v)).map(([k]) => k)
  assert(!lost.length, `the form lost what was typed in: ${lost.join(', ')}`)
  const problems = fallbackProblems(await fallbackLinks(page), ENQUIRY)
  assert(!problems.length, summarise(problems))
  assert(log.length === 1, `expected 1 attempted POST, saw ${log.length}`)
  assert(!(await page.locator('[role="status"][tabindex="-1"]').count()), 'the success panel appeared although nothing was delivered')
  await ctx.close()
  return 'aborted connection → alert with both fallbacks, nothing lost'
})

await check('an incomplete form sends nothing', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  const log = await mockForm(page)
  await open(page, '/contact/')
  await page.locator(SUBMIT).first().click()
  await pause(500)
  const empty = await page.evaluate(n => ({
    invalid: document.querySelector('form [name="name"]').matches(':invalid'),
    required: [...document.querySelectorAll('form [required]')].map(e => e.name).sort(),
    alert: document.querySelector('[role="alert"]')?.textContent.trim() || '',
    form: !!document.querySelector('form'),
  }), null)
  assert(log.length === 0, `an empty form sent ${log.length} request(s)`)
  assert(empty.form && empty.invalid, 'the empty form did not stay on screen, invalid')
  assert(JSON.stringify(empty.required) === JSON.stringify([...REQUIRED].sort()),
    `required fields are ${empty.required.join(', ')}, expected ${[...REQUIRED].sort().join(', ')}`)
  assert(!empty.alert, `an empty submit raised the failure alert: ${empty.alert.slice(0, 60)}`)
  // Two of the three required fields: still nothing.
  await fillForm(page, { name: ENQUIRY.name, email: ENQUIRY.email })
  await page.locator(SUBMIT).first().click()
  await pause(500)
  assert(log.length === 0, `a form without its specification sent ${log.length} request(s)`)
  await ctx.close()
  return `empty and partly-filled submits blocked; required = ${REQUIRED.join(', ')}`
})

await check('a filled honeypot sends nothing and shows success', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  const log = await mockForm(page)
  await open(page, '/contact/')
  const trap = await page.evaluate(name => {
    const el = document.querySelector(`form [name="${name}"]`)
    if (!el) return null
    const out = { tabIndex: el.tabIndex, hidden: !!el.closest('[aria-hidden="true"]') }
    el.value = 'https://spam.example'
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return out
  }, HONEYPOT)
  assert(trap, `the form has no honeypot field named "${HONEYPOT}"`)
  assert(trap.tabIndex === -1 && trap.hidden, `the honeypot is reachable: tabIndex ${trap.tabIndex}, inside aria-hidden ${trap.hidden}`)
  await fillForm(page, Object.fromEntries(REQUIRED.map(k => [k, ENQUIRY[k]])))
  await page.locator(SUBMIT).first().click()
  await waitForConfirmation(page)
  await pause(500)
  assert(log.length === 0, `a trapped submission sent ${log.length} request(s)`)
  await ctx.close()
  return 'no request, confirmation shown'
})

// ─── Tap to contact ──────────────────────────────────────────────────────────

/** Problems with a link that should open a WhatsApp chat in a new tab. */
function waProblems(a, where) {
  if (!a) return [`${where}: no wa.me link`]
  const problems = []
  const u = new URL(a.href)
  if (u.protocol !== 'https:' || u.host !== 'wa.me') problems.push(`${where}: ${a.href} is not https://wa.me/`)
  if (u.pathname !== `/${WHATSAPP_DIGITS}`) problems.push(`${where}: number ${u.pathname.slice(1)}, expected ${WHATSAPP_DIGITS} (${CONTACT_PHONE})`)
  if (a.target !== '_blank') problems.push(`${where}: target=${JSON.stringify(a.target)}, expected _blank`)
  if (!/\bnoopener\b/.test(a.rel)) problems.push(`${where}: rel=${JSON.stringify(a.rel)} lacks noopener`)
  return problems
}

const linkInfo = (page, sel) => page.evaluate(s => {
  const a = document.querySelector(s)
  return a && { href: a.getAttribute('href'), target: a.target, rel: a.rel, text: a.textContent.trim() }
}, sel)

/**
 * A predicate for waitForFunction: true once `sel` exists and its top has not
 * moved since the previous poll. Synchronous on purpose — waitForFunction
 * treats a returned Promise as a truthy value and resolves on the first poll,
 * so an async "has it stopped?" predicate passes before anything has landed.
 * The previous reading is kept on window, keyed by selector.
 */
const STILL = ({ sel, inView }) => {
  const el = document.querySelector(sel)
  const memo = (window.__still ||= {})
  if (!el) { delete memo[sel]; return false }
  const r = el.getBoundingClientRect()
  // Three equal readings, two polls apart: a smooth scroll that had not quite
  // started at the first reading has moved by the third.
  const m = memo[sel] && memo[sel].top === r.top ? { top: r.top, n: memo[sel].n + 1 } : { top: r.top, n: 1 }
  memo[sel] = m
  if (m.n < 3) return false
  return !inView || (r.top >= 0 && r.bottom <= innerHeight)
}

/** Wait until an element is fully inside the viewport and has stopped moving. */
async function inViewAndStill(page, sel, timeout = 5000) {
  await page.evaluate(() => { window.__still = {} })
  return page.waitForFunction(STILL, { sel, inView: true }, { timeout, polling: 150 }).then(() => true, () => false)
}

/** Title per slashed path, from the route table: what Seo.tsx sets on arrival. */
const TITLES = new Map(seoRoutes.map(r => [slashed(r.path), r.title]))

/**
 * Wait for a client-side navigation to have ARRIVED, not merely started. The
 * router keeps the previous page mounted while the next page's lazy chunk
 * loads, so "there is a <main> h1" is already true of the page being left.
 * The URL and the new route's own title are both needed.
 */
async function arrived(page, p) {
  await page.waitForURL(BASE + p, { timeout: 5000 })
    .catch(() => { throw new CheckError(`expected to arrive at ${p}, the URL is ${page.url()}`) })
  const title = TITLES.get(p.split('#')[0])
  await page.waitForFunction(t => document.title === t, title, { timeout: 5000 })
    .catch(() => { throw new CheckError(`${p}: the title never became ${JSON.stringify(title)}`) })
}

await check('WhatsApp pill opens wa.me in a new tab; WeChat pill lands on the /contact/ WeChat row', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  await open(page, '/')
  const wa = await linkInfo(page, '[data-m~="pills"] a[href^="https://wa.me/"]')
  const problems = waProblems(wa, 'WhatsApp pill')
  assert(!problems.length, summarise(problems))
  const wc = page.locator('[data-m~="pills"] a[href="/contact/#wechat"]')
  assert(await wc.count() === 1, 'no WeChat pill linking to /contact/#wechat')
  await wc.click()
  await arrived(page, '/contact/#wechat')
  assert(await inViewAndStill(page, '#wechat'), 'after the WeChat pill, the #wechat row is not fully in view')
  await ctx.close()
  return `wa.me/${WHATSAPP_DIGITS}, target=_blank, rel=noopener; #wechat in view`
})

await check('/contact/ rows: WhatsApp → wa.me, email → mailto:, cold #wechat in view', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  await open(page, '/contact/')
  const problems = waProblems(await linkInfo(page, 'main a[href^="https://wa.me/"]'), 'WhatsApp row')
  const mail = await linkInfo(page, 'main a[href^="mailto:"]')
  if (!mail) problems.push('no mailto: link in the contact rows')
  else if (mail.href !== `mailto:${CONTACT_EMAIL}`) problems.push(`email row is ${mail.href}, expected mailto:${CONTACT_EMAIL}`)
  assert(!problems.length, summarise(problems))
  const cold = await ctx.newPage()
  await open(cold, '/contact/#wechat')
  assert(await inViewAndStill(cold, '#wechat'), 'a cold load of /contact/#wechat does not show the WeChat row')
  await ctx.close()
  return `mailto:${CONTACT_EMAIL}`
})

await check('WeChat button copies the ID, says COPIED, then COPY ID again', async () => {
  const ctx = await newContext()
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
  const page = await ctx.newPage()
  await open(page, '/contact/')
  const label = () => page.evaluate(() => {
    const row = document.getElementById('wechat')
    const spans = [...row.querySelectorAll(':scope > span')].filter(s => !s.getAttribute('role'))
    return spans.map(s => s.textContent.trim()).join('|')
  })
  assert(await label() === 'COPY ID', `the WeChat row's label reads ${JSON.stringify(await label())} before any click, expected COPY ID`)
  await page.evaluate(() => navigator.clipboard.writeText('(clipboard before the click)'))
  await page.locator('#wechat button').click()
  const t0 = Date.now()
  await page.waitForFunction(() => document.getElementById('wechat').textContent.includes('COPIED'), null, { timeout: 3000 })
    .catch(() => { throw new CheckError('the label never changed to COPIED') })
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  assert(clip === CONTACT_WECHAT, `the clipboard holds ${JSON.stringify(clip)}, expected ${JSON.stringify(CONTACT_WECHAT)}`)
  const status = await page.evaluate(() => document.querySelector('#wechat [role="status"]')?.textContent.trim())
  assert(status === 'WeChat ID copied.', `the live region says ${JSON.stringify(status)}`)
  await page.waitForFunction(() => /COPY ID/.test(document.getElementById('wechat').textContent), null, { timeout: 6000 })
    .catch(() => { throw new CheckError('the label never went back to COPY ID') })
  const back = Date.now() - t0
  await ctx.close()
  return `clipboard = ${CONTACT_WECHAT}, back to COPY ID after ~${Math.round(back / 100) / 10}s`
})

// ─── Fragment navigation ─────────────────────────────────────────────────────

/**
 * Where an element sits relative to the sticky masthead, once it has stopped
 * moving (a same-page jump is smooth). `clear` is how far below the header's
 * bottom edge its top is: negative means it is hidden under the header.
 */
async function landing(page, id) {
  await page.evaluate(() => { window.__still = {} })
  const stable = await page.waitForFunction(STILL, { sel: `#${id}`, inView: false }, { timeout: 6000, polling: 150 })
    .then(() => true, () => false)
  assert(stable, `#${id} never appeared or never stopped moving`)
  return page.evaluate(i => {
    const el = document.getElementById(i)
    const r = el.getBoundingClientRect()
    const h = document.querySelector('header')
    const hs = h && getComputedStyle(h).position
    const headerBottom = h && (hs === 'sticky' || hs === 'fixed') ? Math.max(0, h.getBoundingClientRect().bottom) : 0
    return {
      top: r.top, clear: r.top - headerBottom, headerBottom, vh: innerHeight,
      focused: document.activeElement === el, scrollY,
    }
  }, id)
}

/** Problems with a landing on #id: hidden under the header, off-screen, or unfocused. */
function landingProblems(l, id, { focus = true } = {}) {
  const problems = []
  if (l.clear < -0.5) problems.push(`#${id}'s top is ${Math.round(-l.clear)}px under the sticky header`)
  if (l.clear > 48) problems.push(`#${id} is ${Math.round(l.clear)}px below the header — it did not land on the block`)
  if (l.top >= l.vh) problems.push(`#${id} is below the fold (top ${Math.round(l.top)})`)
  if (focus && !l.focused) problems.push(`#${id} did not take focus`)
  return problems
}

await check('footer "Freight & shipping" from / lands on /services/#freight below the sticky header', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  await open(page, '/')
  const link = page.locator('footer a', { hasText: /^Freight & shipping$/ })
  assert(await link.count() === 1, `${await link.count()} footer links read "Freight & shipping"`)
  const href = await link.getAttribute('href')
  assert(href === '/services/#freight', `its href is ${href}, expected /services/#freight`)
  await link.scrollIntoViewIfNeeded()
  await link.click()
  await arrived(page, '/services/#freight')
  const l = await landing(page, 'freight')
  const problems = landingProblems(l, 'freight')
  assert(!problems.length, summarise(problems))
  await ctx.close()
  return `top ${Math.round(l.top)}px, ${Math.round(l.clear)}px below a ${Math.round(l.headerBottom)}px header, focused`
})

await check('a same-page fragment link on /services/ scrolls to its block', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  await open(page, '/services/')
  const link = page.locator('footer a', { hasText: /^Sourcing & vetting$/ })
  await link.scrollIntoViewIfNeeded()
  await link.click()
  await arrived(page, '/services/#sourcing')
  const l = await landing(page, 'sourcing')
  const problems = landingProblems(l, 'sourcing')
  assert(!problems.length, summarise(problems))
  await ctx.close()
  return `top ${Math.round(l.top)}px, ${Math.round(l.clear)}px below the header`
})

await check('a cold load of /services/#inspection lands on it', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  await open(page, '/services/#inspection')
  const l = await landing(page, 'inspection')
  // A cold load is the browser's own fragment jump; nothing moves focus.
  const problems = landingProblems(l, 'inspection', { focus: false })
  assert(!problems.length, summarise(problems))
  await ctx.close()
  return `top ${Math.round(l.top)}px, ${Math.round(l.clear)}px below the header`
})

await check('a plain navigation starts at the top of the next page', async () => {
  const ctx = await newContext()
  const page = await ctx.newPage()
  await open(page, '/services/#inspection')
  await landing(page, 'inspection')
  const from = await page.evaluate(() => scrollY)
  assert(from > 0, 'the setup did not scroll: /services/#inspection is at the top')
  await page.locator('header a[href="/pricing/"]').first().click()
  await arrived(page, '/pricing/')
  await pause(250)
  const after = await page.evaluate(() => ({ y: scrollY, focus: document.activeElement?.id }))
  assert(after.y === 0, `/pricing/ opened at scrollY ${after.y}, not 0`)
  // And from the very bottom of a long page, through the footer.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await page.locator('footer a', { hasText: /^About me$/ }).click()
  await arrived(page, '/about/')
  await pause(250)
  const about = await page.evaluate(() => ({ y: scrollY, focus: document.activeElement?.id }))
  assert(about.y === 0, `/about/ opened at scrollY ${about.y}, not 0`)
  assert(about.focus === 'main', `focus after the navigation is on #${about.focus}, expected #main`)
  await ctx.close()
  return `from scrollY ${Math.round(from)} → 0, and footer → /about/ at 0 with focus on <main>`
})

// ─── Static HTML: links ──────────────────────────────────────────────────────

function* walk(node) {
  yield node
  for (const c of node.childNodes || []) yield* walk(c)
  if (node.content) yield* walk(node.content)
}
const attr = (n, k) => n.attrs?.find(a => a.name === k)?.value
const textOf = n => [...walk(n)].filter(x => x.nodeName === '#text').map(x => x.value).join('')

/** Parsed once: every page's document, its ids, its anchors, its head. */
const DOCS = new Map(PAGES.map(p => {
  const doc = parse(fs.readFileSync(fileFor(p), 'utf8'))
  const nodes = [...walk(doc)]
  return [p, {
    nodes,
    ids: new Set(nodes.map(n => attr(n, 'id')).filter(Boolean)),
    anchors: nodes.filter(n => n.nodeName === 'a'),
  }]
}))

await check('every internal href is slashed, resolves in dist/ and names a fragment that exists', async () => {
  const problems = []
  let internal = 0, fragments = 0, external = 0
  for (const [page, { anchors, ids }] of DOCS) {
    for (const a of anchors) {
      const href = attr(a, 'href')
      const where = `${page} <a>${textOf(a).trim().slice(0, 30)}</a>`
      if (href == null) continue
      if (href === '#' || href === '') { problems.push(`${where} has href=${JSON.stringify(href)}`); continue }
      if (attr(a, 'target') === '_blank' && !/\bnoopener\b/.test(attr(a, 'rel') || '')) {
        problems.push(`${where} opens a new tab without rel=noopener`)
      }
      if (href.startsWith('#')) {
        fragments++
        if (!ids.has(decodeURIComponent(href.slice(1)))) problems.push(`${where} → ${href}: no such id on the page`)
        continue
      }
      if (/^(https?:|mailto:|tel:)/.test(href)) { external++; continue }
      if (!href.startsWith('/') || href.startsWith('//')) { problems.push(`${where} has an unexpected href ${href}`); continue }
      internal++
      const [pathAndQuery, hash] = href.split('#')
      const p = pathAndQuery.split('?')[0]
      if (path.extname(p)) {
        if (!fs.existsSync(path.join(DIST, p))) problems.push(`${where} → ${href}: no such file in dist/`)
        continue
      }
      if (!p.endsWith('/')) { problems.push(`${where} → ${href}: not the slashed form (Pages redirects it)`); continue }
      const target = DOCS.get(p)
      if (!target) { problems.push(`${where} → ${href}: no ${fileFor(p)}`); continue }
      if (hash) {
        fragments++
        if (!target.ids.has(decodeURIComponent(hash))) problems.push(`${where} → ${href}: ${p} has no id "${hash}"`)
      }
    }
  }
  assert(!problems.length, `${problems.length} bad link(s): ${summarise(problems)}`)
  return `${internal} internal, ${fragments} fragment, ${external} external links across ${DOCS.size} files`
})

await check('no href="#" in any page', async () => {
  const hits = []
  for (const [page, { anchors }] of DOCS) {
    const n = anchors.filter(a => attr(a, 'href') === '#').length
    if (n) hits.push(`${page} ×${n}`)
  }
  assert(!hits.length, `href="#" on ${hits.join(', ')}`)
  return `${DOCS.size} files`
})

// ─── Head: share cards, robots, JSON-LD ──────────────────────────────────────

/** Width and height from a PNG's IHDR, or null if the file is not a PNG. */
function pngSize(file) {
  const buf = fs.readFileSync(file)
  const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (buf.length < 24 || !buf.subarray(0, 8).equals(SIG) || buf.toString('latin1', 12, 16) !== 'IHDR') return null
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

/** noindex routes, by the route table; the 404 is always noindex. */
const NOINDEX = new Set([...seoRoutes.filter(r => !r.indexable).map(r => slashed(r.path)), '/404.html'])
/** The spec's own list, which the route table must agree with. */
const NOINDEX_EXPECTED = ['/privacy/', '/terms/', '/mobile/', '/404.html']

await check('head: og:image is a 1200×630 PNG, guides are articles, noindex where it should be, JSON-LD parses', async () => {
  const problems = []
  const missingNoindex = NOINDEX_EXPECTED.filter(p => !NOINDEX.has(p))
  if (missingNoindex.length) problems.push(`the route table indexes ${missingNoindex.join(', ')}`)
  assert(GUIDE_ROUTES.length === 3, `expected three guides under /guides/, dist/ has ${GUIDE_ROUTES.length}`)
  let blocks = 0
  for (const [page, { nodes }] of DOCS) {
    const meta = (kind, key) => nodes.filter(n => n.nodeName === 'meta' && attr(n, kind) === key).map(n => attr(n, 'content'))
    const robots = meta('name', 'robots')
    if (robots.length !== 1) problems.push(`${page}: ${robots.length} robots tags`)
    const noindex = /\bnoindex\b/.test(robots[0] || '')
    if (NOINDEX.has(page) !== noindex) problems.push(`${page}: robots "${robots[0]}", expected ${NOINDEX.has(page) ? 'noindex' : 'index'}`)

    for (const n of nodes.filter(x => x.nodeName === 'script' && attr(x, 'type') === 'application/ld+json')) {
      blocks++
      try { JSON.parse(textOf(n)) } catch (e) { problems.push(`${page}: a JSON-LD block does not parse (${e.message.slice(0, 60)})`) }
    }
    if (page === '/404.html') continue

    const canonical = nodes.find(n => n.nodeName === 'link' && attr(n, 'rel') === 'canonical')
    if (attr(canonical ?? {}, 'href') !== ORIGIN + page) problems.push(`${page}: canonical ${attr(canonical ?? {}, 'href')}, expected ${ORIGIN + page}`)

    const type = meta('property', 'og:type')[0]
    const wantType = GUIDE_ROUTES.includes(page) ? 'article' : 'website'
    if (type !== wantType) problems.push(`${page}: og:type ${type}, expected ${wantType}`)

    const images = meta('property', 'og:image')
    if (images.length !== 1) { problems.push(`${page}: ${images.length} og:image tags`); continue }
    const img = images[0]
    if (!img.startsWith(`${ORIGIN}/`)) { problems.push(`${page}: og:image ${img} is not on ${ORIGIN}`); continue }
    const file = path.join(DIST, new URL(img).pathname)
    if (!fs.existsSync(file)) { problems.push(`${page}: og:image ${new URL(img).pathname} is not in dist/`); continue }
    const size = pngSize(file)
    if (!size) problems.push(`${page}: ${new URL(img).pathname} is not a PNG`)
    else if (size.width !== 1200 || size.height !== 630) problems.push(`${page}: ${new URL(img).pathname} is ${size.width}×${size.height}`)
    const [w] = meta('property', 'og:image:width'), [h] = meta('property', 'og:image:height')
    if (w !== '1200' || h !== '630') problems.push(`${page}: og:image:width/height say ${w}×${h}`)
    const twitter = meta('name', 'twitter:image')[0]
    if (twitter !== img) problems.push(`${page}: twitter:image ${twitter} differs from og:image`)
  }
  assert(!problems.length, summarise(problems))
  return `${DOCS.size - 1} cards at 1200×630, ${GUIDE_ROUTES.length} articles, ${NOINDEX.size} noindex, ${blocks} JSON-LD blocks`
})

// ─── Every route in a browser: network, fonts, errors, copy ──────────────────

const GOOGLE_FONTS = /^https?:\/\/fonts\.(googleapis|gstatic)\.com\//
const FAMILIES = ['Instrument Serif', 'Archivo', 'JetBrains Mono']

const perRoute = { network: [], fonts: [], errors: [], placeholder: [] }
{
  const ctx = await newContext()
  for (const url of PAGES) {
    const page = await ctx.newPage()
    const requests = []
    const errors = []
    page.on('request', r => requests.push(r.url()))
    page.on('pageerror', e => errors.push(`uncaught ${e.message.split('\n')[0]}`))
    page.on('console', m => { if (m.type() === 'error') errors.push(`console.error ${m.text().slice(0, 100)}`) })
    try {
      await open(page, url)
    } catch (e) {
      perRoute.errors.push(`${url}: ${e.message.split('\n')[0]}`)
      await page.close()
      continue
    }
    await pause(200)

    const google = requests.filter(u => GOOGLE_FONTS.test(u))
    const offsite = requests.filter(u => !isLocal(u) && !u.startsWith('data:') && !u.startsWith('blob:'))
    if (google.length) perRoute.network.push(`${url}: ${google.length} request(s) to Google Fonts`)
    else if (offsite.length) perRoute.network.push(`${url}: ${offsite.length} off-site request(s), first ${offsite[0]}`)

    const fonts = await page.evaluate(families => {
      const loaded = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/['"]/g, ''))
      // Where each @font-face of those families points, resolved against its sheet.
      const srcs = []
      for (const sheet of document.styleSheets) {
        let rules
        try { rules = sheet.cssRules } catch { srcs.push({ family: '?', url: `unreadable sheet ${sheet.href}` }); continue }
        for (const rule of rules) {
          if (!(rule instanceof CSSFontFaceRule)) continue
          const family = rule.style.getPropertyValue('font-family').replace(/['"]/g, '').trim()
          for (const m of rule.style.getPropertyValue('src').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
            srcs.push({ family, url: new URL(m[1], sheet.href || location.href).href })
          }
        }
      }
      const files = performance.getEntriesByType('resource').map(e => e.name).filter(n => /\.(woff2?|ttf|otf)(\?|$)/.test(n))
      return { missing: families.filter(f => !loaded.includes(f)), srcs, files }
    }, FAMILIES)
    if (fonts.missing.length) perRoute.fonts.push(`${url}: not loaded: ${fonts.missing.join(', ')}`)
    const foreign = fonts.srcs.filter(s => FAMILIES.includes(s.family) && new URL(s.url).origin !== BASE)
    if (foreign.length) perRoute.fonts.push(`${url}: @font-face ${foreign[0].family} → ${foreign[0].url}`)
    if (!fonts.srcs.some(s => FAMILIES.includes(s.family))) perRoute.fonts.push(`${url}: no @font-face for the three families in any stylesheet`)
    const offFiles = fonts.files.filter(f => new URL(f).origin !== BASE)
    if (offFiles.length) perRoute.fonts.push(`${url}: font file from ${offFiles[0]}`)
    const counts = {}
    for (const f of requests.filter(u => /\.(woff2?|ttf|otf)(\?|$)/.test(u))) counts[f] = (counts[f] || 0) + 1
    const twice = Object.entries(counts).filter(([, n]) => n > 1)
    if (twice.length) perRoute.fonts.push(`${url}: ${path.basename(twice[0][0])} fetched ${twice[0][1]}× (a preload that does not match its @font-face)`)

    if (errors.length) perRoute.errors.push(`${url}: ${errors[0]}`)

    const shown = await page.evaluate(() => document.body.innerText)
    const m = /.{0,30}placeholder.{0,30}/i.exec(shown)
    if (m) perRoute.placeholder.push(`${url}: "${m[0].replace(/\s+/g, ' ').trim()}"`)
    await page.close()
  }
  await ctx.close()
}

await check('no request leaves the origin on any route (no Google Fonts, nothing third-party)', async () => {
  assert(!perRoute.network.length, summarise(perRoute.network))
  return `${PAGES.length} pages`
})

await check('Instrument Serif, Archivo and JetBrains Mono load from same-origin files, each fetched once', async () => {
  assert(!perRoute.fonts.length, summarise(perRoute.fonts))
  return `${PAGES.length} pages`
})

await check('every page loads with no uncaught error and no console error', async () => {
  assert(!perRoute.errors.length, summarise(perRoute.errors))
  return `${PAGES.length} pages`
})

await check('no page shows the word "placeholder"', async () => {
  // The hydrated page (above) and the prerendered HTML: what a crawler and a
  // visitor without JavaScript read. Hydration can discard server text it
  // disagrees with, so the live page alone could miss a word only the HTML
  // says. Text nodes only — an input's placeholder attribute is not copy.
  const problems = [...perRoute.placeholder]
  for (const [p, { nodes }] of DOCS) {
    for (const n of nodes) {
      if (n.nodeName !== '#text' || !/placeholder/i.test(n.value)) continue
      let el = n.parentNode
      while (el && !['script', 'style', 'template', 'head'].includes(el.nodeName)) el = el.parentNode
      if (!el) problems.push(`${p} (prerendered): "${n.value.trim().slice(0, 50)}"`)
    }
  }
  assert(!problems.length, summarise(problems))
  return `${PAGES.length} pages, live and prerendered`
})

// ─── Guides ──────────────────────────────────────────────────────────────────

await check('/guides/ lists and links all three guides; the footer "Guides" link reaches it', async () => {
  const index = DOCS.get('/guides/')
  assert(index, 'there is no /guides/ page')
  const main = index.nodes.find(n => n.nodeName === 'main')
  const linked = new Set([...walk(main)].filter(n => n.nodeName === 'a').map(n => attr(n, 'href')))
  const unlisted = GUIDE_ROUTES.filter(g => !linked.has(g))
  assert(!unlisted.length, `/guides/ does not link ${unlisted.join(', ')}`)

  const ctx = await newContext()
  const page = await ctx.newPage()
  await open(page, '/')
  const link = page.locator('footer a', { hasText: /^Guides$/ })
  assert(await link.count() === 1, `${await link.count()} footer links read "Guides"`)
  await link.scrollIntoViewIfNeeded()
  await link.click()
  await arrived(page, '/guides/')
  const live = await page.evaluate(() => [...document.querySelectorAll('main a')].map(a => a.getAttribute('href')))
  const missing = GUIDE_ROUTES.filter(g => !live.includes(g))
  assert(!missing.length, `after client-side navigation, /guides/ does not link ${missing.join(', ')}`)
  // And each guide is one click away and renders.
  for (const g of GUIDE_ROUTES) {
    await page.goto(`${BASE}/guides/`)
    await page.waitForFunction(() => window.__hydrated === true)
    await page.locator(`main h2 a[href="${g}"]`).first().click()
    await arrived(page, g)
    const h1 = await page.evaluate(() => document.querySelector('main h1')?.textContent.trim())
    assert(h1, `${g} rendered no <h1> after navigating from /guides/`)
  }
  await ctx.close()
  return GUIDE_ROUTES.join(', ')
})

// ─── Nothing stored ──────────────────────────────────────────────────────────

await check('using / and /contact/ leaves no cookie and nothing in web storage', async () => {
  const ctx = await newContext()
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
  const page = await ctx.newPage()
  await mockForm(page)
  await open(page, '/')
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await pause(200)
  // The pill to the contact page, client-side, then everything on it.
  await page.locator('[data-m~="pills"] a[href="/contact/#wechat"]').click()
  await arrived(page, '/contact/#wechat')
  await page.locator('#wechat button').click()
  await page.waitForFunction(() => document.getElementById('wechat').textContent.includes('COPIED'))
  await fillForm(page, ENQUIRY)
  await page.locator(SUBMIT).first().click()
  await waitForConfirmation(page)
  // And a cold load of both, in the same context.
  await open(page, '/contact/')
  await open(page, '/')

  const cookies = await ctx.cookies()
  const stored = await page.evaluate(async () => ({
    cookie: document.cookie,
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    idb: indexedDB.databases ? (await indexedDB.databases()).map(d => d.name) : [],
  }))
  const problems = []
  if (cookies.length) problems.push(`cookies: ${cookies.map(c => c.name).join(', ')}`)
  if (stored.cookie) problems.push(`document.cookie: ${stored.cookie}`)
  if (stored.local.length) problems.push(`localStorage: ${stored.local.join(', ')}`)
  if (stored.session.length) problems.push(`sessionStorage: ${stored.session.join(', ')}`)
  if (stored.idb.length) problems.push(`IndexedDB: ${stored.idb.join(', ')}`)
  assert(!problems.length, summarise(problems))
  await ctx.close()
  return 'no cookies, localStorage, sessionStorage or IndexedDB after the pills, the copy button and a sent form'
})

// ─── The net ─────────────────────────────────────────────────────────────────

for (const ctx of contexts) await ctx.close().catch(() => {})
await b.close()
server.close()

await check(`nothing reached ${new URL(FORM_ENDPOINT).host} or any other host`, async () => {
  const unanswered = formSeen.filter(r => !formAnswered.has(r))
  assert(!unanswered.length,
    `${unanswered.length} request(s) to the form host were not answered by a mock here ` +
    `(pixel-lib's guard aborted them, but a check made a request it did not mean to): ` +
    summarise(unanswered.map(r => `${r.method()} ${r.url()}`)))
  assert(!thirdParty.length, `${thirdParty.length} off-site request(s), all aborted: ${summarise([...new Set(thirdParty)])}`)
  const posts = formSeen.filter(r => r.method() === 'POST').length
  return `${posts} POST(s) to ${FORM_ENDPOINT}, every one fulfilled or aborted locally`
})

console.log('')
console.log(failed === 0
  ? `  All ${passed} behaviour checks pass.`
  : `  ${failed} of ${passed + failed} behaviour check(s) failed.`)
process.exit(failed === 0 ? 0 : 1)
