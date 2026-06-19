'use client';

import { useUserState, type UserState } from '@/context/UserStateContext';

const STATES: { value: UserState; label: string }[] = [
  { value: 'anonymous', label: 'Anonymous' },
  { value: 'signed_in', label: 'Signed in' },
  { value: 'sesh_qualified', label: 'SESH qualified' },
];

export function DevToolbar() {
  const { userState, setUserState, hydrated } = useUserState();

  return (
    <div className="proto-bar" role="region" aria-label="Vinly dev toolbar">
      <b>VINLY PROTOTYPE</b> · local copy for spec &amp; iteration · not the live site
      <span className="spacer" />
      <span>User state:</span>
      {STATES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => setUserState(s.value)}
          className={hydrated && userState === s.value ? 'on' : undefined}
          data-proto-state={s.value}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
