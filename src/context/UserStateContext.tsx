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

export type UserState = 'anonymous' | 'signed_in' | 'sesh_qualified';

type Ctx = {
  userState: UserState;
  setUserState: (s: UserState) => void;
  hydrated: boolean;
};

const UserStateContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'vinly:userState';

export function UserStateProvider({ children }: { children: ReactNode }) {
  const [userState, setUserStateInternal] = useState<UserState>('anonymous');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const s = window.localStorage.getItem(STORAGE_KEY) as UserState | null;
      if (s === 'anonymous' || s === 'signed_in' || s === 'sesh_qualified') {
        setUserStateInternal(s);
      }
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
