/**
 * What the quote form on /contact actually does.
 *
 * The canvas has no backend, so the port it was transpiled from called
 * preventDefault() and showed "Got it — it's on my desk" — every enquiry was
 * thrown away while the visitor was told it had arrived. This module is the
 * part that makes the sentence true: it posts the form to FORM_ENDPOINT, and
 * when that fails it writes the same enquiry out as plain text so the visitor
 * can send it through WhatsApp or email instead of losing it.
 *
 * It lives here rather than in Contact.tsx so the page stays what every other
 * page is — a transcription of the canvas plus the state that switches it —
 * and so none of it runs during render. Everything below touches `window`,
 * `navigator`, `document` or `fetch`, and is only ever called from an event
 * handler, which is what keeps the server markup and the hydrated markup
 * byte-identical.
 */
import { FORM_ENDPOINT, CONTACT_WECHAT, mailtoUrl, whatsappUrl } from './site'

/**
 * Sent with every enquiry. The collector is shared with the owner's other
 * site, and this is the field that tells the two inboxes apart.
 */
export const FORM_TYPE = 'china-guy-quote'

/**
 * The honeypot's field name. The input is visually hidden, out of the tab
 * order, `aria-hidden` and `autoComplete="off"`, so no person fills it and no
 * assistive technology offers it; naive form-filling bots fill every text input
 * they find. A filled honeypot is never sent — see `isTrapped`.
 */
export const HONEYPOT_FIELD = 'website'

/**
 * How long a send may take before it counts as failed. Long enough for a slow
 * mobile connection; short enough that someone on a dead one is handed the
 * WhatsApp and email fallbacks while they are still on the page.
 */
export const SEND_TIMEOUT_MS = 15_000

/**
 * The ceiling on the pre-filled fallback message. wa.me carries the text in
 * the URL, and past roughly this length some clients truncate it or refuse the
 * link outright. The spec is what gets trimmed when a message runs long.
 */
export const FALLBACK_TEXT_LIMIT = 1500

/** An enquiry as the form holds it: field name -> value, honeypot removed. */
export type Enquiry = Record<string, string>

/** The form's fields, as strings, without the honeypot. */
export function readEnquiry(form: HTMLFormElement): Enquiry {
  const fields: Enquiry = {}
  for (const [key, value] of new FormData(form)) {
    if (key === HONEYPOT_FIELD) continue
    if (typeof value === 'string') fields[key] = value
  }
  return fields
}

/** True when the honeypot has been filled — i.e. when a bot sent the form. */
export function isTrapped(form: HTMLFormElement): boolean {
  const value = new FormData(form).get(HONEYPOT_FIELD)
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * POST the enquiry. Resolves to true only when the collector said so — a
 * 2xx response. A network error, a timeout and a 4xx/5xx all resolve to
 * false; nothing here throws, so the caller has exactly two outcomes to draw.
 *
 * The request shape is the one the owner's other site already uses against the
 * same endpoint: JSON, the form's own field names, plus `formType`.
 */
export async function sendEnquiry(fields: Enquiry, timeoutMs = SEND_TIMEOUT_MS): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fields, formType: FORM_TYPE }),
      signal: controller.signal,
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The one-line fields, in the order the form asks for them, with the label
 * each gets in the written-out message. The spec is not here: it is free text
 * of any length and gets a block of its own, last, so it is the part that is
 * trimmed when the message is too long.
 */
const LINES: ReadonlyArray<readonly [field: string, label: string]> = [
  ['name', 'Name'],
  ['company', 'Company'],
  ['email', 'Email'],
  ['destination', 'Destination country'],
  ['need', 'What I need'],
  ['quantity', 'First-order quantity'],
  ['target-price', 'Target unit price'],
]

/** A one-line field can be pasted into at any length; this keeps it a line. */
const LINE_LIMIT = 160

const TRIMMED = '… [trimmed — more to follow]'

/**
 * Cut `text` to at most `limit` characters, marking the cut.
 *
 * Counted in code points, not UTF-16 units: slicing through the middle of an
 * emoji leaves a lone surrogate, and encodeURIComponent throws on one — which
 * would take the whole error panel down with it, at the one moment the visitor
 * most needs it to render.
 */
function clip(text: string, limit: number): string {
  const chars = Array.from(text)
  if (chars.length <= limit) return text
  if (limit <= TRIMMED.length) return chars.slice(0, Math.max(0, limit)).join('')
  return chars.slice(0, limit - TRIMMED.length).join('').trimEnd() + TRIMMED
}

const length = (text: string) => Array.from(text).length

/**
 * The enquiry written out as a message the visitor can send themselves.
 * Empty fields are left out. Never longer than `limit` characters.
 */
export function composeEnquiry(fields: Enquiry, limit = FALLBACK_TEXT_LIMIT): string {
  const lines = LINES.flatMap(([field, label]) => {
    const value = (fields[field] ?? '').replace(/\s+/g, ' ').trim()
    return value ? [`${label}: ${clip(value, LINE_LIMIT)}`] : []
  })
  const head = [
    "Hi Bachar — the quote form on your website wouldn't send, so here is my enquiry.",
    ...(lines.length ? ['', ...lines] : []),
  ].join('\n')

  const spec = (fields.product ?? '').trim()
  if (!spec) return clip(head, limit)

  const specHead = '\n\nProduct & specification:\n'
  const room = limit - length(head) - length(specHead)
  if (room < 40) return clip(head, limit)
  return head + specHead + clip(spec, room)
}

/** A subject line that names who is asking, for the mailto fallback. */
export function enquirySubject(fields: Enquiry): string {
  const name = (fields.name ?? '').trim()
  const company = (fields.company ?? '').trim()
  const who = [name, company && `(${company})`].filter(Boolean).join(' ')
  return clip(who ? `Quote request from ${who}` : 'Quote request', 120)
}

/** The two ways to send an enquiry that did not go through, pre-filled. */
export function fallbackLinks(fields: Enquiry): { whatsapp: string; email: string } {
  const text = composeEnquiry(fields)
  return { whatsapp: whatsappUrl(text), email: mailtoUrl(enquirySubject(fields), text) }
}

/**
 * Copy `text` to the clipboard. Resolves to whether it worked.
 *
 * The async Clipboard API first — it needs a secure context and a user
 * gesture, and the site has both on every click. If it is missing or refuses
 * (an older WebView, a permissions policy), fall back to the pre-API way:
 * select the text in a throwaway textarea and ask for `copy`.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy path.
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const area = document.createElement('textarea')
  area.value = text
  // readonly keeps iOS from raising the keyboard for the instant it is focused.
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  // Laid out but invisible: an element with display:none cannot be selected.
  area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;pointer-events:none'
  document.body.appendChild(area)
  let ok = false
  try {
    area.select()
    area.setSelectionRange(0, text.length)
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  // select() moved focus into the textarea; hand it back to whatever had it.
  previous?.focus({ preventScroll: true })
  return ok
}

/** Copy the WeChat ID — the one contact detail that has no link to follow. */
export const copyWeChatId = (): Promise<boolean> => copyText(CONTACT_WECHAT)
