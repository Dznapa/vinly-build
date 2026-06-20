'use client';

/* ToastProvider — lightweight in-app notifications.
   Usage:
     const { push } = useToast();
     push({ kind: 'success', message: 'Added to cart' });
   Auto-dismisses after 2.6 s. Stacks bottom-right above the dev toolbar. */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type ToastKind = 'success' | 'info' | 'error';
type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  /** Optional muted second line (e.g. the post-purchase cancellation note). */
  sub?: string;
  /** Auto-dismiss ms (default 2600). */
  duration?: number;
};

type Ctx = {
  push: (t: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<Ctx | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.duration ?? 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="vinly-toast-region" role="region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`vinly-toast vinly-toast--${t.kind}`}>
            <i
              className={
                t.kind === 'success'
                  ? 'fa-solid fa-circle-check'
                  : t.kind === 'error'
                    ? 'fa-solid fa-circle-exclamation'
                    : 'fa-solid fa-circle-info'
              }
              aria-hidden
            />
            <span className="vinly-toast-text">
              <span className="vinly-toast-msg">{t.message}</span>
              {t.sub && <span className="vinly-toast-sub">{t.sub}</span>}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Non-provider environments (e.g. SSR tests) — no-op so callers don't crash.
    return { push: () => {} } as Ctx;
  }
  return ctx;
}
