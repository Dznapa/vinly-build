import type { ReactNode, CSSProperties } from 'react';
import { PageChrome } from '@/components/PageChrome';

const H3: CSSProperties = { margin: '0 0 8px', color: '#1f1f1f', fontSize: 17, fontWeight: 700 };
const P: CSSProperties = { margin: 0, color: '#555', lineHeight: 1.6 };
const P_INTRO: CSSProperties = { margin: '0 0 12px', color: '#555', lineHeight: 1.6 };
const LIST: CSSProperties = { margin: 0, paddingLeft: 20, color: '#555', lineHeight: 1.6 };
const LINK: CSSProperties = { color: 'var(--orange)', textDecoration: 'underline' };

// mailto + external link helpers (external opens in a new tab).
const Mail = () => (
  <a href="mailto:support@vinlywine.com" style={LINK}>support@vinlywine.com</a>
);
const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={LINK}>{children}</a>
);

const SECTIONS: { title: string; body: ReactNode }[] = [
  {
    title: 'This Is Not a Real Stock Exchange',
    body: `While we talk like hedge fund managers and drop "IPOs" daily, please note: Vinly is not a financial exchange, and no actual securities or investment contracts are being traded here. Our use of terms like "IPO," "Ticker," and "Market" is strictly for entertainment, gamification, and brand identity. Nothing on this platform constitutes investment advice, a securities offering, or a financial instrument of any kind. You are purchasing physical wine for personal consumption or collection, not with the expectation of financial profit or as an investment. Any "strategy" referenced on the platform is for the sport of the hunt, not a promise of ROI. Vinly's dynamic pricing reflects retail supply and demand — it does not represent or track the value of any underlying asset, security, or investment contract. It's just wine. Glorious, delicious, properly priced wine.`,
  },
  {
    title: 'Prices Fluctuate in Real Time',
    body: (
      <p style={P}>
        {`Yes, the price will move. Vinly pricing responds to demand in real time, just like the market. No refunds for hesitation, overthinking, or second-guessing. The price you see at checkout is the price you pay — lock it or lose it. We aim to offer competitive pricing and endeavor not to list products above the manufacturer's suggested retail price ("MSRP") or the best verified web price from a licensed retailer at the time of listing. If you believe you have found a lower price, submit it to `}
        <Mail />
        {`. We will review and determine appropriate action at our discretion. See our `}
        <Ext href="https://vinlywine.com/price-match">Price-Match Policy</Ext>
        {` for details.`}
      </p>
    ),
  },
  {
    title: 'Vinly Is a Marketing Platform — Not the Seller of Record',
    body: (
      <p style={P}>
        {`Vinly operates solely as a marketing and discovery platform. We do not take title to the wine, hold alcohol licenses, or act as the seller of record. All purchases are fulfilled and sold by our licensed California wine retailer partner ("Seller of Record"), who handles compliance with all alcohol laws and regulations. The Seller of Record has final discretion to accept or reject any order and determine final pricing. See seller details at `}
        <Ext href="https://vinlywine.com/seller-of-record">Seller of Record</Ext>
        {`.`}
      </p>
    ),
  },
  {
    title: 'You Opted In to Texts',
    body: `By opting in, you agree to receive recurring automated marketing texts from Vinly about drops, deals, and events. Message frequency varies. Standard message/data rates may apply. Reply STOP to opt out, or HELP for assistance. Consent is not required for purchase.`,
  },
  {
    title: 'Shipping & Returns',
    body: (
      <ul style={LIST}>
        <li style={{ marginBottom: 8 }}><strong>Availability:</strong> We ship only to eligible U.S. states.</li>
        <li style={{ marginBottom: 8 }}><strong>Timeframes:</strong> Orders typically ship within 2–5 business days.</li>
        <li style={{ marginBottom: 8 }}><strong>Adult Signature Required:</strong> Must be 21+ at delivery.</li>
        <li style={{ marginBottom: 8 }}><strong>Returns &amp; Refunds:</strong> All sales are final. Contact <Mail /> within 7 days for issues.</li>
        <li><strong>Corked or Flawed Bottles:</strong> Contact us for review and possible replacement.</li>
      </ul>
    ),
  },
  {
    title: 'Age Verification',
    body: `You must be 21+ to use Vinly. Age is verified at checkout and delivery.`,
  },
  {
    title: 'Winemaker Access Is Real, But Limited',
    body: `Exclusive drops are limited and subject to sell-out without notice.`,
  },
  {
    title: 'Intellectual Property',
    body: `All content, branding, and designs are owned by Vinly or its licensors. User-submitted content grants Vinly a perpetual license for usage and marketing.`,
  },
  {
    title: 'Privacy & Your Data',
    body: `We collect necessary user data to operate the platform and comply with laws. We do not sell personal data. Users may request access, deletion, or correction.`,
  },
  {
    title: 'Limitation of Liability',
    body: `Liability is limited to the amount paid for the order. No indirect damages apply.`,
  },
  {
    title: 'Indemnification',
    body: `Users agree to indemnify Vinly against claims arising from misuse or violations.`,
  },
  {
    title: 'Account Termination',
    body: `Accounts violating terms may be suspended or terminated.`,
  },
  {
    title: 'Dispute Resolution & Arbitration',
    body: `Disputes must first be resolved informally, then via binding arbitration if needed.`,
  },
  {
    title: 'Governing Law',
    body: `Governed by Nevada law. Jurisdiction in Clark County courts.`,
  },
  {
    title: 'Changes to Terms',
    body: `Terms may be updated. Continued use indicates acceptance.`,
  },
  {
    title: 'Force Majeure',
    body: `Not liable for delays beyond control (weather, disasters, etc.).`,
  },
  {
    title: 'General Provisions',
    body: `Includes severability, no waiver, entire agreement, and assignment clauses.`,
  },
  {
    title: 'The Market Is Brutal. Vinly Is Beautiful.',
    body: `You might miss a deal. You might regret it. But you'll be back. This is about great wine, not financial returns.`,
  },
];

export default function TermsPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> Terms of Service
        </h1>

        <div className="signup-card" style={{ maxWidth: 720, margin: '0 auto 60px' }}>
          <p style={{ margin: '0 0 18px', color: '#777', fontStyle: 'italic', fontSize: 15 }}>
            Because Even the Fun Needs Fine Print.
          </p>

          <p style={P_INTRO}>
            Welcome to Vinly. By visiting this site, creating an account, signing up for texts, or
            making a purchase through our platform, you agree to the following terms. If that sounds
            intimidating, take a sip and read on — we made it entertaining.
          </p>
          <p style={{ ...P_INTRO, marginBottom: 24 }}>
            By using Vinly, you represent and warrant that you are 21 years of age or older and
            legally permitted to purchase alcohol in your jurisdiction. We use third-party age
            verification services at checkout to help confirm this. If verification fails, we will
            not complete the transaction.
          </p>

          <h2 style={{ margin: '0 0 16px', color: '#1f1f1f', fontSize: 18, fontWeight: 800 }}>
            Terms &amp; Conditions
          </h2>

          {SECTIONS.map((s, i) => (
            <div key={i} style={{ marginBottom: 22 }}>
              <h3 style={H3}>
                {String(i + 1).padStart(2, '0')}. {s.title}
              </h3>
              {typeof s.body === 'string' ? <p style={P}>{s.body}</p> : s.body}
            </div>
          ))}

          <div style={{ marginTop: 10, paddingTop: 16, borderTop: '1px solid #eef0f3', color: '#777', fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 6px' }}>Effective date: April 1, 2026</p>
            <p style={{ margin: 0 }}>
              Questions? <Mail /> · Privacy Policy:{' '}
              <Ext href="https://vinlywine.com/privacy-policy">vinlywine.com/privacy</Ext>
            </p>
          </div>
        </div>
      </div>
    </PageChrome>
  );
}
