// Guide: AQL inspection — what 2.5 means, and what gets checked before you pay.
//
// Beyond the canvas — no artboard, so not pixel-diffed. The frame is
// GuideLayout; the prose parts are GuideProse. The headline, summary and
// breadcrumb label are in src/lib/guides.ts, where the JSON-LD reads them too.
//
// The numbers in the table are ISO 2859-1's, transcribed, not derived: the
// code-letter table (general inspection level II) and the single-sampling
// master table for normal inspection. ANSI/ASQ Z1.4 prints the same plans.
// They were checked against the 1999 edition's tables. The third edition
// (ISO 2859-1:2026, January 2026) lists its main changes as skip-lot sampling
// and the removal of the printed OC curves, not the plans themselves — which is
// why the copy cites "ISO 2859-1" without a year. Worth re-checking against
// the 2026 tables before the guide is published. The "not permission to supply
// knowingly" caution and the right to reject any nonconforming unit found are
// both in the standard's own text.
// The acceptance probabilities in the first section are binomial, for n = 200
// and Ac = 10: P(pass) is 0.987 at 2.5% defective, 0.583 at 5% and 0.069 at
// 8%. If a figure here is ever changed, recompute it — do not round it by eye.
//
// The business practice is the site's own and is stated elsewhere in the same
// words: AQL 2.5 as standard, tightened where it matters, in-line at 20% and
// again before the container is sealed (/services); the golden sample
// (/process, /services); same-day photo report and the failed-batch answer
// (/faq); US$210 per man-day, one or two inspections per tier (/pricing);
// independent inspectors working to a plan I write (/about).
import GuideLayout, { type GuideSection } from '../../components/GuideLayout'
import { A, Callout, CalloutP, Checklist, DataTable, List, P, Strong } from '../../components/GuideProse'

const SECTIONS: GuideSection[] = [
  {
    id: 'what-aql-means',
    title: "What AQL means, and what it doesn't",
    body: (
      <>
        <P>
          AQL stands for acceptance quality limit; older documents say acceptable quality level. It is
          defined in the sampling standard ISO 2859-1, and its American counterpart, ANSI/ASQ Z1.4,
          uses the same plans. Both answer one practical question: you cannot check all 5,000 units,
          so how many do you check, and how many faults can you find in them before you reject the
          lot?
        </P>
        <P>
          The AQL is the quality level the plan is built to accept as a matter of routine, expressed
          here as a percentage of defective units. At AQL 2.5, a lot that really is 2.5% defective will
          pass almost every time.
        </P>
        <P>
          What it does not mean is that 2.5% defective is acceptable. The standard says as much: an AQL
          is not permission to supply defective units knowingly, and any defective unit found can be
          rejected even when the lot as a whole passes. Nor is the plan a precise cut-off. A sample
          tells you a lot's quality roughly, not to the decimal. With the plan for a 5,000-unit order:
        </P>
        <List
          items={[
            'a lot that is 2.5% defective passes about 99 times in 100;',
            'a lot that is 5% defective — twice the AQL — still passes a little more than half the time;',
            'a lot that is 8% defective passes fewer than one time in ten.',
          ]}
        />
        <P>
          That is what sampling is good at: catching a lot that is clearly bad. It is not good at
          telling 3% from 4%, and an inspection report that says "passed at AQL 2.5" is a statement
          about the first, not the second.
        </P>
        <Callout label="Where those figures come from">
          <CalloutP>
            They are for a sample of 200 units with an accept number of 10 — the plan the worked example
            below arrives at — and they assume the sample is drawn at random, which is the standard's
            own assumption and the reason an inspector picks the cartons, not the factory.
          </CalloutP>
        </Callout>
      </>
    ),
  },
  {
    id: 'sample-size',
    title: 'How the sample size is chosen',
    body: (
      <>
        <P>
          Two things decide it: the size of the lot and the inspection level.
        </P>
        <P>
          The inspection level sets how hard you look. General inspection level II is the default, and
          the one used unless a contract says otherwise. Level I takes smaller samples and level III
          larger ones. There are also four special levels, S-1 to S-4, with much smaller samples still,
          for tests that are slow or that destroy what they test, such as drop tests on packed cartons.
        </P>
        <P>
          After that it is two lookups. The lot size gives a code letter; the code letter gives the
          sample size and, for each AQL, the accept and reject numbers. For the lot sizes most orders
          fall into:
        </P>
        <DataTable
          id="aql-plans"
          caption="General inspection level II · single sampling · normal inspection"
          columns={['Lot size (units)', 'Code letter', 'Sample size', 'Major · AQL 2.5', 'Minor · AQL 4.0']}
          rows={[
            ['281–500', 'H', '50', 'Accept 3 · reject 4', 'Accept 5 · reject 6'],
            ['501–1,200', 'J', '80', 'Accept 5 · reject 6', 'Accept 7 · reject 8'],
            ['1,201–3,200', 'K', '125', 'Accept 7 · reject 8', 'Accept 10 · reject 11'],
            ['3,201–10,000', 'L', '200', 'Accept 10 · reject 11', 'Accept 14 · reject 15'],
            ['10,001–35,000', 'M', '315', 'Accept 14 · reject 15', 'Accept 21 · reject 22'],
          ]}
          minWidth="620px"
          note="From ISO 2859-1's code-letter table and its single-sampling master table; ANSI/ASQ Z1.4 gives the same plans. Accept: the lot passes with that many defective units in the sample, or fewer. Reject: it fails at that number or more."
        />
        <P>
          Notice that the sample does not grow in step with the order. Anything from 3,201 to 10,000
          units gets the same 200, so a bigger lot is, in proportion, checked less closely than a
          smaller one.
        </P>
      </>
    ),
  },
  {
    id: 'worked-example',
    title: 'A worked example',
    body: (
      <>
        <P>Say you have ordered 5,000 units.</P>
        <Checklist
          items={[
            {
              title: 'The code letter',
              body: '5,000 falls in the 3,201–10,000 band. At general inspection level II, that is code letter L.',
            },
            {
              title: 'The sample',
              body: 'Code letter L means 200 units, drawn at random from across the lot — from cartons at the back of the stack and the middle of the pallet, not the ones stacked by the door.',
            },
            {
              title: 'The limits',
              body: 'Critical defects: none allowed. Major defects at AQL 2.5: accept 10, reject 11. Minor defects at AQL 4.0: accept 14, reject 15.',
            },
            {
              title: 'The verdict',
              body: 'Each class is judged on its own, and the lot has to pass all three. Seven majors and twelve minors: it passes. Eleven majors: it fails, whatever the minors say. One critical: it fails.',
            },
          ]}
        />
        <P>
          The report lists every defect found and the class it was put in, with photographs, so if you
          want to argue with a classification, you are arguing with evidence rather than with a
          summary.
        </P>
      </>
    ),
  },
  {
    id: 'defect-classes',
    title: 'Critical, major and minor',
    body: (
      <>
        <Checklist
          items={[
            {
              title: 'Critical — typically zero',
              body: "A defect that could hurt someone, or that breaks a legal or safety requirement: a sharp edge, an exposed live part, a small part that comes off a child's toy, mould inside food packaging. Strictly, zero is not an AQL in the standard's table; it is a policy. One critical defect found fails the lot.",
            },
            {
              title: 'Major — typically AQL 2.5',
              body: 'A defect likely to make the product fail in use, or make your customer send it back: it does not work, does not close, is the wrong colour against the golden sample, is missing a part, or carries the wrong barcode or label.',
            },
            {
              title: 'Minor — typically AQL 4.0',
              body: 'A flaw that does not affect use and that most customers would not return the product for: a small scuff where no one looks, a loose thread, a faint glue mark.',
            },
          ]}
        />
        <P>
          The classification is written down before the inspection, product by product, in the
          checklist the inspector works from. A scratch inside a cabinet is minor; the same scratch on
          the lid of a gift box is major. Deciding that after the report arrives turns an inspection
          into a negotiation. The inspectors I use are independent third parties, working to an AQL
          plan I write for your product — independent of the factory, and independent of me.
        </P>
        <P>
          AQL 2.5 is my standard, and I tighten it where it matters: a lower AQL for the defects your
          customers notice first, or a larger sample on a product where one bad unit costs more than
          the inspection does. For an Amazon seller, whose real risk is a bad batch sinking a review
          score, tighter limits on major defects are cheap insurance.
        </P>
      </>
    ),
  },
  {
    id: 'what-gets-checked',
    title: 'What gets checked besides defects',
    body: (
      <>
        <P>
          Counting defects is the core of it, but a pre-shipment inspection looks at more than faults in
          the product:
        </P>
        <List
          items={[
            <><Strong>Quantity</Strong> — that what is packed matches the order.</>,
            <><Strong>Packaging and marking</Strong> — carton marks, barcodes, and FBA labels where they
              apply.</>,
            <><Strong>Specification</Strong> — dimensions, weight and materials against the spec sheet
              you signed off.</>,
            <><Strong>Function</Strong> — does it work, and do packed cartons survive a drop test.</>,
            <><Strong>The golden sample</Strong> — the goods side by side with the sample you
              approved.</>,
          ]}
        />
        <P>
          That last check only works if there is a golden sample to hold up. When you approve a sample,
          I seal a duplicate at my Guangzhou office as the reference every batch is judged against.
          "Must match the approved sample" is only an enforceable line in a contract while someone can
          put the approved sample on the table next to the goods.
        </P>
      </>
    ),
  },
  {
    id: 'when-to-inspect',
    title: 'When to inspect: twice',
    body: (
      <>
        <P>
          An inspection at the end, on its own, has one weakness: by the time it finds a problem, the
          whole order has been made with it. So I inspect twice.
        </P>
        <Checklist
          items={[
            {
              title: 'In-line, at 20% of production',
              body: 'Early enough that problems are still fixable — a wrong colour, a tooling fault or a packaging mistake caught on the first units rather than the last.',
            },
            {
              title: 'Pre-shipment, before the container is sealed',
              body: 'Once production is finished and packed, against the full AQL plan. Nothing leaves the floor until you have seen the report and said yes.',
            },
            {
              title: 'Loading, when it matters',
              body: 'Container loading supervision checks that what passed inspection is what goes into the container, and that it is loaded to arrive intact.',
            },
          ]}
        />
        <P>
          The photo report reaches you the same day, with defects classified and a hold-or-ship
          recommendation. The final call is always yours. As an add-on, inspection is US$210 per
          man-day and loading supervision US$180 per container; a single-order engagement includes one
          pre-shipment inspection, and the ongoing programme two per order — the{' '}
          <A to="/pricing">pricing page</A> has the rest. Where the inspections sit in the whole order,
          from brief to shipping, is on <A to="/process">how it works</A>.
        </P>
      </>
    ),
  },
  {
    id: 'failed-batch',
    title: 'What happens when a batch fails',
    body: (
      <>
        <P>
          Nothing ships. The report sets out every defect by class, with a recommendation. Usually the
          factory reworks at its own cost — sorting, repairing or remaking — and the goods are inspected
          again before anything is loaded.
        </P>
        <P>
          What makes a rework request work is the payment terms. The standard split is 30% deposit and
          70% after the goods pass inspection, so when a batch fails, the larger share of the money has
          not moved yet. A factory that has already been paid in full has much less reason to fix
          anything.
        </P>
        <P>
          If the factory refuses and I cannot fix it, I refund my service fee on that order in full and
          help you claim from the supplier. The other questions buyers ask about this are answered on
          the <A to="/faq">FAQ</A>, and what my <A to="/services#inspection">quality inspection</A>{' '}
          service includes is on the services page.
        </P>
      </>
    ),
  },
]

export default function AqlInspection() {
  return (
    <GuideLayout
      guideKey="guide-aql-inspection"
      standfirst="AQL 2.5 is the standard I inspect to, and it is the most quoted number in buying from China — and one of the least understood. This is what it means, how many units actually get checked, what the pass and fail numbers are, and when in production to inspect."
      sections={SECTIONS}
      summary={{
        points: [
          'AQL is a sampling plan, not a defect allowance.',
          'Lot size and inspection level II set the sample: 5,000 units, 200 checked.',
          'Typical limits: critical 0, major 2.5, minor 4.0.',
          'At 200 units and AQL 2.5, ten major defects pass and eleven fail.',
          'Inspect twice: at 20% of production, and before the container is sealed.',
        ],
        cta: { label: 'Quality inspection', to: '/services#inspection' },
        note: 'US$210 PER MAN-DAY · SAME-DAY PHOTO REPORT',
        more: { label: 'What happens if a batch fails', to: '/faq' },
      }}
    />
  )
}
