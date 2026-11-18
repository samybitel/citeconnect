'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}

interface ToastContextValue {
  push: (t: { title: string; description?: string; tone?: Tone }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<ToastContextValue['push']>(
    ({ title, description, tone = 'info' }) => {
      const id = ++counter;
      setItems((prev) => [...prev, { id, title, description, tone }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  const value: ToastContextValue = {
    push,
    success: (title, description) => push({ title, description, tone: 'success' }),
    error: (title, description) => push({ title, description, tone: 'error' }),
    info: (title, description) => push({ title, description, tone: 'info' }),
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-brand-500" />,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:right-4 sm:top-4 sm:items-end sm:px-0">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-pop animate-slide-in-right dark:bg-[#11192a]',
              t.tone === 'success' && 'border-emerald-200 dark:border-emerald-900',
              t.tone === 'error' && 'border-red-200 dark:border-red-900',
              t.tone === 'info' && 'border-slate-200 dark:border-[#24304a]',
            )}
            role="status"
          >
            <div className="mt-0.5 shrink-0">{icons[t.tone]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider');
  return ctx;
}