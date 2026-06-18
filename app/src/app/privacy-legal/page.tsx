// NEEDS REVIEW: built from spec only

import { PageChrome } from '@/components/PageChrome';

export default function PrivacyLegalPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> PRIVACY &amp; LEGAL
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

          <h3
            style={{
              margin: '0 0 10px',
              color: '#1f1f1f',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Information we collect
          </h3>
          <p style={{ margin: '0 0 20px', color: '#555', lineHeight: 1.6 }}>
            We collect the information you provide when you create an account,
            place an order, or contact us — including your name, email, phone
            number, shipping address, and date of birth. We also collect basic
            device and usage data when you browse the site.
          </p>

          <h3
            style={{
              margin: '0 0 10px',
              color: '#1f1f1f',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            How we use it
          </h3>
          <p style={{ margin: '0 0 20px', color: '#555', lineHeight: 1.6 }}>
            We use your information to verify age, qualify you for SESH offers,
            process orders, ship wine, and provide customer support. With your
            permission, we may also send Ticker alerts and new drop
            announcements. We do not sell your personal information.
          </p>

          <h3
            style={{
              margin: '0 0 10px',
              color: '#1f1f1f',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Cookies
          </h3>
          <p style={{ margin: '0 0 20px', color: '#555', lineHeight: 1.6 }}>
            Vinly uses cookies and similar technologies to keep you signed in,
            remember your cart, and understand how the site is used. You can
            control cookies through your browser settings; some features may
            not work if cookies are disabled.
          </p>

          <h3
            style={{
              margin: '0 0 10px',
              color: '#1f1f1f',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Your choices
          </h3>
          <p style={{ margin: '0 0 20px', color: '#555', lineHeight: 1.6 }}>
            You can review and update your account details, change your
            email preferences, or request deletion of your account at any
            time. Contact us at the address below to exercise these rights.
          </p>

          <h3
            style={{
              margin: '0 0 10px',
              color: '#1f1f1f',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Contact
          </h3>
          <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
            Questions about this policy? Email{' '}
            <a
              href="mailto:privacy@vinly.local"
              style={{ color: '#F26A35', textDecoration: 'underline' }}
            >
              privacy@vinly.local
            </a>
            .
          </p>
        </div>
      </div>
    </PageChrome>
  );
}
