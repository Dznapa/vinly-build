'use client';

/* WelcomeBackLine — the light, non-blocking greeting shown to KNOWN users
   (signed-in or SESH-qualified — the persisted "cookied" states) in place of the
   full onboarding explainer (WelcomeModal). Anonymous users get the explainer;
   known users get one short, on-voice line per visit.

   - One line picked at random per load; never the immediately-previous one
     (last index tracked in localStorage; re-rolled on a match).
   - Static — no auto-cycling or shuffling. Dismissable; also self-dismisses so it
     never lingers over the floor. role="status"/aria-live="polite" so it's
     announced once without stealing focus. Fade-in is disabled under
     prefers-reduced-motion (see globals.css). */

import { useEffect, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';

// Editable copy pool — add / seasonalize lines here.
export const WELCOME_BACK_LINES = [
  'Back already? The floor missed you.',
  "The market's open and your instincts are warmed up. Go.",
  'Welcome back. Try to leave some bottles for everyone else.',
  "The tape's moving. You know what to do.",
  'Look who\'s back to make some money look like fun.',
  "The floor's live. Your hesitation, hopefully, is not.",
  "Good timing. Something's always about to happen here.",
  'Back for more. We respect the addiction.',
];

const LAST_INDEX_KEY = 'vinly:welcomeBackLast';
const AUTO_DISMISS_MS = 7000;

function pickLine(): string {
  let last = -1;
  try {
    const raw = window.localStorage.getItem(LAST_INDEX_KEY);
    if (raw !== null) last = Number(raw);
  } catch {
    /* storage unavailable — fall through with last = -1 */
  }
  let idx = Math.floor(Math.random() * WELCOME_BACK_LINES.length);
  // Re-roll on a match with the immediately-previous line.
  if (WELCOME_BACK_LINES.length > 1 && idx === last) {
    idx = (idx + 1) % WELCOME_BACK_LINES.length;
  }
  try {
    window.localStorage.setItem(LAST_INDEX_KEY, String(idx));
  } catch {
    /* ignore */
  }
  return WELCOME_BACK_LINES[idx];
}

export function WelcomeBackLine() {
  const { userState, hydrated } = useUserState();
  const [line, setLine] = useState<string | null>(null);

  // Known users only (anonymous gets the full explainer instead). Pick once,
  // after state hydrates.
  useEffect(() => {
    if (!hydrated || userState === 'anonymous') return;
    setLine(pickLine());
  }, [hydrated, userState]);

  // Self-dismiss so it never sits over the floor.
  useEffect(() => {
    if (!line) return;
    const t = window.setTimeout(() => setLine(null), AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [line]);

  if (!line) return null;

  return (
    <div className="welcome-back-wrap" aria-live="polite">
      <div className="welcome-back" role="status">
        <span className="welcome-back-ic" aria-hidden>
          <i className="fa-solid fa-arrow-trend-up" />
        </span>
        <span className="welcome-back-text">{line}</span>
        <button
          type="button"
          className="welcome-back-close"
          aria-label="Dismiss welcome message"
          onClick={() => setLine(null)}
        >
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default WelcomeBackLine;
