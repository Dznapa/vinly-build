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
      <Header />
      {ticker && <Ticker />}
      {children}
      <Footer />
    </>
  );
}
