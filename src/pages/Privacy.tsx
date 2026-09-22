// Privacy policy. Beyond the canvas: the design has no artboard for it, and the
// footer's PRIVACY link pointed at "#" until this page existed. So nothing here
// is pixel-diffed. It is built from the canvas's own vocabulary instead: the
// red mono eyebrow, the Instrument Serif headline, Archivo body in #3A332E, the
// #FBF9F5 cards with a hairline border, and the `hv-red` hover the canvas
// already uses for ink-coloured links.
//
// Every statement below was checked against the code or the live site on the
// date at the top, not written from a template. If one of these changes, this
// page is wrong until it is edited:
//
//   - the quote form posts JSON to FORM_ENDPOINT (formgrid.dev) — src/lib/site.ts
//     and src/lib/contact.ts: the eight named fields plus `formType`, never the
//     honeypot — into the same Formgrid collector the bytesmonks.com forms use,
//     and Formgrid both stores the submission and emails a notification. A
//     failed send offers a pre-written wa.me / mailto link the visitor sends;
//   - nothing in src/ sets a cookie, touches localStorage/sessionStorage or
//     loads an analytics or ad script (grep for them before adding one);
//   - the fonts are self-hosted, so index.html makes no request to Google
//     Fonts. Put the Google Fonts <link> back and "What it does not collect"
//     becomes false;
//   - the site is GitHub Pages behind Cloudflare's proxy (the live response
//     carries `server: cloudflare` and an `x-github-request-id`), Cloudflare's
//     bot "JavaScript Detections" is injected into every page and issues the
//     `cf_clearance` cookie, and bytesmonks.com's MX records are Cloudflare
//     Email Routing. Turning those off in the Cloudflare dashboard leaves the
//     page cautious rather than wrong — it says "may set".
//
// Layout: one fluid flex row, table of contents first. On a desktop the two
// share a line and the contents rail sticks; below ~870px it wraps above the
// text, where its own line is only as tall as the list, so the sticky inner box
// has no room to move and cannot sit on top of the text it indexes. No media
// query, no stylesheet: a lazily-loaded page cannot bring CSS without painting
// unstyled first.
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

/** The third-party documents this page cites. Every URL was opened and read on
 *  the date above; they are what the page claims each service says. */
const REF = {
  formgrid: 'https://formgrid.dev/privacy-policy',
  githubPages: 'https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#data-collection',
  githubPrivacy: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
  cloudflarePrivacy: 'https://www.cloudflare.com/privacypolicy/',
  cloudflareCookies: 'https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/',
  whatsapp: 'https://www.whatsapp.com/legal/privacy-policy',
  wechat: 'https://www.wechat.com/en/privacy_policy.html',
}

// ── Type, from the canvas ────────────────────────────────────────────────────
const EYEBROW: CSSProperties = { font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "#C0392F", marginBottom: "18px" }
const H1: CSSProperties = { font: "400 58px/1 'Instrument Serif',serif", letterSpacing: "-.02em", margin: "0 0 22px" }
const LEDE: CSSProperties = { font: "400 17px/1.75 Archivo", color: "#3A332E", margin: "0 0 22px", maxWidth: "680px" }
const META: CSSProperties = { font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6259" }
const NUM: CSSProperties = { font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".16em", color: "#C0392F", marginBottom: "12px" }
// 36px sits just under the 38px ceiling mobile.css clamps every h2 to below
// 860px, so the heading does not grow when the viewport shrinks.
const H2: CSSProperties = { font: "400 36px/1.1 'Instrument Serif',serif", letterSpacing: "-.015em", margin: "0 0 18px", scrollMarginTop: "96px" }
const H3: CSSProperties = { font: "600 14.5px/1.4 Archivo", color: "#1A1614", margin: "26px 0 10px" }
const BODY: CSSProperties = { font: "400 16.5px/1.75 Archivo", color: "#3A332E", margin: "0 0 16px" }
const LABEL: CSSProperties = { font: "500 10px 'JetBrains Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#C0392F", marginBottom: "14px" }
const PANEL: CSSProperties = { background: "#FBF9F5", border: "1px solid rgba(26,22,20,.12)", padding: "26px" }
// Links in running text are red on #3A332E text — about 2.3:1 against the words
// around them, too close to tell apart by colour alone — so they are underlined
// as well. No inline colour: index.css's `a` / `a:hover` rules supply the red
// and the darker hover, and an inline colour would beat both.
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

/** A list with the canvas's red marker rather than a browser bullet. */
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

/** A processor card — the About page's "How I'm set up" card, with a link. */
function Processor({ role, name, children, links }: { role: string; name: string; children: ReactNode; links: { href: string; label: string }[] }) {
  return (
    <div style={{ ...PANEL, display: "flex", flexDirection: "column" }}>
      <div style={LABEL}>{role}</div>
      <div style={{ font: "400 23px/1.15 'Instrument Serif',serif", color: "#1A1614", marginBottom: "10px" }}>{name}</div>
      <p style={{ font: "400 13.5px/1.7 Archivo", color: "#6B6259", margin: "0 0 14px" }}>{children}</p>
      {/* Stacked stand-alone links, not links in running text, so WCAG 2.2's
          24px target minimum applies to them: 5px of padding each way on a 13px
          line clears it, and the underline is a text-decoration, so it stays
          attached to the text rather than moving with the box. */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {links.map(l => (
          <a key={l.href} href={l.href} style={{ ...INLINE_LINK, font: "600 13px Archivo", padding: "5px 0" }}>{l.label}</a>
        ))}
      </div>
    </div>
  )
}

const email = <A href={mailtoUrl('Privacy request')}>{CONTACT_EMAIL}</A>

// The same link on a line of its own, closing the <address> block. It is not in
// running text there, so it needs a 24px target of its own: inline-block makes
// the 4px of vertical padding real box, and the underline is a text-decoration,
// so it does not move with it.
const addressEmail = (
  <a href={mailtoUrl('Privacy request')} style={{ ...INLINE_LINK, display: "inline-block", padding: "4px 0" }}>{CONTACT_EMAIL}</a>
)

// ── The policy ───────────────────────────────────────────────────────────────
const SECTIONS: SectionDef[] = [
  {
    id: 'who',
    title: 'Who is responsible',
    body: (
      <>
        <P>
          This site is run by Bachar, the sourcing agent it describes, from the Guangzhou office below. Wherever this
          page says “I” or “me”, that is who it means: the person who decides what happens to what you send, and the
          person to ask about it.
        </P>
        {/* `font` resets the <address> italic along with everything else. */}
        <address style={{ ...PANEL, font: "400 15px/1.7 Archivo", color: "#1A1614", margin: "6px 0 18px" }}>
          {SITE_NAME}<br />
          {ADDRESS_LINE}<br />
          {`${ADDRESS_LOCALITY} ${ADDRESS_POSTAL}, ${ADDRESS_REGION}, China`}<br />
          {addressEmail}
        </address>
        <P>
          The site’s web address and email address are on the bytesmonks.com domain, and the quote form delivers into
          the same Formgrid account as the forms on bytesmonks.com.
        </P>
      </>
    ),
  },
  {
    id: 'what-is-collected',
    title: 'What the site collects',
    body: (
      <>
        <P>
          Only what you choose to send. The quote form on the <To to="/contact">contact page</To> has eight fields:
        </P>
        <Bullets
          items={[
            'Your name and company',
            'Your email address',
            'Destination country',
            'What you need — one choice from a short list',
            'First-order quantity and target unit price',
            'Product and specification — free text',
          ]}
        />
        <P>
          When you press send, the form adds a label saying which site the enquiry came from, and — like every request
          on the web — it reaches Formgrid with your IP address and browser details attached.
        </P>
        <P>
          If the form cannot get through, it offers to write the same enquiry into a WhatsApp message or an email for
          you. Nothing is sent that way until you press send in that app yourself.
        </P>
        <P>
          Attachments do not go through the site. The form says they can follow by email, and an email you send me is
          handled exactly as the form is. Please keep the free-text box to what a quote needs: I never need bank
          details, passwords or ID numbers to answer an enquiry.
        </P>
        <P>
          If you message me on WhatsApp or WeChat, or email me directly, I receive what you send there, plus whatever
          that service shows me about you — usually your name, your number or ID, and a profile photo.
        </P>
        <h3 style={H3}>What it does not collect</h3>
        <P>
          The site’s own code sets no cookies and stores nothing in your browser. It runs no analytics, no advertising
          or social-media pixels and no third-party scripts of its own, and the typefaces are served from this site
          rather than from a font service. Reading the site without sending anything does not identify you to me.
        </P>
      </>
    ),
  },
  {
    id: 'hosting',
    title: 'Hosting and delivery',
    body: (
      <>
        <P>
          The pages are static files, hosted on GitHub Pages and delivered through Cloudflare’s network. As with any
          website, both services see your IP address, your browser details and the page you asked for on every visit,
          and use them to deliver the page and keep it secure.
        </P>
        <Bullets
          items={[
            <>
              <strong style={{ fontWeight: 600, color: "#1A1614" }}>GitHub</strong> states that when a GitHub Pages
              site is visited, the visitor’s IP address is logged and stored for security purposes (
              <A href={REF.githubPages}>GitHub Pages documentation</A>, <A href={REF.githubPrivacy}>GitHub’s privacy statement</A>).
            </>,
            <>
              <strong style={{ fontWeight: 600, color: "#1A1614" }}>Cloudflare</strong> sits in front of the site to
              deliver it and to filter out attacks and automated traffic. To do that it adds a small script of its own to
              each page and may set one cookie, <code style={{ font: "400 14px 'JetBrains Mono',monospace" }}>cf_clearance</code>,
              which it uses to tell people from bots. Cloudflare lists it as strictly necessary, not as an analytics or
              advertising cookie, and this site does not read it (<A href={REF.cloudflareCookies}>Cloudflare’s cookie list</A>,{' '}
              <A href={REF.cloudflarePrivacy}>Cloudflare’s privacy policy</A>).
            </>,
          ]}
        />
        <P>Both keep these logs under their own policies.</P>
      </>
    ),
  },
  {
    id: 'why',
    title: 'What I use it for',
    body: (
      <>
        <P>
          To answer your enquiry: to understand what you want made, judge whether I am the right person for it, and
          prepare a quote. If we then work together, the same details are used to run that project and keep the records
          it needs. That is all. I do not use them for marketing, and nothing about you is decided automatically.
        </P>
        <h3 style={H3}>The legal basis, for visitors in the EU and UK</h3>
        <P>
          For an enquiry and a quote, it is taking steps you asked for before entering into a contract (Article 6(1)(b)
          of the GDPR and the UK GDPR). Where an enquiry is not about possible work — a general question, say — it is
          my legitimate interest in answering the people who write to me (Article 6(1)(f)). The hosting logs rest on the
          legitimate interest in keeping the site running and secure.
        </P>
      </>
    ),
  },
  {
    id: 'who-else',
    title: 'Who else handles it',
    body: (
      <>
        <P>Getting your enquiry to me takes a few services I do not run. Each sees what its part of the job needs.</P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))", gap: "16px", margin: "6px 0 22px" }}>
          <Processor role="Form service" name="Formgrid" links={[{ href: REF.formgrid, label: 'Formgrid’s privacy policy' }]}>
            Receives the form when you press send, keeps a copy in the account it delivers to, and sends an email
            notification of it.
          </Processor>
          <Processor role="Hosting" name="GitHub Pages" links={[{ href: REF.githubPrivacy, label: 'GitHub’s privacy statement' }]}>
            Hosts the site’s files and sees each page request. The form goes straight from your browser to Formgrid,
            so GitHub never sees it.
          </Processor>
          <Processor role="Network and email" name="Cloudflare" links={[{ href: REF.cloudflarePrivacy, label: 'Cloudflare’s privacy policy' }]}>
            Delivers the pages and screens out automated traffic. Email sent to my address is routed through Cloudflare
            to the inbox I read.
          </Processor>
          <Processor
            role="Only if you choose it"
            name="WhatsApp · WeChat"
            links={[
              { href: REF.whatsapp, label: 'WhatsApp’s privacy policy' },
              { href: REF.wechat, label: 'WeChat’s privacy policy' },
            ]}
          >
            Involved only when you message me there. What you send is then also covered by that service’s own terms.
          </Processor>
        </div>
        <P>
          If preparing your quote, or the work that follows, means asking factories, inspectors, a testing lab or a
          freight forwarder, I pass on what that step needs — a specification, an inspection plan, a delivery address —
          and no more. The <To to="/about">about page</To> explains who those people are. I do not sell, rent or trade
          your details, and I would only disclose them to anyone else if the law required it.
        </P>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'Where it goes',
    body: (
      <>
        <P>
          I work in China, so wherever you are writing from, your enquiry ends up being read and kept in China. On the
          way it passes through services based elsewhere: GitHub and Cloudflare are US companies with servers in many
          countries, and Formgrid and the email services along the way run their own. Sending the form means your
          details are transferred to China so that I can answer you.
        </P>
        <P>
          China’s data-protection rules are not the same as those in the EU or the UK, and neither has recognised them
          as equivalent. If that matters for something sensitive, leave it out of the first message — the product and
          the quantity are enough for me to start.
        </P>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long I keep it',
    body: (
      <>
        <P>As long as it is useful for the reason you sent it, and no longer.</P>
        <Bullets
          items={[
            'An enquiry that does not turn into work: while the conversation is live and for a while after, in case you come back to it. Ask me to delete it sooner and I will.',
            'An enquiry that turns into work: it becomes part of that project’s records, kept while the work runs and afterwards for as long as accounting, tax or a possible dispute requires.',
            'When I delete an enquiry, I delete it from my inbox and from the Formgrid account.',
            'Hosting and network logs are kept by GitHub and Cloudflare, under their own policies.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <P>You can ask me to:</P>
        <Bullets
          items={[
            'show you what I hold about you, and give you a copy you can reuse;',
            'correct anything that is wrong or incomplete;',
            'delete it — unless a record has to be kept, for example for tax on work already done, in which case I will tell you what and why;',
            'limit what I do with it while a question about it is sorted out;',
            'stop using it for anything that rests on my legitimate interest.',
          ]}
        />
        <P>
          To do any of these, email {email} — ideally from the address you used, so I can find your enquiry and know it
          is you. It costs nothing, and I will answer within one month.
        </P>
        <P>
          If you think I have got something wrong, tell me first and I will try to put it right. You can also complain
          to the data-protection authority where you live or work — in the EU, your national supervisory authority; in
          the UK, the Information Commissioner’s Office.
        </P>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this page',
    body: (
      <P>
        If what the site does with your details changes — a different form service, analytics, anything new that
        touches what you send — this page changes before it does, and the date at the top moves with it.
      </P>
    ),
  },
  {
    id: 'questions',
    title: 'Questions',
    body: (
      <>
        <P>
          Anything about this page, or a request about your data: email {email}, or write to the office address above.
          The <To to="/terms">terms of use</To> cover the rest of the site.
        </P>
      </>
    ),
  },
]

export default function Privacy() {
  return (
    <article data-m="wrap" style={{ maxWidth: "1260px", margin: "0 auto", padding: "68px 32px 88px", overflowWrap: "break-word" }}>
      <header style={{ maxWidth: "760px", marginBottom: "48px" }}>
        <div style={EYEBROW}>Privacy policy</div>
        <h1 style={H1}>What happens to what you send&nbsp;me.</h1>
        <p style={LEDE}>
          This site is a brochure with one form on it. The form is the only place it asks you for anything, so most of
          this page is about that: what it collects, who handles it on the way to me, how long I keep it, and how to have
          it deleted. It also covers the little a web page cannot avoid — the servers that deliver it see your IP address.
        </p>
        <div style={META}>Last updated <time dateTime={UPDATED_ISO}>{UPDATED_LABEL}</time></div>
      </header>

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
                'The only personal details this site collects are the ones you type into the quote form.',
                'They go to me so I can answer you and prepare a quote. They are not added to a mailing list, sold, or fed into a follow-up sequence.',
                'The site’s own code sets no cookies and runs no analytics, advertising or tracking scripts.',
                'Email me and I will send you a copy of what I hold, correct it, or delete it.',
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
