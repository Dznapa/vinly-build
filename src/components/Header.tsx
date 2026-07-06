'use client';

/* Header — uses the real Vinly logo from /spec/ASSETS.md and FontAwesome icons.
   Account icon opens an inline dropdown:
     anonymous       → Log in / Sign up
     signed_in       → Profile / Orders / Addresses / Payment / Sign out
     sesh_qualified  → same as signed_in, with a "SESH Qualified ✓" header */

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';
import { useCart } from '@/context/CartContext';
import { useProfile } from '@/context/ProfileContext';
import { useBillingGate } from '@/context/BillingGateContext';

// Top-of-page CTA labels (editable). Which ones render is gated on user state below.
const CTA_LEARN_MORE = 'Learn More About Vinly';
const CTA_CREATE_ACCOUNT = 'Create An Account';
const CTA_GET_QUALIFIED = 'Get SESH Qualified';

export function Header() {
  const { userState } = useUserState();
  const { count: cartCount } = useCart();
  const { logout, basics, hydrated } = useProfile();
  const { openGate } = useBillingGate();
  const router = useRouter();
  const pathname = usePathname();

  // CTAs adapt to auth + qualification state (single source: userState).
  //   anonymous       → Learn More · Create An Account · Get SESH Qualified
  //   signed_in        → Learn More · Get SESH Qualified  (account already exists)
  //   sesh_qualified  → Learn More                       (account + qualification done)
  const showCreateAccount = userState === 'anonymous';
  const showGetQualified = userState !== 'sesh_qualified';
  // On the SESH offer page, a signed-in-not-qualified user gets ONE consolidated CTA
  // (the mobile sticky bar), so the header CTA is hidden on mobile for that case only.
  const seshSoloMobile = userState === 'signed_in' && (pathname?.startsWith('/current-offer') ?? false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on click-outside or ESC.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Close when route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const initial = (basics.firstName || basics.email || 'U').trim().charAt(0).toUpperCase();
  const fullName = hydrated && (basics.firstName || basics.lastName)
    ? `${basics.firstName} ${basics.lastName}`.trim()
    : basics.email;

  const handleSignOut = () => {
    logout();
    setMenuOpen(false);
    router.push('/shop');
  };

  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="logo" href="/" aria-label="Vinly home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vinly-logo.png" alt="Vinly" className="logo-img" />
        </Link>

        <div className={`header-cta-group${userState === 'anonymous' ? ' header-cta-group--anon' : ''}`}>
          <a
            href="https://vinly.wine"
            target="_blank"
            rel="noopener noreferrer"
            className="header-cta header-cta--link"
            aria-label={`${CTA_LEARN_MORE} (opens in a new tab)`}
          >
            {CTA_LEARN_MORE}
          </a>
          {showCreateAccount && (
            <Link
              href="/register_details"
              className="header-cta header-cta--blue"
              aria-label={CTA_CREATE_ACCOUNT}
            >
              {CTA_CREATE_ACCOUNT}
            </Link>
          )}
          {showGetQualified && (
            <button
              type="button"
              className={`header-cta header-cta--orange${seshSoloMobile ? ' header-cta--sesh-solo' : ''}`}
              onClick={openGate}
              aria-label={CTA_GET_QUALIFIED}
            >
              {CTA_GET_QUALIFIED}
            </button>
          )}
        </div>

        <nav className="header-icons" aria-label="Primary">
          <Link className="icon" href="/current-offer/justin-isosceles" title="The SESH — live market" aria-label="The SESH — live market">
            <span className="nav-ic"><i className="fa-solid fa-arrow-trend-up" aria-hidden /></span>
            <span className="nav-label">SESH</span>
          </Link>
          <Link className="icon" href="/shop" title="Shop — the Market" aria-label="Shop — the Market">
            <span className="nav-ic"><i className="fa-solid fa-store" aria-hidden /></span>
            <span className="nav-label">Shop</span>
          </Link>
          <Link className="icon" href="/winemaker-spotlight" title="Winemaker Spotlight" aria-label="Winemaker Spotlight">
            <span className="nav-ic"><i className="fa-solid fa-award" aria-hidden /></span>
            <span className="nav-label">Spotlight</span>
          </Link>
          <Link className="icon" href="/customer-cart" title="Cart" aria-label="Cart">
            <span className="nav-ic">
              <i className="fa-solid fa-cart-shopping" aria-hidden />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </span>
            <span className="nav-label">Cart</span>
          </Link>
          <span className="divider-v" aria-hidden />

          <div className="account-wrap" ref={menuRef}>
            <button
              type="button"
              className="icon account-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              title="Account"
            >
              <span className="nav-ic"><i className="fa-solid fa-user" aria-hidden /></span>
              <span className="nav-label">Account</span>
            </button>

            {menuOpen && (
              <div className="account-menu" role="menu">
                {userState === 'anonymous' ? (
                  <>
                    <div className="account-menu-head">
                      <span>Not signed in</span>
                    </div>
                    <Link href="/login" className="account-menu-item" role="menuitem">
                      <i className="fa-solid fa-right-to-bracket" aria-hidden /> Log in
                    </Link>
                    <Link href="/register_details" className="account-menu-item" role="menuitem">
                      <i className="fa-solid fa-user-plus" aria-hidden /> Sign up
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="account-menu-head">
                      <span className="avatar">{initial}</span>
                      <div className="acc-name">
                        <div className="acc-line1">{fullName || 'Member'}</div>
                        {userState === 'sesh_qualified' ? (
                          <div className="acc-line2 acc-qualified">
                            <i className="fa-solid fa-check" aria-hidden /> SESH Qualified
                          </div>
                        ) : (
                          <div className="acc-line2">Member</div>
                        )}
                      </div>
                    </div>
                    <Link href="/profile" className="account-menu-item" role="menuitem">
                      <i className="fa-solid fa-user" aria-hidden /> Profile
                    </Link>
                    <Link href="/profile/orders" className="account-menu-item" role="menuitem">
                      <i className="fa-solid fa-box" aria-hidden /> Orders
                    </Link>
                    <Link href="/profile/addresses" className="account-menu-item" role="menuitem">
                      <i className="fa-solid fa-location-dot" aria-hidden /> Addresses
                    </Link>
                    <Link href="/profile/payment" className="account-menu-item" role="menuitem">
                      <i className="fa-solid fa-credit-card" aria-hidden /> Payment methods
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="account-menu-item account-menu-signout"
                      role="menuitem"
                    >
                      <i className="fa-solid fa-right-from-bracket" aria-hidden /> Sign out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
