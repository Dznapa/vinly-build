'use client';

/* PriceLock — toggles a `prices-locked` class on <body> whenever the user is not
   SESH-qualified (i.e. no billing on file). Global CSS blurs all pricing under
   that class; pricing unlocks once they're qualified. */

import { useEffect } from 'react';
import { useUserState } from '@/context/UserStateContext';

export function PriceLock() {
  const { userState, hydrated } = useUserState();

  useEffect(() => {
    if (!hydrated) return;
    const locked = userState !== 'sesh_qualified';
    document.body.classList.toggle('prices-locked', locked);
  }, [userState, hydrated]);

  return null;
}

export default PriceLock;
