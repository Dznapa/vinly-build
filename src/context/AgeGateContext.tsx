'use client';

/* AgeGateContext — the FIRST thing any visitor sees: a blocking age self-affirmation
   over the (blurred) site, before the welcome flow and any content.

   - Self-affirmation only (no DOB / no input).
   - "Yes — I'm 21+" records the affirmation (localStorage vinly:ageOk) and lets them
     in; the existing anonymous two-stage welcome then proceeds (WelcomeModal waits on
     `passed`, so order is: age gate → Stage 1 welcome → explainer/floor).
   - "No" shows a polite block and never reveals the site.
   - No X, no click-outside dismiss — the visitor must choose.
   - Remembered per-device so a returning confirmed visitor isn't re-gated.

   Rendered client-side after hydration (no gate on SSR) to avoid a hydration flash,
   mirroring the welcome pattern. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useUserState } from '@/context/UserStateContext';

const STORAGE_KEY = 'vinly:ageOk';

type Ctx = { passed: boolean };
const AgeGateContext = createContext<Ctx | null>(null);

export function AgeGateProvider({ children }: { children: ReactNode }) {
  // ANONYMOUS-ONLY: signed-in / SESH-qualified users had their age handled at signup,
  // so they never see the gate. Only logged-out visitors who haven't affirmed on this
  // device get it.
  const { userState, hydrated: userHydrated } = useUserState();
  const [passed, setPassed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [storageRead, setStorageRead] = useState(false);

  useEffect(() => {
    let ok = false;
    try { ok = window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* ignore */ }
    setPassed(ok);
    setStorageRead(true);
  }, []);

  const confirm = useCallback(() => {
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setBlocked(false);
    setPassed(true);
  }, []);
  // "No" is not remembered — a reload gives them the choice again — but the site
  // stays hidden until they affirm.
  const decline = useCallback(() => setBlocked(true), []);

  // Only anonymous, not-yet-affirmed visitors are gated (after both state hydrations).
  const showGate = userHydrated && storageRead && userState === 'anonymous' && !passed;

  const value = useMemo<Ctx>(() => ({ passed }), [passed]);

  return (
    <AgeGateContext.Provider value={value}>
      {children}
      {showGate && <AgeGateModal blocked={blocked} onConfirm={confirm} onDecline={decline} />}
    </AgeGateContext.Provider>
  );
}

function AgeGateModal({
  blocked,
  onConfirm,
  onDecline,
}: {
  blocked: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus the card and trap Tab inside — but NO Escape-to-close (blocking gate).
  useEffect(() => {
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !cardRef.current) return;
      const nodes = cardRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blocked]);

  return (
    <div className="age-overlay" role="dialog" aria-modal="true" aria-label="Age verification">
      <div className="welcome-modal age-modal" tabIndex={-1} ref={cardRef}>
        {blocked ? (
          <>
            <div className="age-ic age-ic--no"><i className="fa-solid fa-ban" aria-hidden /></div>
            <p className="welcome-lede">Come back when you&apos;re older.</p>
            <p className="age-body" role="alert">
              Sorry — you must be of legal drinking age to enter Vinly.
            </p>
          </>
        ) : (
          <>
            <div className="age-ic"><i className="fa-solid fa-wine-bottle" aria-hidden /></div>
            <p className="welcome-lede">Market Entry Required</p>
            <p className="age-body">
              Before you enter, confirm you&apos;re of legal drinking age in your location.
            </p>
            <div className="welcome-actions">
              <button type="button" className="welcome-cta" onClick={onConfirm}>
                Yes — I&apos;m 21+
              </button>
              <button type="button" className="welcome-cta welcome-cta--ghost" onClick={onDecline}>
                No
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function useAgeGate() {
  const ctx = useContext(AgeGateContext);
  if (!ctx) throw new Error('useAgeGate must be used inside <AgeGateProvider>');
  return ctx;
}
