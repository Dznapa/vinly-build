'use client';

/* CountdownTicker — live "time remaining on this SESH offer" widget.
   Big digital HH:MM:SS readout, blinking : separators, status pill that shifts
   green → amber → orange → red as the timer runs down, pulsing LIVE indicator.
   Same visual language as the rest of the SESH panel chrome (Mulish/League
   Spartan, navy + orange + green palette). */

import { useEffect, useRef, useState } from 'react';

type Props = {
  duration?: string; // initial countdown, "HH:MM:SS"
};

function parseDuration(s: string): number {
  const parts = s.split(':').map((p) => Number(p) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function statusFor(secLeft: number) {
  if (secLeft <= 0) return { text: 'Offer Closed', color: '#e23b3b' };
  if (secLeft < 5 * 60) return { text: 'Final Minutes', color: '#e23b3b' };
  if (secLeft < 15 * 60) return { text: 'Going Fast', color: '#f08a3b' };
  if (secLeft < 45 * 60) return { text: 'Hurry', color: '#f1c40f' };
  return { text: 'Load Up', color: '#2ecc40' };
}

export default function CountdownTicker({ duration = '00:30:00' }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() => parseDuration(duration));
  const prevRef = useRef({ h: '00', m: '00', s: '00' });

  // Re-seed when the duration prop changes.
  useEffect(() => {
    setSecondsLeft(parseDuration(duration));
  }, [duration]);

  // Tick every second.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const h = pad(hours);
  const m = pad(minutes);
  const s = pad(seconds);

  // Flip animation: each digit pair animates only when it actually changes.
  const flips = {
    h: h !== prevRef.current.h,
    m: m !== prevRef.current.m,
    s: s !== prevRef.current.s,
  };
  prevRef.current = { h, m, s };

  const status = statusFor(secondsLeft);

  return (
    <div className="vinly-ctd">
      <div className="vinly-ctd-head">
        <span className="vinly-ctd-label">TIME REMAINING</span>
        <span className="vinly-ctd-live">
          <span className="vinly-ctd-live-dot" aria-hidden />
          LIVE
        </span>
      </div>

      <div
        className="vinly-ctd-time"
        role="timer"
        aria-live="polite"
        aria-label={`${hours} hours, ${minutes} minutes, ${seconds} seconds remaining`}
      >
        <span className="vinly-ctd-unit">
          <span className={`vinly-ctd-num${flips.h ? ' is-flipping' : ''}`} key={`h-${h}`}>
            {h}
          </span>
          <span className="vinly-ctd-tag">HR</span>
        </span>
        <span className="vinly-ctd-sep" aria-hidden>:</span>
        <span className="vinly-ctd-unit">
          <span className={`vinly-ctd-num${flips.m ? ' is-flipping' : ''}`} key={`m-${m}`}>
            {m}
          </span>
          <span className="vinly-ctd-tag">MIN</span>
        </span>
        <span className="vinly-ctd-sep" aria-hidden>:</span>
        <span className="vinly-ctd-unit">
          <span className={`vinly-ctd-num${flips.s ? ' is-flipping' : ''}`} key={`s-${s}`}>
            {s}
          </span>
          <span className="vinly-ctd-tag">SEC</span>
        </span>
      </div>

      <div className="vinly-ctd-status" style={{ ['--c' as string]: status.color }}>
        <span className="vinly-ctd-status-dot" aria-hidden />
        {status.text}
      </div>
    </div>
  );
}
