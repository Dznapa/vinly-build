/* Single source of truth for SESH/Ticker "already purchased" customer-facing copy.

   SESH/Ticker cart items are one-click reservations that are ALREADY PAID and settle
   automatically on the customer's default card when the SESH window closes. Copy leads
   with "Already purchased"; the settlement detail stays as secondary fine print.

   Change wording HERE — every surface (cart, order summary, billing) references this. */
export const SESH_COPY = {
  /** Short badge/tag shown next to the wine name. */
  badge: 'Already purchased',
  /** Line note in the cart + order summary (lead + settlement fine print). */
  lineNote: 'Already purchased · settles at window close',
  /** Billing summary group header for the already-purchased pool. */
  groupHead: 'Already purchased · settles at window close',
  /** Row label for the already-purchased subtotal (followed by the bottle count). */
  subtotalLabel: 'Already purchased',
  /** Billing reserved-group explanatory note. */
  billingNote:
    "These items are already purchased — they settle automatically on your default card when the window closes, so they're not part of this order's total.",
  /** Billing payment-method note (why the default card can't be changed). */
  paymentNote:
    "These items are already purchased — they settle automatically on your default card when the window closes, so the payment method can't be changed here.",
  /** All-SESH cart confirmation (nothing to place now). */
  allPurchasedConfirm:
    'These items are already purchased — they settle automatically when the window closes. Nothing to place now.',
} as const;
