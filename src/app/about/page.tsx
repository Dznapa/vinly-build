// NEEDS REVIEW: built from spec only

import { PageChrome } from '@/components/PageChrome';

export default function AboutPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> ABOUT
        </h1>

        <div
          className="signup-card"
          style={{ maxWidth: 720, margin: '0 auto 60px' }}
        >
          <p style={{ margin: '0 0 14px', color: '#555', lineHeight: 1.6 }}>
            Vinly is a live wine market built for people who love deep cuts —
            the small allocations, single-vineyard bottlings, and back-vintage
            finds that usually never reach a retail shelf. Every drop is
            hand-picked by our team and priced in the open.
          </p>
          <p style={{ margin: '0 0 14px', color: '#555', lineHeight: 1.6 }}>
            Our SESH format runs like an open market: a tight time window, a
            real-time price chart, and a fixed inventory. You see what the
            market is paying, you see the MSRP, and you decide when to buy.
          </p>
          <p style={{ margin: '0 0 22px', color: '#555', lineHeight: 1.6 }}>
            No mystery cases, no inflated &ldquo;original&rdquo; prices, no
            algorithmic upsells. Just bottles worth pouring, surfaced for the
            people who care.
          </p>

          <h4
            style={{
              margin: '0 0 12px',
              color: '#1f1f1f',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Our promise
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#555', lineHeight: 1.6 }}>
            <li style={{ marginBottom: 8 }}>
              Every wine is tasted and approved by the Vinly team before it
              hits the market.
            </li>
            <li style={{ marginBottom: 8 }}>
              Prices are live and transparent — MSRP and street price are
              always shown alongside the SESH price.
            </li>
            <li>
              Allocations are real. When a SESH is gone, it is gone — we do
              not restock to chase demand.
            </li>
          </ul>
        </div>
      </div>
    </PageChrome>
  );
}
