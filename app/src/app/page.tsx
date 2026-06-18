'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SESH_OFFERS } from '@/data/mock';

/* The SESH is the front door: every visitor — anonymous, signed-in, or
   SESH-qualified — lands on the SESH page for the first live offer. Non-qualified
   users browse it as viewers (prices visible; buying prompts to add billing). */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/current-offer/${SESH_OFFERS[0].id}`);
  }, [router]);

  return null;
}
