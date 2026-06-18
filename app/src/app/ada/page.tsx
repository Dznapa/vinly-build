// NEEDS REVIEW: built from spec only

import { PageChrome } from '@/components/PageChrome';

export default function AdaPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> ACCESSIBILITY
        </h1>

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
            Accessibility statement
          </h4>
          <p style={{ margin: '0 0 14px', color: '#555', lineHeight: 1.6 }}>
            Vinly is committed to accessibility. We work to ensure that our
            website is usable by the widest possible audience, including
            people who rely on assistive technologies such as screen readers,
            keyboard navigation, and screen magnification.
          </p>
          <p style={{ margin: '0 0 14px', color: '#555', lineHeight: 1.6 }}>
            We aim to meet the Web Content Accessibility Guidelines (WCAG)
            2.1 Level AA across the site. Accessibility is an ongoing effort,
            and we welcome feedback that helps us improve.
          </p>
          <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
            If you encounter an accessibility barrier on Vinly, or if you
            need information from this site in an alternative format, please
            email{' '}
            <a
              href="mailto:accessibility@vinly.local"
              style={{ color: '#F26A35', textDecoration: 'underline' }}
            >
              accessibility@vinly.local
            </a>{' '}
            and we will respond as quickly as possible.
          </p>
        </div>
      </div>
    </PageChrome>
  );
}
