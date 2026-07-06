import { PageChrome } from '@/components/PageChrome';

const H4: React.CSSProperties = { margin: '22px 0 8px', color: '#1f1f1f', fontSize: 16, fontWeight: 700 };
const P: React.CSSProperties = { margin: '0 0 10px', color: '#555', lineHeight: 1.6 };
const LINK: React.CSSProperties = { color: 'var(--orange)', textDecoration: 'underline' };

export default function ShippingReturnsPage() {
  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> Shipping &amp; Returns Policy
        </h1>

        <div className="signup-card" style={{ maxWidth: 720, margin: '0 auto 60px' }}>
          <p style={{ ...P, marginBottom: 6 }}>
            We currently ship to select states within the U.S. based on local alcohol shipping
            laws. If your state doesn&apos;t allow us to deliver wine to your door, we&apos;re as
            frustrated as you are. Please write to your local representative and ask them why they
            hate fun.
          </p>

          <h4 style={H4}>Shipping Timeframes</h4>
          <p style={P}>
            Orders typically ship within 2–5 business days. Delays may occur during extreme weather,
            market surges, or spontaneous wine revolutions. You&apos;ll receive tracking info once
            your wine hits the road.
          </p>

          <h4 style={H4}>Adult Signature Required</h4>
          <p style={P}>
            Wine is serious business. An adult (21+) must be present to sign for delivery, no
            exceptions. The delivery driver won&apos;t accept bribes (we asked).
          </p>

          <h4 style={H4}>Returns &amp; Refunds</h4>
          <p style={P}>
            Due to the nature of the product, all sales are final. However, if your wine arrives
            damaged, or you received the wrong bottle, email us at{' '}
            <a href="mailto:support@vinlywine.com" style={LINK}>support@vinlywine.com</a>{' '}
            within 7 days of delivery. We&apos;ll make it right, because we&apos;re not monsters.
          </p>

          <h4 style={H4}>Corked or Flawed Bottles</h4>
          <p style={P}>
            It happens. If you suspect a corked or flawed bottle, let us know. We&apos;ll investigate
            and determine if a replacement or credit is warranted. Please don&apos;t send us empty
            bottles demanding justice — we&apos;ve seen that move before.
          </p>

          <h4 style={H4}>You Must Be 21+ to Buy Wine Here</h4>
          <p style={P}>
            We don&apos;t make the laws, we just obey them (usually). If you&apos;re underage, please
            go back to TikTok. We&apos;ll see you in 5–10 years.
          </p>

          <h4 style={H4}>Winemaker Access is Real, But Limited</h4>
          <p style={P}>
            We feature exclusive collections and private drops from legendary winemakers. But they
            are humans, not vending machines. When it&apos;s gone, it&apos;s gone. No whining about
            the wine.
          </p>

          <h4 style={H4}>We&apos;re Fun, But We&apos;re Not Liable</h4>
          <p style={P}>
            Vinly is not responsible for wine-induced enlightenment, sudden wine snobbery, or
            breaking up with your overpriced wine club. Please drink responsibly, text wisely, and
            never chug a cult Cab.
          </p>

          <h4 style={H4}>The Market is Brutal. Vinly is Beautiful.</h4>
          <p style={{ ...P, marginBottom: 0 }}>
            You might miss a deal. You might regret it. But you&apos;ll be back. Because this is more
            than wine. It&apos;s strategy, it&apos;s adrenaline, it&apos;s a little bit unhinged — and
            it&apos;s what makes Vinly unlike anything else.
          </p>
        </div>
      </div>
    </PageChrome>
  );
}
