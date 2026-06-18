import Link from 'next/link';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <Link className="logo" href="/" aria-label="Vinly home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vinly-logo.png" alt="Vinly" className="logo-img" />
        </Link>
        <div className="foot-links">
          <div>
            <Link href="/login">Log in</Link>
            <Link href="/customer-service">Customer Service</Link>
          </div>
          <div>
            <Link href="/faq">FAQ</Link>
            <Link href="/shipping-returns">Shipping &amp; Returns</Link>
            <Link href="/about">About Vinly</Link>
          </div>
          <div>
            <Link href="/privacy-legal">Privacy &amp; Legal</Link>
            <Link href="/ada">ADA</Link>
            <Link href="/terms">Terms and Conditions</Link>
          </div>
        </div>
        <div className="foot-social">
          <a
            className="icon"
            href="https://www.tiktok.com/@vinlywine"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
          >
            <i className="fa-brands fa-tiktok" aria-hidden />
          </a>
          <a
            className="icon"
            href="https://www.instagram.com/vinlywine"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <i className="fa-brands fa-instagram" aria-hidden />
          </a>
          <a
            className="icon"
            href="https://www.facebook.com/vinlywine"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            <i className="fa-brands fa-facebook-f" aria-hidden />
          </a>
        </div>
      </div>
      <div className="foot-fineprint">
        <span>© {new Date().getFullYear()} Vinly · You must be 21+ to buy or browse</span>
        <span>Please drink responsibly · Not the live site</span>
      </div>
    </footer>
  );
}
