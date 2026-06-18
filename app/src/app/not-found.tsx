/* 404 page — per /spec/SCREEN_NOTES.md: deep-navy full-screen centered
   "404 | NOT FOUND". Renders without the header/ticker/footer chrome to
   match the observed live page. */

import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        background: 'var(--navy-deep)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: 2,
          textAlign: 'center',
        }}
      >
        <span style={{ marginRight: 16 }}>404</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 14px' }}>|</span>
        <span style={{ marginLeft: 4 }}>NOT FOUND</span>
        <div style={{ marginTop: 24, fontSize: 15, letterSpacing: 0, fontWeight: 500 }}>
          <Link href="/shop" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
            Back to shop
          </Link>
        </div>
      </div>
    </main>
  );
}
