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
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const value = useMemo<Ctx>(
    () => ({ welcomeOpen, setWelcomeOpen }),
    [welcomeOpen],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
