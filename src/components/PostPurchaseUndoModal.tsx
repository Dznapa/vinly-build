'use client';

/* PostPurchaseUndoModal — non-blocking confirmation card shown right after a committed
   SESH/Ticker buy. Offers "Undo — cancel this fill" for a short window (UNDO_SECONDS),
   counting down plainly. Undo reverses the fill (removes it from the cart, no charge)
   and consumes one of the 2 per-SESH cancellations. After the cap, no Undo is offered
   (fills are final on commit) — but buying stays fully open. Charge timing unchanged. */

import { useCallback, useEffect, useState } from 'react';
import { usePostPurchase, UNDO_SECONDS } from '@/context/PostPurchaseContext';
import { useCart } from '@/context/CartContext';
import { useCancellations } from '@/context/CancellationContext';
import { useToast } from './ToastProvider';

// Editable copy.
const PRIMARY = "You're in — that fill's locked. Keep trading.";
const remainingNote = (n: number) =>
  `${n} cancellation${n === 1 ? '' : 's'} remaining if you change your mind.`;
const CAP_NOTE = 'Fills are final now — but buy all you want.';
const UNDO_LABEL = 'Undo — cancel this fill';
const DONE_LABEL = 'Keep trading';
const fmtUndo = (s: number) => `Undo within 0:${String(s).padStart(2, '0')}`;
const cancelMsg = (after: number) =>
  after > 0
    ? `Cancelled. ${after} cancellation${after === 1 ? '' : 's'} left.`
    : "That's your last cancellation. Fills are final from here — but you can keep buying.";

export function PostPurchaseUndoModal() {
  const { pending, expiresAt, clear } = usePostPurchase();
  const { items, setQty } = useCart();
  const { cancel, capReached, remaining } = useCancellations();
  const { push: toast } = useToast();
  const [secondsLeft, setSecondsLeft] = useState(UNDO_SECONDS);

  useEffect(() => {
    if (!pending) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) clear(); // window elapsed → fill is final
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [pending, expiresAt, clear]);

  const handleUndo = useCallback(() => {
    if (!pending) return;
    const after = cancel();
    // Reverse this fill: subtract its quantity (removes the line if it hits 0).
    const current = items.find((i) => i.wineId === pending.wineId)?.qty ?? 0;
    setQty(pending.wineId, Math.max(0, current - pending.qty));
    toast({ kind: 'info', message: cancelMsg(after) });
    clear();
  }, [pending, cancel, items, setQty, toast, clear]);

  if (!pending) return null;

  const canUndo = !capReached;

  return (
    <div className="ppu-card" role="status" aria-live="polite">
      <div className="ppu-primary">
        <i className="fa-solid fa-circle-check" aria-hidden /> {PRIMARY}
      </div>
      <div className="ppu-note">{canUndo ? remainingNote(remaining) : CAP_NOTE}</div>
      {canUndo ? (
        <div className="ppu-actions">
          <button type="button" className="ppu-undo" onClick={handleUndo}>
            {UNDO_LABEL}
            <span className="ppu-timer" aria-label={`${secondsLeft} seconds left to undo`}>{fmtUndo(secondsLeft)}</span>
          </button>
          <button type="button" className="ppu-done" onClick={clear}>{DONE_LABEL}</button>
        </div>
      ) : (
        <div className="ppu-actions">
          <button type="button" className="ppu-done ppu-done--solo" onClick={clear}>{DONE_LABEL}</button>
        </div>
      )}
    </div>
  );
}

export default PostPurchaseUndoModal;
