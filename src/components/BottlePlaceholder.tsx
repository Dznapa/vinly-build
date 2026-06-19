/* BottlePlaceholder — varietal-aware SVG bottle with the wine name on the
   label. Used when a wine has no real Commerce7 image so cards remain
   visually distinct instead of all sharing one generic image. */

import type { JSX } from 'react';

export type BottleVariant = 'red' | 'white' | 'rose' | 'sparkling' | 'pack';

type Props = {
  name: string;
  variant?: BottleVariant;
  width?: number;
  height?: number;
};

function classify(name: string, maker?: string): BottleVariant {
  const haystack = `${name ?? ''} ${maker ?? ''}`.toLowerCase();
  if (haystack.includes('rosé') || haystack.includes('rose')) return 'rose';
  if (haystack.includes('champagne') || haystack.includes('prosecco')) return 'sparkling';
  if (
    haystack.includes('chardonnay') ||
    haystack.includes('sauvignon blanc') ||
    haystack.includes('riesling') ||
    haystack.includes('puligny') ||
    haystack.includes('pinot grigio')
  ) {
    return 'white';
  }
  return 'red';
}

export function pickVariant(name: string, maker?: string): BottleVariant {
  return classify(name, maker);
}

/* Truncate the wine name onto 1–3 label lines so it fits inside the SVG. */
function wrapLabel(name: string): string[] {
  const trimmed = name.replace(/\s*\|\s*\d{4}.*$/, '').trim();
  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > 14) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length === 2) break;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

const VARIANT_STYLES: Record<
  BottleVariant,
  {
    glass: string;
    contents: string;
    capsule: string;
    labelBg: string;
    labelTitle: string;
    labelBand: string;
  }
> = {
  red: {
    glass: 'linear-gradient(to right, #1a2520 0%, #060d09 35%, #060d09 65%, #1a2520 100%)',
    contents: '#3a0a0e',
    capsule: '#5c1018',
    labelBg: '#f4ead6',
    labelTitle: '#2a1a0a',
    labelBand: '#7a3b2e',
  },
  white: {
    glass: 'linear-gradient(to right, #3a4738 0%, #25372a 35%, #25372a 65%, #3a4738 100%)',
    contents: '#e6d68f',
    capsule: '#caa15a',
    labelBg: '#fbf3da',
    labelTitle: '#3a2a0a',
    labelBand: '#8a6a2a',
  },
  rose: {
    glass: 'linear-gradient(to right, #d8c4b8 0%, #b89c8a 35%, #b89c8a 65%, #d8c4b8 100%)',
    contents: '#e98aa6',
    capsule: '#7a3b4e',
    labelBg: '#fff4f4',
    labelTitle: '#5a2a3a',
    labelBand: '#c46680',
  },
  sparkling: {
    glass: 'linear-gradient(to right, #1f2a26 0%, #0b1612 35%, #0b1612 65%, #1f2a26 100%)',
    contents: '#1a1a1a',
    capsule: '#caa75a',
    labelBg: '#1c2b3a',
    labelTitle: '#f4d678',
    labelBand: '#caa75a',
  },
  pack: {
    glass: '#d8c4a4',
    contents: '#d8c4a4',
    capsule: '#a38758',
    labelBg: '#f4e8c8',
    labelTitle: '#5a4a2a',
    labelBand: '#a38758',
  },
};

export default function BottlePlaceholder({
  name,
  variant,
  width = 80,
  height = 240,
}: Props): JSX.Element {
  const v: BottleVariant = variant ?? classify(name);
  const s = VARIANT_STYLES[v];
  const labelLines = wrapLabel(name);
  const gid = `glass-${v}-${name.replace(/[^a-z0-9]/gi, '')}`;
  const lid = `label-${v}`;
  // Render pack art differently — a flat tan square.
  if (v === 'pack') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 80 240"
        width={width}
        height={height}
        role="img"
        aria-label={name}
      >
        <rect x="14" y="80" width="52" height="100" rx="6" fill="#d8c4a4" />
        <rect x="14" y="80" width="52" height="20" fill="#a38758" />
        <text
          x="40"
          y="140"
          textAnchor="middle"
          fontFamily="League Spartan, sans-serif"
          fontWeight="700"
          fontSize="11"
          fill="#5a4a2a"
        >
          PACK
        </text>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 240"
      width={width}
      height={height}
      role="img"
      aria-label={name}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          {v === 'rose' ? (
            <>
              <stop offset="0%" stopColor="#d8c4b8" />
              <stop offset="35%" stopColor="#b89c8a" />
              <stop offset="65%" stopColor="#b89c8a" />
              <stop offset="100%" stopColor="#d8c4b8" />
            </>
          ) : v === 'white' ? (
            <>
              <stop offset="0%" stopColor="#3a4738" />
              <stop offset="35%" stopColor="#25372a" />
              <stop offset="65%" stopColor="#25372a" />
              <stop offset="100%" stopColor="#3a4738" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#1a2520" />
              <stop offset="35%" stopColor="#060d09" />
              <stop offset="65%" stopColor="#060d09" />
              <stop offset="100%" stopColor="#1a2520" />
            </>
          )}
        </linearGradient>
        <linearGradient id={lid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.labelBg} />
          <stop offset="100%" stopColor={s.labelBg} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* cork */}
      <rect x="33" y="4" width="14" height="6" rx="1.5" fill={s.capsule} opacity="0.85" />
      {/* foil capsule */}
      <path d={`M30 10 H50 V42 C50 46 47 48 44 48 H36 C33 48 30 46 30 42 Z`} fill={s.capsule} />
      {/* neck taper */}
      <path d="M32 48 C32 56 30 62 28 70 H52 C50 62 48 56 48 48 Z" fill={`url(#${gid})`} />
      {/* bottle body */}
      <path
        d="M18 84 C18 76 22 70 28 70 H52 C58 70 62 76 62 84 L62 226 C62 232 58 236 52 236 H28 C22 236 18 232 18 226 Z"
        fill={`url(#${gid})`}
      />
      {/* glass highlight */}
      <path
        d="M24 82 L24 220"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* label */}
      <rect x="22" y="120" width="36" height="80" rx="2" fill={`url(#${lid})`} />
      <rect x="22" y="128" width="36" height="8" fill={s.labelBand} />
      {labelLines.map((line, i) => (
        <text
          key={i}
          x="40"
          y={160 + i * 12}
          textAnchor="middle"
          fontFamily="League Spartan, sans-serif"
          fontWeight="700"
          fontSize="8.5"
          fill={s.labelTitle}
        >
          {line}
        </text>
      ))}
      <text
        x="40"
        y="194"
        textAnchor="middle"
        fontFamily="Mulish, sans-serif"
        fontSize="6.5"
        fill={s.labelTitle}
        opacity="0.7"
      >
        750mL
      </text>
    </svg>
  );
}
