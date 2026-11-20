'use client';

/* OnboardingContext — shares the welcome/explainer's open-state so the always-on
   shipping-window timer can stay suppressed while it's up. (The age gate is derived
   render-side from userState + age `passed`, so it needs no publishing here.) The timer
   combines this with the age-gate signal to decide "onboarding complete → show me." */

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Ctx = {
  /** True while the welcome/explainer modal is displayed. */
  welcomeOpen: boolean;
  setWelcomeOpen: (v: boolean) => void;
  /** True once the welcome has reached its FINAL state — either dismissed, or decided
      it won't show (qualified user / already seen). Lets the tour wait for the real
      post-explainer moment instead of a transient pre-welcome gap. Reactive (no
      localStorage), so it also works in Safari Private. */
  welcomeResolved: boolean;
  setWelcomeResolved: (v: boolean) => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeResolved, setWelcomeResolved] = useState(false);

  const value = useMemo<Ctx>(
    () => ({ welcomeOpen, setWelcomeOpen, welcomeResolved, setWelcomeResolved }),
    [welcomeOpen, welcomeResolved],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
