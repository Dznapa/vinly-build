// NEEDS REVIEW: built from spec only

import { PageChrome } from '@/components/PageChrome';

export default function ShippingReturnsPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> SHIPPING &amp; RETURNS
        </h1>

        <div
          className="signup-card"
          style={{ maxWidth: 720, margin: '0 auto 24px' }}
        >
          <h4
            style={{
              margin: '0 0 12px',
              color: '#1f1f1f',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Shipping
          </h4>
          <p style={{ margin: '0 0 10px', color: '#555', lineHeight: 1.6 }}>
            Ground shipping is free on orders of 6 or more bottles. Orders with
            fewer than 6 bottles ship at a flat rate of $14.95.{' '}
            <em style={{ color: '#b3261e' }}>
              (NEEDS REVIEW: confirm flat-rate amount)
            </em>
          </p>
          <p style={{ margin: '0 0 10px', color: '#555', lineHeight: 1.6 }}>
            We ship Monday through Friday. Orders placed after our daily
            cutoff ship the next business day.
          </p>
          <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
            An adult signature (21+) is required on delivery for every Vinly
            shipment. Carriers will attempt delivery up to three times before
            returning the package to the warehouse.
          </p>
        </div>

        <div
          className="signup-card"
          style={{ maxWidth: 720, margin: '0 auto 60px' }}
        >
          <h4
            style={{
              margin: '0 0 12px',
              color: '#1f1f1f',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Returns
          </h4>
          <p style={{ margin: '0 0 10px', color: '#555', lineHeight: 1.6 }}>
            All sales are final on SESH and Ticker quick-buy offers. Once your
            lock window closes and the order is confirmed, it cannot be
            cancelled or refunded.
          </p>
          <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
            Damage claims must be filed within 7 days of delivery and require
            a photo of the affected bottles and outer packaging. Contact
            Customer Service to start a claim.
          </p>
        </div>
      </div>
    </PageChrome>
  );
}
