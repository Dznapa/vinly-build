// NEEDS REVIEW: built from spec only

import { PageChrome } from '@/components/PageChrome';

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: 'Acceptance',
    body: 'By accessing or using Vinly, you agree to these Terms of Service. If you do not agree, do not use the site. We may update these terms from time to time; continued use of Vinly after an update constitutes acceptance of the revised terms.',
  },
  {
    title: 'Eligibility (21+)',
    body: 'Vinly is only available to individuals who are at least 21 years of age. By creating an account or placing an order you represent that you meet this age requirement and are legally permitted to purchase and receive wine in your jurisdiction.',
  },
  {
    title: 'Accounts',
    body: 'You are responsible for the accuracy of the information you provide and for keeping your credentials secure. You may not share your account, transfer it to anyone else, or use it on behalf of a third party without our written permission.',
  },
  {
    title: 'Purchases & SESH',
    body: 'SESH and Ticker quick-buy offers reserve inventory and lock pricing for a limited window (typically 15 minutes). All sales on SESH and quick-buy offers are final once the lock expires and the order is confirmed.',
  },
  {
    title: 'Shipping',
    body: 'Wine ships only to addresses in U.S. states where direct-to-consumer wine shipping is legal. An adult signature (21+) is required on delivery. Vinly is not responsible for delays caused by carriers, weather, or recipient unavailability.',
  },
  {
    title: 'Returns',
    body: 'Standard Shop orders may be cancelled before they leave our warehouse. Damage claims must be filed within 7 days of delivery and include photographic evidence. SESH and Ticker offers are final sale.',
  },
  {
    title: 'Disclaimers',
    body: 'Vinly is provided on an "as is" and "as available" basis. We do not warrant that the site will be uninterrupted or error-free, and to the maximum extent permitted by law we disclaim all implied warranties.',
  },
  {
    title: 'Governing law',
    body: 'These terms are governed by the laws of the State of California, without regard to its conflict of laws principles. Any dispute arising from your use of Vinly will be resolved exclusively in the state or federal courts located in California.',
  },
];

export default function TermsPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> TERMS AND CONDITIONS
        </h1>

        <div
          className="signup-card"
          style={{ maxWidth: 720, margin: '0 auto 60px' }}
        >
          <p
            style={{
              margin: '0 0 22px',
              color: '#777',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Last updated: June 17, 2026
          </p>

          {SECTIONS.map((s, i) => (
            <div key={i} style={{ marginBottom: 22 }}>
              <h3
                style={{
                  margin: '0 0 8px',
                  color: '#1f1f1f',
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                {i + 1}. {s.title}
              </h3>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageChrome>
  );
}
