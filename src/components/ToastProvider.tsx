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
    }, 2600);
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
            <span>{t.message}</span>
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
