/* Single source of truth for SESH/Ticker "already purchased" customer-facing copy.

   SESH/Ticker cart items are one-click reservations that are ALREADY PAID and settle
   automatically on the customer's default card when the SESH window closes. Copy leads
   with "Already purchased"; the settlement detail stays as secondary fine print.

   Change wording HERE — every surface (cart, order summary, billing) references this. */
export const SESH_COPY = {
  /** Short badge/tag shown next to the wine name. */
  badge: 'Already purchased',
  /** Line note in the cart line items. */
  lineNote: 'Already purchased',
  /** Order-summary group header for the already-purchased pool (cart + checkout). */
  groupHead: 'Already purchased',
  /** Row label for the already-purchased subtotal (followed by the bottle count). */
  subtotalLabel: 'Already purchased',
  /** Billing payment-method note (why the default card can't be changed). */
  paymentNote:
    "These items are already purchased — they settle automatically on your default card when the window closes, so the payment method can't be changed here.",
  /** All-SESH cart confirmation (nothing to place now). */
  allPurchasedConfirm:
    'These items are already purchased — they settle automatically when the window closes. Nothing to place now.',
} as const;
