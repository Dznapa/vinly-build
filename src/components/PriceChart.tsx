'use client';

/* PriceChart — Recharts implementation per /spec/CHANGE_PROMPT.md.
   - Stock-market-style: smooth monotone line, subtle area gradient, light grid.
   - Per-timeframe volatility profile: 30 Sec is jumpy day-trader feel, longer
     windows are progressively smoother. Tick rate also scales with timeframe.
   - History is STABLE — points are generated deterministically per timeframe
     and only the newest point slides in on each tick.
   - Dashed pill-labeled MSRP / STREET PRICE always render (gated and qualified).
   - Gated state hides the green live line + area + dot but keeps axes + refs. */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type Timeframe = '30 Sec' | '1 Min' | '5 Min' | '15 Min' | '30 Min' | 'Hour' | 'All';

type Props = {
  gated: boolean;
  /** Blur the Y-axis price-scale labels (non-qualified users can't read the scale). */
  blurAxis?: boolean;
  /** When true, the live line freezes (stops ticking) but stays visible —
      used when the floor is closed (inventory depleted). */
  frozen?: boolean;
  msrp?: number;
  street?: number;
  timeframe?: Timeframe;
  /** Called with the latest live price every time the chart ticks, so the
      SESH page can keep its headline price + % off in sync with the chart. */
  onPriceChange?: (price: number) => void;
};

type Profile = {
  points: number; // x-axis density
  noise: number; // per-step random walk magnitude
  drift: number; // mean-reversion strength toward anchor
  tickMs: number; // how often a new point slides in
};

/* Day-trader feel on short windows; smoother on longer windows. */
const PROFILES: Record<Timeframe, Profile> = {
  '30 Sec': { points: 30, noise: 4.5, drift: 0.04, tickMs: 700 },
  '1 Min':  { points: 60, noise: 3.6, drift: 0.05, tickMs: 900 },
  '5 Min':  { points: 60, noise: 2.4, drift: 0.06, tickMs: 1200 },
  '15 Min': { points: 90, noise: 1.8, drift: 0.07, tickMs: 1500 },
  '30 Min': { points: 90, noise: 1.3, drift: 0.07, tickMs: 1800 },
  Hour:     { points: 120, noise: 1.0, drift: 0.08, tickMs: 2200 },
  All:      { points: 180, noise: 0.7, drift: 0.09, tickMs: 2600 },
};

/* Bottom padding per timeframe — how tight the lower bound hugs the data.
   The top of the domain always extends past MSRP so the reference lines
   stay visible on every timeframe. */
const Y_PADDING: Record<Timeframe, number | 'full'> = {
  '30 Sec': 3,
  '1 Min':  4,
  '5 Min':  6,
  '15 Min': 10,
  '30 Min': 16,
  Hour:     'full',
  All:      'full',
};

/* mulberry32 — seeded PRNG so each timeframe has a STABLE series. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSeries(timeframe: Timeframe, anchor: number) {
  const { points, noise, drift } = PROFILES[timeframe];
  const seedBase = timeframe.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const rand = mulberry32(seedBase * 9941 + 17);
  const pts: { i: number; price: number }[] = [];
  let v = anchor;
  for (let i = 0; i < points; i++) {
    const meanRev = (anchor - v) * drift;
    const wobble = (rand() - 0.5) * 2 * noise;
    v = Math.max(12, Math.min(78, v + meanRev + wobble));
    pts.push({ i, price: Number(v.toFixed(2)) });
  }
  return pts;
}

/* Bold pill-chip label drawn on a reference line (navy rounded bg + bold text,
   right-aligned, centered on the line) so the dashed line never cuts the text. */
function RefPill({ viewBox, value }: { viewBox?: { x: number; y: number; width: number; height: number }; value: string }) {
  if (!viewBox) return null;
  const padX = 9;
  const h = 21;
  const w = value.length * 7.1 + padX * 2;
  const x = viewBox.x + viewBox.width - w - 4;
  const y = viewBox.y - h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#0E2647" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
      <text
        x={x + padX}
        y={y + h / 2}
        dominantBaseline="central"
        fill="#fff"
        fontFamily="League Spartan, sans-serif"
        fontSize={12.5}
        fontWeight={800}
        letterSpacing={0.6}
      >
        {value}
      </text>
    </g>
  );
}

// Y-axis tick — rendered ourselves so we can blur the price scale reliably for
// non-qualified users (a CSS filter on the Recharts SVG text didn't take).
function YAxisTick(props: {
  x?: number;
  y?: number;
  payload?: { value: number };
  blur?: boolean;
}) {
  const { x = 0, y = 0, payload, blur } = props;
  return (
    <text
      x={x}
      y={y}
      dy="0.355em"
      textAnchor="end"
      fill="#cfe0ef"
      fontSize={11}
      fontFamily="League Spartan"
      style={blur ? { filter: 'blur(6px)' } : undefined}
    >
      ${payload?.value}
    </text>
  );
}

export default function PriceChart({
  gated,
  blurAxis = false,
  frozen = false,
  msrp = 85,
  street = 60,
  timeframe = '30 Sec',
  onPriceChange,
}: Props) {
  /* One stable base series per timeframe. */
  const baseSeriesByTf = useMemo(() => {
    const map: Partial<Record<Timeframe, { i: number; price: number }[]>> = {};
    (Object.keys(PROFILES) as Timeframe[]).forEach((tf) => {
      map[tf] = generateSeries(tf, 43);
    });
    return map as Record<Timeframe, { i: number; price: number }[]>;
  }, []);

  const [tailDelta, setTailDelta] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (gated || frozen) {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    const interval = window.setInterval(() => {
      setTailDelta((d) => d + 1);
    }, PROFILES[timeframe].tickMs);
    tickRef.current = interval;
    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [gated, frozen, timeframe]);

  const data = useMemo(() => {
    const base = baseSeriesByTf[timeframe];
    if (!base) return [];
    const offset = tailDelta % base.length;
    return base.map((_, idx) => ({
      i: idx,
      price: base[(idx + offset) % base.length].price,
    }));
  }, [baseSeriesByTf, timeframe, tailDelta]);

  /* Per-timeframe Y-axis domain.
     - Lower bound hugs the data so the live wobble is visible.
     - Upper bound ALWAYS extends past MSRP + a few dollars so the MSRP and
       STREET reference lines remain on-screen no matter which timeframe is
       selected (user can always orient against them). */
  const { yDomain, yTicks } = useMemo(() => {
    const pad = Y_PADDING[timeframe];
    if (pad === 'full' || data.length === 0) {
      return {
        yDomain: [0, 99] as [number, number],
        yTicks: [0, 20, 40, 60, 80, 99],
      };
    }
    let lo = data[0].price;
    let hi = data[0].price;
    for (const p of data) {
      if (p.price < lo) lo = p.price;
      if (p.price > hi) hi = p.price;
    }
    const min = Math.max(0, Math.floor(lo) - pad);
    const max = Math.min(99, Math.max(Math.ceil(hi) + pad, msrp + 6));
    const range = max - min;
    const step = Math.max(2, Math.round(range / 5));
    const ticks: number[] = [];
    for (let v = min; v <= max; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] !== max) ticks.push(max);
    return {
      yDomain: [min, max] as [number, number],
      yTicks: ticks,
    };
  }, [data, timeframe, msrp]);

  // MSRP and STREET reference lines are always rendered now (within domain).
  const showMsrpRef = true;
  const showStreetRef = street >= yDomain[0];

  // Surface the latest live price to the parent so the SESH page can mirror it.
  useEffect(() => {
    if (!onPriceChange || data.length === 0) return;
    onPriceChange(data[data.length - 1].price);
  }, [data, onPriceChange]);

  /* On short windows render the line with sharp corners; on longer windows
     use monotone smoothing for a clean trading-chart look. */
  const lineType = timeframe === '30 Sec' || timeframe === '1 Min' ? 'linear' : 'monotone';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 14, right: 26, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#36e05a" stopOpacity={0.34} />
              <stop offset="80%" stopColor="#36e05a" stopOpacity={0.04} />
              <stop offset="100%" stopColor="#36e05a" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />

          <XAxis dataKey="i" hide />
          <YAxis
            domain={yDomain}
            ticks={yTicks}
            stroke="#cfe0ef"
            tick={<YAxisTick blur={blurAxis} />}
            axisLine={false}
            tickLine={false}
            width={48}
            allowDataOverflow
          />

          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeDasharray: 4 }}
            content={(props) => {
              if (!props.active || !props.payload || !props.payload.length) return null;
              // Last payload entry is the live-price series at the hovered point.
              const live = Number(props.payload[props.payload.length - 1].value);
              return (
                <div className="chart-tip">
                  <div className="chart-tip-row is-live"><span>Live</span><b>${live.toFixed(2)}</b></div>
                  <div className="chart-tip-row"><span>MSRP</span><b>${msrp.toFixed(2)}</b></div>
                  <div className="chart-tip-row"><span>Street</span><b>${street.toFixed(2)}</b></div>
                </div>
              );
            }}
          />

          {showMsrpRef && (
            <ReferenceLine
              y={msrp}
              stroke="rgba(255,255,255,0.55)"
              strokeDasharray="6 4"
              ifOverflow="visible"
              label={<RefPill value={`$${msrp} MSRP`} />}
            />
          )}
          {showStreetRef && (
            <ReferenceLine
              y={street}
              stroke="rgba(255,255,255,0.55)"
              strokeDasharray="6 4"
              ifOverflow="visible"
              label={<RefPill value={`$${street} STREET PRICE`} />}
            />
          )}

          {!gated && (
            <Area
              type={lineType}
              dataKey="price"
              stroke="none"
              fill="url(#priceFill)"
              isAnimationActive={false}
            />
          )}
          {!gated && (
            <Line
              type={lineType}
              dataKey="price"
              stroke="#36e05a"
              strokeWidth={2}
              dot={(props: { cx?: number; cy?: number; index?: number }) => {
                const { cx, cy, index } = props;
                const key = `pc-dot-${index}`;
                // Flashing beacon only on the latest point — and only while live.
                if (frozen || index !== data.length - 1 || typeof cx !== 'number' || typeof cy !== 'number') {
                  return <g key={key} />;
                }
                return (
                  <g key={key} style={{ pointerEvents: 'none' }}>
                    <circle cx={cx} cy={cy} r={9} fill="rgba(54, 224, 90, 0.18)" />
                    <circle className="pc-beacon-ring" cx={cx} cy={cy} />
                    <circle className="pc-beacon-core" cx={cx} cy={cy} r={4.5} />
                  </g>
                );
              }}
              activeDot={{ r: 4, fill: '#36e05a', stroke: '#fff', strokeWidth: 1 }}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
      {/* Legend removed — MSRP/Street are labeled on the chart lines and in KEY STATS. */}
    </div>
  );
}
