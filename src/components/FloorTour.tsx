'use client';

/* FloorTour — a 5-step first-run coach-mark tour (react-joyride) that teaches the floor
   mechanics in context. Runs ONCE, the first time a user reaches the floor AFTER
   onboarding (age gate + "How it works" explainer both dismissed — never overlapping
   them). Highlights real on-screen elements via [data-tour="…"] anchors. Skippable at
   any step; completion remembered in localStorage. Re-triggerable by dispatching the
   `vinly:floorTour:start` window event (wired to a "How it works" link on the floor).

   Purely additive onboarding overlay — no purchase/pricing/qualification logic here. */

import { useCallback, useEffect, useRef, useState } from 'react';
import Joyride, { STATUS, type CallBackProps, type Step, type Styles } from 'react-joyride';
import { useUserState } from '@/context/UserStateContext';
import { useAgeGate } from '@/context/AgeGateContext';
import { useOnboarding } from '@/context/OnboardingContext';

const DONE_KEY = 'vinly:floorTourDone';
/** Fire `window.dispatchEvent(new Event(FLOOR_TOUR_START_EVENT))` to replay the tour. */
export const FLOOR_TOUR_START_EVENT = 'vinly:floorTour:start';

// Brand theme — dark navy tooltip, orange accent, white/muted text (not Joyride default).
const TOUR_STYLES: Partial<Styles> = {
  options: {
    arrowColor: '#0E2647',
    backgroundColor: '#0E2647',
    overlayColor: 'rgba(6, 14, 26, 0.72)',
    primaryColor: '#F26A35',
    textColor: '#ffffff',
    zIndex: 3000,
  },
  tooltip: { borderRadius: 14, padding: '18px 18px 14px', border: '1px solid rgba(99,162,222,0.28)' },
  tooltipTitle: { fontFamily: "'League Spartan', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', margin: '0 0 6px' },
  tooltipContent: { fontFamily: "'Mulish', sans-serif", color: '#c7d5e6', fontSize: 14, lineHeight: 1.5, padding: '4px 0' },
  buttonNext: { backgroundColor: '#F26A35', color: '#fff', fontFamily: "'League Spartan', sans-serif", fontWeight: 800, letterSpacing: 0.4, borderRadius: 8, padding: '9px 16px' },
  buttonBack: { color: '#8aa2bb', fontFamily: "'League Spartan', sans-serif", fontWeight: 700, marginRight: 8 },
  buttonSkip: { color: '#8aa2bb', fontFamily: "'Mulish', sans-serif" },
  spotlight: { borderRadius: 10 },
};

type StepDef = { target: string; title: string; body: string; center?: boolean };

// Step 4 (qualify) is injected only for non-qualified users; the final step is centered.
function stepDefs(qualified: boolean): StepDef[] {
  return [
    {
      target: '[data-tour="nav"]',
      title: 'Three places to shop.',
      body: 'SESH is the live market. Shop and Spotlight are fixed-price picks. Grab from any of them — it all lands in one cart.',
    },
    {
      target: '[data-tour="ticker"]',
      title: 'The prices are alive.',
      body: 'On SESH and Ticker, prices move with demand — real-time, up and down. See a number you like? Lock it before it moves.',
    },
    {
      target: '[data-tour="timer"]',
      title: 'The clock and the six.',
      body: 'Buy a SESH or Ticker wine and a 15-minute window opens. Hit 6 bottles before it hits zero — shipping’s on us.',
    },
    ...(qualified
      ? []
      : [{
          target: '[data-tour="qualify"]',
          title: 'Unlock the floor.',
          body: 'Add billing and shipping once to get SESH qualified. Then live prices and one-tap buys are yours. Costs nothing to unlock.',
        }]),
    {
      target: 'body',
      title: 'Engines on.',
      body: 'That’s the whole game: watch the number, beat the clock, grab your six. The floor’s yours.',
      center: true,
    },
  ];
}

// Only anchor to elements actually rendered AND visible — on mobile a hidden target is
// skipped gracefully rather than pointing at nothing. (getBoundingClientRect works for
// fixed-position elements, unlike offsetParent.)
function isVisible(selector: string): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function FloorTour() {
  const { userState, hydrated } = useUserState();
  const { passed: agePassed } = useAgeGate();
  const { welcomeOpen } = useOnboarding();

  const [mounted, setMounted] = useState(false);
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const autoRan = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Build the runnable step list: center step always; element steps only if visible now.
  const startTour = useCallback(() => {
    const qualified = userState === 'sesh_qualified';
    const built: Step[] = stepDefs(qualified)
      .filter((d) => d.center || isVisible(d.target))
      .map((d) => ({
        target: d.target,
        title: d.title,
        content: d.body,
        placement: d.center ? 'center' : 'auto',
        disableBeacon: true,
      }));
    if (!built.length) return;
    setSteps(built);
    setRun(true);
  }, [userState]);

  // Onboarding (age gate OR welcome explainer) must be fully dismissed first — same
  // signal the always-on timer uses — so the tour never overlaps onboarding.
  const onboardingActive = !hydrated || (userState === 'guest' && !agePassed) || welcomeOpen;

  // AUTO-RUN once: first floor visit after onboarding. Marked done immediately so a
  // mid-tour refresh won't replay it.
  useEffect(() => {
    if (!mounted || onboardingActive || autoRan.current) return;
    autoRan.current = true;
    let done = false;
    try { done = window.localStorage.getItem(DONE_KEY) === '1'; } catch { /* ignore */ }
    if (done) return;
    try { window.localStorage.setItem(DONE_KEY, '1'); } catch { /* ignore */ }
    // Let the floor settle (explainer closed, targets laid out) before anchoring.
    const t = window.setTimeout(() => startTour(), 600);
    return () => window.clearTimeout(t);
  }, [mounted, onboardingActive, startTour]);

  // Re-trigger: a "How it works" link dispatches this event to replay the tour anytime.
  useEffect(() => {
    const onStart = () => startTour();
    window.addEventListener(FLOOR_TOUR_START_EVENT, onStart);
    return () => window.removeEventListener(FLOOR_TOUR_START_EVENT, onStart);
  }, [startTour]);

  const handleCallback = useCallback((data: CallBackProps) => {
    const finished = data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED;
    if (finished) {
      setRun(false);
      try { window.localStorage.setItem(DONE_KEY, '1'); } catch { /* ignore */ }
    }
  }, []);

  // Client-only (avoid SSR execution of Joyride internals).
  if (!mounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      disableScrollParentFix
      callback={handleCallback}
      styles={TOUR_STYLES}
      locale={{ back: 'Back', next: 'Next', skip: 'Skip', last: 'Done', close: 'Done' }}
    />
  );
}

export default FloorTour;
