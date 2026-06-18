'use client';

// NEEDS REVIEW: built from spec only — no screenshot or prototype HTML exists
// for /admin. Layout, copy, and stub values are best-effort inferences from
// BUILD_PROMPT.md plus the prototype design grammar.

import { useMemo, useState } from 'react';
import { PageChrome } from '@/components/PageChrome';
import { SHOP, SESH_OFFERS } from '@/data/mock';
import styles from './admin.module.css';

type Tab = 'dashboard' | 'inventory' | 'sesh' | 'orders' | 'members';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sesh', label: 'SESH Offers' },
  { id: 'orders', label: 'Orders' },
  { id: 'members', label: 'Members' },
];

// NEEDS REVIEW: KPI values are fabricated placeholders — spec gives no real
// numbers. Owner should supply the real KPIs once admin design lands.
const KPIS: { label: string; value: string }[] = [
  { label: "Today's SESH Sales", value: '$12,430' },
  { label: 'Members', value: '2,184' },
  { label: 'Open Offers', value: '3' },
  { label: 'Cart Conversion', value: '27.8%' },
];

// NEEDS REVIEW: stub orders — no spec rows provided.
const STUB_ORDERS: {
  id: string;
  date: string;
  member: string;
  total: string;
  status: string;
}[] = [
  { id: '#10421', date: '2026-06-17', member: 'a.lopez@example.com', total: '$184.20', status: 'Paid' },
  { id: '#10420', date: '2026-06-17', member: 'jordan.k@example.com', total: '$76.50', status: 'Paid' },
  { id: '#10419', date: '2026-06-16', member: 'mira.s@example.com', total: '$312.00', status: 'Shipped' },
  { id: '#10418', date: '2026-06-16', member: 'devon.w@example.com', total: '$54.00', status: 'Refunded' },
  { id: '#10417', date: '2026-06-15', member: 'sam.t@example.com', total: '$248.75', status: 'Shipped' },
];

// NEEDS REVIEW: stub members — no spec rows provided.
const STUB_MEMBERS: {
  email: string;
  joined: string;
  qualified: boolean;
  lifetimeOrders: number;
}[] = [
  { email: 'a.lopez@example.com', joined: '2025-11-02', qualified: true, lifetimeOrders: 14 },
  { email: 'jordan.k@example.com', joined: '2026-01-18', qualified: true, lifetimeOrders: 7 },
  { email: 'mira.s@example.com', joined: '2026-03-04', qualified: false, lifetimeOrders: 2 },
  { email: 'devon.w@example.com', joined: '2026-04-22', qualified: false, lifetimeOrders: 1 },
  { email: 'sam.t@example.com', joined: '2026-05-30', qualified: true, lifetimeOrders: 5 },
];

type SortDir = 'asc' | 'desc';
type SortState<K extends string> = { key: K; dir: SortDir } | null;

/* Generic search filter over the visible string columns of a row. */
function matchesQuery(row: Record<string, unknown>, fields: string[], q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => {
    const v = row[f];
    if (v == null) return false;
    return String(v).toLowerCase().includes(needle);
  });
}

function compareVals(a: unknown, b: unknown, dir: SortDir): number {
  const mul = dir === 'asc' ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * mul;
  }
  return String(a ?? '').localeCompare(String(b ?? '')) * mul;
}

function nextSort<K extends string>(
  current: SortState<K>,
  key: K,
): SortState<K> {
  if (!current || current.key !== key) return { key, dir: 'asc' };
  if (current.dir === 'asc') return { key, dir: 'desc' };
  return null;
}

function SortGlyph({ dir }: { dir: SortDir }) {
  return (
    <i
      className={`fa-solid ${dir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'} ${styles.sortGlyph}`}
      aria-hidden
    />
  );
}

/* ---------- Dashboard (unchanged) ---------- */
function DashboardTab() {
  return (
    // NEEDS REVIEW: KPI grid composition is inferred from spec wording.
    <div className={styles.kpiGrid}>
      {KPIS.map((k) => (
        <div key={k.label} className={`wine-card ${styles.kpiCard}`}>
          <div className={styles.kpiLabel}>{k.label}</div>
          <div className={styles.kpiValue}>{k.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Inventory ---------- */
type InvKey = 'name' | 'price' | 'msrp' | 'qty';

function InventoryTab() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortState<InvKey>>(null);

  const rows = useMemo(() => {
    const filtered = SHOP.filter((w) =>
      matchesQuery(
        { name: w.name, price: w.price, msrp: w.msrp, qty: w.qty },
        ['name', 'price', 'msrp', 'qty'],
        q,
      ),
    );
    if (!sort) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => compareVals(a[sort.key], b[sort.key], sort.dir));
    return arr;
  }, [q, sort]);

  const header = (key: InvKey, label: string) => (
    <th
      className={styles.sortable}
      onClick={() => setSort((s) => nextSort(s, key))}
    >
      {label}
      {sort?.key === key && <SortGlyph dir={sort.dir} />}
    </th>
  );

  return (
    <>
      <div className={styles.tableTools}>
        <input
          type="text"
          className={styles.searchPill}
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {header('name', 'Name')}
              {header('price', 'Price')}
              {header('msrp', 'MSRP')}
              <th>Stock</th>
              {header('qty', 'Qty')}
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td>{w.name}</td>
                <td className={styles.numCell}>${w.price.toFixed(2)}</td>
                <td className={styles.numCell}>${w.msrp.toFixed(2)}</td>
                <td>
                  <span className={w.stock ? styles.inStock : styles.outStock}>
                    {w.stock ? 'IN STOCK' : 'OUT OF STOCK'}
                  </span>
                </td>
                <td className={styles.numCell}>{w.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- SESH Offers ---------- */
type SeshKey =
  | 'dateTag'
  | 'title'
  | 'livePrice'
  | 'msrp'
  | 'offMsrpPct'
  | 'offerDuration'
  | 'inventoryPct';

function SeshOffersTab() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortState<SeshKey>>(null);

  const rows = useMemo(() => {
    const filtered = SESH_OFFERS.filter((o) =>
      matchesQuery(
        {
          dateTag: o.dateTag,
          title: o.title,
          livePrice: o.livePrice,
          msrp: o.msrp,
          offMsrpPct: o.offMsrpPct,
          offerDuration: o.offerDuration,
          inventoryPct: o.inventoryPct,
        },
        [
          'dateTag',
          'title',
          'livePrice',
          'msrp',
          'offMsrpPct',
          'offerDuration',
          'inventoryPct',
        ],
        q,
      ),
    );
    if (!sort) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) =>
      compareVals(
        a[sort.key as keyof typeof a],
        b[sort.key as keyof typeof b],
        sort.dir,
      ),
    );
    return arr;
  }, [q, sort]);

  const header = (key: SeshKey, label: string) => (
    <th
      className={styles.sortable}
      onClick={() => setSort((s) => nextSort(s, key))}
    >
      {label}
      {sort?.key === key && <SortGlyph dir={sort.dir} />}
    </th>
  );

  return (
    <>
      <div className={styles.tableTools}>
        <input
          type="text"
          className={styles.searchPill}
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {header('dateTag', 'Date Tag')}
              {header('title', 'Title')}
              {header('livePrice', 'Live Price')}
              {header('msrp', 'MSRP')}
              {header('offMsrpPct', 'Off MSRP %')}
              {header('offerDuration', 'Offer Duration')}
              {header('inventoryPct', 'Inventory %')}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.dateTag}</td>
                <td>{o.title}</td>
                <td className={styles.numCell}>${o.livePrice.toFixed(2)}</td>
                <td className={styles.numCell}>${o.msrp.toFixed(2)}</td>
                <td className={styles.numCell}>{o.offMsrpPct.toFixed(2)}%</td>
                <td className={styles.numCell}>{o.offerDuration}</td>
                <td className={styles.numCell}>
                  {Math.round(o.inventoryPct * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- Orders ---------- */
type OrderKey = 'id' | 'date' | 'member' | 'total';

function OrdersTab() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortState<OrderKey>>(null);

  const rows = useMemo(() => {
    const filtered = STUB_ORDERS.filter((o) =>
      matchesQuery(
        { id: o.id, date: o.date, member: o.member, total: o.total, status: o.status },
        ['id', 'date', 'member', 'total', 'status'],
        q,
      ),
    );
    if (!sort) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => compareVals(a[sort.key], b[sort.key], sort.dir));
    return arr;
  }, [q, sort]);

  const header = (key: OrderKey, label: string) => (
    <th
      className={styles.sortable}
      onClick={() => setSort((s) => nextSort(s, key))}
    >
      {label}
      {sort?.key === key && <SortGlyph dir={sort.dir} />}
    </th>
  );

  return (
    <>
      <div className={styles.tableTools}>
        <input
          type="text"
          className={styles.searchPill}
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {header('id', 'Order #')}
              {header('date', 'Date')}
              {header('member', 'Member')}
              {header('total', 'Total')}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.date}</td>
                <td>{o.member}</td>
                <td className={styles.numCell}>{o.total}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- Members ---------- */
type MemberKey = 'email' | 'joined' | 'lifetimeOrders';

function MembersTab() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortState<MemberKey>>(null);

  const rows = useMemo(() => {
    const filtered = STUB_MEMBERS.filter((m) =>
      matchesQuery(
        {
          email: m.email,
          joined: m.joined,
          lifetimeOrders: m.lifetimeOrders,
        },
        ['email', 'joined', 'lifetimeOrders'],
        q,
      ),
    );
    if (!sort) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => compareVals(a[sort.key], b[sort.key], sort.dir));
    return arr;
  }, [q, sort]);

  const header = (key: MemberKey, label: string) => (
    <th
      className={styles.sortable}
      onClick={() => setSort((s) => nextSort(s, key))}
    >
      {label}
      {sort?.key === key && <SortGlyph dir={sort.dir} />}
    </th>
  );

  return (
    <>
      <div className={styles.tableTools}>
        <input
          type="text"
          className={styles.searchPill}
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {header('email', 'Email')}
              {header('joined', 'Joined')}
              <th>SESH Qualified</th>
              {header('lifetimeOrders', 'Lifetime Orders')}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.email}>
                <td>{m.email}</td>
                <td>{m.joined}</td>
                <td>
                  <span className={m.qualified ? styles.inStock : styles.outStock}>
                    {m.qualified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className={styles.numCell}>{m.lifetimeOrders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  // NEEDS REVIEW: ticker omitted on admin — spec lists admin alongside other
  // back-of-house surfaces where ticker noise would be inappropriate, but
  // owner should confirm.
  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className="sesh-title">
          <span className="tag">ADMIN</span> VINLY OPS
        </div>

        <div className={styles.tabsRow}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tf ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <section className="shop-panel">
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'inventory' && <InventoryTab />}
          {tab === 'sesh' && <SeshOffersTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'members' && <MembersTab />}
        </section>
      </main>
    </PageChrome>
  );
}
