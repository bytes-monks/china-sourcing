// Screenshots all ten routes of the built site, through the same code path
// `capture-reference.mjs` uses, so the two sets are comparable pixel for pixel.
//
//   node scripts/capture-build.mjs           # dist/ (prerendered)
//   DIR=dist SPA=1 node scripts/capture-build.mjs   # SPA build, index fallback
import fs from 'node:fs'
import { serve, browser, settle, ensureDir, PAGES } from './pixel-lib.mjs'

const PORT = 4600
const WIDTH = Number(process.env.WIDTH || 1440)
const DIR = process.env.DIR || 'dist'
const SPA = process.env.SPA === '1'
const OUT = `.pixel/build/${WIDTH}`

const PATHS = {
  home: '/', services: '/services', process: '/process', industries: '/industries',
  pricing: '/pricing', about: '/about', faq: '/faq', audit: '/audit',
  contact: '/contact', mobile: '/mobile',
}

if (!fs.existsSync(DIR)) throw new Error(`${DIR}/ does not exist — run \`npm run build\` first`)

const server = await serve(DIR, PORT, { spa: SPA })
const b = await browser()
const page = await b.newPage({ viewport: { width: WIDTH, height: 1000 } })

const errors = []
page.on('pageerror', e => errors.push(String(e.message)))
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

ensureDir(OUT)
for (const name of PAGES) {
  await page.goto(`http://127.0.0.1:${PORT}${PATHS[name]}`, { waitUntil: 'networkidle' })
  // React must have taken over before the shot: a prerendered page looks right
  // before hydration, which would hide a hydration-only regression.
  await page.waitForFunction(() => window.__hydrated === true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  const h = await page.evaluate(() => document.body.scrollHeight)
  console.log(`build ${WIDTH}  ${name.padEnd(11)} ${h}px`)
}

if (errors.length) {
  console.log('\nPAGE ERRORS:')
  for (const e of [...new Set(errors)].slice(0, 10)) console.log('  ' + e)
}
await b.close()
server.close()
