'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserState } from '@/context/UserStateContext';
import { SESH_OFFERS } from '@/data/mock';

/* Landing logic from BUILD_PROMPT.md:
   anonymous + signed-in non-qualified -> /shop
   sesh_qualified -> SESH page (first offer) */
export default function RootPage() {
  const router = useRouter();
  const { userState, hydrated } = useUserState();

  useEffect(() => {
    if (!hydrated) return;
    if (userState === 'sesh_qualified') {
      router.replace(`/current-offer/${SESH_OFFERS[0].id}`);
    } else {
      router.replace('/shop');
    }
  }, [hydrated, userState, router]);

  return null;
}
