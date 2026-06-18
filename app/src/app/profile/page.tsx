'use client';

/* /profile — Member profile + SESH-qualification status.
   Wired to ProfileContext for basics/orders/prefs and UserStateContext for
   the session state. Reuses .panel / .sesh-grid / .btn-* grammar from
   globals.css; only Profile-specific bits live in profile.module.css. */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useUserState } from '@/context/UserStateContext';
import { useProfile } from '@/context/ProfileContext';
import styles from './profile.module.css';

// NEEDS REVIEW: layout/grammar inferred — no live screenshot for Profile.
// Buttons and copy are speculative until owner confirms.

function formatMemberSince(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = String(d.getFullYear()).slice(2);
  return `${m}.${day}.${y}`;
}

function moneyStr(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { userState, setUserState } = useUserState();
  const {
    basics,
    orders,
    prefs,
    updatePrefs,
    setQualified,
    logout,
  } = useProfile();

  const fullName =
    `${basics.firstName ?? ''} ${basics.lastName ?? ''}`.trim() ||
    basics.email ||
    'Vinly Member';
  const firstInitial = (fullName.charAt(0) || 'V').toUpperCase();
  const memberSince = formatMemberSince(basics.memberSince);

  const recentOrders = orders.slice(0, 4);

  const onLogIn = () => {
    router.push('/login');
  };

  const onGetQualified = () => {
    setQualified();
    router.push('/current-offer/justin-isosceles');
  };

  const onResetQualification = () => {
    setUserState('signed_in');
  };

  const onSignOut = () => {
    logout();
    router.push('/shop');
  };

  return (
    <PageChrome>
      <main className="wrap">
        {/* NEEDS REVIEW: header copy/format inferred from .sesh-title grammar. */}
        <div className="sesh-title">
          <span className="tag">PROFILE</span> {fullName}
        </div>
        {userState !== 'anonymous' && basics.firstName && (
          <div className={styles.greeting}>
            Welcome back, <b>{basics.firstName}</b>.
          </div>
        )}

        {/* ---- Row 1: ACCOUNT (navy) + SESH STATUS (white) ---- */}
        <section className="sesh-grid">
          <div className="panel ipo-panel">
            <div className={styles.accountInner}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                ACCOUNT
              </h2>

              <div className={styles.accountHead}>
                <div className={styles.avatar} aria-hidden="true">
                  {firstInitial}
                </div>
                <div>
                  <h3 className={styles.accountName}>{fullName}</h3>
                  <div className={styles.accountMeta}>
                    <div>{basics.email}</div>
                    {memberSince && <div>Member since {memberSince}</div>}
                  </div>
                </div>
              </div>

              <div className={styles.accountActions}>
                <Link href="/profile/edit" className={`btn-explore ${styles.accountBtn}`}>
                  EDIT PROFILE
                </Link>
                <Link href="/profile/addresses" className={`btn-explore ${styles.accountBtn}`}>
                  MANAGE ADDRESSES
                </Link>
                <Link href="/profile/payment" className={`btn-explore ${styles.accountBtn}`}>
                  PAYMENT METHODS
                </Link>
                <button
                  type="button"
                  className={`btn-skip ${styles.accountBtn}`}
                  onClick={onSignOut}
                >
                  SIGN OUT
                </button>
              </div>
            </div>
          </div>

          <div className="panel detail-panel">
            <div className={styles.statusHead}>
              <h2>SESH STATUS</h2>
            </div>

            {userState === 'anonymous' && (
              <>
                <div className={styles.statusRow}>
                  <span
                    className={`${styles.dot} ${styles.dotRed}`}
                    aria-hidden="true"
                  />
                  Not signed in
                </div>
                <p className={styles.statusHint}>
                  Log in to become a Vinly Member and unlock the SESH.
                </p>
                <div className={styles.statusActions}>
                  <button
                    type="button"
                    className={`btn-create ${styles.statusBtn}`}
                    onClick={onLogIn}
                  >
                    LOG IN
                  </button>
                </div>
              </>
            )}

            {userState === 'signed_in' && (
              <>
                <div className={styles.statusRow}>
                  <span
                    className={`${styles.dot} ${styles.dotYellow}`}
                    aria-hidden="true"
                  />
                  Member — Not SESH qualified
                </div>
                <p className={styles.statusHint}>
                  Add billing &amp; shipping to participate in live SESH offers.
                </p>
                <div className={styles.statusActions}>
                  <button
                    type="button"
                    className={`btn-billing ${styles.statusBtn}`}
                    onClick={onGetQualified}
                  >
                    GET SESH QUALIFIED
                  </button>
                </div>
              </>
            )}

            {userState === 'sesh_qualified' && (
              <>
                <div className={styles.statusRow}>
                  <span
                    className={`${styles.dot} ${styles.dotGreen}`}
                    aria-hidden="true"
                  />
                  SESH Qualified
                  <span className={styles.qualifiedChip}>
                    <span aria-hidden="true">✓</span> VERIFIED
                  </span>
                </div>
                <p className={styles.statusHint}>
                  You&apos;re cleared for live SESH purchases and quick-buy.
                </p>
                <div className={styles.statusActions}>
                  <button
                    type="button"
                    className={`btn-skip ${styles.statusBtn}`}
                    onClick={onResetQualification}
                  >
                    RESET QUALIFICATION
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ---- Row 2: ORDER HISTORY (deep-navy) + PREFERENCES (white) ---- */}
        <section className="sesh-grid">
          <div className="panel inv-panel">
            <h2 className={styles.historyHead}>ORDER HISTORY</h2>
            {recentOrders.length === 0 ? (
              <p
                style={{
                  color: '#cfe0ef',
                  fontSize: 14,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                No orders yet.{' '}
                <Link
                  href="/shop"
                  style={{ color: 'var(--cyan)', fontWeight: 600 }}
                >
                  Start shopping
                </Link>
              </p>
            ) : (
              <>
                <div>
                  {recentOrders.map((o) => {
                    const first = o.lines[0];
                    const summary = first
                      ? `${first.name} (x${first.qty})${
                          o.lines.length > 1
                            ? ` +${o.lines.length - 1} more`
                            : ''
                        }`
                      : '—';
                    return (
                      <div key={o.id} className={styles.orderRow}>
                        <div className={styles.orderDate}>
                          {formatOrderDate(o.date)}
                        </div>
                        <div className={styles.orderItem}>{summary}</div>
                        <div className={styles.orderTotal}>
                          {moneyStr(o.total)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, textAlign: 'right' }}>
                  <Link
                    href="/profile/orders"
                    style={{
                      color: 'var(--cyan)',
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    View all
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="panel explore-panel">
            <h2 className={styles.prefsHead}>PREFERENCES</h2>
            <div className={styles.prefsBody}>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={prefs.tickerAlerts}
                  onChange={(e) =>
                    updatePrefs({ tickerAlerts: e.target.checked })
                  }
                />{' '}
                Vinly Ticker alerts
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={prefs.newDropAlerts}
                  onChange={(e) =>
                    updatePrefs({ newDropAlerts: e.target.checked })
                  }
                />{' '}
                New Drop alerts
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={prefs.marketingEmails}
                  onChange={(e) =>
                    updatePrefs({ marketingEmails: e.target.checked })
                  }
                />{' '}
                Marketing emails
              </label>
            </div>
          </div>
        </section>
      </main>
    </PageChrome>
  );
}
