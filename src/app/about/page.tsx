import { PageChrome } from '@/components/PageChrome';

const H4: React.CSSProperties = { margin: '24px 0 8px', color: '#1f1f1f', fontSize: 16, fontWeight: 700 };
const P: React.CSSProperties = { margin: '0 0 10px', color: '#555', lineHeight: 1.6 };
const LIST: React.CSSProperties = { margin: '0 0 10px', paddingLeft: 20, color: '#555', lineHeight: 1.6 };
const LEAD: React.CSSProperties = { margin: '0 0 12px', color: '#1f1f1f', fontSize: 17, fontWeight: 700 };
const CRED_TITLE: React.CSSProperties = { color: '#1f1f1f', fontWeight: 700 };

export default function AboutPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> About Us
        </h1>

        <div className="signup-card" style={{ maxWidth: 720, margin: '0 auto 60px' }}>
          <p style={{ ...P, marginBottom: 6 }}>
            Vinly was founded by four individuals who prefer to let the bottles (and the market) do
            the talking. No ego, no center-stage selfies, no personal brands to maintain. Just a
            shared obsession: wine, strategy, and the thrill of the trade.
          </p>

          <h4 style={H4}>What We&apos;ll Tell You</h4>
          <p style={P}>
            Between the four of us, there&apos;s more than enough experience to back up why
            you&apos;re in good hands — and why your wine portfolio is in even better hands.
          </p>

          <h4 style={H4}>Our Founding Philosophy</h4>
          <p style={LEAD}>Wine should move as fast as markets.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '0 0 12px' }}>
            <span style={callout}>Bottles traded in real time</span>
            <span style={callout}>No dusty shelves — only market action</span>
          </div>
          <p style={P}>
            Bottles aren&apos;t just sitting on dusty shelves. They&apos;re trading, shifting,
            reacting in real time. That&apos;s where we come in.
          </p>

          <h4 style={H4}>Why Trust Us?</h4>
          <p style={P}>
            Because we&apos;re not here for the spotlight. We&apos;re here to make sure the wine you
            buy is:
          </p>
          <ul style={LIST}>
            <li style={{ marginBottom: 8 }}>Priced strategically (and shifts by the second)</li>
            <li style={{ marginBottom: 8 }}>
              Curated by people who&apos;ve lived, breathed, and frankly, drank wine for decades
            </li>
            <li>Delivered without the fluff, snobbery, or gatekeeping</li>
          </ul>
          <p style={P}>
            Think of us as your behind-the-scenes sommelier squad, finance geeks, vigneron, and
            market-makers all rolled into one.
          </p>

          <h4 style={H4}>Our (Mostly Anonymous) Credentials</h4>
          <ol style={{ ...LIST, marginBottom: 0 }}>
            <li style={{ marginBottom: 14 }}>
              <div style={CRED_TITLE}>The Wild Hog Trapper Turned Wine Insider</div>
              <p style={{ ...P, marginBottom: 0 }}>
                Some people sell wine. Others spend evenings tracking down wild hogs, and still show
                up in the morning ready to hunt down the next best deal. This partner has spent the
                last decade sourcing and trading a diverse range of commodities — some from the
                vineyard, others far off the beaten path. He&apos;s quick, strategic, and always
                ahead of the game.
              </p>
            </li>
            <li style={{ marginBottom: 14 }}>
              <div style={CRED_TITLE}>The Finance Wizard (and Brother of the Hog Trapper)</div>
              <p style={{ ...P, marginBottom: 0 }}>
                Sibling rivalry? Maybe. One brother&apos;s in the wild, the other&apos;s deep in the
                numbers. A high-tech finance mind who turns complex data into winning strategies —
                running Monte Carlo simulations on wine prices for fun. He keeps our marketplace
                smart, fluid, and opportunity-driven.
              </p>
            </li>
            <li style={{ marginBottom: 14 }}>
              <div style={CRED_TITLE}>The Real Estate Ace &amp; Poker-Playing Wine Enthusiast</div>
              <p style={{ ...P, marginBottom: 0 }}>
                Real estate investor and venture capitalist by day, poker strategist by night, wine
                lover always. He understands deals, risk, and timing — bringing precision and calm
                to high-stakes decisions and the occasional all-in.
              </p>
            </li>
            <li>
              <div style={CRED_TITLE}>The &lsquo;Sesh&rsquo; Architect Keeping the Chaos Beautiful</div>
              <p style={{ ...P, marginBottom: 0 }}>
                Moved to Napa Valley in 1998, before wine was trendy. Credentials from the Master
                Sommelier Guild, WSET, and the Society of Wine Educators. He&apos;s not here to flex
                — he&apos;s here to make our curation smarter, sharper, and more fun.
              </p>
            </li>
          </ol>
        </div>
      </div>
    </PageChrome>
  );
}

const callout: React.CSSProperties = {
  background: 'rgba(242, 106, 53, 0.1)',
  border: '1px solid rgba(242, 106, 53, 0.3)',
  color: '#b4531f',
  borderRadius: 999,
  padding: '6px 14px',
  fontSize: 13.5,
  fontWeight: 600,
};
