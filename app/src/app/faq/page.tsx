// NEEDS REVIEW: built from spec only

import { PageChrome } from '@/components/PageChrome';

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'What is a SESH?',
    a: 'A SESH is a short, time-boxed Vinly drop on a single wine. The price moves live during the offer window — qualified members can watch the chart in real time and buy when the price is right.',
  },
  {
    q: 'How do I get SESH-qualified?',
    a: 'Create a Vinly account, verify you are 21+, and add a billing and shipping profile. Once your details are on file, you will be SESH-qualified and able to view live pricing and buy from active drops.',
  },
  {
    q: 'When does the SESH start?',
    a: 'New SESH drops are announced through the Vinly Ticker and email alerts. Each SESH has its own duration shown on the offer page — once the timer expires, the offer closes.',
  },
  {
    q: 'How does the 15-minute lock work?',
    a: 'When you reserve a SESH or Ticker bottle, the price and inventory are locked to you for 15 minutes so you can complete checkout without the market moving against you. If you do not finish in time, the lock releases.',
  },
  {
    q: 'What are your shipping rates?',
    a: 'Ground shipping is free on orders of 6 or more bottles. Orders with fewer than 6 bottles ship at a flat rate. Adult signature is required on delivery.',
  },
  {
    q: 'Can I cancel an order?',
    a: 'SESH and Ticker quick-buy purchases are final once the lock window closes. Standard Shop orders can be cancelled before they leave our warehouse — contact Customer Service as soon as possible.',
  },
  {
    q: 'Where do you ship?',
    a: 'Vinly ships to most U.S. states where direct-to-consumer wine shipping is permitted. State availability is shown at checkout based on your shipping address.',
  },
  {
    q: 'How do I update my account?',
    a: 'Sign in and open your account menu to update your contact info, password, billing, and shipping details. Email preferences for Ticker and New Drop alerts can be managed from the same screen.',
  },
];

export default function FaqPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> FAQ
        </h1>
        <div
          className="signup-card"
          style={{ maxWidth: 720, margin: '0 auto 60px' }}
        >
          {FAQS.map((item, i) => (
            <div
              key={i}
              style={{
                paddingBottom: 18,
                marginBottom: 18,
                borderBottom:
                  i === FAQS.length - 1 ? 'none' : '1px solid #eef0f3',
              }}
            >
              <h4
                style={{
                  margin: '0 0 8px',
                  color: '#1f1f1f',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {item.q}
              </h4>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageChrome>
  );
}
