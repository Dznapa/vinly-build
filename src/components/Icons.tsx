/* SVG icon set ported from /spec/prototype/assets/app.js (object `I`).
   Keep stroke=orange via parent .header-icons rule. */

export function IconChart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <polyline points="3 17 9 11 13 15 21 6" />
      <polyline points="16 6 21 6 21 11" />
    </svg>
  );
}

export function IconBottles() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M9 3h2v4l1 2v11H8V9l1-2z" />
      <path d="M14 3h2v4l1 2v11h-4V9l1-2z" />
    </svg>
  );
}

export function IconStar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <polygon points="12 7 13.5 10.5 17 11 14.5 13.5 15 17 12 15.2 9 17 9.5 13.5 7 11 10.5 10.5" />
    </svg>
  );
}

export function IconCart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.2 12.5h11L21 7H6" />
    </svg>
  );
}

export function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="9" r="4" />
      <path d="M4 20c1.5-4 14.5-4 16 0" />
    </svg>
  );
}

export function IconFunnel() {
  // sort funnel for shop search row
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <polygon points="3 5 21 5 14 13 14 20 10 20 10 13" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="7" fill="none" stroke="#9aa3ad" strokeWidth={2} />
      <line x1="16" y1="16" x2="21" y2="21" stroke="#9aa3ad" strokeWidth={2} />
    </svg>
  );
}

export function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M16 3c.4 2.2 1.8 3.8 4 4v3c-1.6 0-3-.5-4-1.3V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3h3z" />
    </svg>
  );
}

export function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#F26A35" strokeWidth={2} />
      <circle cx="12" cy="12" r="4" fill="none" stroke="#F26A35" strokeWidth={2} />
      <circle cx="17" cy="7" r="1.3" />
    </svg>
  );
}

export function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M14 8h2V5h-2c-2 0-3 1.2-3 3v2H9v3h2v6h3v-6h2l.5-3H14V8.5c0-.3.2-.5.6-.5z" />
    </svg>
  );
}
