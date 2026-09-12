// Proves the prerendered markup is the markup React would build.
//
// A prerendered page that disagrees with the client tree looks fine in a
// screenshot — React silently patches it up — but the patch costs a frame, and
// anything React cannot reconcile is discarded. So each route is loaded twice:
// once with JavaScript blocked, to capture exactly what the server wrote, and
// once normally, to capture the tree after hydration. They must agree, and
// React must not have complained on the way.
//
//   node scripts/check-hydration.mjs
import fs from 'node:fs'
import { serve, browser, settle } from './pixel-lib.mjs'

const PORT = 4620
const DIST = 'dist'

if (!fs.existsSync(`${DIST}/404.html`)) {
  throw new Error('dist/ is not prerendered — run `npm run build`, not `build:spa`')
}

const { paths } = await import(
  (await import('node:url')).pathToFileURL(
    (await import('node:path')).resolve('.ssr/entry-server.js')
  ).href
)

/**
 * Collapse the differences that are legitimate rather than bugs: React writes
 * `style="a: b; c: d"` where the server wrote `style="a:b;c:d"`, and whitespace
 * between block elements is not observable.
 */
const normalise = html =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ?([:;]) ?/g, '$1')
    .replace(/;"/g, '"')
    .replace(/> </g, '><')
    .trim()

const server = await serve(DIST, PORT)
const b = await browser()

let failures = 0

for (const route of paths) {
  const url = `http://127.0.0.1:${PORT}${route}`

  // 1 — server markup, with the app's JavaScript blocked.
  const staticCtx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } })
  const staticPage = await staticCtx.newPage()
  await staticPage.goto(url, { waitUntil: 'domcontentloaded' })
  const serverHtml = await staticPage.evaluate(() => document.getElementById('root').innerHTML)
  await staticCtx.close()

  // 2 — the tree after hydration, plus anything React said about it.
  const complaints = []
  const page = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  const note = t => {
    if (/hydrat|did not match|server (?:HTML|rendered)|mismatch/i.test(t)) complaints.push(t)
  }
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') note(m.text()) })
  page.on('pageerror', e => note(String(e.message)))

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__hydrated === true)
  await settle(page)
  const clientHtml = await page.evaluate(() => document.getElementById('root').innerHTML)
  await page.close()

  const same = normalise(serverHtml) === normalise(clientHtml)
  const ok = same && complaints.length === 0

  if (!ok) failures++
  console.log(
    `  ${route.padEnd(12)} server ${String(serverHtml.length).padStart(6)} B  ` +
    `client ${String(clientHtml.length).padStart(6)} B  ${ok ? 'ok' : 'FAIL'}`
  )

  if (!same) {
    const a = normalise(serverHtml)
    const c = normalise(clientHtml)
    let i = 0
    while (i < a.length && i < c.length && a[i] === c[i]) i++
    console.log(`      first divergence at char ${i}:`)
    console.log(`        server: …${a.slice(Math.max(0, i - 60), i + 90)}`)
    console.log(`        client: …${c.slice(Math.max(0, i - 60), i + 90)}`)
  }
  for (const c of [...new Set(complaints)].slice(0, 3)) {
    console.log(`      React: ${c.slice(0, 200)}`)
  }
}

console.log('')
console.log(
  failures === 0
    ? `  All ${paths.length} prerendered routes hydrate cleanly.`
    : `  ${failures}/${paths.length} route(s) failed.`
)

await b.close()
server.close()
process.exit(failures === 0 ? 0 : 1)
