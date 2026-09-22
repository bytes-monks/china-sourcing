// Guide: FOB, CIF or DDP — what the price includes, and where the risk passes.
//
// Beyond the canvas — no artboard, so not pixel-diffed. The frame is
// GuideLayout; the prose parts are GuideProse. The headline, summary and
// breadcrumb label are in src/lib/guides.ts, where the JSON-LD reads them too.
//
// The Incoterms facts are the ICC's, for the 2020 edition: eleven rules, four
// of them sea-and-inland-waterway only; FOB and CIF both pass risk on board at
// the port of shipment; CIF's minimum cover is Institute Cargo Clauses (C) at
// 110% (CIP's became (A) in 2020, CIF's did not); DDP delivers cleared for
// import and duty paid; the ICC steers containers to FCA rather than FOB.
// Amazon's refusal to act as importer of record for FBA stock is its published
// policy. None of it is paraphrased from a forwarder's brochure.
//
// The business practice is the site's own: three-way quotes (FOB, CIF,
// door-to-door), established Guangzhou forwarders, carrier invoices at cost
// and no freight margin, the document pack and weekly updates, 28–34 days
// Guangzhou to the EU by sea (/services, /pricing); FOB prices on the
// shortlist comparison sheet (/services); a target landed price in the brief
// (/process); US$180 loading supervision (/pricing).
import GuideLayout, { type GuideSection } from '../../components/GuideLayout'
import { A, DataTable, List, P, Strong } from '../../components/GuideProse'

const SECTIONS: GuideSection[] = [
  {
    id: 'what-incoterms-decide',
    title: 'What an Incoterms rule decides',
    body: (
      <>
        <P>
          Incoterms are eleven trade rules published by the International Chamber of Commerce. The
          current edition, Incoterms 2020, has applied since 1 January 2020. Each rule answers three
          questions for the contract it is written into: who arranges and pays for each leg of the
          journey, where the risk of loss or damage passes from seller to buyer, and who clears the
          goods through customs at each end.
        </P>
        <P>
          Just as useful is what they do not decide. An Incoterms rule says nothing about when you own
          the goods, when or how you pay, or what happens if the goods are wrong. Those belong in the
          contract. And a rule only means something with a place and an edition attached: "FOB
          Shenzhen, Incoterms 2020" is a term; "FOB" on its own is a hint.
        </P>
        <P>
          Seven of the rules work for any mode of transport, and four — FAS, FOB, CFR and CIF — only for
          sea and inland waterway. Buying from China, the ones you will meet are EXW, FOB, CIF and DDP,
          and DAP hiding inside a good many door-to-door quotes.
        </P>
      </>
    ),
  },
  {
    id: 'exw',
    title: 'EXW: the price at the factory gate',
    body: (
      <>
        <P>
          Under Ex Works, the seller makes the goods available at its own premises, and that is all.
          They are not loaded onto your truck and not cleared for export. Everything after that —
          loading, trucking to the port, Chinese export customs, freight, insurance, import — is yours.
        </P>
        <P>
          EXW prices look cheapest because they include the least. They also carry a practical snag: as
          an overseas buyer you cannot lodge a Chinese export declaration yourself, so someone in China
          has to — your forwarder, or the factory for a fee. In practice an EXW deal from China tends to
          turn into FOB with extra invoices, and it is usually simpler to ask for FOB in the first
          place.
        </P>
      </>
    ),
  },
  {
    id: 'fob',
    title: 'FOB: the price factories quote',
    body: (
      <>
        <P>
          Under Free On Board, the seller clears the goods for export and loads them on board the
          vessel you have nominated, at the named port of shipment. <Strong>The risk passes to you once
          the goods are on board.</Strong> From there the freight, the insurance, the destination
          charges, the import duty and the clearance at your end are yours — and so is the choice of
          forwarder and ship.
        </P>
        <P>
          The named place is the port of shipment: FOB Shenzhen, FOB Guangzhou, FOB Ningbo. Yiwu, where
          a lot of small-order buyers start, is an inland city with no seaport, so goods bought there
          usually ship FOB Ningbo or Shanghai; a quote marked "FOB Yiwu" deserves a question about what
          it actually includes.
        </P>
        <P>
          One technicality. The ICC's own guidance is that FOB does not suit containers, because a
          container is handed over at a terminal, often days before it is lifted on board — and for
          those days the goods are at the seller's risk but out of the seller's hands. It recommends
          FCA instead. In practice most Chinese factories quote FOB for container goods anyway, and it
          works as long as both sides understand the gap.
        </P>
        <P>
          FOB is also how I compare factories. Every price on my shortlist comparison sheet is FOB, so
          three to five factories are measured on the same basis, and the freight stays under your
          control. And because the risk passes as the goods go on board, the loading is the moment
          worth watching: container loading supervision is US$180 a container.
        </P>
      </>
    ),
  },
  {
    id: 'cif',
    title: 'CIF: freight paid, risk not',
    body: (
      <>
        <P>
          Under Cost, Insurance and Freight, the seller does everything FOB asks of it, and also pays
          the freight to the named port of destination — CIF Rotterdam, CIF Felixstowe — and buys cargo
          insurance for your benefit. Incoterms 2020 sets the minimum cover at Institute Cargo Clauses
          (C), for 110% of the contract price.
        </P>
        <P>
          Here is the misunderstanding that costs people money: <Strong>under CIF the risk still passes
          when the goods are on board at the port of shipment</Strong>, exactly as under FOB. The seller
          pays for the voyage; it does not carry the voyage's risk. If the container is damaged at sea,
          the claim is yours to make, under a policy you did not choose, with an insurer you may never
          have heard of.
        </P>
        <P>
          And (C) is the narrowest of the standard cargo clauses. It covers major casualties — fire,
          explosion, the vessel sinking, stranding or colliding — and not, for example, theft or most
          handling damage. You can agree wider cover, Institute Cargo Clauses (A), in the contract.
          Incoterms 2020 made (A) the minimum for CIP, CIF's any-transport sibling, but left CIF at (C).
        </P>
        <P>
          The second catch is cost. Under CIF the seller chooses the forwarder, and the charges at the
          destination — terminal handling, documentation and delivery-order fees — are yours when the
          goods arrive, payable to that forwarder's agent. A CIF price that looks cheap on freight can
          be made up at the other end. Compare CIF quotes on what the goods cost you delivered, never
          on the headline.
        </P>
      </>
    ),
  },
  {
    id: 'ddp',
    title: 'DDP, DAP and door-to-door',
    body: (
      <>
        <P>
          Under Delivered Duty Paid, the seller delivers to the named place in your country, cleared for
          import, with the duty and import taxes paid, ready for unloading. It is the most the seller
          can take on, and the least you can.
        </P>
        <P>
          Its sibling DAP, Delivered at Place, is the same journey without the import: the seller
          delivers to your named place, and the import clearance and duty are yours. Many door-to-door
          quotes are one or the other without saying which, so the first question to ask of any
          door-to-door price is whether duty and import tax are in it.
        </P>
        <P>
          The harder question under DDP is whose name the goods are imported in. Whoever is the importer
          is who customs holds responsible for the declaration — the value, the tariff classification,
          the product's compliance. A factory in China is rarely set up to be the importer into your
          country; that usually needs a local registration, such as an EORI number in the EU or the UK.
          So DDP from China is usually arranged by a forwarder, clearing the goods under its own name or
          someone else's. Before you accept one, ask:
        </P>
        <List
          items={[
            'whose name the import declaration is in;',
            'what value and tariff code the goods will be declared under;',
            'whether duty and import VAT or sales tax are included, or charged on arrival;',
            'what is excluded — residential delivery, a tail-lift, storage, booking fees at the warehouse.',
          ]}
        />
        <P>
          Two consequences are easy to miss. If you are VAT-registered, import VAT paid in someone
          else's name is usually import VAT you cannot reclaim. And if you sell on Amazon, Amazon will
          not act as importer of record for FBA stock, so that question needs an answer before the
          goods leave China.
        </P>
      </>
    ),
  },
  {
    id: 'comparison',
    title: 'Side by side',
    body: (
      <>
        <P>
          The same five rules, reduced to the questions that decide what a quote is worth. Read the
          "risk" column twice: it is the one people get wrong.
        </P>
        <DataTable
          id="incoterms"
          caption="Incoterms 2020, buying from China"
          columns={['Rule', 'Export clearance', 'Main freight', 'Insurance', 'Risk passes to you', 'Import clearance & duty']}
          rows={[
            ['EXW', 'You', 'You', 'Your choice', 'At the factory, once the goods are made available — before loading', 'You'],
            ['FOB', 'Seller', 'You', 'Your choice', 'On board the vessel at the port of shipment', 'You'],
            ['CIF', 'Seller', 'Seller, to the destination port', 'Seller: at least ICC (C), 110%', 'On board the vessel at the port of shipment — as FOB', 'You, plus destination port charges'],
            ['DAP', 'Seller', 'Seller, to your named place', "Seller's choice; no obligation", 'At your named place, ready for unloading', 'You'],
            ['DDP', 'Seller', 'Seller, to your named place', "Seller's choice; no obligation", 'At your named place, ready for unloading', 'Seller — ask in whose name'],
          ]}
          minWidth="680px"
          note="Unloading at the named place is yours under DAP and DDP. Under CIF, unloading at the destination port is yours unless the seller's contract of carriage includes it. Ownership, payment and remedies for faulty goods are set by the contract, not by the rule."
        />
      </>
    ),
  },
  {
    id: 'landed-cost',
    title: 'Compare landed cost — and how I quote it',
    body: (
      <>
        <P>
          The only fair comparison between two terms is landed cost: what the goods cost you on your own
          warehouse floor. Add up:
        </P>
        <List
          items={[
            'the product price, on FOB terms so that factories are comparable;',
            'freight — sea, as a full or shared container (FCL or LCL), or air and express;',
            'cargo insurance;',
            "charges at both ports, and your customs broker's fee;",
            "import duty, which depends on the product's tariff code and origin;",
            'import VAT, GST or sales tax, where you cannot reclaim it;',
            'delivery from the port to your door.',
          ]}
        />
        <P>
          That is why the brief I ask for includes a target landed price, not only a unit price, and
          why I quote freight three ways — FOB, CIF and door-to-door — so you can see exactly what the
          convenience costs. I book through established Guangzhou forwarders; carrier invoices are
          passed through at cost with the paperwork attached, and I take no margin on freight. You get
          a booking confirmation, a customs-ready document pack, and weekly position updates until it
          lands. By sea, Guangzhou to the EU runs 28 to 34 days.
        </P>
        <P>
          Which term is right for you depends on your volume, and on whether you already have a customs
          broker at home. If you are not sure, send me the product and the destination and I will price
          all three. The <A to="/services#freight">freight service</A> is described on the services
          page, my fees are on the <A to="/pricing">pricing page</A>, and the quickest way to a quote is
          the <A to="/contact">contact form</A>.
        </P>
      </>
    ),
  },
]

export default function FobCifDdp() {
  return (
    <GuideLayout
      guideKey="guide-fob-cif-ddp"
      standfirst="Factories quote FOB, forwarders sell door-to-door, and somewhere in between sits CIF, which looks like the safe choice and usually is not. These are the Incoterms rules you will actually meet buying from China: what each one makes the seller pay for, who clears customs, and the point at which the goods become your problem."
      sections={SECTIONS}
      summary={{
        points: [
          'Incoterms decide who pays for what and where the risk passes — not ownership, not payment.',
          'FOB: the risk is yours once the goods are on board in China.',
          'CIF: the seller pays freight and minimum insurance, but the risk still passes on board in China.',
          'DDP: delivered cleared and duty paid — ask whose name the import is in.',
          'Compare on landed cost, never on the headline price.',
        ],
        cta: { label: 'Freight, sea & air', to: '/services#freight' },
        note: 'QUOTED FOB, CIF & DOOR-TO-DOOR · NO FREIGHT MARGIN',
        more: { label: 'Ask me for a three-way quote', to: '/contact' },
      }}
    />
  )
}
