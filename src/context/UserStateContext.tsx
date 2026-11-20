'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/* Two states only: a GUEST (no account — can browse everything and buy fixed-price
   Shop / Winemaker Spotlight wine, but SESH + Ticker are gated) and a SESH_QUALIFIED
   user (has an account — buys everything). There is no separate "signed in but not
   qualified" state: having an account == SESH qualified. */
export type UserState = 'guest' | 'sesh_qualified';

type Ctx = {
  userState: UserState;
  setUserState: (s: UserState) => void;
  hydrated: boolean;
};

const UserStateContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'vinly:userState';

export function UserStateProvider({ children }: { children: ReactNode }) {
  const [userState, setUserStateInternal] = useState<UserState>('guest');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const s = window.localStorage.getItem(STORAGE_KEY);
      // Legacy migration: the old three-state model ('anonymous' | 'signed_in' |
      // 'sesh_qualified') collapses to two — both non-qualified values become 'guest'.
      if (s === 'sesh_qualified') setUserStateInternal('sesh_qualified');
      else if (s === 'guest' || s === 'anonymous' || s === 'signed_in') setUserStateInternal('guest');
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setUserState = useCallback((s: UserState) => {
    setUserStateInternal(s);
    try {
      window.localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ userState, setUserState, hydrated }),
    [userState, setUserState, hydrated],
  );

  return <UserStateContext.Provider value={value}>{children}</UserStateContext.Provider>;
}

export function useUserState() {
  const ctx = useContext(UserStateContext);
  if (!ctx) throw new Error('useUserState must be used inside <UserStateProvider>');
  return ctx;
}
