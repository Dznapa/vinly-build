import type { CSSProperties } from 'react';
import { PageChrome } from '@/components/PageChrome';

const H3: CSSProperties = { margin: '24px 0 10px', color: '#1f1f1f', fontSize: 18, fontWeight: 700 };
const H4: CSSProperties = { margin: '14px 0 6px', color: '#1f1f1f', fontSize: 15, fontWeight: 700 };
const P: CSSProperties = { margin: '0 0 12px', color: '#555', lineHeight: 1.6 };
const LIST: CSSProperties = { margin: '0 0 12px', paddingLeft: 20, color: '#555', lineHeight: 1.6 };
const LI: CSSProperties = { marginBottom: 6 };
const LINK: CSSProperties = { color: '#F26A35', textDecoration: 'underline' };

const Mail = () => (
  <a href="mailto:support@vinlywine.com" style={LINK}>support@vinlywine.com</a>
);

export default function PrivacyLegalPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> Privacy Policy
        </h1>

        <div className="signup-card" style={{ maxWidth: 720, margin: '0 auto 60px' }}>
          <h3 style={{ ...H3, marginTop: 0 }}>Introduction</h3>
          <p style={P}>
            {`Your privacy is important to us. This Privacy Policy describes how Vinly, LLC and our affiliates ("Vinly," "we," "our," or "us") collect, use, disclose, and protect your personal information when you visit or use our website at vinlywine.com, our mobile applications, and any other online services that link to this policy (collectively, the "Platform").`}
          </p>
          <p style={P}>
            <strong>Important:</strong>
            {` Vinly operates as a marketing and discovery platform for wine. We do not hold alcohol licenses, take title to wine, or act as the seller of record. All purchases made through the Platform are fulfilled and sold by licensed California wine retailer partner(s) (the "Seller of Record"). When you complete a purchase, you are transacting with that licensed seller. The Seller of Record will be displayed on the packing slip/invoice included with your order. The Seller of Record has its own privacy practices, which may supplement this policy for transaction-related data.`}
          </p>
          <p style={P}>
            {`For the purposes of this policy, "personal information" means information that identifies, relates to, describes, is reasonably capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular individual.`}
          </p>

          <h3 style={H3}>Information We Collect</h3>

          <h4 style={H4}>Information You Provide to Us</h4>
          <ul style={LIST}>
            <li style={LI}>{`Full name, email address, postal address, phone number, date of birth, username, and account credentials`}</li>
            <li style={LI}>{`Billing information and payment details (processed by third-party payment processors)`}</li>
            <li style={LI}>{`Purchase history and preferences`}</li>
            <li>{`Messages, reviews, ratings, and content submitted`}</li>
          </ul>

          <h4 style={H4}>Information Collected Through Age Verification</h4>
          <p style={P}>
            {`We use third-party age verification services. Limited identity data may be processed. Vinly retains date of birth or verification status for compliance and account management.`}
          </p>

          <h4 style={H4}>Information Collected Automatically</h4>
          <ul style={LIST}>
            <li style={LI}>{`Device and browser information`}</li>
            <li style={LI}>{`Usage data (pages visited, time spent)`}</li>
            <li>{`IP address and approximate location`}</li>
          </ul>

          <h4 style={H4}>Cookies and Tracking Technologies</h4>
          <p style={P}>
            {`We use cookies and similar technologies to operate, analyze, and improve the Platform and deliver targeted advertising.`}
          </p>

          <h4 style={H4}>Information Collected Through SMS/Text Messaging</h4>
          <p style={P}>
            {`If you opt in, we collect phone number, consent status, and engagement data. You can opt out anytime by replying STOP.`}
          </p>

          <h4 style={H4}>Information Received from Third Parties</h4>
          <p style={P}>
            {`We may receive personal information from partners, Seller of Record, analytics providers, and advertising networks.`}
          </p>

          <h3 style={H3}>How We Use Your Information</h3>
          <ul style={LIST}>
            <li style={LI}>{`Operate Platform and process orders`}</li>
            <li style={LI}>{`Communicate with users`}</li>
            <li style={LI}>{`Send marketing communications (with consent)`}</li>
            <li style={LI}>{`Improve Platform performance`}</li>
            <li style={LI}>{`Personalize experience`}</li>
            <li>{`Ensure compliance and prevent fraud`}</li>
          </ul>

          <h3 style={H3}>Cookies and Tracking Technologies</h3>
          <p style={P}>
            {`We use strictly necessary, functional, analytics, and advertising cookies. You can manage cookies via browser settings or opt-out mechanisms like GPC.`}
          </p>

          <h3 style={H3}>How We Disclose Your Information</h3>
          <ul style={LIST}>
            <li style={LI}>{`Seller of Record for order fulfillment`}</li>
            <li style={LI}>{`Service providers (payment, hosting, analytics)`}</li>
            <li style={LI}>{`Advertising partners`}</li>
            <li style={LI}>{`Legal authorities when required`}</li>
            <li>{`Corporate transactions`}</li>
          </ul>

          <h3 style={H3}>Sale and Sharing of Personal Information</h3>
          <p style={P}>
            {`We do not sell personal information for monetary consideration. We may share data for advertising purposes as defined by law.`}
          </p>

          <h3 style={H3}>Data Retention</h3>
          <p style={P}>
            {`We retain data based on purpose and legal requirements, including account data, transactions, and compliance records.`}
          </p>

          <h3 style={H3}>U.S. State Privacy Rights</h3>
          <p style={P}>
            {`Depending on your state, you may have rights to access, delete, correct, or opt out of data sharing.`}
          </p>

          <h3 style={H3}>How to Exercise Your Rights</h3>
          <p style={P}>
            {`You may submit a request via email at `}<Mail />{` or through provided contact channels.`}
          </p>

          <h3 style={H3}>Response Timeframe</h3>
          <p style={P}>{`We respond within 30 days, extendable where required.`}</p>

          <h3 style={H3}>Third-Party Websites and Services</h3>
          <p style={P}>{`We are not responsible for third-party privacy practices.`}</p>

          <h3 style={H3}>Minors and Underage Users</h3>
          <p style={P}>
            {`This Platform is only for users aged 21+. We do not knowingly collect data from minors.`}
          </p>

          <h3 style={H3}>Information Security</h3>
          <p style={P}>{`We use reasonable safeguards including encryption and access control.`}</p>

          <h3 style={H3}>Changes to This Privacy Policy</h3>
          <p style={P}>
            {`We may update this policy and will notify users of material changes.`}
          </p>

          <h3 style={H3}>How to Contact Us</h3>
          <p style={P}>
            {`If you have questions, concerns, or complaints, please contact us: Vinly, LLC — Email: `}<Mail />
          </p>

          <div style={{ marginTop: 10, paddingTop: 16, borderTop: '1px solid #eef0f3', color: '#777', fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ margin: 0 }}>Effective Date: April 1, 2026</p>
          </div>
        </div>
      </div>
    </PageChrome>
  );
}
