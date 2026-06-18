import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { UserStateProvider } from '@/context/UserStateContext';
import { BillingGateProvider } from '@/context/BillingGateContext';
import { CartProvider } from '@/context/CartContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { ToastProvider } from '@/components/ToastProvider';
import { ScrollToTop } from '@/components/ScrollToTop';
import { DevToolbar } from '@/components/DevToolbar';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Vinly',
  description: 'Vinly — local UI/UX clone. Not the production site.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts per /spec/ASSETS.md: Mulish for body, League Spartan for headings. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@300;400;500;600;700;800&family=Mulish:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* FontAwesome 6.5.1 per /spec/ASSETS.md. */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <UserStateProvider>
          <ProfileProvider>
            <BillingGateProvider>
              <CartProvider>
                <ToastProvider>
                  {children}
                  <ScrollToTop />
                  <DevToolbar />
                </ToastProvider>
              </CartProvider>
            </BillingGateProvider>
          </ProfileProvider>
        </UserStateProvider>
      </body>
    </html>
  );
}
