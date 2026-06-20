import type { ReactNode } from 'react';
import { Header } from './Header';
import { Ticker } from './Ticker';
import { Footer } from './Footer';

/* Wrapper for any route that needs the full Vinly chrome.
   Routes can pass `ticker={false}` (e.g. signup, admin) to omit it. */
export function PageChrome({
  children,
  ticker = true,
}: {
  children: ReactNode;
  ticker?: boolean;
}) {
  return (
    <>
      {/* Header + Ticker stick to the top together so the nav icons stay reachable
          on scroll (no need to scroll all the way up). */}
      <div className="site-chrome">
        <Header />
        {ticker && <Ticker sticky={false} />}
      </div>
      {children}
      <Footer />
    </>
  );
}
