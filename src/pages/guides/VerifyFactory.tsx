// Guide: how to verify a Chinese factory before you pay it anything.
//
// Beyond the canvas — no artboard, so not pixel-diffed. The frame is
// GuideLayout; the prose parts are GuideProse. The headline, summary and
// breadcrumb label are in src/lib/guides.ts, where the JSON-LD reads them too.
//
// Every business fact in here is one the site already states elsewhere: the
// audit's US$390, four working days, 14 pages and 60+ photos (/services,
// /audit), the sample licence 91440606MA… and "41 EU shipments in 2025"
// (/audit), the payment rule and the 30/70 split (Home, /faq), the 3–5 factory
// shortlist in 5–8 working days (/services), cost + 10% on lab testing (/faq).
// The general facts were checked before they were written down: the USCC is
// 18 characters from GB 32100-2015's alphabet (no I, O, S, V, Z), "91" is an
// enterprise registered by the market regulator, 440606 is the division code
// of Shunde District, Foshan; gsxt.gov.cn is SAMR's public register; licences
// must be displayed at the premises; CE rests on a declaration of conformity
// for most products; the FDA issues no registration certificates. Keep it that
// way: the owner reviews every guide before it is published, and accuracy is
// the whole of its value.
import GuideLayout, { type GuideSection } from '../../components/GuideLayout'
import { A, Checklist, H3, List, P, Strong, Zh } from '../../components/GuideProse'

const SECTIONS: GuideSection[] = [
  {
    id: 'factory-or-trader',
    title: 'Factory or trading company?',
    body: (
      <>
        <P>
          A trading company is not a scam, and for small mixed orders, or in the Yiwu market, some are
          genuinely useful. The problem is dealing with one while believing you have found the
          factory.
        </P>
        <P>
          That is one of the ways I lost money myself, on the buyer's side of the table. When a trader
          poses as a factory, you pay a margin you cannot see; you have no say in which workshop makes
          your goods, and it can change between orders; and when something goes wrong, the person you
          are negotiating with has to go and ask someone you have never met.
        </P>
        <P>
          The signs usually show before the paperwork does: a product range spanning unrelated
          categories — kitchenware, LED lighting and pet beds from one "factory" — a quote on anything
          within the hour, showroom photos but never the production floor, "our factory" but never
          where.
        </P>
        <P>
          One complication is legitimate. Plenty of real factories export through a sister trading
          company or a Hong Kong company of their own. That is not a red flag, but it makes the maker
          and the invoicer two legal entities: know which one you are contracting with, and verify
          that one.
        </P>
      </>
    ),
  },
  {
    id: 'business-licence',
    title: 'Start with the business licence',
    body: (
      <>
        <P>
          Ask for a photo of the business licence — the <Zh>营业执照</Zh>. Every company legally
          registered in mainland China has one, and a supplier that will not send it before you pay has
          told you what you need to know. Read off it:
        </P>
        <List
          items={[
            <><Strong>The registered name, in Chinese.</Strong> That is the legal name. The English one
              on a website is a translation the company chose for itself, with no legal standing.</>,
            <><Strong>The Unified Social Credit Code</Strong> (<Zh>统一社会信用代码</Zh>): 18
              characters, digits and capital letters, never I, O, S, V or Z. It is the company's
              registration number, and what you search the register with.</>,
            <><Strong>The legal representative</Strong> (<Zh>法定代表人</Zh>) <Strong>and the date of
              establishment.</Strong> A company registered last spring that claims fifteen years of
              experience is worth a question.</>,
            <><Strong>The registered address and the business scope</Strong>, which get a section of
              their own below.</>,
          ]}
        />
        <P>
          The code carries information of its own. For an ordinary company it usually begins 91, and the
          next six digits are the area code of the office that registered it. The licence on my{' '}
          <A to="/audit">sample audit report</A> starts 91440606: 440606 is Shunde District in Foshan,
          which is where that factory stands. A Guangdong supplier whose code points to another
          province owes you an explanation.
        </P>
      </>
    ),
  },
  {
    id: 'check-the-register',
    title: 'Check it on the government register',
    body: (
      <>
        <P>
          A photo of a licence proves that someone has a photo. The check is the register itself: the
          National Enterprise Credit Information Publicity System,{' '}
          <A href="https://www.gsxt.gov.cn/">gsxt.gov.cn</A>, run by China's market regulator. It is
          free, and you can search it by the code or by the Chinese name. Look at:
        </P>
        <List
          items={[
            <><Strong>Status.</Strong> <Zh>存续</Zh> or <Zh>在业</Zh> means active. <Zh>注销</Zh> is
              deregistered and <Zh>吊销</Zh> is revoked; a company in either state should not be taking
              your order.</>,
            <><Strong>A match.</Strong> The name, code, legal representative and address should be
              exactly what is on the photo you were sent. Any mismatch ends the conversation until it is
              explained.</>,
            <><Strong>Penalties and lists.</Strong> Administrative penalties, the list of abnormal
              operations (<Zh>经营异常名录</Zh>) and the list of serious violations. The abnormal list
              most often means a missed annual report or an unreachable registered address — not proof
              of fraud, but a question to ask before money moves.</>,
          ]}
        />
        <P>
          The register is in Chinese only and can be slow from outside China; a browser's translation
          gets you through it. Commercial databases such as Qichacha and Tianyancha repackage the same
          records with a friendlier search, often with court records alongside — useful, but the
          register is the source.
        </P>
      </>
    ),
  },
  {
    id: 'business-scope',
    title: 'Read the business scope, and the address',
    body: (
      <>
        <P>
          The business scope (<Zh>经营范围</Zh>) lists what the company is registered to do, and it is
          the quickest way to tell a factory from a trader on paper.
        </P>
        <P>
          A manufacturer's scope uses words for making things — <Zh>生产</Zh> (production),{' '}
          <Zh>制造</Zh> (manufacture), <Zh>加工</Zh> (processing) — followed by the product. A trader's
          uses words for selling them: <Zh>销售</Zh> (sales), <Zh>批发</Zh> (wholesale),{' '}
          <Zh>零售</Zh> (retail), <Zh>货物进出口</Zh> (import and export of goods). A company licensed
          to sell kitchenware, lighting and toys but to make none of them is not a factory, whatever its
          website says. The scope can rule a supplier out; it can never rule one in. That takes seeing
          the place.
        </P>
        <P>
          Then the address. A factory registered at an office and producing on an industrial estate
          across town is ordinary. What matters is that you know where production happens, and that the
          name on the gate there is the name on the licence. Companies have to display the original
          licence at their premises, and my <A to="/audit">audit report</A> photographs that wall for
          exactly this reason.
        </P>
      </>
    ),
  },
  {
    id: 'capacity',
    title: 'Export history and capacity',
    body: (
      <>
        <P>
          A factory that has never exported may make a good product, but your order would be its
          education in export paperwork, carton marking and your market's labelling rules. Ask where it ships, and for evidence: recent bills of lading
          or export declarations, with the customers' names blacked out. My sample report records 41 EU
          shipments in 2025; a record answers questions no sales call can.
        </P>
        <P>
          Capacity is arithmetic, and worth doing yourself. Ask how many lines make your product,
          how many shifts they run, each line's daily output, and how full the order book is for your
          weeks. Then divide. If your order is two months of the
          factory's entire output, either you would be its biggest customer or part of your order is
          going somewhere else. And capacity in the weeks around Chinese New Year, when workers go home
          and not all of them come back on time, is not capacity in March.
        </P>
        <H3>Ask what they sub-contract</H3>
        <P>
          Almost no factory makes every part of a product. Plating, printing and packaging are
          routinely bought in, and that is fine. Not knowing is not. At the factory in my sample audit,
          handle assembly was going to a nearby workshop, so one condition before a first order was a
          written commitment not to sub-contract it. Put the same in your contract: which processes are
          done in-house, and that anything else needs your written approval. Verbal agreements in China
          are worth exactly what they cost.
        </P>
      </>
    ),
  },
  {
    id: 'certificates',
    title: 'Certificates: ask whoever issued them',
    body: (
      <>
        <P>
          A photo of a certificate is a claim with a logo on it. For a management-system certificate
          such as ISO 9001, or a social-audit report such as BSCI, check the number on the issuing
          body's own website, that the company name and address on it match the licence, that its scope
          covers your product, and that it is in date.
        </P>
        <P>
          Lab test reports — SGS, TÜV, Intertek — name a specific product, model and applicant. One for
          another product or model says nothing about yours, and the lab will confirm whether a report
          number is genuine.
        </P>
        <P>
          Two claims need particular care. A "CE certificate" is often a test report with a grand
          title: for most products, CE marking rests on a declaration of conformity that the
          manufacturer or importer makes, not on a certificate a lab issues. And the US FDA does not
          issue registration certificates at all; an "FDA certificate" is usually a consultant's record
          of having filed a registration. If your product needs real testing, I coordinate it with
          accredited labs, passing their invoice through at cost plus 10% (see the{' '}
          <A to="/faq">FAQ</A>).
        </P>
      </>
    ),
  },
  {
    id: 'see-it',
    title: 'Video walk-through or on-site audit',
    body: (
      <>
        <P>
          A live video call costs nothing and screens out the least convincing suppliers quickly — as
          long as it is live and unscripted. Make the requests yourself, on the call:
        </P>
        <List
          items={[
            'start at the gate, with the company name in shot;',
            'walk to the business licence on the wall;',
            'show a line running your kind of product — and a machine you name, not one they choose;',
            'show the raw-material store and the finished-goods warehouse;',
            "hold a phone showing today's date up to the camera.",
          ]}
        />
        <P>
          Video shows only what the camera is pointed at, and it can be pointed at a friend's factory.
          You cannot count the staff, read the records or open a carton.
        </P>
        <P>
          An on-site audit can. I spend a full day there — machines, staffing, storage, certifications,
          records — and answer the question that matters most: which parts of your order do they
          actually make themselves? You get a scored 14-page report with 60+ photos and a map of what is
          sub-contracted, ending in pass, conditional or fail — and if conditional, the fixes to ask
          for. US$390 per factory, report in four working days.{' '}
          <A to="/audit">Page one of a real one is here</A>.
        </P>
      </>
    ),
  },
  {
    id: 'payment',
    title: 'Pay the company on the licence, and no one else',
    body: (
      <>
        <P>
          The last check protects the money. On every order I run, you pay the factory's own corporate
          account, in the exact Chinese name on its licence, against its own invoice — never a personal
          account, and never mine. I check the account name against the licence before anything is
          sent.
        </P>
        <Checklist
          items={[
            {
              title: 'A personal account: no.',
              body: 'Faster, cheaper, "the company account is being changed": whatever the reason, the answer is the same.',
            },
            {
              title: 'A different company name: find out why.',
              body: 'An invoice from a Hong Kong or sister trading company is a different legal entity from the one you verified. It can be legitimate: get the reason in writing, name that company in the contract, and verify it too.',
            },
            {
              title: 'New bank details by email: assume fraud.',
              body: 'A genuine-looking invoice with changed bank details is one of the oldest frauds in the trade. Confirm by phone or video, on a number you already had.',
            },
            {
              title: 'Keep the balance for after inspection.',
              body: 'Standard terms are 30% deposit and 70% after the goods pass inspection, by T/T; the unpaid balance is what makes a rework request work. For larger orders I set up a letter of credit instead.',
            },
          ]}
        />
        <P>
          None of this needs an agent; most of it is an afternoon at a desk. What a desk cannot do is
          stand in the building. If you would rather someone did, that is my{' '}
          <A to="/services#sourcing">sourcing service</A> — three to five verified factories in five to
          eight working days, free until you approve the quotation — or an audit of a factory you found
          yourself. Fees are on the <A to="/pricing">pricing page</A>.
        </P>
      </>
    ),
  },
]

export default function VerifyFactory() {
  return (
    <GuideLayout
      guideKey="guide-verify-factory"
      standfirst="A lot of the money importers lose in China is lost before production starts — to a trader posing as a factory, a licence that does not match the bank account, or a supplier that was never going to make the goods itself. These are the checks I run on every factory before a client sends a deposit, in the order I run them."
      sections={SECTIONS}
      summary={{
        points: [
          'Get the business licence, and read the 18-character code off it.',
          'Look the company up on gsxt.gov.cn yourself.',
          'Check the business scope says make, not only sell.',
          'Do the capacity sum, and ask what is sub-contracted.',
          "Pay only a corporate account in the licence's exact name.",
        ],
        cta: { label: 'See a sample audit report', to: '/audit' },
        note: 'ON-SITE AUDIT · US$390 PER FACTORY · REPORT IN 4 WORKING DAYS',
        more: { label: 'Or send me the supplier to check', to: '/contact' },
      }}
    />
  )
}
