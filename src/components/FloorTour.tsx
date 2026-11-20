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
  const { welcomeOpen, welcomeResolved } = useOnboarding();

  const [mounted, setMounted] = useState(false);
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const startedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Build the runnable step list: center step always; element steps only if visible NOW
  // (a target hidden on the current viewport — e.g. the qualify CTA on mobile — is
  // skipped gracefully). The first step passed to Joyride is therefore always present,
  // so one missing target never aborts the whole tour.
  const buildSteps = useCallback((): Step[] => {
    const qualified = userState === 'sesh_qualified';
    return stepDefs(qualified)
      .filter((d) => d.center || isVisible(d.target))
      .map((d) => ({
        target: d.target,
        title: d.title,
        content: d.body,
        placement: d.center ? 'center' : 'auto',
        disableBeacon: true,
      }));
  }, [userState]);

  // Start now (markDone persists the one-run flag — only on a real start, so a failed
  // start never burns the flag).
  const beginTour = useCallback((markDone: boolean): boolean => {
    if (startedRef.current) return false;
    const built = buildSteps();
    if (!built.length) return false;
    startedRef.current = true;
    if (markDone) { try { window.localStorage.setItem(DONE_KEY, '1'); } catch { /* ignore */ } }
    setSteps(built);
    setRun(true);
    return true;
  }, [buildSteps]);

  // Tour may auto-start only once onboarding is fully RESOLVED: hydrated, past the age
  // gate, the explainer not open AND resolved (shown+dismissed, or decided not to show).
  // `welcomeResolved` closes the transient pre-welcome gap that previously latched the
  // tour before the explainer and killed the real post-explainer start.
  const tourGateOpen =
    !hydrated
    || (userState === 'guest' && !agePassed)
    || welcomeOpen
    || !welcomeResolved;

  // AUTO-RUN once. Poll (while the gate is closed) until the real element targets have
  // mounted — handles mobile layout timing — then start. The effect re-runs whenever the
  // gate toggles, so the brief pre-welcome gap is cleared before any tick fires.
  useEffect(() => {
    if (!mounted || tourGateOpen || startedRef.current) return;
    let done = false;
    try { done = window.localStorage.getItem(DONE_KEY) === '1'; } catch { done = false; /* fail open */ }
    if (done) { startedRef.current = true; return; }

    const qualified = userState === 'sesh_qualified';
    const MAX_TRIES = 24; // ~6s budget (24 × 250ms) for targets to appear
    let tries = 0;
    const tick = () => {
      if (startedRef.current) { window.clearInterval(id); return; }
      tries += 1;
      const anyRealTarget = stepDefs(qualified).some((d) => !d.center && isVisible(d.target));
      if (anyRealTarget || tries >= MAX_TRIES) {
        beginTour(true);
        window.clearInterval(id);
      }
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [mounted, tourGateOpen, userState, beginTour]);

  // Re-trigger: a "How it works" link dispatches this event to replay the tour anytime
  // (ignores the done flag; re-arms the one-shot guard).
  useEffect(() => {
    const onStart = () => { startedRef.current = false; beginTour(false); };
    window.addEventListener(FLOOR_TOUR_START_EVENT, onStart);
    return () => window.removeEventListener(FLOOR_TOUR_START_EVENT, onStart);
  }, [beginTour]);

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
