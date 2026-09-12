// One-time importer: Claude Design canvas  ->  React/TypeScript.
//
// The canvas at `reference/index.html` is a single `<x-dc>` template styled
// entirely with inline `style="..."` strings, branched with `<sc-if>`, and
// hovered with `style-hover=`/`style-focus=` attributes. Transcribing 1,000
// lines of that by hand would be a typo farm, so it is transpiled instead:
// every declaration that reaches the browser is copied byte-for-byte from the
// design, and `scripts/diff-pixels.mjs` proves the result matches.
//
// Output lands in `.design-import/` (gitignored). It is a starting point that
// gets curated into `src/`, not a build step — re-running is always safe.
//
//   node scripts/from-design.mjs
import fs from 'node:fs'
import path from 'node:path'
import * as parse5 from 'parse5'

const SRC = 'reference/index.html'
const OUT = '.design-import'

// ─────────────────────────────────────────────────────────── template extract

const html = fs.readFileSync(SRC, 'utf8')
const open = /<x-dc(?:\s[^>]*)?>/.exec(html)
const close = html.lastIndexOf('</x-dc>')
if (!open || close === -1) throw new Error('no <x-dc> element in ' + SRC)
let template = html.slice(open.index + open[0].length, close)

// `<helmet>` carries the font links and base stylesheet. Those become
// index.html + src/index.css by hand, so lift them out before parsing.
const helmet = /<helmet[^>]*>([\s\S]*?)<\/helmet>/.exec(template)
if (!helmet) throw new Error('no <helmet> block')
template = template.replace(helmet[0], '')

const frag = parse5.parseFragment(template)

// ───────────────────────────────────────────────────────── pseudo-class rules
//
// The runtime compiles `style-hover="color:#F4F0E8"` into a generated class
// with an `!important`-ified `:hover` rule (see createPseudoSheet/importantify
// in reference/support.js). `!important` is load-bearing: every one of these
// elements also carries an inline `color`/`background`, which a normal
// stylesheet declaration would lose to. Named here instead of hashed so the
// components stay readable.

const HOVER_NAMES = {
  'color:#F4F0E8': 'hv-cream',
  'color:#C0392F': 'hv-red',
  'color:#1A1614;border-color:#1A1614': 'hv-ink-text',
  'background:#1A1614': 'hv-ink-bg',
  'background:#1A1614;color:#F4F0E8': 'hv-ink',
  'background:#F4F0E8;color:#1A1614': 'hv-cream-fill',
  'background:#fff': 'hv-white',
  'background:rgba(192,57,47,.09)': 'hv-red-wash',
  'background:#C0392F;color:#fff': 'hv-red-fill',
  'background:#93261E;color:#F4F0E8': 'hv-red-deep',
  'background:#1FB855;color:#fff': 'hv-whatsapp',
  'border-color:#F4F0E8;background:rgba(244,240,232,.12);color:#F4F0E8': 'hv-cream-ghost',
}
const FOCUS_NAMES = {
  'border-color:#C0392F': 'fc-red',
}

const usedHover = new Map()
const usedFocus = new Map()

function pseudoClass(kind, css) {
  const table = kind === 'hover' ? HOVER_NAMES : FOCUS_NAMES
  const used = kind === 'hover' ? usedHover : usedFocus
  const name = table[css]
  if (!name) throw new Error(`unnamed style-${kind}: ${JSON.stringify(css)}`)
  used.set(name, css)
  return name
}

/** Mirror of `importantify` in the design runtime. */
function importantify(css) {
  return splitDecls(css)
    .map(d => (/!\s*important$/i.test(d) ? d : d + ' !important'))
    .join(';')
}

// ────────────────────────────────────────────────────────────── style parsing

/** Split a declaration list on top-level `;` (never inside `(...)`). */
function splitDecls(css) {
  const out = []
  let depth = 0
  let start = 0
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ';' && depth === 0) { out.push(css.slice(start, i)); start = i + 1 }
  }
  out.push(css.slice(start))
  return out.map(d => d.trim()).filter(Boolean)
}

/** `background-color` -> `backgroundColor`; `--x` and vendor prefixes intact. */
function cssPropToJs(prop) {
  if (prop.startsWith('--')) return prop
  const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  // `-webkit-font-smoothing` camelises to `WebkitFontSmoothing` (capital W).
  return prop.startsWith('-') ? camel[0].toUpperCase() + camel.slice(1) : camel
}

function styleToObject(css) {
  const pairs = []
  for (const decl of splitDecls(css)) {
    const i = decl.indexOf(':')
    if (i === -1) throw new Error('bad declaration: ' + decl)
    const prop = decl.slice(0, i).trim()
    const value = decl.slice(i + 1).trim()
    pairs.push([cssPropToJs(prop), value])
  }
  return pairs
}

function styleLiteral(css) {
  const pairs = styleToObject(css)
  const body = pairs
    .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(', ')
  return `{ ${body} }`
}

// ───────────────────────────────────────────────────────────── expressions

/** `{{ go.contact }}` -> `go.contact` */
function unwrap(v) {
  const m = /^\s*\{\{\s*([\s\S]*?)\s*\}\}\s*$/.exec(v)
  return m ? m[1] : null
}

/**
 * Routes. The canvas swaps artboards through component state because a canvas
 * has one URL; the site gets real paths so every page is linkable, crawlable
 * and prerenderable. `<Link>` still renders an `<a>`, so this costs no pixels.
 */
const ROUTES = {
  home: '/',
  services: '/services',
  process: '/process',
  industries: '/industries',
  pricing: '/pricing',
  about: '/about',
  faq: '/faq',
  audit: '/audit',
  contact: '/contact',
  mobile: '/mobile',
}

// ────────────────────────────────────────────────────────────── JSX emission

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'])

// parse5 lowercases attribute names (HTML is case-insensitive), so the
// design's `onClick=` arrives as `onclick=`. React's DOM props are
// case-sensitive, so map them back explicitly rather than guessing.
const ATTR_RENAME = {
  class: 'className',
  for: 'htmlFor',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  maxlength: 'maxLength',
  autocomplete: 'autoComplete',
  onclick: 'onClick',
  onsubmit: 'onSubmit',
  onchange: 'onChange',
  oninput: 'onInput',
}
const attrName = n => ATTR_RENAME[n] || n

const NUMERIC_ATTRS = new Set(['rows', 'cols', 'size', 'span', 'colspan', 'rowspan', 'maxlength'])

const isText = n => n.nodeName === '#text'
const isComment = n => n.nodeName === '#comment'
const children = n => (n.childNodes || []).filter(c => !isComment(c))
const attrsOf = n => Object.fromEntries((n.attrs || []).map(a => [a.name, a.value]))

/** Mixed content: the element has real text of its own, so it is an inline
 *  formatting context and its whitespace is significant. */
function hasOwnText(node) {
  return children(node).some(c => isText(c) && c.value.trim() !== '')
}

/** Text -> JSX text. `{`/`}` would open an expression; `<`/`>` never survive
 *  parse5 as raw text (they arrive already decoded from entities). */
function jsxText(s) {
  return s
    .replace(/[{}]/g, m => `{'${m}'}`)
    .replace(/</g, '{'+ "'<'" + '}')
    .replace(/>/g, '{' + "'>'" + '}')
}

let needsLink = false

/**
 * One element -> its JSX open tag plus the tag name actually used.
 * Returns null for `sc-if`, which is handled by the caller as a conditional.
 */
function openTag(node) {
  const a = attrsOf(node)
  let tag = node.tagName
  const props = []

  // `<a href="#" onClick={{ go.pricing }}>` is a navigation, so it becomes a
  // router Link with a real href rather than a dead `#` plus a handler.
  const clickExpr = a.onclick ? unwrap(a.onclick) : null
  const navTarget = clickExpr && /^go\.([a-z]+)$/.exec(clickExpr)
  if (tag === 'a' && navTarget && a.href === '#') {
    tag = 'Link'
    needsLink = true
    props.push(`to=${JSON.stringify(ROUTES[navTarget[1]])}`)
  }

  for (const [name, value] of Object.entries(a)) {
    if (name === 'hint-placeholder-val') continue           // canvas editor hint
    if (tag === 'Link' && (name === 'href' || name === 'onclick')) continue
    if (name === 'style') { props.push(`style={${styleLiteral(value)}}`); continue }
    if (name === 'style-hover' || name === 'style-focus') continue  // -> className
    const expr = unwrap(value)
    if (expr !== null) { props.push(`${attrName(name)}={${expr}}`); continue }
    // React types these DOM props as numbers, not strings.
    if (NUMERIC_ATTRS.has(name)) { props.push(`${attrName(name)}={${Number(value)}}`); continue }
    props.push(`${attrName(name)}=${JSON.stringify(value)}`)
  }

  const cls = []
  if (a['style-hover']) cls.push(pseudoClass('hover', a['style-hover']))
  if (a['style-focus']) cls.push(pseudoClass('focus', a['style-focus']))
  if (cls.length) props.unshift(`className=${JSON.stringify(cls.join(' '))}`)

  return { tag, props }
}

function emit(node, indent, out) {
  const pad = '  '.repeat(indent)

  if (isText(node)) {
    const t = jsxText(node.value)
    if (t.trim() !== '') out.push(pad + t.trim())
    return
  }

  if (node.tagName === 'sc-if') {
    const cond = unwrap(attrsOf(node).value)
    out.push(`${pad}{${cond} && (`)
    out.push(`${pad}  <>`)
    emitChildren(node, indent + 2, out)
    out.push(`${pad}  </>`)
    out.push(`${pad})}`)
    return
  }

  const { tag, props } = openTag(node)
  const kids = children(node)
  const attrStr = props.length ? ' ' + props.join(' ') : ''

  if (VOID.has(node.tagName) || kids.length === 0) {
    out.push(`${pad}<${tag}${attrStr} />`)
    return
  }

  // Inline formatting context: keep every child on one line so no whitespace
  // is invented or lost between them.
  if (hasOwnText(node)) {
    out.push(`${pad}<${tag}${attrStr}>${inline(node)}</${tag}>`)
    return
  }

  out.push(`${pad}<${tag}${attrStr}>`)
  emitChildren(node, indent + 1, out)
  out.push(`${pad}</${tag}>`)
}

/** Serialise a subtree onto a single line, whitespace untouched. */
function inline(node) {
  let s = ''
  for (const c of children(node)) {
    if (isText(c)) { s += jsxText(c.value); continue }
    if (c.tagName === 'sc-if') {
      const cond = unwrap(attrsOf(c).value)
      s += `{${cond} && (<>${inline(c)}</>)}`
      continue
    }
    const { tag, props } = openTag(c)
    const attrStr = props.length ? ' ' + props.join(' ') : ''
    if (VOID.has(c.tagName) || children(c).length === 0) s += `<${tag}${attrStr} />`
    else s += `<${tag}${attrStr}>${inline(c)}</${tag}>`
  }
  return s
}

function emitChildren(node, indent, out) {
  for (const c of children(node)) emit(c, indent, out)
}

function render(node, indent = 0) {
  const out = []
  emit(node, indent, out)
  return out.join('\n')
}

// ────────────────────────────────────────────────────────── structural split

const root = children(frag).find(n => n.tagName === 'div')
if (!root) throw new Error('no root <div> in template')

// The frame, in document order. Matched positionally and then checked for
// completeness — an earlier version picked these out by tag name and silently
// dropped the site-wide CTA band that sits between <main> and <footer>, which
// cost every page 261px. Nothing may be left over.
const FRAME = ['div', 'header', 'main', 'section', 'footer', 'sc-if']
const parts = children(root).filter(n => n.tagName)

const shape = parts.map(n => n.tagName)
if (shape.join(',') !== FRAME.join(',')) {
  throw new Error(
    `unexpected page frame.\n  expected: ${FRAME.join(', ')}\n  found:    ${shape.join(', ')}\n` +
    'Add the new part to FRAME and give it a component, or it will vanish from every page.'
  )
}
const [topbar, header, main, cta, footer, sticky] = parts

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true })
fs.mkdirSync(path.join(OUT, 'components'), { recursive: true })

const banner = (what) => `// ${what}
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html".
`

// Each top-level `<sc-if value="{{ isX }}">` under <main> is one page.
const pageOf = {}
for (const n of children(main)) {
  if (n.tagName !== 'sc-if') continue
  const cond = unwrap(attrsOf(n).value)
  const m = /^is([A-Z]\w*)$/.exec(cond)
  if (!m) throw new Error('unexpected <main> branch: ' + cond)
  const key = m[1][0].toLowerCase() + m[1].slice(1)
  // The single child <div> is a wrapper the conditional needs; the page
  // component replaces it with a fragment of its sections.
  const wrapper = children(n).find(c => c.tagName === 'div')
  pageOf[key] = wrapper ? children(wrapper) : children(n)
}

for (const [key, sections] of Object.entries(pageOf)) {
  const body = sections.map(s => render(s, 2)).join('\n')
  const comp = key[0].toUpperCase() + key.slice(1)
  fs.writeFileSync(path.join(OUT, 'pages', `${comp}.tsx`), `${banner(`${comp} page.`)}
export default function ${comp}() {
  return (
    <>
${body}
    </>
  )
}
`)
}

const chrome = {
  TopBar: topbar,
  SiteHeader: header,
  SiteCta: cta,
  SiteFooter: footer,
  StickyContact: sticky,
}
for (const [name, node] of Object.entries(chrome)) {
  fs.writeFileSync(path.join(OUT, 'components', `${name}.tsx`), `${banner(`${name}.`)}
export default function ${name}() {
  return (
${render(node, 2)}
  )
}
`)
}

// The pseudo-class stylesheet, emitted in the same shape the runtime builds.
const rules = []
rules.push('/* Generated by scripts/from-design.mjs — mirrors the design runtime\'s')
rules.push('   pseudo-class sheet. Every declaration is !important because each of')
rules.push('   these elements also carries an inline style for the same property. */')
for (const [name, css] of [...usedHover].sort()) rules.push(`.${name}:hover { ${importantify(css)} }`)
for (const [name, css] of [...usedFocus].sort()) rules.push(`.${name}:focus { ${importantify(css)} }`)
fs.writeFileSync(path.join(OUT, 'pseudo.css'), rules.join('\n') + '\n')

fs.writeFileSync(path.join(OUT, 'helmet.html'), helmet[1].trim() + '\n')

console.log('pages    ', Object.keys(pageOf).join(' '))
console.log('chrome   ', Object.keys(chrome).join(' '))
console.log('hover    ', usedHover.size, 'rules  focus', usedFocus.size)
console.log('needsLink', needsLink)
