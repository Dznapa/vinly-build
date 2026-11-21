'use client';

/* GetQualifiedButton — the canonical two-line "Get SESH Qualified / Create Account" CTA.
   Shared by the header and the chart locked-pricing overlay so they stay visually in
   sync (same format + styling). Styling lives in the .header-cta* classes (globals.css);
   callers pass extra context classes via `className` (e.g. the header's sesh-solo mobile
   hide, or a full-width block variant). Action/routing is the caller's `onClick`. */

const LINE1 = 'Get SESH Qualified';
const LINE2 = 'Create Account';

export function GetQualifiedButton({
  onClick,
  className,
  dataTour,
  ariaLabel,
}: {
  onClick: () => void;
  className?: string;
  dataTour?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className={`header-cta header-cta--orange header-cta--stack${className ? ` ${className}` : ''}`}
      onClick={onClick}
      aria-label={ariaLabel ?? `${LINE1} — create your account`}
      data-tour={dataTour}
    >
      <span className="header-cta-l1">{LINE1}</span>
      <span className="header-cta-l2">{LINE2}</span>
    </button>
  );
}

export default GetQualifiedButton;
