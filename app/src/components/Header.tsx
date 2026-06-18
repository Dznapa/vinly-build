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

export function Header() {
  const { userState } = useUserState();
  const { count: cartCount } = useCart();
  const { logout, basics, hydrated } = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const showCenter = userState === 'anonymous';

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

        {showCenter && (
          <Link href="/register_details" className="header-center">
            NEW TO VINLY? <span className="start">START HERE</span>
          </Link>
        )}

        <nav className="header-icons" aria-label="Primary">
          <Link className="icon" href="/current-offer/justin-isosceles" title="SESH" aria-label="SESH">
            <i className="fa-solid fa-arrow-trend-up" aria-hidden />
          </Link>
          <Link className="icon" href="/shop" title="Shop" aria-label="Shop">
            <i className="fa-solid fa-store" aria-hidden />
          </Link>
          <Link className="icon" href="/winemaker-spotlight" title="Winemaker" aria-label="Winemaker">
            <i className="fa-solid fa-award" aria-hidden />
          </Link>
          <Link className="icon" href="/customer-cart" title="Cart" aria-label="Cart">
            <i className="fa-solid fa-cart-shopping" aria-hidden />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
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
              <i className="fa-solid fa-user" aria-hidden />
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
