// Terms of use. Beyond the canvas: the design has no artboard for it, and the
// footer's TERMS link pointed at "#" until this page existed. Not pixel-diffed;
// built from the canvas's vocabulary — the red mono eyebrow, the Instrument
// Serif headline, Archivo body in #3A332E, the #FBF9F5 hairline panels, the
// `hv-red` hover on ink-coloured links.
//
// The layout and the small building blocks below are the same as Privacy.tsx's,
// deliberately repeated rather than imported: importing them from Privacy.tsx
// would pull the whole privacy policy into this route's chunk. If the two pages
// ever need to change together, they belong in a shared module of their own.
//
// What these terms may say is bounded by what the rest of the site already
// promises. They cover the website only; engagements are agreed in writing per
// project (/pricing: "One fee, written down before I start" and "Sourcing is
// free until you approve a quotation"), goods are paid to the factory and never
// to Bachar (/faq), and a typical first order is 9 to 14 weeks (/process). No
// governing law is stated, because none is stated anywhere the operator has
// published one — that is the owner's to add, not this file's to invent.
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ADDRESS_LINE,
  ADDRESS_LOCALITY,
  ADDRESS_POSTAL,
  ADDRESS_REGION,
  CONTACT_EMAIL,
  SITE_NAME,
  mailtoUrl,
} from '../lib/site'
import { toHref } from '../lib/routes'

const UPDATED_ISO = '2026-09-22'
const UPDATED_LABEL = '22 September 2026'

// ── Type, from the canvas (same values as Privacy.tsx) ──────────────────────
const EYEBROW: CSSProperties = { font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "18px" }
const H1: CSSProperties = { font: "400 58px/1 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0 0 22px" }
const LEDE: CSSProperties = { font: "400 17px/1.75 Archivo", color: "#3A332E", margin: "0 0 22px", maxWidth: "680px" }
const META: CSSProperties = { font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259" }
const NUM: CSSProperties = { font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", color: "#C0392F", marginBottom: "12px" }
// Just under the 38px ceiling mobile.css clamps h2s to below 860px.
const H2: CSSProperties = { font: "400 36px/1.1 'Instrument Serif',serif", letterSpacing: "-.015em", margin: "0 0 18px", scrollMarginTop: "96px" }
const BODY: CSSProperties = { font: "400 16.5px/1.75 Archivo", color: "#3A332E", margin: "0 0 16px" }
const LABEL: CSSProperties = { font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#C0392F", marginBottom: "14px" }
const PANEL: CSSProperties = { background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "26px" }
// Underlined as well as red: red against #3A332E body text is ~2.3:1, too
// close to mark a link by colour alone. No inline colour, so index.css's
// `a` / `a:hover` still apply.
const INLINE_LINK: CSSProperties = { textDecoration: "underline", textDecorationThickness: "1px", textUnderlineOffset: "3px" }

// ── Building blocks ──────────────────────────────────────────────────────────
function P({ children }: { children: ReactNode }) {
  return <p style={BODY}>{children}</p>
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} style={INLINE_LINK}>{children}</a>
}

function To({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={toHref(to)} style={INLINE_LINK}>{children}</Link>
}

function Bullets({ items, flush = false }: { items: ReactNode[]; flush?: boolean }) {
  return (
    <ul style={{ listStyle: "none", padding: "0", margin: flush ? "0" : "0 0 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: "12px", font: "400 16px/1.7 Archivo", color: "#3A332E" }}>
          <span aria-hidden="true" style={{ flex: "none", width: "6px", height: "6px", background: "#C0392F", marginTop: "11px" }} />
          <span style={{ minWidth: "0" }}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

interface SectionDef {
  id: string
  title: string
  body: ReactNode
}

function Section({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} style={{ borderTop: "1px solid rgba(26,22,20,.12)", paddingTop: "34px", marginTop: "40px" }}>
      <div style={NUM} aria-hidden="true">{String(n).padStart(2, '0')}</div>
      <h2 id={id} style={H2}>{title}</h2>
      {children}
    </section>
  )
}

const email = <A href={mailtoUrl('Terms of use')}>{CONTACT_EMAIL}</A>

// The same link on a line of its own, closing the <address> block. It is not in
// running text there, so it needs a 24px target of its own: inline-block makes
// the 4px of vertical padding real box, and the underline is a text-decoration,
// so it does not move with it.
const addressEmail = (
  <a href={mailtoUrl('Terms of use')} style={{ ...INLINE_LINK, display: "inline-block", padding: "4px 0" }}>{CONTACT_EMAIL}</a>
)

// ── The terms ────────────────────────────────────────────────────────────────
const SECTIONS: SectionDef[] = [
  {
    id: 'who',
    title: 'Who runs this site',
    body: (
      <>
        <P>
          This site is run by Bachar, the sourcing agent it describes, from the Guangzhou office below. “I” and “me” in
          these terms mean him.
        </P>
        {/* `font` resets the <address> italic along with everything else. */}
        <address style={{ ...PANEL, font: "400 15px/1.7 Archivo", color: "#1A1614", margin: "6px 0 18px" }}>
          {SITE_NAME}<br />
          {ADDRESS_LINE}<br />
          {`${ADDRESS_LOCALITY} ${ADDRESS_POSTAL}, ${ADDRESS_REGION}, China`}<br />
          {addressEmail}
        </address>
        <P>Using the site means accepting these terms. If you do not accept them, please do not use it.</P>
      </>
    ),
  },
  {
    id: 'not-an-offer',
    title: 'Information, not an offer',
    body: (
      <>
        <P>
          Everything here — the services, the prices, the timelines, the sample audit report, the guides — describes how
          I usually work. None of it is an offer you can accept by sending the form, and sending it does not create a
          contract or commit either of us to anything.
        </P>
        <P>
          The fees on the <To to="/pricing">pricing page</To> are there so you know what to expect before we talk.
          Timelines, like the 9 to 14 weeks a typical first order takes, are typical ranges, not promises.
        </P>
      </>
    ),
  },
  {
    id: 'engagements',
    title: 'How work is agreed',
    body: (
      <>
        <P>
          Every engagement is agreed in writing, per project, before any work starts: what I will do, the fee, and how
          it is paid. As the pricing page says, the fee is written down before I start, and nothing is billed before you
          approve a quotation you are happy with. If anything in that written agreement differs from this website, the
          agreement wins.
        </P>
        <P>
          You pay factories directly, on their own invoice, into their own corporate account — never to me, as the{' '}
          <To to="/faq">FAQ</To> explains. If anyone asks you to pay for goods into an account in my name, it is not me:
          stop, and check with me through the <To to="/contact">contact page</To> first.
        </P>
      </>
    ),
  },
  {
    id: 'accuracy',
    title: 'How far to rely on it',
    body: (
      <>
        <P>
          I write the site carefully and keep it current, but I cannot promise that every page is complete, free of
          errors or up to date on the day you read it. Prices, regulations, freight rates and trade rules change.
        </P>
        <P>
          The <To to="/guides">guides</To> are general information about importing from China, not legal, customs, tax
          or financial advice for your situation. Check anything that matters with the relevant authority or a qualified
          adviser before you rely on it — or ask me, and get an answer about your product.
        </P>
      </>
    ),
  },
  {
    id: 'content',
    title: 'The site’s content',
    body: (
      <>
        <P>
          The words, design and images on this site are ©&nbsp;Bachar Sourcing unless a page says otherwise. You are welcome
          to read, print and share them, and to quote short passages with a link back to the page. Please do not copy
          whole pages or republish them as your own.
        </P>
        <P>
          Other companies’ names and marks — a testing lab, a marketplace — belong to them. Mentioning one does not mean
          it endorses me.
        </P>
      </>
    ),
  },
  {
    id: 'links',
    title: 'Links to other sites',
    body: (
      <P>
        The site links to services I do not run — WhatsApp, WeChat, Formgrid, and the policies the privacy page cites. I
        am not responsible for what they publish or for how they handle your information; their own terms apply. How I
        handle what you send me is set out in the <To to="/privacy">privacy policy</To>.
      </P>
    ),
  },
  {
    id: 'fair-use',
    title: 'Using the site fairly',
    body: (
      <P>
        Please do not try to break or overload the site, get around its security, or use the form to send spam or
        anything unlawful. The form has a trap for automated submissions, and anything it catches is never sent.
      </P>
    ),
  },
  {
    id: 'liability',
    title: 'Liability',
    body: (
      <>
        <P>
          The site is provided free and as it is. As far as the law allows, I am not liable for loss that comes from
          relying on the site alone — a decision made on its content without a written engagement — or from the site
          being unavailable or interrupted.
        </P>
        <P>
          Nothing in these terms limits liability that the law does not allow to be limited, such as for fraud, or for
          death or personal injury caused by negligence, and nothing here takes away rights you have as a consumer.
          Liability for sourcing work is set out in the written agreement for that work.
        </P>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <P>
        I may update these terms when the site changes. The date at the top shows when they last did, and the version on
        this page when you use the site is the one that applies. A change here never alters a written agreement already
        in place.
      </P>
    ),
  },
  {
    id: 'questions',
    title: 'Questions',
    body: (
      <P>
        Anything about these terms: email {email}, or write to the office address above. For a quote, the{' '}
        <To to="/contact">contact page</To> is quicker.
      </P>
    ),
  },
]

export default function Terms() {
  return (
    <article data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "68px 32px 88px", overflowWrap: "break-word" }}>
      <header style={{ maxWidth: "760px", marginBottom: "48px" }}>
        <div style={EYEBROW}>Terms of use</div>
        <h1 style={H1}>The small print, kept&nbsp;short.</h1>
        <p style={LEDE}>
          These terms cover using this website — reading it, and sending an enquiry through it. They do not cover
          sourcing work. That is agreed in writing, per project, before anything starts, and those written terms are the
          ones that govern it.
        </p>
        <div style={META}>Last updated <time dateTime={UPDATED_ISO}>{UPDATED_LABEL}</time></div>
      </header>

      {/* One fluid row, contents first: side by side on a desktop with the rail
          sticky; wrapped above the text below ~870px, where the rail's own line
          is only as tall as the list and the sticky box cannot move. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "40px 56px" }}>
        <nav aria-labelledby="toc-label" style={{ flex: "1 1 220px", maxWidth: "280px" }}>
          <div style={{ position: "sticky", top: "96px" }}>
            <div id="toc-label" style={{ ...META, marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid rgba(26,22,20,.12)" }}>On this page</div>
            <ol style={{ listStyle: "none", padding: "0", margin: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a className="hv-red" href={`#${s.id}`} style={{ display: "flex", gap: "12px", padding: "6px 0", font: "400 14px/1.45 Archivo", color: "#3A332E", textDecoration: "none" }}>
                    <span aria-hidden="true" style={{ flex: "none", width: "20px", font: "500 10.5px/2 'JetBrains Mono',monospace", color: "#6B6259" }}>{String(i + 1).padStart(2, '0')}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div style={{ flex: "999 1 520px", minWidth: "0", maxWidth: "700px" }}>
          <div style={PANEL}>
            <div style={LABEL}>The short version</div>
            <Bullets
              items={[
                'This site describes how I work. It is not an offer, and sending the form does not create a contract.',
                'Every engagement is agreed in writing, per project, before any work starts — the fee included.',
                'I keep the site accurate, but check anything that matters before you rely on it.',
                'The words and design are mine. Quote and link freely; please do not copy whole pages.',
              ]}
              flush
            />
          </div>

          {SECTIONS.map((s, i) => (
            <Section key={s.id} n={i + 1} id={s.id} title={s.title}>{s.body}</Section>
          ))}
        </div>
      </div>
    </article>
  )
}
