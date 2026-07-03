/* POST /api/orders — SERVER-SIDE authoritative shipping-destination check for order
   placement. Runs on the server (Next.js Route Handler), so it enforces the
   shippable-states allowlist even if the client is bypassed: a request to place an
   order to a disallowed state is rejected with 422 regardless of the UI.

   This is a mock clone with no real order persistence — the handler's job is the
   authoritative destination gate. It reuses the ONE allowlist (lib/shippableStates),
   never a duplicated list. */

import { NextResponse } from 'next/server';
import { isShippableState, shipBlockMessage } from '@/lib/shippableStates';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const state =
    body && typeof body === 'object' && 'state' in body && typeof (body as { state: unknown }).state === 'string'
      ? (body as { state: string }).state
      : undefined;

  if (!isShippableState(state)) {
    return NextResponse.json(
      { ok: false, code: 'DESTINATION_NOT_SHIPPABLE', message: shipBlockMessage(state) },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true });
}
