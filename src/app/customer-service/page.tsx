import type { CSSProperties } from 'react';
import { PageChrome } from '@/components/PageChrome';

const H3: CSSProperties = { margin: '0 0 10px', color: '#1f1f1f', fontSize: 18, fontWeight: 700 };
const H4: CSSProperties = { margin: '22px 0 8px', color: '#1f1f1f', fontSize: 16, fontWeight: 700 };
const P: CSSProperties = { margin: '0 0 12px', color: '#555', lineHeight: 1.6 };
const LIST: CSSProperties = { margin: '0 0 4px', paddingLeft: 20, color: '#555', lineHeight: 1.6 };
const LI: CSSProperties = { marginBottom: 6 };
const LINK: CSSProperties = { color: '#F26A35', textDecoration: 'underline' };

export default function CustomerServicePage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> Customer Service
        </h1>

        <div className="signup-card" style={{ maxWidth: 720, margin: '0 auto 60px' }}>
          <h3 style={H3}>Need to Reach Us?</h3>
          <p style={P}>
            {`We keep overhead low so your wine prices stay lower. That means no call centers. No hold music. Just real people, real inboxes, and answers that don't sound like they were written by a chatbot in 2012.`}
          </p>

          <h4 style={H4}>Email Us:</h4>
          <ul style={LIST}>
            <li style={LI}>
              <a href="mailto:support@vinlywine.com" style={LINK}>support@vinlywine.com</a>
            </li>
            <li style={LI}>
              {`Questions, concerns, rave reviews, or existential wine crises — drop us a line.`}
            </li>
            <li>
              {`Just make sure to include your name and email address — because we'll be responding via email (faster, cleaner, no phone tag).`}
            </li>
          </ul>

          <h4 style={H4}>Office Hours:</h4>
          <ul style={LIST}>
            <li style={LI}>{`Monday–Friday | 8AM–5PM`}</li>
            <li style={LI}>{`Napa Valley time (yes, the actual Napa)`}</li>
            <li>
              {`Emails sent after hours or over the weekend will be answered in the order received once we're back — fully caffeinated and ready to go.`}
            </li>
          </ul>
        </div>
      </div>
    </PageChrome>
  );
}
